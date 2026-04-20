import { test, expect } from '@playwright/test'
import { waitForContent } from './helpers'

test.describe('Navigation & Page Loading', () => {

  test('Home page loads with correct elements', async ({ page }) => {
    await page.goto('/')
    await waitForContent(page)

    // Header
    await expect(page.locator('text=Thursday Football')).toBeVisible()

    // Next Game card
    await expect(page.locator('text=Next Game')).toBeVisible()

    // Last Game section
    await expect(page.locator('text=Last Game')).toBeVisible()

    // Quick action buttons
    await expect(page.locator('text=Set Up Match')).toBeVisible()
    await expect(page.locator('text=Vote Man of the Match')).toBeVisible()
    await expect(page.locator('text=Standings')).toBeVisible()
    await expect(page.locator('text=Submit Stats')).toBeVisible()

    // Man of the Match banner
    await expect(page.locator('text=Man of the Match')).toBeVisible()

    // Must NOT say "MOTM" anywhere
    const bodyText = await page.locator('body').textContent()
    expect(bodyText).not.toContain('MOTM')
  })

  test('Bottom navigation has all 6 tabs', async ({ page }) => {
    await page.goto('/')
    await waitForContent(page)

    const nav = page.locator('nav')
    await expect(nav.locator('text=Home')).toBeVisible()
    await expect(nav.locator('text=Standings')).toBeVisible()
    await expect(nav.locator('text=Players')).toBeVisible()
    await expect(nav.locator('text=Ratings')).toBeVisible()
    await expect(nav.locator('text=Seasons')).toBeVisible()
    await expect(nav.locator('text=Coins')).toBeVisible()

    // Must NOT have Settings in bottom nav
    await expect(nav.locator('text=Settings')).not.toBeVisible()
  })

  test('Each nav tab navigates to correct page', async ({ page }) => {
    await page.goto('/')
    await waitForContent(page)

    // Standings
    await page.locator('nav >> text=Standings').click()
    await expect(page).toHaveURL('/standings')
    await expect(page.locator('text=/Standings|League Table/')).toBeVisible()

    // Players
    await page.locator('nav >> text=Players').click()
    await expect(page).toHaveURL('/players')
    await expect(page.locator('text=Ahmed')).toBeVisible()

    // Ratings
    await page.locator('nav >> text=Ratings').click()
    await expect(page).toHaveURL('/ratings')

    // Seasons
    await page.locator('nav >> text=Seasons').click()
    await expect(page).toHaveURL('/seasons')

    // Coins
    await page.locator('nav >> text=Coins').click()
    await expect(page).toHaveURL('/coins')

    // Home
    await page.locator('nav >> text=Home').click()
    await expect(page).toHaveURL('/')
  })

  test('Standings page loads with player data', async ({ page }) => {
    await page.goto('/standings')
    await waitForContent(page)

    // Should show player names
    await expect(page.locator('text=Ahmed')).toBeVisible()
    await expect(page.locator('text=Shareef')).toBeVisible()
  })

  test('Players page shows players', async ({ page }) => {
    await page.goto('/players')
    await waitForContent(page)

    // Should show some player names
    await expect(page.locator('text=Ahmed')).toBeVisible()
  })

  test('Points page explains scoring system', async ({ page }) => {
    await page.goto('/points')
    await waitForContent(page)

    // Check key point values are displayed
    await expect(page.locator('text=/Goal/')).toBeVisible()
    await expect(page.locator('text=/Match Win/')).toBeVisible()
    await expect(page.locator('text=/Man of the Match/')).toBeVisible()

    // Must use "Defender Bonus" not "Clean Sheet"
    const bodyText = await page.locator('body').textContent()
    expect(bodyText).not.toContain('Clean Sheet')
  })

  test('Seasons page loads', async ({ page }) => {
    await page.goto('/seasons')
    await waitForContent(page)
    await expect(page.locator('text=/Season/')).toBeVisible()
  })

  test('Coins page loads', async ({ page }) => {
    await page.goto('/coins')
    await waitForContent(page)
    await expect(page.locator('text=/Coins/')).toBeVisible()
  })
})