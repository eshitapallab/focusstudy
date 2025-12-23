# FocusFlow - Quick Start Guide

## Prerequisites Check

Before you begin, ensure you have:
- ✅ Node.js 18 or higher
- ✅ npm or yarn
- ✅ Git

Check your versions:
```bash
node --version  # Should be v18.0.0 or higher
npm --version   # Should be 8.0.0 or higher
```

## Step 1: Clone and Install

```bash
# Clone the repository
git clone <your-repo-url>
cd FocusFlow

# Install dependencies
npm install
```

## Step 2: Environment Setup

Create a `.env.local` file:
```bash
cp .env.example .env.local
```

For now, you can leave the Supabase credentials empty to test locally:
```env
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
NEXT_PUBLIC_APP_URL=http://localhost:3000
```

The app will work in **local-only mode** without Supabase!

## Step 3: Run Development Server

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

## Step 4: Test the Timer

1. Click the big "Start Studying" button
2. Watch the timer count up
3. Try pause/resume
4. Stop the timer
5. Fill in the reflection modal

Your session is saved locally in IndexedDB!

## Step 5: Run Tests (Optional)

```bash
# Unit tests
npm test

# E2E tests (requires dev server running)
npm run test:e2e
```

## Optional: Set Up Supabase

To enable auth and cloud sync:

### 1. Create Supabase Project
- Go to [supabase.com](https://supabase.com)
- Create a new project
- Wait for it to finish provisioning

### 2. Run Database Migration
- Open SQL Editor in Supabase dashboard
- Copy content from `supabase/migrations/001_initial_schema.sql`
- Paste and run it

### 3. Get API Keys
- Go to Project Settings → API
- Copy the Project URL and anon/public key
- Add them to `.env.local`

### 4. Enable Auth Providers
- Go to Authentication → Providers
- Enable Email (Magic Link)
- Optionally enable Google/GitHub OAuth

## Troubleshooting

### Port 3000 already in use
```bash
# Use a different port
PORT=3001 npm run dev
```

### Module not found errors
```bash
# Clear cache and reinstall
rm -rf node_modules .next
npm install
```

### IndexedDB not working
- Check if you're in private/incognito mode
- IndexedDB may be disabled in some browsers
- Try a different browser (Chrome/Edge work best)

### Build errors
```bash
# Check TypeScript errors
npm run lint

# Clear Next.js cache
rm -rf .next
npm run build
```

## Next Steps

1. **Try offline mode**: 
   - Disable network in DevTools
   - Timer still works!
   
2. **Check persistence**:
   - Close and reopen the app
   - Your sessions are still there

3. **Set up Supabase** to enable:
   - Multi-device sync
   - Data backup
   - Account creation

4. **Deploy to Vercel**:
   - Push to GitHub
   - Import to Vercel
   - Add environment variables
   - Deploy!

## Need Help?

- Check the [README.md](README.md) for full documentation
- See [CONTRIBUTING.md](CONTRIBUTING.md) for development guidelines
- Open an issue on GitHub

Happy studying! 🎯
