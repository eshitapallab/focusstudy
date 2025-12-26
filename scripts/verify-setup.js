#!/usr/bin/env node

/**
 * Setup Verification Script
 * Run this to check if your StudyTrack installation is configured correctly
 */

const fs = require('fs')
const path = require('path')

const checks = []
let passed = 0
let failed = 0

function check(name, condition, fix) {
  const result = condition()
  checks.push({ name, passed: result, fix })
  if (result) {
    passed++
    console.log(`✅ ${name}`)
  } else {
    failed++
    console.log(`❌ ${name}`)
    if (fix) {
      console.log(`   → ${fix}`)
    }
  }
}

console.log('\n🔍 StudyTrack Setup Verification\n')

// Check Node version
check(
  'Node.js version >= 16',
  () => {
    const version = process.version
    const major = parseInt(version.split('.')[0].slice(1))
    return major >= 16
  },
  'Install Node.js 16 or higher from https://nodejs.org'
)

// Check if node_modules exists
check(
  'Dependencies installed',
  () => fs.existsSync(path.join(process.cwd(), 'node_modules')),
  'Run: npm install'
)

// Check if .env.local exists
check(
  'Environment file exists (.env.local)',
  () => fs.existsSync(path.join(process.cwd(), '.env.local')),
  'Copy .env.example to .env.local: cp .env.example .env.local'
)

// Check if Firebase vars are set
if (fs.existsSync(path.join(process.cwd(), '.env.local'))) {
  const env = fs.readFileSync(path.join(process.cwd(), '.env.local'), 'utf-8')
  
  check(
    'Firebase API Key configured',
    () => env.includes('NEXT_PUBLIC_FIREBASE_API_KEY') && !env.includes('your_api_key_here'),
    'Add your Firebase API key to .env.local'
  )
  
  check(
    'Firebase Project ID configured',
    () => env.includes('NEXT_PUBLIC_FIREBASE_PROJECT_ID') && !env.includes('your_project_id'),
    'Add your Firebase project ID to .env.local'
  )
  
  check(
    'Firebase App ID configured',
    () => env.includes('NEXT_PUBLIC_FIREBASE_APP_ID') && !env.includes('your_app_id'),
    'Add your Firebase app ID to .env.local'
  )
}

// Check if Firebase package is installed
check(
  'Firebase SDK installed',
  () => {
    try {
      require('firebase')
      return true
    } catch {
      return false
    }
  },
  'Run: npm install firebase firebase-admin'
)

// Check if Next.js is installed
check(
  'Next.js installed',
  () => {
    try {
      require('next')
      return true
    } catch {
      return false
    }
  },
  'Run: npm install'
)

// Check required files exist
const requiredFiles = [
  'lib/firebase.ts',
  'lib/firestore.ts',
  'lib/types.ts',
  'lib/verdictEngine.ts',
  'lib/microActionGenerator.ts',
  'components/Onboarding/OnboardingFlow.tsx',
  'components/CheckIn/DailyCheckInCard.tsx',
  'components/Dashboard/MainDashboard.tsx',
  'public/manifest.json'
]

requiredFiles.forEach(file => {
  check(
    `File exists: ${file}`,
    () => fs.existsSync(path.join(process.cwd(), file)),
    `File missing: ${file}`
  )
})

console.log(`\n📊 Results: ${passed} passed, ${failed} failed\n`)

if (failed === 0) {
  console.log('🎉 All checks passed! You\'re ready to run:\n')
  console.log('   npm run dev\n')
  console.log('Then open http://localhost:3000\n')
} else {
  console.log('⚠️  Please fix the issues above before running the app.\n')
  console.log('📖 See docs/QUICK_START.md for setup instructions.\n')
  process.exit(1)
}
