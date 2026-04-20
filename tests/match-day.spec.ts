import { test, expect } from '@playwright/test'
import { waitForContent } from './helpers'

test.describe('Match Day', () => {

  test('Match day page loads', async ({ page }) => {
    await page.goto('/match-day')
    await waitForContent(page)

    // Should show setup options
    await expect(page.locator('text=/Match Day|Set Up/')).toBeVisible()
  })

  test('Login page loads with Google button', async ({ page }) => {
    await page.goto('/login')
    await waitForContent(page)

    await expect(page.locator('text=/Google|Sign in|Log in|Login/')).toBeVisible()
  })
})