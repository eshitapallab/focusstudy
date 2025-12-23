import { test, expect } from '@playwright/test'

test.describe('Timer Flow', () => {
  test('should start, pause, resume, and stop a session', async ({ page }) => {
    await page.goto('/')

    // Check for the start button
    const startButton = page.getByRole('button', { name: /start studying/i })
    await expect(startButton).toBeVisible()

    // Start a session
    await startButton.click()

    // Should show timer fullscreen
    await expect(page.locator('text=/Running|Paused/')).toBeVisible()
    
    // Wait a bit to accumulate time
    await page.waitForTimeout(2000)

    // Check that elapsed time is showing
    const timerDisplay = page.locator('text=/[0-9]+:[0-9]{2}/')
    await expect(timerDisplay).toBeVisible()

    // Pause the timer
    const pauseButton = page.getByRole('button', { name: /pause/i })
    await pauseButton.click()

    // Should show resume button
    const resumeButton = page.getByRole('button', { name: /resume/i })
    await expect(resumeButton).toBeVisible()

    // Resume
    await resumeButton.click()
    await expect(pauseButton).toBeVisible()

    // Stop the timer
    const stopButton = page.getByRole('button', { name: /stop/i })
    await stopButton.click()

    // Confirm stop
    const confirmButton = page.getByRole('button', { name: /end session/i })
    await confirmButton.click()

    // Should show reflection modal
    await expect(page.locator('text=/what was that session for/i')).toBeVisible()
  })

  test('should complete reflection and return to today screen', async ({ page }) => {
    await page.goto('/')

    // Start and immediately stop
    await page.getByRole('button', { name: /start studying/i }).click()
    await page.waitForTimeout(1000)
    await page.getByRole('button', { name: /stop/i }).click()
    await page.getByRole('button', { name: /end session/i }).click()

    // Fill in reflection
    const subjectInput = page.getByPlaceholder(/e.g., math/i)
    await subjectInput.fill('Mathematics')

    // Select focus rating
    await page.getByRole('button', { name: /focus rating 4/i }).click()

    // Save
    await page.getByRole('button', { name: /save/i }).click()

    // Should return to today screen
    await expect(page.getByRole('button', { name: /start studying/i })).toBeVisible()
    
    // Should show updated stats
    await expect(page.locator('text=/[0-9]+ min/')).toBeVisible()
  })

  test('should skip reflection and return to today screen', async ({ page }) => {
    await page.goto('/')

    // Start and stop
    await page.getByRole('button', { name: /start studying/i }).click()
    await page.waitForTimeout(500)
    await page.getByRole('button', { name: /stop/i }).click()
    await page.getByRole('button', { name: /end session/i }).click()

    // Skip reflection
    await page.getByRole('button', { name: /skip/i }).click()

    // Should return to today screen
    await expect(page.getByRole('button', { name: /start studying/i })).toBeVisible()
  })

  test('should persist session data across page reloads', async ({ page }) => {
    await page.goto('/')

    // Start a session
    await page.getByRole('button', { name: /start studying/i }).click()
    await page.waitForTimeout(2000)

    // Stop and label
    await page.getByRole('button', { name: /stop/i }).click()
    await page.getByRole('button', { name: /end session/i }).click()
    await page.getByPlaceholder(/e.g., math/i).fill('Physics')
    await page.getByRole('button', { name: /save/i }).click()

    // Get the minutes count
    const minutesText = await page.locator('text=/[0-9]+ min/').textContent()

    // Reload page
    await page.reload()

    // Should still show the same stats
    await expect(page.locator('text=/[0-9]+ min/')).toHaveText(minutesText || '0 min')
  })
})
