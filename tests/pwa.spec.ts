import { test, expect } from '@playwright/test'

test.describe('PWA & Metadata', () => {

  test('Manifest is accessible', async ({ request }) => {
    const response = await request.get('/manifest.json')
    expect(response.status()).toBe(200)

    const manifest = await response.json()
    expect(manifest.name).toBe('Thursday Football League')
    expect(manifest.short_name).toBe('Thursday FC')
    expect(manifest.display).toBe('standalone')
    expect(manifest.background_color).toBe('#000000')
    expect(manifest.theme_color).toBe('#000000')
    expect(manifest.icons.length).toBeGreaterThanOrEqual(2)
  })

  test('Page has correct title', async ({ page }) => {
    await page.goto('/')
    await expect(page).toHaveTitle('Thursday Football League')
  })

  test('Page is mobile responsive (no horizontal scroll)', async ({ page }) => {
    await page.goto('/')

    const bodyWidth = await page.evaluate(() => document.body.scrollWidth)
    const viewportWidth = await page.evaluate(() => window.innerWidth)

    expect(bodyWidth).toBeLessThanOrEqual(viewportWidth + 1)
  })
})