import { Timer, formatDuration, calculateActualDuration } from '@/lib/timer'
import { db, LocalSession } from '@/lib/dexieClient'
import Dexie from 'dexie'

// Use in-memory database for tests
beforeEach(async () => {
  await db.delete()
  await db.open()
})

afterEach(async () => {
  await db.close()
})

describe('Timer', () => {
  describe('start', () => {
    it('should create a new session with correct timestamps', async () => {
      const timer = new Timer()
      const beforeStart = Date.now()
      const sessionId = await timer.start('flow')
      const afterStart = Date.now()

      expect(sessionId).toBeTruthy()

      const session = await db.sessions.get(sessionId)
      expect(session).toBeTruthy()
      expect(session!.startTs).toBeGreaterThanOrEqual(beforeStart)
      expect(session!.startTs).toBeLessThanOrEqual(afterStart)
      expect(session!.running).toBe(true)
      expect(session!.mode).toBe('flow')
      expect(session!.pausedMs).toBe(0)
      expect(session!.pauses).toEqual([])
    })

    it('should return correct initial state', async () => {
      const timer = new Timer()
      await timer.start('flow')

      const state = timer.getState()
      expect(state.running).toBe(true)
      expect(state.sessionId).toBeTruthy()
      expect(state.startTs).toBeTruthy()
      expect(state.totalPausedMs).toBe(0)
      expect(state.elapsedMs).toBeGreaterThanOrEqual(0)
    })
  })

  describe('pause and resume', () => {
    it('should pause and resume correctly', async () => {
      const timer = new Timer()
      await timer.start('flow')

      // Wait a bit
      await new Promise(resolve => setTimeout(resolve, 100))

      await timer.pause()
      const pauseState = timer.getState()
      expect(pauseState.running).toBe(false)

      const session = await db.sessions.get(pauseState.sessionId!)
      expect(session!.pauses.length).toBe(1)
      expect(session!.pauses[0].start).toBeTruthy()
      expect(session!.pauses[0].end).toBeUndefined()

      // Wait during pause
      await new Promise(resolve => setTimeout(resolve, 100))

      await timer.resume()
      const resumeState = timer.getState()
      expect(resumeState.running).toBe(true)

      const updatedSession = await db.sessions.get(resumeState.sessionId!)
      expect(updatedSession!.pauses[0].end).toBeTruthy()
      expect(updatedSession!.pausedMs).toBeGreaterThan(0)
    })

    it('should track paused time correctly', async () => {
      const timer = new Timer()
      await timer.start('flow')

      await new Promise(resolve => setTimeout(resolve, 50))
      await timer.pause()
      
      const pauseStart = Date.now()
      await new Promise(resolve => setTimeout(resolve, 100))
      
      await timer.resume()
      const pauseDuration = Date.now() - pauseStart

      const session = await db.sessions.get(timer.getState().sessionId!)
      
      // Allow 20ms tolerance for timing
      expect(session!.pausedMs).toBeGreaterThanOrEqual(pauseDuration - 20)
      expect(session!.pausedMs).toBeLessThanOrEqual(pauseDuration + 20)
    })
  })

  describe('stop', () => {
    it('should stop session and set end timestamp', async () => {
      const timer = new Timer()
      const sessionId = await timer.start('flow')

      await new Promise(resolve => setTimeout(resolve, 100))

      const beforeStop = Date.now()
      await timer.stop()
      const afterStop = Date.now()

      const session = await db.sessions.get(sessionId)
      expect(session!.endTs).toBeGreaterThanOrEqual(beforeStop)
      expect(session!.endTs).toBeLessThanOrEqual(afterStop)
      expect(session!.running).toBe(false)
    })

    it('should complete ongoing pause when stopping', async () => {
      const timer = new Timer()
      await timer.start('flow')

      await new Promise(resolve => setTimeout(resolve, 50))
      await timer.pause()
      await new Promise(resolve => setTimeout(resolve, 100))
      
      const sessionId = await timer.stop()

      const session = await db.sessions.get(sessionId)
      expect(session!.pauses[0].end).toBeTruthy()
      expect(session!.pausedMs).toBeGreaterThan(0)
    })
  })

  describe('timestamp-based duration', () => {
    it('should calculate correct duration after backgrounding simulation', async () => {
      const timer = new Timer()
      const sessionId = await timer.start('flow')

      // Simulate time passing (100ms)
      await new Promise(resolve => setTimeout(resolve, 100))

      const state1 = timer.getState()
      expect(state1.elapsedMs).toBeGreaterThanOrEqual(90)
      expect(state1.elapsedMs).toBeLessThanOrEqual(150)

      // Simulate more time (100ms more)
      await new Promise(resolve => setTimeout(resolve, 100))

      const state2 = timer.getState()
      expect(state2.elapsedMs).toBeGreaterThanOrEqual(190)
      expect(state2.elapsedMs).toBeLessThanOrEqual(250)
    })

    it('should correctly calculate actual duration for completed session', async () => {
      const timer = new Timer()
      const sessionId = await timer.start('flow')

      const startTime = Date.now()
      await new Promise(resolve => setTimeout(resolve, 100))
      
      await timer.pause()
      await new Promise(resolve => setTimeout(resolve, 50))
      
      await timer.resume()
      await new Promise(resolve => setTimeout(resolve, 100))
      
      await timer.stop()
      const endTime = Date.now()

      const session = await db.sessions.get(sessionId)
      const actualDuration = calculateActualDuration(session!)

      // Total elapsed should be close to 200ms (100 + 100, excluding 50ms pause)
      // Allow 50ms tolerance
      expect(actualDuration).toBeGreaterThanOrEqual(150)
      expect(actualDuration).toBeLessThanOrEqual(300)
      
      // Verify pause was excluded
      expect(actualDuration).toBeLessThan(endTime - startTime)
    })
  })
})

describe('formatDuration', () => {
  it('should format durations correctly', () => {
    expect(formatDuration(0)).toBe('0:00')
    expect(formatDuration(1000)).toBe('0:01')
    expect(formatDuration(60000)).toBe('1:00')
    expect(formatDuration(61000)).toBe('1:01')
    expect(formatDuration(3661000)).toBe('1:01:01')
    expect(formatDuration(36000000)).toBe('10:00:00')
  })
})

describe('calculateActualDuration', () => {
  it('should return 0 for sessions without end time', () => {
    const session: LocalSession = {
      id: '1',
      deviceId: 'test',
      startTs: Date.now(),
      endTs: null,
      pausedMs: 0,
      mode: 'flow',
      pauses: [],
      running: true,
      createdAt: Date.now(),
      syncStatus: 'pending'
    }

    expect(calculateActualDuration(session)).toBe(0)
  })

  it('should calculate duration excluding paused time', () => {
    const startTs = 1000000
    const endTs = 1010000 // 10 seconds later
    const pausedMs = 2000 // 2 seconds paused

    const session: LocalSession = {
      id: '1',
      deviceId: 'test',
      startTs,
      endTs,
      pausedMs,
      mode: 'flow',
      pauses: [],
      running: false,
      createdAt: startTs,
      syncStatus: 'pending'
    }

    expect(calculateActualDuration(session)).toBe(8000) // 10s - 2s = 8s
  })
})
