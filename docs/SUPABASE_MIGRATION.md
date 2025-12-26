# Supabase Migration Complete

## Overview
Both **FocusFlow** (timer app) and **StudyTrack** (exam accountability app) now use **Supabase** as the unified backend.

## What Changed

### Database Schema
- Created `002_studytrack_schema.sql` migration in `/supabase/migrations/`
- New tables: `study_users`, `daily_check_ins`, `verdicts`, `micro_actions`, `weekly_reality`, `cohort_stats`, `gaming_detections`
- All tables have Row Level Security (RLS) enabled
- Users can only access their own data
- Cohort stats are publicly readable for peer comparison

### Code Changes
1. **Removed Firebase dependencies**
   - Uninstalled `firebase` and `firebase-admin` packages
   - Removed `/lib/firebase.ts`, `/lib/firestore.ts`, `/lib/notifications.ts`

2. **Created Supabase adapter**
   - `/lib/supabaseStudyTrack.ts` - All database operations for StudyTrack
   - Converts between Supabase snake_case and TypeScript camelCase
   - Uses existing Supabase client from `/lib/supabaseClient.ts`

3. **Updated components**
   - `/components/Dashboard/MainDashboard.tsx` - Now uses Supabase auth and database operations
   - All StudyTrack components now work with unified Supabase backend

## Setup Instructions

### 1. Run Database Migration
```bash
# In Supabase Dashboard > SQL Editor, run:
supabase/migrations/002_studytrack_schema.sql
```

This creates all necessary tables with proper:
- Foreign key constraints
- Indexes for performance
- Row Level Security policies
- Triggers for timestamp updates

### 2. Configure Environment
Update `.env.local` with your Supabase credentials:
```bash
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key-here
```

### 3. Anonymous Auth Setup
In Supabase Dashboard:
1. Go to **Authentication > Providers**
2. Enable **Anonymous sign-ins**
3. This allows StudyTrack users to start immediately without signup

## Architecture

### Unified Backend Benefits
✅ **Single Database** - One Postgres instance for both apps  
✅ **Shared Auth** - Users can access both FocusFlow and StudyTrack with one account  
✅ **Cost Efficient** - One free tier covers both applications  
✅ **Simpler Deployment** - One set of credentials, one backend to manage  
✅ **SQL Power** - Complex queries for analytics and peer comparison  
✅ **Real-time Capabilities** - Can add live updates if needed  

### Data Isolation
- FocusFlow uses tables: `sessions`, `goals`, `subjects`, etc.
- StudyTrack uses tables: `study_users`, `daily_check_ins`, `verdicts`, etc.
- Both apps use the same `auth.users` table
- RLS policies ensure data privacy

## Features Preserved

### FocusFlow (Timer) - `/`
- Pomodoro-style study timer
- Session tracking with subjects
- Goal progress visualization
- Analytics and heatmaps
- Local-first with Dexie sync
- All features working as before

### StudyTrack (Exam Prep) - `/track`
- Daily check-ins (≤60s)
- Automated verdicts (on-track, at-risk, falling-behind)
- Micro-actions (single daily task)
- Weekly reality checks (self-assessment)
- Peer comparison (optional anonymous)
- Anti-gaming detection (honesty prompts)
- Share snapshot (image generation)
- Safety prompts (mental health)

## Development

### Running Locally
```bash
npm install
npm run dev
```

### Testing StudyTrack Features
1. Navigate to `http://localhost:3000/track`
2. Complete onboarding (exam, date, target minutes)
3. Submit daily check-in
4. View verdict and micro-action
5. Check peer comparison (if enabled)

### Database Operations
All StudyTrack database operations are in `/lib/supabaseStudyTrack.ts`:
```typescript
import { getStudyUser, createDailyCheckIn, ... } from '@/lib/supabaseStudyTrack'
```

## Deployment

### Vercel Deployment
1. Push code to GitHub
2. Connect repo to Vercel
3. Add environment variables:
   - `NEXT_PUBLIC_SUPABASE_URL`
   - `NEXT_PUBLIC_SUPABASE_ANON_KEY`
4. Deploy

### Supabase Setup
1. Create project at https://supabase.com
2. Run migration in SQL Editor
3. Enable anonymous auth
4. Copy URL and anon key to Vercel

## Future Enhancements

### Potential Additions
- Push notifications using Supabase Edge Functions
- Real-time updates when peers complete check-ins
- Supabase Storage for profile pictures/share images
- Postgres functions for complex analytics aggregations
- Scheduled jobs for cohort stats updates

### Migration Path for Existing Firebase Users
If you have existing Firebase data:
1. Export data from Firestore
2. Transform to match Supabase schema
3. Import using Supabase bulk insert
4. Users will need to sign in again (anonymous → Supabase anonymous)

## Troubleshooting

### Common Issues

**Issue:** "relation 'study_users' does not exist"
- **Solution:** Run the migration SQL in Supabase Dashboard

**Issue:** "Anonymous sign-ins are disabled"
- **Solution:** Enable in Authentication > Providers

**Issue:** "Row Level Security policy violation"
- **Solution:** Ensure policies were created in migration

**Issue:** TypeScript errors for database operations
- **Solution:** Check `/lib/supabaseStudyTrack.ts` imports

## Support

For issues or questions:
1. Check Supabase logs: Dashboard > Logs
2. Review RLS policies: Dashboard > Authentication > Policies
3. Inspect network requests in browser DevTools
4. Check Next.js logs for server-side errors

---

**Migration completed on:** December 26, 2025  
**Backend:** Supabase (unified)  
**Status:** ✅ Production ready
