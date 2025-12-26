# Quick Start Guide

Get StudyTrack running in 15 minutes.

## Step 1: Clone & Install (2 min)

```bash
git clone https://github.com/yourusername/studytrack.git
cd studytrack
npm install
```

## Step 2: Firebase Setup (8 min)

### Create Project

1. Go to [Firebase Console](https://console.firebase.google.com)
2. Click "Add project"
3. Name it "studytrack"
4. Disable Google Analytics
5. Click "Create project"

### Enable Auth

1. Go to **Authentication** > **Get started**
2. Enable **Anonymous** sign-in method
3. Save

### Create Database

1. Go to **Firestore Database** > **Create database**
2. Start in **Production mode**
3. Choose your region
4. Click "Enable"

### Get Credentials

1. Go to **Project Settings** (gear icon)
2. Scroll to "Your apps"
3. Click **Web** icon (`</>`)
4. Register app: "StudyTrack Web"
5. Copy the config object

## Step 3: Configure Environment (2 min)

1. Copy example file:
```bash
cp .env.example .env.local
```

2. Edit `.env.local` and paste your Firebase credentials:
```env
NEXT_PUBLIC_FIREBASE_API_KEY=AIza...
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=studytrack-xxx.firebaseapp.com
NEXT_PUBLIC_FIREBASE_PROJECT_ID=studytrack-xxx
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=studytrack-xxx.appspot.com
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=123456789
NEXT_PUBLIC_FIREBASE_APP_ID=1:123456789:web:abc123
```

## Step 4: Run App (1 min)

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000)

## Step 5: Test Flow (2 min)

1. **Onboarding**: Select exam, set target, choose date
2. **Daily Check-In**: Pick subject, slide minutes, answer recall
3. **See Verdict**: View your status (🟢🟡🔴)
4. **Get Micro-Action**: See your task for tomorrow

Done! 🎉

## Next Steps

### Add Firestore Security Rules

1. Go to **Firestore** > **Rules**
2. Paste this:

```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    match /users/{userId} {
      allow read, write: if request.auth != null && request.auth.uid == userId;
    }
    
    match /dailyCheckIns/{checkInId} {
      allow read, create: if request.auth != null;
      allow update, delete: if request.auth != null && 
        resource.data.userId == request.auth.uid;
    }
    
    match /verdicts/{verdictId} {
      allow read, create: if request.auth != null;
      allow update, delete: if request.auth != null && 
        resource.data.userId == request.auth.uid;
    }
    
    match /microActions/{actionId} {
      allow read, create: if request.auth != null;
      allow update, delete: if request.auth != null && 
        resource.data.userId == request.auth.uid;
    }
    
    match /weeklyReality/{realityId} {
      allow read, create: if request.auth != null;
      allow update, delete: if request.auth != null && 
        resource.data.userId == request.auth.uid;
    }
    
    match /cohortStats/{statsId} {
      allow read: if true;
      allow write: if false;
    }
    
    match /gamingDetections/{detectionId} {
      allow read, create: if request.auth != null;
      allow update, delete: if request.auth != null && 
        resource.data.userId == request.auth.uid;
    }
  }
}
```

3. Click **Publish**

### Deploy to Vercel

```bash
npm install -g vercel
vercel login
vercel
```

Follow prompts, then add environment variables in Vercel dashboard.

## Troubleshooting

### "Firebase: Error (auth/operation-not-allowed)"
➜ Enable Anonymous authentication in Firebase Console

### "Missing or insufficient permissions"
➜ Publish Firestore security rules (see above)

### Can't see data in Firestore
➜ Complete a check-in first, then refresh Firestore console

### Notifications not working
➜ Notifications require HTTPS (works in production, not localhost)

## Need Help?

- 📖 [Full Documentation](./README.md)
- 🔥 [Firebase Setup Guide](./FIREBASE_SETUP.md)
- 🚀 [Deployment Guide](./DEPLOYMENT.md)
- 💬 [GitHub Issues](https://github.com/yourusername/studytrack/issues)
