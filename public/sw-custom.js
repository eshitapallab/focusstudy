/**
 * Custom Service Worker for FocusFlow
 * Extends next-pwa's service worker with timer-specific functionality
 * 
 * Features:
 * - Background sync for offline data
 * - Periodic sync to keep timer accurate
 * - Push notifications for break reminders
 */

// Import workbox modules from next-pwa
importScripts('https://storage.googleapis.com/workbox-cdn/releases/6.5.4/workbox-sw.js')

// Workbox configuration
workbox.setConfig({ debug: false })

// Precache and route setup (next-pwa will inject precache manifest)
workbox.precaching.precacheAndRoute(self.__WB_MANIFEST || [])

// Cache strategies for different resource types
workbox.routing.registerRoute(
  ({ request }) => request.destination === 'document',
  new workbox.strategies.NetworkFirst({
    cacheName: 'documents',
    plugins: [
      new workbox.expiration.ExpirationPlugin({
        maxEntries: 50,
        maxAgeSeconds: 60 * 60 * 24 * 7 // 7 days
      })
    ]
  })
)

// Cache API responses with stale-while-revalidate
workbox.routing.registerRoute(
  ({ url }) => url.pathname.startsWith('/api/'),
  new workbox.strategies.NetworkFirst({
    cacheName: 'api-cache',
    networkTimeoutSeconds: 3,
    plugins: [
      new workbox.expiration.ExpirationPlugin({
        maxEntries: 100,
        maxAgeSeconds: 60 * 5 // 5 minutes
      })
    ]
  })
)

// Cache static assets
workbox.routing.registerRoute(
  ({ request }) => 
    request.destination === 'script' ||
    request.destination === 'style' ||
    request.destination === 'image' ||
    request.destination === 'font',
  new workbox.strategies.CacheFirst({
    cacheName: 'static-assets',
    plugins: [
      new workbox.expiration.ExpirationPlugin({
        maxEntries: 200,
        maxAgeSeconds: 60 * 60 * 24 * 30 // 30 days
      })
    ]
  })
)

// Background Sync for offline data
const bgSyncPlugin = new workbox.backgroundSync.BackgroundSyncPlugin('focusflow-sync-queue', {
  maxRetentionTime: 24 * 60 // Retry for 24 hours
})

// Queue failed session sync requests
workbox.routing.registerRoute(
  ({ url }) => url.pathname.includes('/sessions') || url.pathname.includes('/sync'),
  new workbox.strategies.NetworkOnly({
    plugins: [bgSyncPlugin]
  }),
  'POST'
)

// Timer state persistence in IndexedDB (shared with main app via Dexie)
const TIMER_STATE_KEY = 'focusflow_timer_state'

// Handle messages from the main app
self.addEventListener('message', async (event) => {
  const { type, data } = event.data || {}
  
  switch (type) {
    case 'TIMER_START':
      // Store timer start state
      await storeTimerState({
        sessionId: data.sessionId,
        startTs: data.startTs,
        running: true,
        pausedMs: 0
      })
      break
      
    case 'TIMER_PAUSE':
      const currentState = await getTimerState()
      if (currentState) {
        await storeTimerState({
          ...currentState,
          running: false,
          pauseStartTs: Date.now()
        })
      }
      break
      
    case 'TIMER_RESUME':
      const pausedState = await getTimerState()
      if (pausedState && pausedState.pauseStartTs) {
        const pauseDuration = Date.now() - pausedState.pauseStartTs
        await storeTimerState({
          ...pausedState,
          running: true,
          pausedMs: (pausedState.pausedMs || 0) + pauseDuration,
          pauseStartTs: null
        })
      }
      break
      
    case 'TIMER_STOP':
      await clearTimerState()
      break
      
    case 'GET_TIMER_STATE':
      const state = await getTimerState()
      event.ports[0].postMessage({ state })
      break
      
    case 'SYNC_NOW':
      // Trigger immediate sync
      await triggerSync()
      break
      
    case 'SKIP_WAITING':
      self.skipWaiting()
      break
  }
})

// Store timer state in cache (IndexedDB-like via Cache API)
async function storeTimerState(state) {
  try {
    const cache = await caches.open('timer-state')
    const response = new Response(JSON.stringify({
      ...state,
      updatedAt: Date.now()
    }))
    await cache.put(TIMER_STATE_KEY, response)
  } catch (error) {
    console.error('[SW] Failed to store timer state:', error)
  }
}

// Get timer state from cache
async function getTimerState() {
  try {
    const cache = await caches.open('timer-state')
    const response = await cache.match(TIMER_STATE_KEY)
    if (response) {
      return await response.json()
    }
  } catch (error) {
    console.error('[SW] Failed to get timer state:', error)
  }
  return null
}

// Clear timer state
async function clearTimerState() {
  try {
    const cache = await caches.open('timer-state')
    await cache.delete(TIMER_STATE_KEY)
  } catch (error) {
    console.error('[SW] Failed to clear timer state:', error)
  }
}

// Trigger background sync
async function triggerSync() {
  try {
    const registration = self.registration
    if ('sync' in registration) {
      await registration.sync.register('focusflow-sync')
    }
  } catch (error) {
    console.error('[SW] Failed to trigger sync:', error)
  }
}

// Background sync event handler
self.addEventListener('sync', async (event) => {
  if (event.tag === 'focusflow-sync') {
    event.waitUntil(performSync())
  }
})

// Perform actual sync
async function performSync() {
  console.log('[SW] Performing background sync')
  
  // Notify all clients that sync is happening
  const clients = await self.clients.matchAll()
  clients.forEach(client => {
    client.postMessage({ type: 'SYNC_STARTED' })
  })
  
  // The actual sync will be handled by the main app
  // We just notify it that it should sync
  clients.forEach(client => {
    client.postMessage({ type: 'SYNC_REQUESTED' })
  })
}

// Periodic background sync (if supported)
self.addEventListener('periodicsync', (event) => {
  if (event.tag === 'focusflow-timer-check') {
    event.waitUntil(checkTimerState())
  }
})

// Check timer state periodically
async function checkTimerState() {
  const state = await getTimerState()
  
  if (state && state.running) {
    const elapsed = Date.now() - state.startTs - (state.pausedMs || 0)
    const elapsedMinutes = Math.floor(elapsed / 60000)
    
    // Send break reminder every 25 minutes
    if (elapsedMinutes > 0 && elapsedMinutes % 25 === 0) {
      await showNotification('Time for a break!', {
        body: `You've been focusing for ${elapsedMinutes} minutes. Consider taking a short break.`,
        tag: 'break-reminder',
        requireInteraction: false
      })
    }
  }
}

// Show notification
async function showNotification(title, options = {}) {
  if (self.Notification && Notification.permission === 'granted') {
    try {
      await self.registration.showNotification(title, {
        icon: '/icon-192.svg',
        badge: '/icon-192.svg',
        vibrate: [200, 100, 200],
        ...options
      })
    } catch (error) {
      console.error('[SW] Failed to show notification:', error)
    }
  }
}

// Handle notification clicks
self.addEventListener('notificationclick', (event) => {
  event.notification.close()
  
  event.waitUntil(
    self.clients.matchAll({ type: 'window' }).then(clients => {
      // Focus existing window or open new one
      for (const client of clients) {
        if (client.url.includes('/focus') && 'focus' in client) {
          return client.focus()
        }
      }
      if (self.clients.openWindow) {
        return self.clients.openWindow('/focus')
      }
    })
  )
})

// Handle push notifications
self.addEventListener('push', (event) => {
  if (!event.data) return
  
  try {
    const data = event.data.json()
    event.waitUntil(
      showNotification(data.title || 'FocusFlow', {
        body: data.body,
        tag: data.tag || 'push-notification',
        data: data.data
      })
    )
  } catch (error) {
    console.error('[SW] Failed to handle push:', error)
  }
})

// Activate and claim clients immediately
self.addEventListener('activate', (event) => {
  event.waitUntil(
    Promise.all([
      self.clients.claim(),
      // Clean up old caches
      caches.keys().then(keys => {
        return Promise.all(
          keys
            .filter(key => !['documents', 'api-cache', 'static-assets', 'timer-state'].includes(key))
            .map(key => caches.delete(key))
        )
      })
    ])
  )
})

// Install event
self.addEventListener('install', (event) => {
  console.log('[SW] FocusFlow service worker installed')
  self.skipWaiting()
})

console.log('[SW] FocusFlow service worker loaded')
