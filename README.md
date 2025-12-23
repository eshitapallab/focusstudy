# FocusFlow

A production-ready, local-first study timer with post-hoc labeling, zero-friction start, and neurodivergent-friendly design.

## ✨ Features

- **Zero-friction Start**: Big "Start Studying" button — no setup required
- **Timestamp-based Timer**: Resilient to OS backgrounding and pausing
- **Post-hoc Labeling**: Label sessions after completion, not before
- **Local-first**: Works offline with IndexedDB, syncs when online
- **Authentication**: Magic link email + OAuth (Google/GitHub) 🆕
- **Cloud Sync**: Automatic backup and multi-device sync 🆕
- **Soft Account Prompt**: Prompts for account after 5-10 sessions to enable sync
- **Analytics Dashboard**: Week trends, heatmap, subject breakdown
- **Session Planning**: Pre-schedule focus sessions
- **Accessibility**: High contrast, reduce motion, large tap targets (44x44px)
- **PWA**: Install as a mobile app
- **Forgiving Analytics**: Neutral heatmap, no guilt-inducing streaks

## 🚀 Getting Started

### Prerequisites

- Node.js 18+ 
- npm or yarn
- Supabase account (for auth & sync)

### Installation

1. Clone the repository:
```bash
git clone <your-repo-url>
cd FocusFlow
```

2. Install dependencies:
```bash
npm install
```

3. Set up environment variables:
```bash
cp .env.example .env.local
```

**👉 See [SETUP_SUPABASE.md](./SETUP_SUPABASE.md) for detailed setup instructions (15 min)**

Quick version:
- Create a Supabase project at [supabase.com](https://supabase.com)
- Copy your Project URL and anon key to `.env.local`
- Run the database migration in SQL Editor
- You're ready to go!

4. Run the development server:
```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

## 🗄️ Database Setup

### Supabase Setup

1. Create a new Supabase project at [supabase.com](https://supabase.com)

2. Run the migration script in Supabase SQL Editor:
   - Go to SQL Editor in Supabase Dashboard
   - Copy and paste the content from `supabase/migrations/001_initial_schema.sql`
   - Click "Run"

3. Configure Auth providers (optional):
   - Go to Authentication > Providers
   - Enable Email (Magic Link)
   - Optionally enable Google and GitHub OAuth

4. Copy your project URL and anon key to `.env.local`

## 📦 Project Structure

```
FocusFlow/
├── app/                    # Next.js 14 app router
│   ├── layout.tsx         # Root layout with metadata
│   ├── page.tsx           # Today screen (main)
│   └── globals.css        # Global styles
├── components/            # React components
│   ├── Timer/
│   │   └── TimerFullScreen.tsx
│   └── ReflectionModal.tsx
├── hooks/                 # Custom React hooks
│   └── useTimer.ts
├── lib/                   # Core logic
│   ├── dexieClient.ts    # IndexedDB schema & helpers
│   ├── supabaseClient.ts # Supabase client & auth
│   └── timer.ts          # Timer class with timestamp logic
├── supabase/
│   └── migrations/        # Database migrations
├── __tests__/            # Jest tests
├── public/               # Static assets
└── package.json
```

## 🧪 Testing

### Unit Tests

```bash
npm test
```

### E2E Tests (Coming Soon)

```bash
npm run test:e2e
```

## 🎨 Design Principles

### Neurodivergent-Friendly
- Large tap targets (minimum 44x44px)
- High contrast mode available
- Reduce motion toggle
- Simple, clear language (no productivity jargon)
- No guilt-inducing UI (neutral colors for analytics)

### Local-First
- All data stored in IndexedDB first
- Works completely offline
- Sync to Supabase when signed in
- Device ID for anonymous sessions

### Timestamp-Based Timer
- Uses `Date.now()` timestamps, not intervals
- Resilient to backgrounding and OS pausing
- Automatically reconciles time discrepancies
- Shows adjustment banner when time is corrected

## 🔄 Sync Architecture

1. **Anonymous Mode**: Data stored locally with `device_id`
2. **Sign Up**: Links `device_id` to `user_id`, uploads local sessions
3. **Conflict Resolution**: Server version wins, local kept as backup
4. **Real-time Sync**: Uses Supabase Realtime for multi-device updates

## 📱 PWA Features

- Installable on mobile and desktop
- Offline-capable
- Service worker for caching
- Page Visibility API for background detection

## 🚀 Deployment

### Deploy to Vercel

1. Push your code to GitHub

2. Import project in Vercel:
   - Go to [vercel.com](https://vercel.com)
   - Click "Import Project"
   - Select your repository

3. Add environment variables:
   - `NEXT_PUBLIC_SUPABASE_URL`
   - `NEXT_PUBLIC_SUPABASE_ANON_KEY`
   - `NEXT_PUBLIC_APP_URL` (your Vercel URL)

4. Deploy!

[![Deploy with Vercel](https://vercel.com/button)](https://vercel.com/new/clone?repository-url=https://github.com/yourusername/focusflow)

## 📊 Analytics & Privacy

- All analytics computed locally
- No tracking or external analytics services
- Data only synced when user signs in
- Export and delete account features available

## 🛠️ Technology Stack

- **Frontend**: Next.js 14 (React), TypeScript, Tailwind CSS
- **Local DB**: IndexedDB (Dexie.js)
- **Backend**: Supabase (Auth, Postgres, Realtime)
- **Deployment**: Vercel
- **Testing**: Jest, Playwright

## 📝 Sprint Progress

### ✅ Sprint 1: Core App Shell & Local-First Timer
- [x] Next.js + TypeScript + Tailwind setup
- [x] PWA configuration
- [x] Dexie.js local DB schema
- [x] Timer logic with timestamp-based tracking
- [x] Today screen UI (mobile-first)
- [x] Timer fullscreen component
- [x] Timer reconciliation logic
- [x] Unit tests for timer

### ⏳ Sprint 2: Post-hoc Labeling & Analytics
- [x] Reflection modal
- [ ] Analytics dashboard
- [ ] Heatmap calendar
- [ ] Subject breakdown charts

### ⏳ Sprint 3: Supabase Auth & Sync
- [x] Supabase client setup
- [x] Database migrations
- [ ] Magic link authentication
- [ ] Sync pipeline
- [ ] Conflict resolution

### ⏳ Sprint 4: Notifications & Backend
- [ ] Browser push notifications
- [ ] Supabase Edge Function for reminders
- [ ] Optional Cloudflare Worker hooks

### ⏳ Sprint 5: Polish & Deployment
- [ ] Accessibility audit
- [ ] E2E tests
- [ ] Production deployment
- [ ] Performance optimization

## 🤝 Contributing

Contributions welcome! Please read our contributing guidelines first.

## 📄 License

MIT License - see LICENSE file for details

## 🙏 Acknowledgments

- Tiimo app for neurodivergent-friendly design inspiration
- Supabase for excellent local-first architecture docs
- Next.js team for the amazing framework

---

**Built with ❤️ for students who need a frictionless way to track their study time**
