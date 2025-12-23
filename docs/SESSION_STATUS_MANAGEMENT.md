# Planned Session Status Management

## Overview
FocusStudy now includes comprehensive status tracking for planned sessions, allowing you to mark sessions as completed, reschedule them, or cancel them as needed.

## Status Types

### 1. **Pending** (Default)
- **Color**: Primary blue
- **Meaning**: Session is planned and waiting to be started
- **Actions Available**:
  - ✓ Mark as Complete
  - Reschedule
  - Cancel
  - Start (begins actual study session)
  - Delete

### 2. **Completed**
- **Color**: Primary accent (teal)
- **Icon**: Checkmark
- **Meaning**: Session was successfully completed
- **Actions Available**:
  - Restore to Pending
  - Delete
- **Future Enhancement**: Link to actual completed session ID

### 3. **Cancelled**
- **Color**: Gray
- **Icon**: X mark
- **Meaning**: Session was cancelled and won't be done
- **Actions Available**:
  - Restore to Pending
  - Delete

### 4. **Rescheduled**
- **Color**: Warning yellow
- **Icon**: Refresh arrows
- **Meaning**: Session was moved to a different date
- **Additional Info**: Shows the new date
- **Actions Available**:
  - Restore to Pending (on original date)
  - Delete
- **Behavior**: Creates a new pending session on the target date

---

## Database Schema

### PlannedSession Interface
```typescript
interface PlannedSession {
  id: string
  deviceId: string
  userId?: string | null
  subject: string
  plannedDate: string // ISO date (YYYY-MM-DD)
  goal?: string | null
  
  // Status tracking (NEW)
  status: 'pending' | 'completed' | 'cancelled' | 'rescheduled'
  completedSessionId?: string | null // Links to actual session
  rescheduledTo?: string | null // New date if rescheduled
  
  createdAt: number
  syncStatus: 'pending' | 'synced' | 'conflict'
}
```

### Database Version
- **Version 3**: Added `status` field to plannedSessions index
- **Migration**: Automatically sets `status: 'pending'` for existing sessions

---

## User Interface

### Today's List (Home Page)
**Pending Sessions:**
- Displayed prominently under "Today's Plan"
- Shows status badge
- Large "Start" button to begin studying
- Quick action icons:
  - ✓ Mark complete
  - 📅 Reschedule
  - ✕ Cancel

**Other Sessions:**
- Completed/Cancelled/Rescheduled sessions shown below
- Smaller display with restore option
- Can be deleted

### Calendar View (`/planner`)
**Calendar Grid:**
- Sessions color-coded by status:
  - Pending: Blue
  - Completed: Teal
  - Cancelled: Gray
  - Rescheduled: Yellow

**Selected Date Panel:**
- Full session details
- Status badge
- Goal display
- Creation date
- Reschedule target (if applicable)
- Full action buttons
- Delete option

---

## Actions

### 1. Mark as Complete
**When**: Session was successfully completed (even without using the timer)
**Effect**: 
- Sets `status: 'completed'`
- Stays on same date
- Shown in "Other Sessions" section

### 2. Reschedule
**When**: Need to move session to a different date
**Flow**:
1. Click "Reschedule" button
2. Modal opens with date picker
3. Select new date
4. Confirm

**Effect**:
- Original session: `status: 'rescheduled'`, `rescheduledTo: newDate`
- New session created on target date with `status: 'pending'`
- Original session preserved for history

### 3. Cancel
**When**: Session won't be done
**Effect**:
- Sets `status: 'cancelled'`
- Confirmation required
- Can be restored later

### 4. Restore to Pending
**When**: Want to reactivate completed/cancelled/rescheduled session
**Effect**:
- Resets `status: 'pending'`
- Clears `completedSessionId` and `rescheduledTo`
- Returns to "Today's Plan" section

### 5. Delete
**When**: Permanently remove session
**Effect**:
- Complete deletion from database
- Confirmation required
- Cannot be undone

---

## Components

### `StatusBadge.tsx`
**Purpose**: Visual indicator of session status
**Props**:
- `status`: Session status
- `size`: 'sm' | 'md' (default 'sm')

**Features**:
- Color-coded backgrounds
- Status icons (checkmark, X, refresh)
- Semantic labeling

### `SessionActions.tsx`
**Purpose**: Manage session status changes
**Props**:
- `session`: PlannedSession object
- `onUpdate`: Callback after status change
- `compact`: Boolean for icon-only mode

**Modes**:
- **Pending**: Full action set (complete, reschedule, cancel)
- **Non-pending**: Restore option only
- **Compact**: Icon buttons only
- **Full**: Text buttons with icons

**Modals**:
- Reschedule modal with date picker
- Validation for future dates

### Updated Components

#### `TodayList.tsx`
- Separated pending vs non-pending sessions
- Added status badges
- Integrated SessionActions component
- Shows both action buttons and status

#### `PlannerModal.tsx`
- Sets `status: 'pending'` by default
- Initializes new fields

#### `app/planner/page.tsx`
- Color-coded calendar sessions
- Shows status badges in detail view
- Full action buttons
- Displays rescheduled target date

---

## User Workflows

### Scenario 1: Complete a Session
1. Plan session for today
2. Complete your study
3. Click ✓ icon next to session
4. Session marked as completed (teal badge)
5. Moves to "Other Sessions" section

### Scenario 2: Reschedule
1. Realize you can't study today
2. Click 📅 reschedule icon
3. Pick tomorrow's date
4. Confirm
5. Original session marked "Rescheduled" (yellow)
6. New session created for tomorrow

### Scenario 3: Cancel and Restore
1. Cancel a session you won't do
2. Session grayed out
3. Later, decide to do it
4. Click "Restore to Pending"
5. Returns to active list

---

## Implementation Details

### State Management
- Parent components reload sessions after actions
- `onUpdate` callback triggers refresh
- Optimistic UI updates

### Validation
- Reschedule date must be >= today
- Delete requires confirmation
- Cancel requires confirmation

### Accessibility
- All buttons have `aria-label`
- Minimum 44px touch targets
- Keyboard navigation support
- Clear visual status indicators

### Performance
- Indexed status field for fast queries
- Efficient filtering (pending vs others)
- Lazy loading of action modals

---

## Future Enhancements

### Phase 1 (Current)
- ✅ Basic status tracking
- ✅ Manual completion marking
- ✅ Reschedule functionality
- ✅ Cancel/restore

### Phase 2 (Planned)
- [ ] Auto-complete when session started with same subject
- [ ] Link `completedSessionId` to actual session
- [ ] Show actual study duration on completed sessions
- [ ] Statistics: completion rate, reschedule frequency

### Phase 3 (Advanced)
- [ ] Recurring sessions
- [ ] Bulk operations (complete multiple)
- [ ] Template sessions
- [ ] Status history/audit log
- [ ] Notifications for pending sessions

---

## Testing Checklist

- [x] Create pending session
- [x] Mark as complete
- [x] Cancel session
- [x] Reschedule to future date
- [x] Restore cancelled session
- [x] Delete completed session
- [x] Status badges display correctly
- [x] Calendar shows color-coded sessions
- [x] Today's list separates pending/other
- [x] Database migration works
- [x] TypeScript compilation passes
- [x] Build succeeds

---

## Migration Notes

**Upgrading from Version 2:**
- Database automatically upgrades to version 3
- Existing planned sessions get `status: 'pending'`
- No data loss
- Backward compatible

**Developer Notes:**
- Always check `session.status` before rendering
- Use `StatusBadge` component for consistency
- Call `onUpdate()` after status changes
- Handle all status types in UI logic

---

## API Reference

### Database Operations

```typescript
// Mark as complete
await db.plannedSessions.update(sessionId, { 
  status: 'completed',
  completedSessionId: actualSessionId // optional
})

// Reschedule
await db.plannedSessions.update(sessionId, {
  status: 'rescheduled',
  rescheduledTo: newDateISO
})

// Create rescheduled session
await db.plannedSessions.add({
  ...originalSession,
  id: crypto.randomUUID(),
  plannedDate: newDateISO,
  status: 'pending',
  createdAt: Date.now()
})

// Cancel
await db.plannedSessions.update(sessionId, { 
  status: 'cancelled' 
})

// Restore
await db.plannedSessions.update(sessionId, {
  status: 'pending',
  completedSessionId: null,
  rescheduledTo: null
})
```

### Query Examples

```typescript
// Get all pending sessions for today
const pending = await db.plannedSessions
  .where('plannedDate')
  .equals(todayISO)
  .and(s => s.status === 'pending')
  .toArray()

// Get completed sessions count
const completed = await db.plannedSessions
  .where('status')
  .equals('completed')
  .count()

// Get all rescheduled sessions
const rescheduled = await db.plannedSessions
  .where('status')
  .equals('rescheduled')
  .toArray()
```

---

## Keyboard Shortcuts (Future)

- `C` - Mark as complete
- `R` - Reschedule
- `X` - Cancel
- `S` - Start session
- `Del` - Delete

---

## Support & Troubleshooting

**Issue**: Status not updating
- **Solution**: Check browser console, ensure `onUpdate` callback is called

**Issue**: Rescheduled session not appearing
- **Solution**: Navigate to target date in calendar, check database

**Issue**: Migration failed
- **Solution**: Clear IndexedDB, refresh page (data will be lost)

**Issue**: Status badge wrong color
- **Solution**: Verify `status` field value in database

---

## Summary

The status management system provides:
- ✅ Full lifecycle tracking of planned sessions
- ✅ Flexible status options (pending, completed, cancelled, rescheduled)
- ✅ Visual status indicators throughout UI
- ✅ Quick actions for status changes
- ✅ Non-destructive operations (can restore)
- ✅ Calendar integration
- ✅ Database migration support
- ✅ Calm, supportive UX aligned with FocusStudy brand

This system transforms planned sessions from simple reminders into a comprehensive planning and tracking tool.
