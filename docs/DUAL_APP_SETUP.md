# Two Apps in One Project

This workspace contains two separate apps:

## 🎯 FocusFlow (Timer App) - Route: `/`

**Original timer app with Supabase**
- Zero-friction study timer
- Post-hoc session labeling
- Analytics dashboard
- Session planning
- Supabase sync

**Stack:**
- Supabase (Auth + Postgres)
- Dexie (IndexedDB)
- Local-first architecture

**Key Files:**
- [app/page.tsx](../app/page.tsx) - Main timer interface
- [lib/supabaseClient.ts](../lib/supabaseClient.ts)
- [hooks/useTimer.ts](../hooks/useTimer.ts)
- [hooks/useAuth.tsx](../hooks/useAuth.tsx)

---

## 📚 StudyTrack (Exam Accountability) - Route: `/track`

**New exam prep accountability app with Firebase**
- Daily check-ins (≤60 seconds)
- Verdict engine (🟢🟡🔴)
- Micro-actions
- Weekly reality checks
- Peer comparison
- Anti-gaming detection

**Stack:**
- Firebase (Firestore + Auth)
- Anonymous auth by default
- Mobile-first PWA

**Key Files:**
- [app/track/page.tsx](../app/track/page.tsx) - Dashboard entry
- [components/Dashboard/MainDashboard.tsx](../components/Dashboard/MainDashboard.tsx)
- [lib/firebase.ts](../lib/firebase.ts)
- [lib/firestore.ts](../lib/firestore.ts)

---

## Environment Setup

Both apps can run simultaneously. Configure credentials for each:

### FocusFlow (Supabase)
```env
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
```

### StudyTrack (Firebase)
```env
NEXT_PUBLIC_FIREBASE_API_KEY=your_key
NEXT_PUBLIC_FIREBASE_PROJECT_ID=your_project
NEXT_PUBLIC_FIREBASE_APP_ID=your_app_id
```

---

## Running the Apps

```bash
npm run dev
```

- **FocusFlow Timer**: http://localhost:3000
- **StudyTrack Accountability**: http://localhost:3000/track

Both apps are completely independent and won't interfere with each other.

---

## Documentation

- **FocusFlow**: See main [README.md](../README.md)
- **StudyTrack**: See [docs/README.md](./README.md) and [QUICK_START.md](./QUICK_START.md)
