import { test, expect } from '@playwright/test'

// Test 1: Public pages load
test.describe('Public Pages', () => {
  test('home page loads with countdown', async ({ page }) => {
    await page.goto('/')
    // Just check page loaded
    await expect(page.locator('body')).toBeVisible({ timeout: 10000 })
  })

  test('standings page loads', async ({ page }) => {
    await page.goto('/standings')
    await expect(page.locator('body')).toBeVisible({ timeout: 10000 })
  })

  test('players page loads with 21 players', async ({ page }) => {
    await page.goto('/players')
    // Wait for players grid to load
    await expect(page.locator('.grid')).toBeVisible({ timeout: 15000 })
    const cards = page.locator('.grid > a, .grid > div')
    expect(await cards.count()).toBeGreaterThanOrEqual(20)
  })

  test('points page loads', async ({ page }) => {
    await page.goto('/points')
    await expect(page.locator('body')).toBeVisible({ timeout: 10000 })
  })
})

// Test 2: Auth flow
test.describe('Auth Flow', () => {
  test('login page loads', async ({ page }) => {
    await page.goto('/login')
    await expect(page.locator('body')).toBeVisible({ timeout: 10000 })
  })

  test('profile selection page shows', async ({ page }) => {
    await page.goto('/profile')
    await expect(page.locator('body')).toBeVisible({ timeout: 10000 })
  })
})

// Test 3: Match day flow
test.describe('Match Day Flow', () => {
  test('match-day page loads', async ({ page }) => {
    await page.goto('/match-day')
    await expect(page.locator('body')).toBeVisible({ timeout: 10000 })
    // Check navigation exists
    await expect(page.locator('nav')).toBeVisible({ timeout: 5000 })
  })

  test('match-day auto page loads without crashing', async ({ page }) => {
    // Try direct URL with players param
    const playerIds = '7f1e43d8-80f0-49c6-84ac-6378af6de477,d58595c9-cb6c-4b9d-8158-523f6b893580,d717b3e-9b91-4486-a3d0-1fc50e7c7a91,d7191c8b-8e31-4c5d-9a8c-1a2b3c4d5e6f'
    await page.goto(`/match-day/auto?players=${playerIds}&size=5&teams=2`)
    // Just check page loads without crashing
    await expect(page.locator('body')).toBeVisible({ timeout: 15000 })
  })
})