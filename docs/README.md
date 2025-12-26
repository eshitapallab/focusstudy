# StudyTrack - Exam Prep Accountability App

## Overview

StudyTrack is a mobile-first PWA designed for exam aspirants who need honest feedback and accountability. The app focuses on daily check-ins, verdict-based tracking, and micro-actions to keep students on track without overwhelming them.

## Core Features

### 1. Onboarding (≤30 seconds)
- Select exam type (UPSC, JEE, NEET, SSC, GATE, CAT, Banking, or Other)
- Optional exam date
- Set daily study target (30 min - 8 hours)
- Anonymous by default

### 2. Daily Check-In
A single full-screen card with 3 simple inputs:
1. **Subject studied** - Dropdown with common subjects
2. **Minutes studied** - Slider (15 min - 8 hours)
3. **Recall check** - "Could you revise this tomorrow without notes?" (Yes/No)

Auto-submits when all fields are filled.

### 3. Verdict Engine
Returns one of three states based on:
- Study minutes vs target
- Recall ratio (last 7 days)
- Consistency (streaks, gaps)
- Exam proximity

**Verdict States:**
- 🟢 **On Track** - Meeting goals, good recall
- 🟡 **At Risk** - Falling slightly behind
- 🔴 **Falling Behind** - Need course correction

### 4. Micro-Actions
After each verdict, shows exactly ONE task:
- ≤30 minutes
- References subjects already studied
- Specific and actionable

Examples:
- "Tomorrow: Revise Polity Ch 3-5 (20 min)"
- "Tomorrow: Deep review of Physics (25 min)"

### 5. Weekly Reality Check
Once per week, 5 honest questions:
1. Did you avoid weak subjects this week?
2. Did you revise what you studied?
3. If exam were tomorrow, would you pass basics?
4. Were you consistent with your study routine?
5. Have you been honest about your progress?

Generates:
- **Reality Score** (0-100)
- **Trajectory message** (calm, supportive tone)

### 6. Peer Comparison (Optional)
- Shows median study minutes for same exam
- Anonymous only
- Opt-out available
- No rankings or usernames

### 7. Anti-Gaming Detection
Detects suspicious patterns:
- Same minutes every day
- Always "Yes" to recall
- No variance in study patterns

Triggers soft prompt: "Be honest — accuracy matters more than streaks."

### 8. Sharing
Generate daily snapshot image:
- Current status (🟢🟡🔴)
- Hours studied
- Exam name
- Streak (if active)

Share to WhatsApp, Instagram, or download.

### 9. Safety & Wellbeing
If repeated 🔴 verdicts detected:
- Show supportive language
- Offer "turn off peer comparison" option
- Suggest adjusting daily target
- No crisis messaging unless explicitly needed

## Tech Stack

- **Frontend:** Next.js (App Router), TypeScript, Tailwind CSS
- **Backend:** Firebase (Firestore + Auth + Cloud Functions)
- **Auth:** Anonymous by default, optional email
- **State:** Local-first, sync when online
- **Notifications:** Firebase Cloud Messaging
- **Deployment:** Vercel
- **Design:** Mobile-first PWA

## Data Models

### Collections
- `users` - User profiles and settings
- `dailyCheckIns` - Daily study check-ins
- `verdicts` - Daily verdict calculations
- `microActions` - Generated micro-actions
- `weeklyReality` - Weekly reality checks
- `cohortStats` - Anonymous aggregated stats
- `gamingDetections` - Anti-gaming flags

## Setup Instructions

### 1. Firebase Setup

1. Create a Firebase project at [console.firebase.google.com](https://console.firebase.google.com)
2. Enable Authentication (Anonymous + Email/Password)
3. Create a Firestore database
4. Enable Cloud Messaging

### 2. Environment Variables

Create `.env.local` and add:

```env
NEXT_PUBLIC_FIREBASE_API_KEY=your_api_key
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=your_project.firebaseapp.com
NEXT_PUBLIC_FIREBASE_PROJECT_ID=your_project_id
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=your_project.appspot.com
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=your_sender_id
NEXT_PUBLIC_FIREBASE_APP_ID=your_app_id
NEXT_PUBLIC_FIREBASE_VAPID_KEY=your_vapid_key
```

### 3. Install Dependencies

```bash
npm install
```

### 4. Run Development Server

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000)

### 5. Build for Production

```bash
npm run build
npm start
```

## Firestore Security Rules

```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    // Users can only read/write their own data
    match /users/{userId} {
      allow read, write: if request.auth != null && request.auth.uid == userId;
    }
    
    match /dailyCheckIns/{checkInId} {
      allow read, write: if request.auth != null && 
        resource.data.userId == request.auth.uid;
    }
    
    match /verdicts/{verdictId} {
      allow read, write: if request.auth != null && 
        resource.data.userId == request.auth.uid;
    }
    
    match /microActions/{actionId} {
      allow read, write: if request.auth != null && 
        resource.data.userId == request.auth.uid;
    }
    
    match /weeklyReality/{realityId} {
      allow read, write: if request.auth != null && 
        resource.data.userId == request.auth.uid;
    }
    
    // Cohort stats are public (read-only)
    match /cohortStats/{statsId} {
      allow read: if true;
      allow write: if false; // Only via Cloud Functions
    }
    
    match /gamingDetections/{detectionId} {
      allow read, write: if request.auth != null && 
        resource.data.userId == request.auth.uid;
    }
  }
}
```

## A/B Testing Flags

Configure in user profile:
- `verdictTone`: 'neutral' | 'direct'
- `shareCTAPlacement`: 'top' | 'bottom'
- `peerMedianVisibleByDefault`: boolean

## UX Guidelines

### Language Tone
- Use calm, adult language
- Never say "failed", "behind others", "not enough"
- Prefer: "Here's what to do next", "Adjust course", "Still recoverable"

### Timing
- Onboarding: ≤30 seconds
- Daily check-in: ≤60 seconds
- Weekly reality check: ~2 minutes

### Colors
- 🟢 Green: On track
- 🟡 Yellow: At risk
- 🔴 Red: Falling behind

## Success Metrics

- Daily check-in completion rate
- 7-day retention
- Average time to complete check-in (<60s)
- % users opting into peer comparison
- Self-reported anxiety reduction

## What NOT to Build (v1)

- ❌ Timetables
- ❌ Pomodoro timers
- ❌ Notes
- ❌ Flashcards
- ❌ Video embedding
- ❌ Chatbots
- ❌ AI tutors
- ❌ Full analytics dashboards
- ❌ Gamification beyond light streaks

## License

MIT
