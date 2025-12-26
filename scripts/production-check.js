// Production deployment checklist and verification script

const chalk = require('chalk')
const fs = require('fs')
const path = require('path')

console.log(chalk.blue.bold('\n🔍 FocusFlow Production Readiness Check\n'))

let errors = 0
let warnings = 0

// Check 1: Environment variables
console.log(chalk.yellow('1. Checking environment configuration...'))
const envExample = path.join(__dirname, '..', '.env.example')
const envLocal = path.join(__dirname, '..', '.env.local')

if (!fs.existsSync(envLocal)) {
  console.log(chalk.red('   ✗ .env.local not found'))
  console.log(chalk.gray('   → Copy .env.example to .env.local and fill in values'))
  errors++
} else {
  const envContent = fs.readFileSync(envLocal, 'utf-8')
  
  if (envContent.includes('your-project.supabase.co')) {
    console.log(chalk.red('   ✗ Supabase URL not configured'))
    errors++
  } else if (envContent.includes('your-anon-key')) {
    console.log(chalk.red('   ✗ Supabase anon key not configured'))
    errors++
  } else {
    console.log(chalk.green('   ✓ Environment variables configured'))
  }
}

// Check 2: Dependencies
console.log(chalk.yellow('\n2. Checking dependencies...'))
try {
  const packageJson = require('../package.json')
  const requiredDeps = [
    '@supabase/supabase-js',
    '@supabase/ssr',
    'next',
    'react',
    'react-dom',
    'dexie'
  ]
  
  const missing = requiredDeps.filter(dep => !packageJson.dependencies[dep])
  
  if (missing.length > 0) {
    console.log(chalk.red(`   ✗ Missing dependencies: ${missing.join(', ')}`))
    errors++
  } else {
    console.log(chalk.green('   ✓ All required dependencies installed'))
  }
} catch (error) {
  console.log(chalk.red('   ✗ Error reading package.json'))
  errors++
}

// Check 3: TypeScript configuration
console.log(chalk.yellow('\n3. Checking TypeScript setup...'))
const tsconfigPath = path.join(__dirname, '..', 'tsconfig.json')
if (fs.existsSync(tsconfigPath)) {
  console.log(chalk.green('   ✓ TypeScript configured'))
} else {
  console.log(chalk.red('   ✗ tsconfig.json not found'))
  errors++
}

// Check 4: Build readiness
console.log(chalk.yellow('\n4. Checking build configuration...'))
const nextConfigPath = path.join(__dirname, '..', 'next.config.js')
if (fs.existsSync(nextConfigPath)) {
  const nextConfig = fs.readFileSync(nextConfigPath, 'utf-8')
  
  if (nextConfig.includes('reactStrictMode: true')) {
    console.log(chalk.green('   ✓ React Strict Mode enabled'))
  } else {
    console.log(chalk.yellow('   ⚠ React Strict Mode disabled'))
    warnings++
  }
  
  if (nextConfig.includes('headers()')) {
    console.log(chalk.green('   ✓ Security headers configured'))
  } else {
    console.log(chalk.yellow('   ⚠ Security headers not configured'))
    warnings++
  }
} else {
  console.log(chalk.red('   ✗ next.config.js not found'))
  errors++
}

// Check 5: Database migrations
console.log(chalk.yellow('\n5. Checking database setup...'))
const migrationPath = path.join(__dirname, '..', 'supabase', 'migrations', '002_studytrack_schema.sql')
if (fs.existsSync(migrationPath)) {
  console.log(chalk.green('   ✓ StudyTrack migration file found'))
  console.log(chalk.gray('   → Remember to run this in Supabase SQL Editor'))
} else {
  console.log(chalk.red('   ✗ Migration file not found'))
  errors++
}

// Check 6: PWA configuration
console.log(chalk.yellow('\n6. Checking PWA setup...'))
const manifestPath = path.join(__dirname, '..', 'public', 'manifest.json')
if (fs.existsSync(manifestPath)) {
  console.log(chalk.green('   ✓ PWA manifest found'))
} else {
  console.log(chalk.yellow('   ⚠ PWA manifest not found'))
  warnings++
}

// Check 7: Security files
console.log(chalk.yellow('\n7. Checking security configuration...'))
const gitignorePath = path.join(__dirname, '..', '.gitignore')
if (fs.existsSync(gitignorePath)) {
  const gitignore = fs.readFileSync(gitignorePath, 'utf-8')
  
  if (gitignore.includes('.env*.local') || gitignore.includes('.env.local')) {
    console.log(chalk.green('   ✓ .env.local in .gitignore'))
  } else {
    console.log(chalk.red('   ✗ .env.local not in .gitignore - SECURITY RISK!'))
    errors++
  }
} else {
  console.log(chalk.yellow('   ⚠ .gitignore not found'))
  warnings++
}

// Final summary
console.log(chalk.blue.bold('\n📊 Summary\n'))

if (errors === 0 && warnings === 0) {
  console.log(chalk.green.bold('✅ All checks passed! Ready for production.\n'))
  console.log(chalk.gray('Next steps:'))
  console.log(chalk.gray('  1. Run database migration in Supabase Dashboard'))
  console.log(chalk.gray('  2. Enable anonymous auth in Supabase'))
  console.log(chalk.gray('  3. Run: npm run build'))
  console.log(chalk.gray('  4. Test: npm start'))
  console.log(chalk.gray('  5. Deploy to Vercel/Netlify\n'))
  process.exit(0)
} else {
  if (errors > 0) {
    console.log(chalk.red(`❌ ${errors} error(s) found`))
  }
  if (warnings > 0) {
    console.log(chalk.yellow(`⚠️  ${warnings} warning(s) found`))
  }
  console.log(chalk.gray('\nFix the errors above before deploying to production.\n'))
  process.exit(errors > 0 ? 1 : 0)
}
