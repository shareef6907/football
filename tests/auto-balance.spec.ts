import { test, expect } from '@playwright/test'
import { waitForContent, PLAYER_IDS } from './helpers'

test.describe('Auto Balance Teams', () => {

  const testPlayerIds = Object.values(PLAYER_IDS).slice(0, 10).join(',')

  test('Auto balance page loads with players', async ({ page }) => {
    await page.goto(`/match-day/auto?players=${testPlayerIds}&size=5&teams=2`)
    await waitForContent(page)

    await expect(page.locator('text=Auto Balanced Teams')).toBeVisible()
    await expect(page.locator('text=/10 players/')).toBeVisible()
    await expect(page.locator('text=/5v5/')).toBeVisible()
    await expect(page.locator('text=/2 teams/')).toBeVisible()
  })

  test('Teams are balanced (avg ratings within 0.5)', async ({ page }) => {
    await page.goto(`/match-day/auto?players=${testPlayerIds}&size=5&teams=2`)
    await waitForContent(page)

    // Get both team average ratings
    const avgTexts = await page.locator('text=/Avg Rating: [\\d.]+/').allTextContents()
    expect(avgTexts.length).toBe(2)

    const ratings = avgTexts.map(t => parseFloat(t.replace('Avg Rating: ', '')))
    const diff = Math.abs(ratings[0] - ratings[1])

    // Teams should be balanced within 0.5
    expect(diff).toBeLessThanOrEqual(0.5)
  })

  test('Re-balance button exists', async ({ page }) => {
    await page.goto(`/match-day/auto?players=${testPlayerIds}&size=5&teams=2`)
    await waitForContent(page)

    await expect(page.locator('text=Re-balance')).toBeVisible()
  })

  test('Confirm Teams button exists', async ({ page }) => {
    await page.goto(`/match-day/auto?players=${testPlayerIds}&size=5&teams=2`)
    await waitForContent(page)

    await expect(page.locator('text=Confirm Teams & Start Match')).toBeVisible()
  })
})