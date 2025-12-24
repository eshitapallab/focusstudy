import { supabase } from './supabaseClient'
import { db } from './dexieClient'

export interface SyncResult {
  success: boolean
  uploaded: number
  failed: number
  errors: string[]
}

/**
 * Sync local sessions to Supabase
 * Called after user signs in
 */
export async function syncLocalToSupabase(userId: string, deviceId: string): Promise<SyncResult> {
  const result: SyncResult = {
    success: true,
    uploaded: 0,
    failed: 0,
    errors: []
  }

  if (!supabase) {
    result.success = false
    result.errors.push('Supabase not configured')
    return result
  }

  try {
    // Get all pending sessions (limit to recent 100 for performance)
    const pendingSessions = await db.sessions
      .where('syncStatus')
      .equals('pending')
      .reverse()
      .limit(100)
      .toArray()

    // Batch upload sessions for better performance
    const sessionsToUpload = pendingSessions.map(session => ({
      id: session.id,
      user_id: userId,
      device_id: deviceId,
      start_ts: new Date(session.startTs).toISOString(),
      end_ts: session.endTs ? new Date(session.endTs).toISOString() : null,
      paused_ms: session.pausedMs,
      mode: session.mode,
      created_at: new Date(session.createdAt).toISOString()
    }))

    // Bulk insert sessions
    if (sessionsToUpload.length > 0) {
      const { error: bulkError } = await supabase
        .from('sessions')
        .upsert(sessionsToUpload, { onConflict: 'id', ignoreDuplicates: true })

      if (bulkError) {
        console.error('Bulk session upload error:', bulkError)
        result.errors.push(`Bulk upload failed: ${bulkError.message}`)
      } else {
        result.uploaded = sessionsToUpload.length
      }
    }

    // Update sync status for all sessions in parallel
    await Promise.all(
      pendingSessions.map(session =>
        db.sessions.update(session.id, { syncStatus: 'synced', userId })
      )
    )

    // Handle metadata separately with batching
    for (const session of pendingSessions.slice(0, 20)) {
      try {
        const metadata = await db.sessionMetadata
          .where('sessionId')
          .equals(session.id)
          .toArray()

        if (metadata.length === 0) continue

        const metadataToUpload = metadata.map(meta => ({
          id: meta.id,
          session_id: session.id,
          subject: meta.subject,
          planned: meta.planned,
          focus_rating: meta.focusRating,
          note: meta.note,
          labeled_at: meta.labeledAt ? new Date(meta.labeledAt).toISOString() : null
        }))

        const { error: metaError } = await supabase
          .from('session_metadata')
          .upsert(metadataToUpload, { onConflict: 'id', ignoreDuplicates: true })

        if (!metaError) {
          await Promise.all(
            metadata.map(meta =>
              db.sessionMetadata.update(meta.id, { syncStatus: 'synced' })
            )
          )
        }
      } catch (metaError) {
        console.error('Metadata sync error:', metaError)
        // Continue with other sessions
      }
    }

    // Sync planned sessions
    const pendingPlanned = await db.plannedSessions
      .where('syncStatus')
      .equals('pending')
      .toArray()

    for (const planned of pendingPlanned) {
      try {
        const { error } = await supabase
          .from('planned_sessions')
          .insert({
            id: planned.id,
            user_id: userId,
            device_id: deviceId,
            subject: planned.subject,
            planned_date: planned.plannedDate,
            goal: planned.goal,
            created_at: new Date(planned.createdAt).toISOString()
          })

        if (error && error.code !== '23505') {
          throw error
        }

        await db.plannedSessions.update(planned.id, { 
          syncStatus: 'synced',
          userId 
        })
      } catch (error) {
        result.failed++
        result.errors.push(`Planned session ${planned.id}: ${error}`)
        console.error('Failed to sync planned session:', error)
      }
    }

    // Create device backup
    const allSessions = await db.sessions.toArray()
    const allMetadata = await db.sessionMetadata.toArray()
    const allPlanned = await db.plannedSessions.toArray()
    
    await supabase
      .from('device_backups')
      .upsert({
        device_id: deviceId,
        user_id: userId,
        backup_data: {
          sessions: allSessions,
          metadata: allMetadata,
          planned: allPlanned
        },
        last_synced: new Date().toISOString()
      })

    // Update last synced timestamp
    await db.config.toArray().then(configs => {
      if (configs.length > 0) {
        db.config.update(configs[0].deviceId, { lastSyncedAt: Date.now() })
      }
    })

    result.success = result.failed === 0
  } catch (error) {
    result.success = false
    result.errors.push(`Sync error: ${error}`)
    console.error('Sync failed:', error)
  }

  return result
}

/**
 * Pull remote sessions to local
 * Used when signing in on a new device
 */
export async function syncSupabaseToLocal(userId: string): Promise<SyncResult> {
  const result: SyncResult = {
    success: true,
    uploaded: 0,
    failed: 0,
    errors: []
  }

  if (!supabase) {
    result.success = false
    result.errors.push('Supabase not configured')
    return result
  }

  try {
    // Fetch remote sessions
    const { data: remoteSessions, error: sessionsError } = await supabase
      .from('sessions')
      .select('*, session_metadata(*)')
      .eq('user_id', userId)

    if (sessionsError) throw sessionsError

    for (const remote of remoteSessions || []) {
      try {
        // Check if session already exists locally
        const existing = await db.sessions.get(remote.id)
        
        if (existing) {
          // Conflict - keep server version, mark local as conflict
          if (existing.syncStatus === 'pending') {
            await db.sessions.update(remote.id, {
              syncStatus: 'conflict',
              serverVersion: 1
            })
          }
          continue
        }

        // Add remote session to local DB
        await db.sessions.add({
          id: remote.id,
          userId: remote.user_id,
          deviceId: remote.device_id,
          startTs: new Date(remote.start_ts).getTime(),
          endTs: remote.end_ts ? new Date(remote.end_ts).getTime() : null,
          pausedMs: remote.paused_ms,
          mode: remote.mode,
          pauses: [],
          running: false,
          createdAt: new Date(remote.created_at).getTime(),
          syncStatus: 'synced'
        })

        // Add metadata
        if (remote.session_metadata && remote.session_metadata.length > 0) {
          for (const meta of remote.session_metadata) {
            await db.sessionMetadata.add({
              id: meta.id,
              sessionId: remote.id,
              subject: meta.subject,
              planned: meta.planned,
              focusRating: meta.focus_rating,
              note: meta.note,
              labeledAt: meta.labeled_at ? new Date(meta.labeled_at).getTime() : null,
              syncStatus: 'synced'
            })
          }
        }

        result.uploaded++
      } catch (error) {
        result.failed++
        result.errors.push(`Remote session ${remote.id}: ${error}`)
        console.error('Failed to sync remote session:', error)
      }
    }

    result.success = result.failed === 0
  } catch (error) {
    result.success = false
    result.errors.push(`Pull sync error: ${error}`)
    console.error('Pull sync failed:', error)
  }

  return result
}

/**
 * Full sync - both directions
 */
export async function fullSync(userId: string, deviceId: string): Promise<{
  upload: SyncResult
  download: SyncResult
}> {
  const upload = await syncLocalToSupabase(userId, deviceId)
  const download = await syncSupabaseToLocal(userId)
  
  return { upload, download }
}
