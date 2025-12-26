# Firebase Setup Guide

## Step 1: Create Firebase Project

1. Go to [Firebase Console](https://console.firebase.google.com)
2. Click "Add project"
3. Enter project name (e.g., "studytrack")
4. Disable Google Analytics (optional for MVP)
5. Click "Create project"

## Step 2: Enable Authentication

1. In Firebase Console, go to **Build > Authentication**
2. Click "Get started"
3. Enable **Anonymous** authentication
4. Enable **Email/Password** authentication (for future upgrades)

## Step 3: Create Firestore Database

1. Go to **Build > Firestore Database**
2. Click "Create database"
3. Choose **Production mode**
4. Select your region (choose closest to your users)
5. Click "Enable"

### Set up Security Rules

Go to the "Rules" tab and paste:

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

Click "Publish"

## Step 4: Create Indexes

Firestore will automatically suggest indexes when queries fail. For initial setup, you may need:

### dailyCheckIns Index
- Collection: `dailyCheckIns`
- Fields: `userId` (Ascending), `date` (Descending)

### verdicts Index
- Collection: `verdicts`
- Fields: `userId` (Ascending), `date` (Descending)

You can create these in advance or wait for Firestore to suggest them.

## Step 5: Enable Cloud Messaging

1. Go to **Build > Cloud Messaging**
2. Under "Web configuration", click "Generate key pair"
3. Copy the VAPID key (starts with "B...")
4. Save this for your `.env` file

## Step 6: Get Configuration

1. Go to **Project Settings** (gear icon)
2. Under "Your apps", click the **Web** icon (`</>`)
3. Register app with nickname "StudyTrack Web"
4. Copy the `firebaseConfig` object

It looks like:
```javascript
const firebaseConfig = {
  apiKey: "AIza...",
  authDomain: "your-project.firebaseapp.com",
  projectId: "your-project",
  storageBucket: "your-project.appspot.com",
  messagingSenderId: "123456789",
  appId: "1:123456789:web:abc123"
};
```

## Step 7: Update Environment Variables

Create or update `.env.local`:

```env
NEXT_PUBLIC_FIREBASE_API_KEY=AIza...
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=your-project.firebaseapp.com
NEXT_PUBLIC_FIREBASE_PROJECT_ID=your-project
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=your-project.appspot.com
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=123456789
NEXT_PUBLIC_FIREBASE_APP_ID=1:123456789:web:abc123
NEXT_PUBLIC_FIREBASE_VAPID_KEY=B...
```

## Step 8: Deploy Cloud Functions (Optional for v1.1)

Create `functions/index.js`:

```javascript
const functions = require('firebase-functions');
const admin = require('firebase-admin');
admin.initializeApp();

// Update cohort stats daily
exports.updateCohortStats = functions.pubsub
  .schedule('every day 23:59')
  .timeZone('Asia/Kolkata')
  .onRun(async (context) => {
    const db = admin.firestore();
    const today = new Date().toISOString().split('T')[0];
    
    // Get all check-ins for today grouped by exam
    const checkInsSnapshot = await db.collection('dailyCheckIns')
      .where('date', '==', today)
      .get();
    
    const examStats = new Map();
    
    checkInsSnapshot.forEach(doc => {
      const data = doc.data();
      const exam = data.exam;
      
      if (!examStats.has(exam)) {
        examStats.set(exam, []);
      }
      examStats.get(exam).push(data.minutesStudied);
    });
    
    // Calculate median for each exam
    const batch = db.batch();
    
    examStats.forEach((minutes, exam) => {
      const sorted = minutes.sort((a, b) => a - b);
      const median = sorted[Math.floor(sorted.length / 2)];
      
      const statsRef = db.collection('cohortStats').doc(`${exam}_${today}`);
      batch.set(statsRef, {
        exam,
        date: today,
        medianStudyMinutes: median,
        participantCount: minutes.length,
        updatedAt: admin.firestore.FieldValue.serverTimestamp()
      });
    });
    
    await batch.commit();
    console.log('Cohort stats updated');
  });
```

Deploy:
```bash
cd functions
npm install firebase-functions firebase-admin
firebase deploy --only functions
```

## Step 9: Test the Setup

1. Start your dev server: `npm run dev`
2. Open [http://localhost:3000](http://localhost:3000)
3. Complete onboarding
4. Check Firebase Console > Authentication for new anonymous user
5. Check Firestore for created user document
6. Complete a daily check-in
7. Verify data appears in Firestore

## Troubleshooting

### Error: "Firebase: Error (auth/operation-not-allowed)"
- Go to Authentication > Sign-in methods
- Enable Anonymous authentication

### Error: "Missing or insufficient permissions"
- Check Firestore Rules
- Ensure user is authenticated
- Verify userId matches in query

### Notifications not working
- Check VAPID key is set
- Verify HTTPS (required for PWA)
- Test in Chrome/Edge (best PWA support)

### Can't read/write data
- Check Firestore indexes
- Look in Firebase Console > Firestore > Indexes
- Click suggested index links in browser console

## Production Checklist

- [ ] Firebase project in production mode
- [ ] Firestore security rules published
- [ ] All indexes created
- [ ] Environment variables in Vercel
- [ ] Domain added to Firebase Auth authorized domains
- [ ] HTTPS enabled
- [ ] Service worker registered
- [ ] PWA manifest configured
- [ ] Icons generated (192x192, 512x512)
