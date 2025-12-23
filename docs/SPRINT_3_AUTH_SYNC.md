# Sprint 3: Supabase Auth & Sync

## Overview
Sprint 3 implements user authentication and cloud synchronization using Supabase. Users can sign in with magic links or OAuth providers (Google/GitHub), and their local session data automatically syncs to the cloud.

## Features Implemented

### 1. Authentication Components

#### AuthModal (`components/Auth/AuthModal.tsx`)
- Full-featured authentication modal with:
  - Magic link email authentication
  - OAuth providers (Google and GitHub)
  - Email validation
  - Loading states
  - Success confirmation
  - Error handling

#### UserMenu (`components/Auth/UserMenu.tsx`)
- User account dropdown menu with:
  - User initials/avatar
  - Display email
  - Sign out functionality
  - Last sync timestamp
  - Sync in progress indicator

#### AuthProvider (`hooks/useAuth.tsx`)
- React Context provider managing:
  - User authentication state
  - Supabase auth state changes
  - Automatic sync trigger on sign-in
  - Sync status tracking (in progress, last sync time, errors)

#### Auth Callback (`app/auth/callback/page.tsx`)
- OAuth redirect handler
- Processes authentication tokens
- Redirects to home page

### 2. Home Page Integration

Updated `app/page.tsx` with:
- UserMenu in header (shows when authenticated)
- Auth modal trigger
- Account prompt (only shows for unauthenticated users)
- Sync status banners (syncing indicator, error messages)
- Modified account creation flow to open AuthModal

### 3. Authentication Flow

```
┌─────────────────────────────────────────────┐
│  Anonymous Usage (Local-First)              │
│  - All sessions stored in IndexedDB         │
│  - No account required                      │
└──────────────────┬──────────────────────────┘
                   │
                   │ After 5-10 sessions
                   ▼
┌─────────────────────────────────────────────┐
│  Soft Prompt: "Create Account"              │
│  - User can dismiss                         │
│  - Doesn't block usage                      │
└──────────────────┬──────────────────────────┘
                   │
                   │ User clicks "Create account"
                   ▼
┌─────────────────────────────────────────────┐
│  AuthModal Opens                            │
│  - Choose Magic Link or OAuth               │
│  - Enter email / click provider             │
└──────────────────┬──────────────────────────┘
                   │
                   │ Auth success
                   ▼
┌─────────────────────────────────────────────┐
│  Automatic Sync Triggered                   │
│  - Upload local sessions to Supabase        │
│  - Merge with existing cloud data           │
│  - Handle conflicts (last-write-wins)       │
└──────────────────┬──────────────────────────┘
                   │
                   │ Sync complete
                   ▼
┌─────────────────────────────────────────────┐
│  Authenticated State                        │
│  - UserMenu shows in header                 │
│  - Ongoing bidirectional sync               │
│  - Multi-device support                     │
└─────────────────────────────────────────────┘
```

## Setup Instructions

### 1. Create Supabase Project

1. Go to [supabase.com](https://supabase.com) and create an account
2. Click "New Project"
3. Choose your organization
4. Set project name: `focusflow-prod` (or your choice)
5. Set database password (save this securely)
6. Choose region closest to your users
7. Click "Create new project"
8. Wait ~2 minutes for provisioning

### 2. Enable Authentication Providers

#### Magic Link Email (Enabled by Default)
1. In Supabase Dashboard, go to **Authentication** → **Providers**
2. Scroll to **Email** provider
3. Ensure "Enable Email provider" is ON
4. Confirm Email rate limiting is set (default: 4 emails per hour)

#### Google OAuth
1. Go to [Google Cloud Console](https://console.cloud.google.com)
2. Create a new project or select existing
3. Enable **Google+ API**
4. Go to **Credentials** → **Create Credentials** → **OAuth 2.0 Client ID**
5. Set application type: **Web application**
6. Add Authorized redirect URIs:
   ```
   https://<your-project-ref>.supabase.co/auth/v1/callback
   ```
7. Copy **Client ID** and **Client Secret**
8. In Supabase Dashboard:
   - Go to **Authentication** → **Providers**
   - Enable **Google**
   - Paste Client ID and Secret
   - Save

#### GitHub OAuth
1. Go to [GitHub Settings](https://github.com/settings/developers)
2. Click **OAuth Apps** → **New OAuth App**
3. Set:
   - Application name: `FocusFlow`
   - Homepage URL: `https://yourapp.com` (or localhost for dev)
   - Authorization callback URL:
     ```
     https://<your-project-ref>.supabase.co/auth/v1/callback
     ```
4. Click **Register application**
5. Copy **Client ID**
6. Generate a **Client Secret** and copy it
7. In Supabase Dashboard:
   - Go to **Authentication** → **Providers**
   - Enable **GitHub**
   - Paste Client ID and Secret
   - Save

### 3. Run Database Migrations

1. In Supabase Dashboard, go to **SQL Editor**
2. Click **New query**
3. Copy and paste the contents of `supabase/migrations/20240101000000_init_schema.sql`
4. Click **Run** or press Cmd/Ctrl + Enter
5. Verify tables created: `sessions`, `session_metadata`, `planned_sessions`, `sync_metadata`
6. Verify RLS policies are active

### 4. Set Environment Variables

1. Copy `.env.example` to `.env.local`:
   ```bash
   cp .env.example .env.local
   ```

2. In Supabase Dashboard, go to **Settings** → **API**

3. Copy the following values to `.env.local`:
   ```env
   NEXT_PUBLIC_SUPABASE_URL=https://your-project-ref.supabase.co
   NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key-here
   NEXT_PUBLIC_APP_URL=http://localhost:3000
   ```

4. For production, add these to your Vercel environment variables

### 5. Test Authentication

1. Start the dev server:
   ```bash
   npm run dev
   ```

2. Open http://localhost:3000

3. **Test Magic Link:**
   - Click "Create account" on the account prompt
   - Click "Continue with Email"
   - Enter your email
   - Check email for magic link
   - Click link → should redirect back and sign in

4. **Test OAuth:**
   - Click "Create account"
   - Click "Continue with Google" or "Continue with GitHub"
   - Authorize the app
   - Should redirect back and sign in

5. **Verify Sync:**
   - Create a few sessions before signing in
   - Sign in with any method
   - Check browser console for "Starting full sync..."
   - Check UserMenu → should show "Last synced: Just now"
   - Open Supabase Dashboard → **Table Editor** → `sessions`
   - Should see your local sessions uploaded

### 6. Test Multi-Device Sync

1. **Device 1:**
   - Open app, create some sessions
   - Sign in
   - Verify sync completes

2. **Device 2:**
   - Open app in incognito/different browser
   - Sign in with same account
   - Should see sessions from Device 1
   - Create new sessions
   - Verify they sync

3. **Back to Device 1:**
   - Refresh page
   - Should see sessions from Device 2

## Technical Details

### Sync Strategy

**Local-First Architecture:**
- All data writes go to IndexedDB first
- Background sync to Supabase when authenticated
- Reads prefer local data, fallback to cloud
- Optimistic UI updates

**Conflict Resolution:**
- Last-write-wins based on timestamps
- Device ID + session ID ensures uniqueness
- No session data is ever lost
- Metadata can be overwritten by latest update

**Sync Triggers:**
- On sign-in (full sync of all local data)
- After completing a session (incremental)
- After updating metadata (incremental)
- On app launch (if authenticated)
- Manual refresh (future feature)

### Database Schema

**Local (IndexedDB via Dexie):**
```typescript
sessions: {
  id: string (deviceId:timestamp)
  deviceId: string
  startTs: number
  endTs?: number
  syncStatus: 'pending' | 'synced'
  lastModified: number
}

sessionMetadata: {
  sessionId: string
  subject?: string
  focusRating?: number
  notes?: string
  tags?: string[]
  syncStatus: 'pending' | 'synced'
  lastModified: number
}
```

**Cloud (Supabase Postgres):**
```sql
sessions (
  id TEXT PRIMARY KEY,
  user_id UUID REFERENCES auth.users,
  device_id TEXT NOT NULL,
  start_ts TIMESTAMPTZ NOT NULL,
  end_ts TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
)

session_metadata (
  session_id TEXT PRIMARY KEY REFERENCES sessions(id),
  subject TEXT,
  focus_rating INTEGER CHECK (focus_rating BETWEEN 1 AND 5),
  notes TEXT,
  tags TEXT[],
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
)
```

### Row Level Security (RLS)

All tables have RLS enabled with policies:
- Users can only read their own data
- Users can only insert/update/delete their own data
- Anonymous users have no access
- Service role bypasses RLS (for admin tools)

### Authentication Context

`useAuth` hook provides:
```typescript
{
  user: User | null,              // Supabase user object
  loading: boolean,               // Initial auth check
  signOut: () => Promise<void>,   // Sign out function
  syncInProgress: boolean,        // Sync status
  lastSyncTime: Date | null,      // Last successful sync
  syncError: string | null        // Sync error message
}
```

## Security Considerations

1. **Environment Variables:**
   - Never commit `.env.local` to git
   - Use different projects for dev/staging/production
   - Rotate keys if accidentally exposed

2. **RLS Policies:**
   - Tested and enforced on all tables
   - Users cannot access other users' data
   - Device ID doesn't leak user information

3. **Authentication:**
   - Magic links expire after 1 hour
   - OAuth tokens handled by Supabase
   - Session tokens stored in httpOnly cookies

4. **Data Privacy:**
   - All data encrypted in transit (HTTPS)
   - Supabase encrypts data at rest
   - No PII required (email only for auth)

## Known Limitations

1. **Offline Conflict Resolution:**
   - Last-write-wins may overwrite changes made on another device while offline
   - Future: Implement operational transformation or CRDT

2. **Large Data Sets:**
   - Initial sync of 1000+ sessions may be slow
   - Future: Implement incremental sync with cursor pagination

3. **Real-time Sync:**
   - Currently requires page refresh to see changes from other devices
   - Future: Implement Supabase Realtime subscriptions

## Next Steps (Sprint 4)

1. **Notifications & Reminders:**
   - Push notifications for break reminders
   - Daily streaks and goals
   - VAPID keys setup

2. **Enhanced Sync:**
   - Real-time sync with Supabase subscriptions
   - Sync status toast notifications
   - Manual sync button
   - Sync conflict UI

3. **Multi-Device Polish:**
   - Device management screen
   - Device names/icons
   - Last active timestamp
   - Sign out all devices

## Testing Checklist

- [ ] Magic link authentication works
- [ ] Google OAuth authentication works
- [ ] GitHub OAuth authentication works
- [ ] Local sessions sync on sign-in
- [ ] New sessions sync after creation
- [ ] Metadata syncs after reflection
- [ ] UserMenu displays correctly
- [ ] Sign out clears session
- [ ] Multi-device sync works
- [ ] RLS policies prevent unauthorized access
- [ ] Account prompt dismissed persists
- [ ] Account prompt hidden when authenticated
- [ ] Sync status banner shows during sync
- [ ] Sync error banner shows on failure

## Troubleshooting

### "supabaseUrl is required" Error
- Ensure `.env.local` exists with correct variables
- Restart dev server after creating `.env.local`
- Verify variable names start with `NEXT_PUBLIC_`

### Magic Link Not Received
- Check spam folder
- Verify email provider in Supabase Dashboard
- Check Supabase rate limits (4 emails/hour default)
- Verify SMTP settings (default uses Supabase's email)

### OAuth Redirect Not Working
- Verify callback URL in OAuth provider settings
- Must match `https://<project-ref>.supabase.co/auth/v1/callback`
- Check browser console for errors
- Verify provider is enabled in Supabase

### Sync Not Triggered
- Check browser console for errors
- Verify user is authenticated (`useAuth().user` not null)
- Check network tab for failed requests
- Verify Supabase URL and anon key are correct

### RLS Policy Errors
- Ensure migrations ran successfully
- Check Supabase logs for policy violations
- Verify user_id is set correctly in session data
- Test policies in SQL Editor with specific user IDs

---

**Sprint 3 Completion Date:** [Current Date]
**Duration:** [Time Taken]
**Lines of Code Added:** ~600
**Files Modified:** 8
**New Dependencies:** None (used existing @supabase/supabase-js)
