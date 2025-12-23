# Quick Start: Setting Up Supabase for FocusFlow

## 📝 Note: Supabase is Optional!

**FocusFlow works perfectly in local-only mode without Supabase!** 

If you don't set up Supabase:
- ✅ All features work (timer, analytics, planning)
- ✅ Data stored locally in your browser (IndexedDB)
- ✅ No account creation or sync features
- ❌ Data won't sync across devices
- ❌ Data is lost if you clear browser data

**To enable cloud sync and multi-device support**, follow this guide to set up Supabase (takes ~15 min).

---

## Prerequisites
- Node.js 18+ installed
- FocusFlow project cloned
- A Supabase account (free tier works!)

## Step 1: Create Supabase Project (5 min)

1. Go to [supabase.com](https://supabase.com/dashboard)
2. Click **New Project**
3. Fill in:
   - **Name:** focusflow-dev (or your choice)
   - **Database Password:** Generate a strong password (you won't need this often)
   - **Region:** Choose closest to you
4. Click **Create new project**
5. ☕ Wait ~2 minutes for setup

## Step 2: Get Your API Keys (1 min)

1. In your project dashboard, click **Settings** (gear icon) → **API**
2. Copy these two values:
   - **Project URL** (looks like `https://xxxxx.supabase.co`)
   - **anon/public key** (long string under "Project API keys")

## Step 3: Set Up Environment Variables (2 min)

1. In your FocusFlow project root, copy the example file:
   ```bash
   cp .env.example .env.local
   ```

2. Open `.env.local` and replace with your values:
   ```env
   NEXT_PUBLIC_SUPABASE_URL=https://xxxxx.supabase.co
   NEXT_PUBLIC_SUPABASE_ANON_KEY=your-long-anon-key-here
   NEXT_PUBLIC_APP_URL=http://localhost:3000
   ```

3. Save the file

## Step 4: Run Database Migrations (2 min)

1. In Supabase Dashboard, go to **SQL Editor** (left sidebar)
2. Click **New query**
3. Open `supabase/migrations/20240101000000_init_schema.sql` in your code editor
4. Copy the entire contents
5. Paste into the SQL Editor
6. Click **Run** (or press Ctrl/Cmd + Enter)
7. You should see "Success. No rows returned"

## Step 5: Enable Authentication Providers (3 min)

### Magic Link Email (Already Enabled!)
Email authentication works out of the box. No setup needed! 🎉

### Optional: Google OAuth

1. Go to **Authentication** → **Providers** in Supabase Dashboard
2. Find **Google** and toggle it ON
3. You'll need Google OAuth credentials. For now, you can skip this and use email only.

### Optional: GitHub OAuth

1. Go to **Authentication** → **Providers** in Supabase Dashboard
2. Find **GitHub** and toggle it ON
3. You'll need GitHub OAuth credentials. For now, you can skip this and use email only.

> **Note:** You can always add OAuth providers later! Email magic links are enough to get started.

## Step 6: Test It! (2 min)

1. Start your dev server:
   ```bash
   npm run dev
   ```

2. Open http://localhost:3000

3. Create a few focus sessions (just click the big "Start" button, wait a few seconds, click "Stop")

4. After 5 sessions, you'll see a prompt: **"Protect your history & sync devices"**

5. Click **"Create account"**

6. Click **"Continue with Email"**

7. Enter your email and click **"Send Magic Link"**

8. Check your email (might take 30 seconds)

9. Click the magic link in the email

10. 🎉 You're signed in! Your sessions are now synced to the cloud.

## Verification

After signing in, you should see:
- Your email initial in a circle in the top right
- Click it to see your email and "Last synced: Just now"
- Open Supabase Dashboard → **Table Editor** → **sessions** table
- You should see your sessions there!

## Troubleshooting

### "supabaseUrl is required" error
- Make sure you created `.env.local` (not just `.env.example`)
- Restart your dev server: Stop (Ctrl+C) and run `npm run dev` again

### Magic link email not arriving
- Check your spam/junk folder
- Wait up to 1 minute (email delivery can be slow)
- Try again with a different email
- Make sure you entered the email correctly

### Still stuck?
Check the full guide: `docs/SPRINT_3_AUTH_SYNC.md`

## What's Next?

Now that auth is working:
- Test on a second device/browser (incognito mode) with the same email
- Your sessions should sync across devices!
- All future sessions will automatically backup to the cloud
- You'll never lose your focus history

## OAuth Setup (Optional)

If you want to add Google or GitHub sign-in later:

### Google OAuth Setup
1. [Google Cloud Console](https://console.cloud.google.com) → Create Project
2. APIs & Services → Credentials → Create OAuth Client ID
3. Application Type: Web Application
4. Authorized redirect URIs: `https://YOUR-PROJECT-REF.supabase.co/auth/v1/callback`
5. Copy Client ID and Secret to Supabase

### GitHub OAuth Setup
1. [GitHub Settings](https://github.com/settings/developers) → OAuth Apps → New
2. Homepage URL: Your app URL
3. Authorization callback URL: `https://YOUR-PROJECT-REF.supabase.co/auth/v1/callback`
4. Copy Client ID and Secret to Supabase

Full instructions: See `docs/SPRINT_3_AUTH_SYNC.md` section "Enable Authentication Providers"

---

**Total Setup Time:** ~15 minutes  
**Cost:** $0 (Supabase free tier)  
**Difficulty:** Easy ⭐⭐⚪⚪⚪
