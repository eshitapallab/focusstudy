/**
 * Custom Service Worker Extensions for FocusFlow Timer
 * This file extends next-pwa's generated service worker
 */

// Timer state management in service worker
const TIMER_CACHE_NAME = 'focusflow-timer-state'
const TIMER_STATE_KEY = '/timer-state'

// Store timer state for background persistence
async function storeTimerState(state) {
  try {
    const cache = await caches.open(TIMER_CACHE_NAME)
    const response = new Response(JSON.stringify({
      ...state,
      updatedAt: Date.now()
    }), {
      headers: { 'Content-Type': 'application/json' }
    })
    await cache.put(TIMER_STATE_KEY, response)
    return true
  } catch (error) {
    console.error('[SW Worker] Failed to store timer state:', error)
    return false
  }
}

// Retrieve timer state
async function getTimerState() {
  try {
    const cache = await caches.open(TIMER_CACHE_NAME)
    const response = await cache.match(TIMER_STATE_KEY)
    if (response) {
      return await response.json()
    }
  } catch (error) {
    console.error('[SW Worker] Failed to get timer state:', error)
  }
  return null
}

// Clear timer state
async function clearTimerState() {
  try {
    const cache = await caches.open(TIMER_CACHE_NAME)
    await cache.delete(TIMER_STATE_KEY)
    return true
  } catch (error) {
    console.error('[SW Worker] Failed to clear timer state:', error)
    return false
  }
}

// Handle messages from the main app
self.addEventListener('message', async (event) => {
  const { type, data } = event.data || {}
  
  switch (type) {
    case 'TIMER_STATE_UPDATE':
      await storeTimerState(data)
      break
      
    case 'GET_TIMER_STATE':
      const state = await getTimerState()
      if (event.ports && event.ports[0]) {
        event.ports[0].postMessage({ state })
      }
      break
      
    case 'CLEAR_TIMER_STATE':
      await clearTimerState()
      break
      
    case 'SYNC_REQUEST':
      // Notify all clients to perform sync
      const clients = await self.clients.matchAll({ type: 'window' })
      clients.forEach(client => {
        client.postMessage({ type: 'SYNC_REQUESTED' })
      })
      break
      
    case 'SKIP_WAITING':
      self.skipWaiting()
      break
  }
})

// Background sync support
self.addEventListener('sync', (event) => {
  if (event.tag === 'focusflow-session-sync') {
    event.waitUntil(handleBackgroundSync())
  }
})

async function handleBackgroundSync() {
  console.log('[SW Worker] Background sync triggered')
  
  // Notify all clients that they should sync
  const clients = await self.clients.matchAll({ type: 'window' })
  clients.forEach(client => {
    client.postMessage({ type: 'BACKGROUND_SYNC_TRIGGERED' })
  })
}

// Periodic background sync (when supported)
self.addEventListener('periodicsync', (event) => {
  if (event.tag === 'focusflow-timer-heartbeat') {
    event.waitUntil(handleTimerHeartbeat())
  }
})

async function handleTimerHeartbeat() {
  const state = await getTimerState()
  
  if (state && state.running) {
    // Calculate current elapsed time
    const now = Date.now()
    const elapsed = now - state.startTs - (state.pausedMs || 0)
    const elapsedMinutes = Math.floor(elapsed / 60000)
    
    // Send break reminder every 25 minutes
    if (elapsedMinutes > 0 && elapsedMinutes % 25 === 0) {
      await showBreakReminder(elapsedMinutes)
    }
    
    // Update stored state with current time check
    await storeTimerState({
      ...state,
      lastHeartbeat: now
    })
  }
}

async function showBreakReminder(minutes) {
  if (self.Notification && Notification.permission === 'granted') {
    const registration = self.registration
    await registration.showNotification('⏰ Time for a break!', {
      body: `You've been focusing for ${minutes} minutes. Consider taking a short break.`,
      icon: '/icon-192.svg',
      badge: '/icon-192.svg',
      tag: 'break-reminder',
      requireInteraction: false,
      vibrate: [200, 100, 200],
      actions: [
        { action: 'dismiss', title: 'Dismiss' },
        { action: 'continue', title: 'Keep Going' }
      ]
    })
  }
}

// Handle notification actions
self.addEventListener('notificationclick', (event) => {
  event.notification.close()
  
  const action = event.action
  
  if (action === 'continue') {
    // User wants to continue - just close notification
    return
  }
  
  // Default action or 'dismiss' - focus or open the app
  event.waitUntil(
    self.clients.matchAll({ type: 'window' }).then(clients => {
      // Try to find and focus existing window
      for (const client of clients) {
        if (client.url.includes('/focus') && 'focus' in client) {
          return client.focus()
        }
      }
      // Open new window if none found
      if (self.clients.openWindow) {
        return self.clients.openWindow('/focus')
      }
    })
  )
})

// Ensure clients are claimed immediately
self.addEventListener('activate', (event) => {
  event.waitUntil(self.clients.claim())
})

console.log('[SW Worker] FocusFlow timer worker extensions loaded')
