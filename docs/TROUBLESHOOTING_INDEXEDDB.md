# Troubleshooting: IndexedDB Schema Errors

## Issue: "KeyPath endTs on object store sessions is not indexed"

This error occurs when your browser has an old version of the IndexedDB database schema cached.

## Solution 1: Automatic Migration (Recommended)

The app has been updated to version 2 of the database schema. Simply:

1. **Refresh the page** (Ctrl+R or Cmd+R)
2. The new schema will automatically migrate your data
3. The error should disappear

If this doesn't work, try Solution 2.

## Solution 2: Clear IndexedDB Manually

If the automatic migration doesn't work, manually clear the database:

### Chrome/Edge:
1. Open DevTools (F12)
2. Go to **Application** tab
3. Expand **Storage** → **IndexedDB**
4. Right-click **FocusFlowDB**
5. Click **Delete database**
6. Refresh the page (Ctrl+R)

### Firefox:
1. Open DevTools (F12)
2. Go to **Storage** tab
3. Expand **Indexed DB**
4. Right-click **FocusFlowDB**
5. Click **Delete "FocusFlowDB"**
6. Refresh the page (Ctrl+R)

### Safari:
1. Open Web Inspector (Cmd+Option+I)
2. Go to **Storage** tab
3. Select **IndexedDB** → **FocusFlowDB**
4. Click **Delete Database**
5. Refresh the page (Cmd+R)

## ⚠️ Warning

Clearing IndexedDB will:
- ✅ Delete local session data (if not synced to cloud)
- ✅ Reset settings to defaults
- ✅ Clear streak information

If you're signed in with Supabase:
- ✅ Your data is safe in the cloud
- ✅ Will re-sync after clearing
- ✅ No data loss

If you're NOT signed in:
- ⚠️ All local data will be lost
- 💡 Consider creating an account first to backup your data

## Solution 3: Hard Refresh

Sometimes a hard refresh forces the new code to load:

- **Windows/Linux**: Ctrl + Shift + R
- **Mac**: Cmd + Shift + R

## Solution 4: Clear All Site Data

If nothing else works:

### Chrome/Edge:
1. Go to `chrome://settings/content/all`
2. Search for "localhost:3001"
3. Click **Clear data**
4. Refresh the app

### Firefox:
1. Press Ctrl+Shift+Del
2. Check "Site data"
3. Click "Clear Now"
4. Refresh the app

## Verify Fix

After clearing, verify the database is recreated:

1. Open DevTools (F12)
2. Go to Application/Storage tab
3. Check IndexedDB → FocusFlowDB
4. You should see version: **2**
5. Tables should have: sessions, sessionMetadata, plannedSessions, config

## Still Having Issues?

If you're still seeing the error:

1. Check browser console for other errors
2. Ensure you're running the latest code:
   ```bash
   git pull
   npm install
   npm run dev
   ```
3. Try a different browser
4. Check if service worker is cached (clear it in DevTools)

## Prevention

To avoid this issue in the future:
- Keep your browser updated
- Don't force-quit the browser during database operations
- Use the app in one tab at a time
- Sign in to enable cloud backup

---

**Latest Schema Version:** 2  
**Last Updated:** December 24, 2025
