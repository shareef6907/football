import { test, expect } from '@playwright/test'

// Simplified functional tests that verify pages load
test.describe('Functional Tests', () => {
  
  test('Test 1: Standings page loads', async ({ page }) => {
    const response = await page.goto('/standings')
    expect(response?.status()).toBeLessThan(400)
    await expect(page.locator('body')).toBeVisible({ timeout: 10000 })
    console.log('✓ Test 1: Standings page loads')
  })

  test('Test 2: Stats submission page loads', async ({ page }) => {
    const response = await page.goto('/match-day/submit')
    expect(response?.status()).toBeLessThan(400)
    await expect(page.locator('body')).toBeVisible({ timeout: 10000 })
    console.log('✓ Test 2: Stats submission page loads')
  })

  test('Test 3: Man of the Match page loads', async ({ page }) => {
    const response = await page.goto('/man-of-the-match')
    expect(response?.status()).toBeLessThan(400)
    await expect(page.locator('body')).toBeVisible({ timeout: 10000 })
    console.log('✓ Test 3: Man of the Match page loads')
  })

  test('Test 4: Players page loads', async ({ page }) => {
    const response = await page.goto('/players')
    expect(response?.status()).toBeLessThan(400)
    await expect(page.locator('body')).toBeVisible({ timeout: 10000 })
    console.log('✓ Test 4: Players page loads')
  })

  test('Test 5: Admin page loads', async ({ page }) => {
    const response = await page.goto('/admin')
    expect(response?.status()).toBeLessThan(400)
    await expect(page.locator('body')).toBeVisible({ timeout: 10000 })
    console.log('✓ Test 5: Admin page loads')
  })

  test('Test 6: Ratings page loads', async ({ page }) => {
    const response = await page.goto('/ratings')
    expect(response?.status()).toBeLessThan(400)
    await expect(page.locator('body')).toBeVisible({ timeout: 10000 })
    console.log('✓ Test 6: Ratings page loads')
  })

  test('Test 7: Navigation works on main pages', async ({ page }) => {
    const pages = ['/', '/standings', '/players', '/points']
    for (const path of pages) {
      const response = await page.goto(path)
      expect(response?.status()).toBeLessThan(400)
      await expect(page.locator('body')).toBeVisible({ timeout: 10000 })
    }
    console.log('✓ Test 7: Navigation works on main pages')
  })

  test('Test 8: Match day auto balance page loads', async ({ page }) => {
    const response = await page.goto('/match-day/auto?players=test1,test2,test3,test4&size=5&teams=2')
    expect(response?.status()).toBeLessThan(400)
    await expect(page.locator('body')).toBeVisible({ timeout: 10000 })
    console.log('✓ Test 8: Match day auto balance page loads')
  })

  test('Test 9: Points page loads', async ({ page }) => {
    const response = await page.goto('/points')
    expect(response?.status()).toBeLessThan(400)
    await expect(page.locator('body')).toBeVisible({ timeout: 10000 })
    console.log('✓ Test 9: Points page loads')
  })

  test('Test 10: Coins page loads', async ({ page }) => {
    const response = await page.goto('/coins')
    expect(response?.status()).toBeLessThan(400)
    await expect(page.locator('body')).toBeVisible({ timeout: 10000 })
    console.log('✓ Test 10: Coins page loads')
  })
})