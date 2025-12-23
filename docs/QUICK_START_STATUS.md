# Quick Start: Managing Planned Sessions

## ✅ Mark a Session as Complete

### From Today's List (Home Page)
1. Find your session under "Today's Plan"
2. Click the **✓ checkmark icon** at the bottom
3. Session instantly marked complete (teal badge)
4. Moves to "Other Sessions" section

### From Calendar View
1. Navigate to `/planner`
2. Click on the date with your session
3. Click **"✓ Complete"** button
4. Confirmation shown with status badge

**When to use**: You completed the study session (even if you didn't use the timer)

---

## 📅 Reschedule a Session

### Quick Reschedule (Home Page)
1. Find your session under "Today's Plan"
2. Click the **📅 calendar icon**
3. Pick new date from modal
4. Click "Reschedule"

**Result**: 
- Original session marked as "Rescheduled" (yellow badge)
- New session created on target date with "Pending" status

### Full Reschedule (Calendar View)
1. Navigate to `/planner`
2. Click on date with session
3. Click **"Reschedule"** button
4. Choose new date
5. Confirm

**When to use**: Can't do the session today, want to move it to another day

---

## ✕ Cancel a Session

### From Today's List
1. Click the **✕ icon** at the bottom
2. Confirm cancellation
3. Session marked as "Cancelled" (gray badge)
4. Moves to "Other Sessions"

### From Calendar
1. Click on date
2. Click **"Cancel"** button
3. Confirm

**When to use**: Session won't be done (project cancelled, topic no longer relevant)

---

## 🔄 Restore a Session

Sessions that are completed, cancelled, or rescheduled can be restored to pending.

### Steps
1. Find session in "Other Sessions" (home) or calendar
2. Click **"Restore to Pending"** button
3. Session returns to active status

**When to use**: 
- Changed your mind about cancellation
- Want to redo a completed session
- Need to undo a reschedule

---

## 🎨 Status Color Guide

| Status | Color | Meaning |
|--------|-------|---------|
| **Pending** | 🔵 Blue | Ready to start |
| **Completed** | 🟢 Teal | Successfully done |
| **Cancelled** | ⚪ Gray | Won't be done |
| **Rescheduled** | 🟡 Yellow | Moved to new date |

---

## 💡 Pro Tips

### Planning Your Day
1. Create multiple sessions for different subjects
2. Start sessions directly from "Today's Plan"
3. Mark as complete as you finish each one
4. View your progress in "Other Sessions"

### Using the Calendar
1. View full month of planned sessions
2. Click any date to see all sessions
3. Color-coded sessions show status at a glance
4. Manage future sessions before the day arrives

### Workflow Optimization
**Morning Routine:**
1. Check "Today's Plan"
2. Reschedule anything you can't do
3. Start first session

**After Each Session:**
1. If you used timer: session auto-recorded
2. If not: manually mark as complete
3. Plan next session if needed

**End of Day:**
1. Review "Other Sessions"
2. Reschedule pending items to tomorrow
3. Check tomorrow's plan in calendar

### Handling Changes
- **Project dropped**: Cancel the session
- **Topic takes longer**: Keep pending, continue tomorrow
- **Schedule conflict**: Reschedule to specific date
- **Completed offline**: Mark as complete manually

---

## 🎯 Common Scenarios

### Scenario 1: Flexible Study Day
```
Morning: Plan 3 sessions (Math, History, Science)
After lunch: Complete Math ✓
Afternoon: Reschedule History → Tomorrow 📅
Evening: Complete Science ✓
Result: 2 completed today, 1 pending tomorrow
```

### Scenario 2: Project Cancelled
```
Have session planned for "Presentation Research"
Project gets cancelled
Action: Cancel session ✕
Result: Gray badge, archived in "Other Sessions"
Later: Delete permanently if not needed
```

### Scenario 3: Rescheduling Chain
```
Monday: Plan "Study Chapter 5" for Tuesday
Tuesday morning: Too busy, reschedule → Wednesday
Wednesday: Complete successfully ✓
Result: Shows rescheduled chain in calendar
```

### Scenario 4: Mistake Recovery
```
Accidentally cancel important session
Realize mistake
Action: Click "Restore to Pending"
Result: Back in "Today's Plan", ready to start
```

---

## 📱 Mobile-Friendly Actions

All action buttons meet 44px minimum touch target size:
- Large tap areas
- No accidental clicks
- Clear visual feedback
- Swipe-friendly layout

**Mobile Tips:**
- Use compact icon view in Today's List
- Full buttons in Calendar detail view
- Responsive modals
- Easy date picking

---

## ⚠️ Important Notes

**Deleting vs Cancelling:**
- **Cancel**: Keeps session in history, can restore
- **Delete**: Permanent removal, cannot undo

**Rescheduling:**
- Original session kept for history
- New session created on target date
- Can reschedule multiple times
- Chain visible in calendar

**Completing:**
- Manual completion doesn't link to timer session (yet)
- Future: Auto-complete when starting session with same subject
- Use for offline study tracking

**Status Persistence:**
- Synced across devices (if signed in)
- Stored in IndexedDB locally
- Survives browser restart
- Migrates safely on updates

---

## 🔍 Finding Sessions

### By Date (Calendar View)
1. Navigate to `/planner`
2. Click any date
3. See all sessions for that day
4. Filter by status visually (colors)

### By Status (Today's List)
- **Pending**: Top section "Today's Plan"
- **Others**: Bottom section "Other Sessions"
- Grouped automatically

### Quick Access
- Home page: Today's sessions only
- Calendar: All past, present, future sessions
- Click date for full details

---

## 🎓 Best Practices

1. **Plan Ahead**: Create sessions for the week in calendar view
2. **Be Realistic**: Don't overcommit, reschedule if needed
3. **Track Progress**: Mark completed sessions for motivation
4. **Clean Up**: Delete old cancelled sessions periodically
5. **Stay Flexible**: Use reschedule freely, no guilt
6. **Use Goals**: Add goal text for each session
7. **Review Weekly**: Check calendar for upcoming sessions

---

## 🆘 Troubleshooting

**Q: Status not updating?**
A: Refresh the page, check browser console

**Q: Rescheduled session not showing?**
A: Navigate to target date in calendar

**Q: Can't find cancelled session?**
A: Check "Other Sessions" on original date

**Q: Want to undo reschedule?**
A: Restore original to pending, delete new one

**Q: Lost data after reschedule?**
A: Subject and goal copied to new session

---

## 🎉 Summary

You now have powerful tools to:
- ✅ Track what you've completed
- 📅 Flexibly reschedule without stress
- ✕ Cancel what won't happen
- 🔄 Restore if you change your mind
- 🎨 Visualize status at a glance
- 📊 Build better study habits

**Remember**: This is about supporting your learning journey, not creating pressure. Use these tools in whatever way helps YOU study better! 🌟
