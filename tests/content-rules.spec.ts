import { test, expect } from '@playwright/test'
import { waitForContent } from './helpers'

test.describe('Content Rules', () => {

  test('"MOTM" should not appear on home page', async ({ page }) => {
    await page.goto('/')
    await waitForContent(page)

    const bodyText = await page.locator('body').textContent()
    // Allow "Man of the Match" but not "MOTM" abbreviation
    expect(bodyText).not.toMatch(/\bMOTM\b/)
  })

  test('"Clean Sheet" should not appear in UI', async ({ page }) => {
    await page.goto('/admin')
    await page.fill('input[placeholder="Username"]', 'admin')
    await page.fill('input[placeholder="Password"]', 'Thursday2024')
    await page.locator('button:has-text("Login")').click()
    await waitForContent(page)

    await page.locator('button:has-text("Stats")').click()
    await waitForContent(page)

    // Check the visible text doesn't say "Clean Sheet"
    const visibleText = await page.locator('body').textContent()
    expect(visibleText).not.toContain('Clean Sheet')
  })
})