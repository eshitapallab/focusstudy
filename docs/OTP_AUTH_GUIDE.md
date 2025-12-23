# OTP-Only Authentication System

## Overview

FocusStudy uses a **password-free authentication system** with email OTP (one-time password) codes only. This provides a simple, secure way to protect and sync study data without the complexity of passwords.

## Philosophy

- **No passwords** - Users never create or remember passwords
- **Unified flow** - Signup and login use the same process
- **Never blocks studying** - Auth is optional, studying works offline
- **Local-first** - All data saved locally first, sync happens after auth
- **Safe logout** - Signing out never deletes local data

---

## User Journey

### 1. Email Entry (`/auth`)

**UI Elements:**
- Email input field (large, accessible)
- "Continue" button
- Helper text: *"We'll send a one-time code to your email. No passwords required."*
- "Back to studying" link

**Flow:**
```typescript
// User enters: user@example.com
await supabase.auth.signInWithOtp({
  email,
  options: { shouldCreateUser: true }
})

// Success → redirect to /auth/verify?email=user@example.com
```

**Edge Cases:**
- Invalid email → Inline error
- Rate limited → "Too many requests. Please wait..."
- Network error → "Failed to send code. Check your connection"

---

### 2. OTP Verification (`/auth/verify`)

**UI Elements:**
- 6 separate input boxes (one digit each)
- Masked email display: `u***r@example.com`
- "Verify Code" button
- "Resend code" link (disabled for 30s)
- "Use different email" link

**Flow:**
```typescript
// User enters: 1 2 3 4 5 6
await supabase.auth.verifyOtp({
  email,
  token: '123456',
  type: 'email'
})

// Success → Session created → Redirect to /?auth=success
```

**Features:**
- **Auto-advance**: Focus moves to next input after digit entry
- **Auto-submit**: Verifies automatically when 6th digit entered
- **Paste support**: Paste "123456" from clipboard
- **Backspace handling**: Deletes and moves to previous input
- **Mobile numeric keyboard**: `inputMode="numeric"`

**Edge Cases:**
- Invalid OTP → "Invalid code. Please check and try again."
- Expired OTP → "Code expired. Please request a new one."
- Rate limited → Resend button disabled with countdown

---

### 3. Authentication Success

**What Happens:**
1. Session stored by Supabase client
2. `AuthProvider` detects `SIGNED_IN` event
3. Auto-triggers `fullSync(userId, deviceId)`
4. Uploads local sessions to cloud
5. Downloads any cloud sessions
6. Shows success banner: *"You're signed in! Your sessions are now synced across devices"*

**User Experience:**
- Redirected to home page (`/`)
- Green success banner (auto-dismiss after 5s)
- User menu appears in header
- Blue "Syncing..." banner while sync in progress

---

## Technical Implementation

### File Structure

```
app/
├── auth/
│   ├── page.tsx              # Email entry
│   ├── verify/
│   │   └── page.tsx          # OTP verification
│   └── callback/
│       └── page.tsx          # Auth redirect handler

components/Auth/
├── AuthModal.tsx             # Redirects to /auth
└── UserMenu.tsx              # Shows user info + logout

hooks/
└── useAuth.tsx               # Auth context provider

lib/
├── supabaseClient.ts         # Supabase client setup
└── sync.ts                   # Local↔Cloud sync logic
```

### Supabase Client Configuration

```typescript
// lib/supabaseClient.ts
export const supabase = createClient(url, key, {
  auth: {
    autoRefreshToken: true,      // Auto-refresh before expiry
    persistSession: true,         // Store in localStorage
    detectSessionInUrl: true      // Handle OAuth callbacks
  }
})
```

### Auth Provider

```typescript
// hooks/useAuth.tsx
export function AuthProvider({ children }) {
  const [user, setUser] = useState<User | null>(null)
  
  useEffect(() => {
    // Get initial session
    supabase.auth.getSession().then(({ data: { session } }) => {
      setUser(session?.user ?? null)
      
      // Trigger sync if user signed in
      if (session?.user) {
        triggerSync(session.user.id)
      }
    })
    
    // Listen for auth state changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        setUser(session?.user ?? null)
        
        if (event === 'SIGNED_IN' && session?.user) {
          await triggerSync(session.user.id)
        }
      }
    )
    
    return () => subscription.unsubscribe()
  }, [])
  
  // ... rest of provider
}
```

---

## Session Management

### Getting Current Session

```typescript
import { useAuth } from '@/hooks/useAuth'

function MyComponent() {
  const { user, loading } = useAuth()
  
  if (loading) return <LoadingSpinner />
  if (!user) return <AnonymousView />
  return <AuthenticatedView />
}
```

### Checking Auth Status

```typescript
// Check if user is authenticated
if (user) {
  // User is signed in
  console.log('User ID:', user.id)
  console.log('Email:', user.email)
}

// Check if Supabase is configured
if (isSupabaseConfigured) {
  // Cloud sync available
}
```

---

## Logout Flow

### What Logout Does

```typescript
await supabase.auth.signOut()
```

**Does:**
- ✅ Clears Supabase session
- ✅ Removes auth cookies
- ✅ Resets auth state to null
- ✅ Hides UserMenu

**Does NOT:**
- ❌ Delete IndexedDB data
- ❌ Delete device_id
- ❌ Clear study sessions
- ❌ Remove planned sessions

### User Experience

1. User clicks "Sign out" in UserMenu
2. Toast notification: *"You're signed out. Your data stays on this device."*
3. App continues working in anonymous mode
4. All local sessions remain accessible
5. User can still start new sessions
6. Sync stops until user signs in again

---

## Local-First Data Safety

### Core Principles

1. **Studying never blocked** - App works fully offline
2. **Local storage first** - Sessions saved to IndexedDB immediately
3. **Sync is additive** - Cloud sync never deletes local data
4. **device_id persistence** - Tracks sessions even when logged out

### Sync Trigger Points

```typescript
// Sync happens ONLY when:
1. User signs in (SIGNED_IN event)
2. User refreshes page while authenticated
3. Session auto-refreshes (Supabase handles this)

// Sync does NOT happen when:
- User is logged out
- Supabase not configured
- Network is offline
```

### Data Flow

```
Anonymous User:
  Session Start → IndexedDB (device_id)
  Session End   → IndexedDB (device_id)
  
Authenticated User:
  Session Start → IndexedDB (device_id + user_id)
  Session End   → IndexedDB
  Auth Event    → fullSync(userId, deviceId)
                  ├── Upload local sessions to Supabase
                  └── Download cloud sessions to IndexedDB
```

---

## Error Handling

### Network Errors

```typescript
try {
  await supabase.auth.signInWithOtp({ email })
} catch (error) {
  setError('Failed to send code. Please check your connection and try again.')
}
```

### Invalid OTP

```typescript
const { error } = await supabase.auth.verifyOtp({ email, token, type: 'email' })

if (error) {
  if (error.message.includes('expired')) {
    setError('Code expired. Please request a new one.')
  } else if (error.message.includes('invalid')) {
    setError('Invalid code. Please check and try again.')
  }
}
```

### Rate Limiting

```typescript
if (error.message.includes('rate limit')) {
  setError('Too many requests. Please wait a moment and try again.')
}
```

---

## Supabase Configuration

### Auth Settings (Required)

Navigate to Supabase Dashboard → Authentication → Providers:

1. **Enable Email OTP**
   - ✅ Enable Email provider
   - ✅ Enable "Email OTP"
   - ❌ Disable "Email link (Magic Link)"
   - ❌ Disable "Email + Password"

2. **OTP Settings**
   - Expiry: 10 minutes
   - Rate limit: 5 requests per hour per email

3. **Email Templates**
   - Customize OTP email template (optional)
   - Default subject: "Your verification code"
   - Default body: "Your code is {{ .Token }}"

### Environment Variables

```bash
# .env.local
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
```

### Row Level Security (RLS)

```sql
-- Enable RLS on sessions table
ALTER TABLE sessions ENABLE ROW LEVEL SECURITY;

-- Users can only read/write their own sessions
CREATE POLICY "Users manage own sessions"
ON sessions
FOR ALL
USING (user_id = auth.uid())
WITH CHECK (user_id = auth.uid());

-- Anonymous users (device_id only) can read/write before sign-in
CREATE POLICY "Anonymous device access"
ON sessions
FOR ALL
USING (
  user_id IS NULL 
  AND device_id = current_setting('app.device_id', true)
);
```

---

## Testing Checklist

### Email Entry Flow
- [ ] Enter valid email → Success
- [ ] Enter invalid email → Inline error
- [ ] Submit empty form → HTML5 validation
- [ ] Rate limit triggered → Friendly message
- [ ] Network offline → Connection error
- [ ] Click "Back to studying" → Returns to home

### OTP Verification Flow
- [ ] Enter 6 digits manually → Auto-submit
- [ ] Paste 6-digit code → Auto-verifies
- [ ] Enter invalid OTP → Error shown, inputs cleared
- [ ] Wait 10+ minutes → Expired error
- [ ] Click resend (before 30s) → Button disabled
- [ ] Click resend (after 30s) → New OTP sent, countdown resets
- [ ] Backspace on empty input → Focus moves back
- [ ] Tab between inputs → Works correctly
- [ ] Mobile numeric keyboard → Opens correctly

### Session Management
- [ ] Sign in → Session persisted
- [ ] Refresh page → Session restored
- [ ] Close tab → Session persisted
- [ ] Session auto-refreshes → No interruption
- [ ] Token expires → Auto-refreshes seamlessly

### Logout Flow
- [ ] Click "Sign out" → User signed out
- [ ] IndexedDB data → Remains intact
- [ ] device_id → Unchanged
- [ ] Start new session → Works (anonymous mode)
- [ ] Sign in again → Previous data syncs

### Sync Behavior
- [ ] Sign in with existing sessions → Uploads to cloud
- [ ] Sign in with cloud sessions → Downloads to local
- [ ] Sign out → Sync stops
- [ ] New session while signed out → Stays local
- [ ] Sign in again → Syncs new local sessions

---

## Security Considerations

### OTP Security
- **Expiry**: Codes expire after 10 minutes
- **Single-use**: Each OTP can only be used once
- **Rate limiting**: Max 5 OTP requests per hour per email
- **No logging**: OTP codes never logged or stored

### Session Security
- **httpOnly cookies**: Session tokens stored securely
- **Auto-refresh**: Tokens refreshed before expiry
- **Secure transmission**: All API calls over HTTPS
- **RLS enforcement**: Users can only access their own data

### Data Privacy
- **Local-first**: Data stored locally by default
- **Opt-in sync**: User chooses when to enable cloud sync
- **Logout safety**: Signing out never deletes local data
- **Device isolation**: device_id prevents cross-contamination

---

## Migration from Old Auth

### Removed Features
- ❌ Password authentication
- ❌ Magic link authentication
- ❌ Google OAuth
- ❌ GitHub OAuth

### Why OTP-Only?

1. **Simplicity**: One auth flow, not four
2. **Security**: No password reuse or leaks
3. **UX**: Faster than magic links, simpler than OAuth
4. **Mobile-friendly**: Easy to copy OTP from SMS/email
5. **Passwordless**: Modern, secure standard

### Backward Compatibility

The `AuthModal` component still exists but now redirects to `/auth`:

```typescript
// Old usage still works
<AuthModal 
  onClose={() => setShowAuthModal(false)}
/>

// Internally redirects to /auth page
```

---

## Troubleshooting

### "Authentication is not configured"

**Cause**: Supabase environment variables missing

**Fix**:
```bash
# Add to .env.local
NEXT_PUBLIC_SUPABASE_URL=your-url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-key
```

### "Too many requests"

**Cause**: Rate limit reached (5 OTP per hour)

**Fix**: Wait 1 hour or adjust rate limit in Supabase dashboard

### "Failed to send code"

**Causes**:
1. Supabase project suspended
2. Email provider not configured
3. Network offline

**Fix**: Check Supabase dashboard status and email settings

### OTP not received

**Checks**:
1. Check spam folder
2. Verify email provider configured in Supabase
3. Check Supabase logs for email delivery
4. Try different email address

### Session not persisting

**Causes**:
1. Browser in incognito mode (localStorage disabled)
2. Browser blocking third-party cookies
3. localStorage full

**Fix**: Use regular browser mode, clear storage

---

## API Reference

### `supabase.auth.signInWithOtp()`

```typescript
const { data, error } = await supabase.auth.signInWithOtp({
  email: string,
  options?: {
    shouldCreateUser: boolean,  // Default: true
    data?: object              // User metadata (optional)
  }
})
```

### `supabase.auth.verifyOtp()`

```typescript
const { data, error } = await supabase.auth.verifyOtp({
  email: string,
  token: string,
  type: 'email'
})

// Returns:
// - data.session: Session object if successful
// - data.user: User object if successful
// - error: Error object if failed
```

### `supabase.auth.signOut()`

```typescript
const { error } = await supabase.auth.signOut()
```

### `supabase.auth.getSession()`

```typescript
const { data: { session }, error } = await supabase.auth.getSession()
```

### `supabase.auth.onAuthStateChange()`

```typescript
const { data: { subscription } } = supabase.auth.onAuthStateChange(
  (event, session) => {
    // event: 'SIGNED_IN' | 'SIGNED_OUT' | 'TOKEN_REFRESHED' | etc.
    // session: Session object or null
  }
)

// Cleanup
subscription.unsubscribe()
```

---

## Future Enhancements

### Potential Additions
- [ ] SMS OTP (alternative to email)
- [ ] Biometric auth (Face ID / Touch ID)
- [ ] Passkey support (WebAuthn)
- [ ] Remember device (skip OTP for 30 days)

### Not Planned
- ❌ Password authentication (complexity, security risks)
- ❌ Social OAuth (privacy concerns, complexity)
- ❌ Magic links (slower UX than OTP)

---

## Support

**Email not working?** Check Supabase email settings  
**OTP expired?** Request a new one (30s cooldown)  
**Local data missing?** Check IndexedDB in DevTools  
**Sync failing?** Check network and Supabase status

For more help, see [SETUP_SUPABASE.md](./SETUP_SUPABASE.md)
