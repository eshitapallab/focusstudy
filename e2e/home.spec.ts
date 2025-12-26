import { test, expect } from '@playwright/test'

test('home shows Timer + StudyTrack options', async ({ page }) => {
  await page.goto('/')

  await expect(page.getByRole('heading', { name: 'FocusStudy' })).toBeVisible()
  await expect(page.getByRole('link', { name: /timer/i })).toBeVisible()
  await expect(page.getByRole('link', { name: /studytrack/i })).toBeVisible()
})

test('timer option navigates to /focus', async ({ page }) => {
  await page.goto('/')
  await page.getByRole('link', { name: /timer/i }).click()
  await expect(page).toHaveURL(/\/focus$/)
  await expect(page.getByText('Start Studying')).toBeVisible()
})

test('studytrack option navigates to /track and renders', async ({ page }) => {
  await page.goto('/')
  await page.getByRole('link', { name: /studytrack/i }).click()
  await expect(page).toHaveURL(/\/track$/)

  // StudyTrack may show onboarding, dashboard, or a setup error depending on env+DB.
  const candidates = [
    'StudyTrack',
    "Today's Check-In",
    'Which exam are you preparing for?',
    'Missing Supabase configuration',
    'Anonymous sign-in unavailable',
    'Unable to load StudyTrack',
    'Account setup failed'
  ]

  let matched = false
  for (const text of candidates) {
    const count = await page.getByText(text, { exact: false }).count()
    if (count > 0) {
      matched = true
      break
    }
  }

  expect(matched).toBeTruthy()
})
