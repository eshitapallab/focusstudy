/**
 * Type declarations for experimental Web APIs used by FocusFlow
 */

// Wake Lock API
interface WakeLockSentinel extends EventTarget {
  readonly released: boolean
  readonly type: 'screen'
  release(): Promise<void>
  onrelease: ((this: WakeLockSentinel, ev: Event) => any) | null
}

interface WakeLock {
  request(type: 'screen'): Promise<WakeLockSentinel>
}

interface Navigator {
  wakeLock?: WakeLock
}

// Background Sync API
interface SyncManager {
  register(tag: string): Promise<void>
  getTags(): Promise<string[]>
}

interface ServiceWorkerRegistration {
  sync?: SyncManager
  periodicSync?: {
    register(tag: string, options?: { minInterval: number }): Promise<void>
    unregister(tag: string): Promise<void>
    getTags(): Promise<string[]>
  }
}

// Page Lifecycle Events
interface Document {
  addEventListener(
    type: 'freeze',
    listener: (this: Document, ev: Event) => any,
    options?: boolean | AddEventListenerOptions
  ): void
  addEventListener(
    type: 'resume',
    listener: (this: Document, ev: Event) => any,
    options?: boolean | AddEventListenerOptions
  ): void
}
