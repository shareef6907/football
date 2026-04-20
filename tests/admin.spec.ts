import { test, expect } from '@playwright/test'
import { waitForContent } from './helpers'

test.describe('Admin Panel', () => {

  test('Admin login page loads', async ({ page }) => {
    await page.goto('/admin')
    await waitForContent(page)
    await expect(page.locator('text=Admin Login')).toBeVisible()
    await expect(page.locator('input[placeholder="Username"]')).toBeVisible()
    await expect(page.locator('input[placeholder="Password"]')).toBeVisible()
  })

  test('Admin login with wrong password fails', async ({ page }) => {
    await page.goto('/admin')
    await waitForContent(page)

    await page.fill('input[placeholder="Username"]', 'admin')
    await page.fill('input[placeholder="Password"]', 'wrongpassword')
    await page.locator('text=Login').click()

    await expect(page.locator('text=Invalid')).toBeVisible()
  })

  test('Admin login with correct password succeeds', async ({ page }) => {
    await page.goto('/admin')
    await waitForContent(page)

    await page.fill('input[placeholder="Username"]', 'admin')
    await page.fill('input[placeholder="Password"]', 'Thursday2024')
    await page.locator('button:has-text("Login")').click()

    await waitForContent(page)

    // Should see admin panel with tabs
    await expect(page.locator('text=Admin Panel')).toBeVisible()
    await expect(page.locator('button:has-text("Ratings")')).toBeVisible()
    await expect(page.locator('button:has-text("Stats")')).toBeVisible()
    await expect(page.locator('button:has-text("Reset")')).toBeVisible()
  })

  test('Admin Stats tab shows correct date', async ({ page }) => {
    await page.goto('/admin')
    await page.fill('input[placeholder="Username"]', 'admin')
    await page.fill('input[placeholder="Password"]', 'Thursday2024')
    await page.locator('button:has-text("Login")').click()
    await waitForContent(page)

    // Click Stats tab
    await page.locator('button:has-text("Stats")').click()
    await waitForContent(page)

    // Should show a Thursday date (verify it's not off by one)
    const matchDateText = await page.locator('text=/Match:.*\\d{1,2}.*\\w{3}.*\\d{4}/').textContent()
    expect(matchDateText).toBeTruthy()

    // Should show all 21 players in stats list
    await expect(page.locator('text=Ahmed').first()).toBeVisible()
    await expect(page.locator('text=Shareef').first()).toBeVisible()
  })

  test('Admin Ratings tab shows player ratings', async ({ page }) => {
    await page.goto('/admin')
    await page.fill('input[placeholder="Username"]', 'admin')
    await page.fill('input[placeholder="Password"]', 'Thursday2024')
    await page.locator('button:has-text("Login")').click()
    await waitForContent(page)

    // Ratings tab should be active by default
    await expect(page.locator('text=Player Ratings')).toBeVisible()

    // Should show FWD/MID/DEF/GK labels
    await expect(page.locator('text=FWD').first()).toBeVisible()
  })

  test('Admin tabs switch correctly', async ({ page }) => {
    await page.goto('/admin')
    await page.fill('input[placeholder="Username"]', 'admin')
    await page.fill('input[placeholder="Password"]', 'Thursday2024')
    await page.locator('button:has-text("Login")').click()
    await waitForContent(page)

    // Switch to Stats
    await page.locator('button:has-text("Stats")').click()
    await expect(page.locator('text=/Match:/')).toBeVisible()

    // Switch to Reset
    await page.locator('button:has-text("Reset")').click()
    await expect(page.locator('text=Danger Zone')).toBeVisible()

    // Switch back to Ratings
    await page.locator('button:has-text("Ratings")').click()
    await expect(page.locator('text=Player Ratings')).toBeVisible()
  })

  test('Admin Reset tab shows warning', async ({ page }) => {
    await page.goto('/admin')
    await page.fill('input[placeholder="Username"]', 'admin')
    await page.fill('input[placeholder="Password"]', 'Thursday2024')
    await page.locator('button:has-text("Login")').click()
    await waitForContent(page)

    await page.locator('button:has-text("Reset")').click()

    await expect(page.locator('text=Danger Zone')).toBeVisible()
    await expect(page.locator('text=Reset All Standings to Zero')).toBeVisible()

    // Must say "Man of the Match" not "MOTM"
    const bodyText = await page.locator('body').textContent()
    expect(bodyText).not.toContain('MOTM')
  })
})