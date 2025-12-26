# FocusFlow + StudyTrack

Unified study companion with **Supabase backend** - includes focus timer (FocusFlow) and exam accountability system (StudyTrack).

## Quick Start

### 1. Install Dependencies
```bash
npm install
```

### 2. Setup Supabase

#### Create Project
1. Go to [supabase.com](https://supabase.com)
2. Create new project
3. Wait 2 minutes for provisioning

#### Run Migration
1. Open **SQL Editor** in Supabase Dashboard
2. Copy contents of `/supabase/migrations/002_studytrack_schema.sql`
3. Paste and click **Run**

#### Enable Anonymous Auth
1. Go to **Authentication > Providers**
2. Toggle **Anonymous Sign-ins** to Enabled

#### Get Credentials
1. Go to **Project Settings > API**
2. Copy **Project URL** and **anon public** key

### 3. Configure Environment

Update `.env.local`:
```env
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGc...your-key
NEXT_PUBLIC_APP_URL=http://localhost:3000
```

### 4. Start
```bash
npm run dev
```

- **FocusFlow Timer:** http://localhost:3000
- **StudyTrack:** http://localhost:3000/track

## Features

### FocusFlow (/) - Timer App
- Pomodoro-style study timer
- Session tracking with subjects
- Goal progress visualization
- Analytics and heatmaps
- Local-first with offline support

### StudyTrack (/track) - Exam Accountability
1. **Quick Onboarding** (≤30s) - Select exam, set target
2. **Daily Check-in** (≤60s) - Subject, minutes, recall ability
3. **Automated Verdict** - On Track / At Risk / Falling Behind
4. **Micro-Actions** - One specific task for tomorrow
5. **Weekly Reality Check** - 5 honest questions about progress
6. **Peer Comparison** (Optional) - Anonymous cohort medians
7. **Anti-Gaming** - Detect suspicious patterns
8. **Share Snapshot** - Generate shareable progress image
9. **Safety Prompts** - Mental health awareness

## Architecture

### Unified Supabase Backend
- **Single Database** - Postgres for both apps
- **Shared Auth** - One account for both FocusFlow and StudyTrack
- **Row Level Security** - Users only see their own data
- **Cost Efficient** - One free tier covers everything

### Database Tables

#### FocusFlow Tables
- `sessions` - Study timer sessions
- `goals` - Study goals and targets
- `subjects` - Subject management

#### StudyTrack Tables
- `study_users` - User profiles for exam prep
- `daily_check_ins` - Daily study logs
- `verdicts` - Automated assessments
- `micro_actions` - Tomorrow's tasks
- `weekly_reality` - Self-assessment answers
- `cohort_stats` - Anonymous peer aggregates
- `gaming_detections` - Anti-cheating logs

## Development

### Project Structure
```
/app
  /page.tsx                 # FocusFlow (home)
  /track/page.tsx          # StudyTrack dashboard
/components
  /Dashboard/              # StudyTrack orchestration
  /Timer/                  # FocusFlow components
  /Onboarding/            # StudyTrack onboarding
  /CheckIn/               # Daily check-in
  /Verdict/               # Verdict display
  /Actions/               # Micro-actions
  /Reality/               # Weekly reality check
  /Peer/                  # Peer comparison
  /Share/                 # Share snapshot
  /Safety/                # Safety prompts
/lib
  /supabaseClient.ts      # Supabase initialization
  /supabaseStudyTrack.ts  # StudyTrack database operations
  /verdictEngine.ts       # Verdict calculation
  /microActionGenerator.ts # Task generation
  /realityCheck.ts        # Reality check scoring
  /gamingDetection.ts     # Pattern detection
  /types.ts               # TypeScript definitions
/supabase
  /migrations/
    /002_studytrack_schema.sql  # Database setup
```

### Database Operations

```typescript
// Import StudyTrack operations
import {
  createStudyUser,
  getDailyCheckIn,
  createVerdict,
  getCohortStats,
  // ... more operations
} from '@/lib/supabaseStudyTrack'
```

All operations automatically filtered by authenticated user ID via RLS policies.

## Deployment

### Vercel (Recommended)
1. Push to GitHub
2. Import in Vercel
3. Add environment variables:
   ```
   NEXT_PUBLIC_SUPABASE_URL
   NEXT_PUBLIC_SUPABASE_ANON_KEY
   NEXT_PUBLIC_APP_URL
   ```
4. Deploy

### Other Platforms
Works on any platform supporting Next.js:
- Netlify
- Railway
- AWS Amplify
- Self-hosted

## Advanced Features

### Cohort Stats Aggregation

For production, add a Supabase Edge Function or pg_cron job:

```sql
CREATE OR REPLACE FUNCTION update_cohort_stats()
RETURNS void AS $$
BEGIN
  INSERT INTO cohort_stats (exam, date, median_study_minutes, participant_count)
  SELECT 
    su.exam,
    dc.date,
    PERCENTILE_CONT(0.5) WITHIN GROUP (ORDER BY dc.minutes_studied),
    COUNT(DISTINCT dc.user_id)
  FROM daily_check_ins dc
  JOIN study_users su ON dc.user_id = su.id
  WHERE dc.date = CURRENT_DATE
  GROUP BY su.exam, dc.date
  ON CONFLICT (exam, date) DO UPDATE SET
    median_study_minutes = EXCLUDED.median_study_minutes,
    participant_count = EXCLUDED.participant_count;
END;
$$ LANGUAGE plpgsql;
```

### Push Notifications
Use Supabase Edge Functions + Web Push API for reminders.

### Real-time Updates
Add Supabase Realtime for live peer comparison updates:

```typescript
supabase
  .channel('cohort_updates')
  .on('postgres_changes', 
    { event: 'INSERT', schema: 'public', table: 'daily_check_ins' },
    (payload) => {
      // Update UI
    }
  )
  .subscribe()
```

## Customization

### Modify Verdict Algorithm
Edit `/lib/verdictEngine.ts`:

```typescript
export function calculateVerdict(data: VerdictInput): Verdict {
  const targetRatio = todayMinutes / data.user.dailyTargetMinutes
  // Adjust thresholds here
  if (targetRatio >= 0.8 && recallRatio >= 0.7) {
    return { status: 'on-track', ... }
  }
  // ...
}
```

### Change Reality Check Questions
Edit `/components/Reality/WeeklyRealityCheck.tsx`:

```typescript
const QUESTIONS = [
  { id: 'question1', text: 'Your custom question?' },
  // ...
]
```

### Adjust Daily Target
Users set this during onboarding, but you can change the default in `/components/Onboarding/OnboardingFlow.tsx`:

```typescript
const [dailyTarget, setDailyTarget] = useState(120) // Change default here
```

## Troubleshooting

### "relation does not exist"
**Fix:** Run the migration in Supabase SQL Editor

### "Anonymous sign-ins are disabled"
**Fix:** Enable in Authentication > Providers

### "Row Level Security policy violation"
**Fix:** Verify RLS policies were created during migration

### TypeScript Errors
**Fix:** Run `npm install` to ensure all dependencies are installed

### Can't see data in database
**Fix:** Check RLS policies - users can only see their own data

## Performance Optimization

### Indexes
All critical queries have indexes:
- User + date lookups (check-ins, verdicts)
- Exam + date lookups (cohort stats)

### Caching
Consider adding Redis for cohort stats caching in production.

### Database Optimization
Monitor slow queries in Supabase Dashboard > Database > Query Performance.

## Security

### Row Level Security
All tables protected with RLS policies:
- Users can only access their own data
- Cohort stats are public (anonymous aggregates only)

### Anonymous Auth
- No email or password required
- Users get unique UUID
- Can upgrade to email/password later

### Data Privacy
- No personal info collected without consent
- Peer comparison uses anonymous aggregates
- Optional features can be disabled

## Documentation

- [Supabase Migration Guide](docs/SUPABASE_MIGRATION.md)
- [Session Status Management](docs/SESSION_STATUS_MANAGEMENT.md)
- [OTP Auth Guide](docs/OTP_AUTH_GUIDE.md)

## Tech Stack

- **Framework:** Next.js 16 (App Router)
- **Language:** TypeScript
- **Database:** Supabase (Postgres)
- **Auth:** Supabase Auth (Anonymous + Email)
- **Styling:** Tailwind CSS
- **Local Storage:** Dexie (IndexedDB)
- **PWA:** next-pwa

## License

MIT

## Support

For issues:
1. Check Supabase Dashboard > Logs
2. Review browser console
3. Verify environment variables
4. Check RLS policies

---

**Status:** ✅ Production Ready  
**Backend:** Unified Supabase  
**Last Updated:** December 26, 2025
