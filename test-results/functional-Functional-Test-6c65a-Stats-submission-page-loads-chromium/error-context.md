# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: functional.spec.ts >> Functional Tests >> Test 2: Stats submission page loads
- Location: tests/functional.spec.ts:13:7

# Error details

```
Error: expect(received).toBeLessThan(expected)

Expected: < 400
Received:   500
```

# Page snapshot

```yaml
- generic [ref=e2]: Internal Server Error
```

# Test source

```ts
  1  | import { test, expect } from '@playwright/test'
  2  | 
  3  | // Simplified functional tests that verify pages load
  4  | test.describe('Functional Tests', () => {
  5  |   
  6  |   test('Test 1: Standings page loads', async ({ page }) => {
  7  |     const response = await page.goto('/standings')
  8  |     expect(response?.status()).toBeLessThan(400)
  9  |     await expect(page.locator('body')).toBeVisible({ timeout: 10000 })
  10 |     console.log('✓ Test 1: Standings page loads')
  11 |   })
  12 | 
  13 |   test('Test 2: Stats submission page loads', async ({ page }) => {
  14 |     const response = await page.goto('/match-day/submit')
> 15 |     expect(response?.status()).toBeLessThan(400)
     |                                ^ Error: expect(received).toBeLessThan(expected)
  16 |     await expect(page.locator('body')).toBeVisible({ timeout: 10000 })
  17 |     console.log('✓ Test 2: Stats submission page loads')
  18 |   })
  19 | 
  20 |   test('Test 3: Man of the Match page loads', async ({ page }) => {
  21 |     const response = await page.goto('/man-of-the-match')
  22 |     expect(response?.status()).toBeLessThan(400)
  23 |     await expect(page.locator('body')).toBeVisible({ timeout: 10000 })
  24 |     console.log('✓ Test 3: Man of the Match page loads')
  25 |   })
  26 | 
  27 |   test('Test 4: Players page loads', async ({ page }) => {
  28 |     const response = await page.goto('/players')
  29 |     expect(response?.status()).toBeLessThan(400)
  30 |     await expect(page.locator('body')).toBeVisible({ timeout: 10000 })
  31 |     console.log('✓ Test 4: Players page loads')
  32 |   })
  33 | 
  34 |   test('Test 5: Admin page loads', async ({ page }) => {
  35 |     const response = await page.goto('/admin')
  36 |     expect(response?.status()).toBeLessThan(400)
  37 |     await expect(page.locator('body')).toBeVisible({ timeout: 10000 })
  38 |     console.log('✓ Test 5: Admin page loads')
  39 |   })
  40 | 
  41 |   test('Test 6: Ratings page loads', async ({ page }) => {
  42 |     const response = await page.goto('/ratings')
  43 |     expect(response?.status()).toBeLessThan(400)
  44 |     await expect(page.locator('body')).toBeVisible({ timeout: 10000 })
  45 |     console.log('✓ Test 6: Ratings page loads')
  46 |   })
  47 | 
  48 |   test('Test 7: Navigation works on main pages', async ({ page }) => {
  49 |     const pages = ['/', '/standings', '/players', '/points']
  50 |     for (const path of pages) {
  51 |       const response = await page.goto(path)
  52 |       expect(response?.status()).toBeLessThan(400)
  53 |       await expect(page.locator('body')).toBeVisible({ timeout: 10000 })
  54 |     }
  55 |     console.log('✓ Test 7: Navigation works on main pages')
  56 |   })
  57 | 
  58 |   test('Test 8: Match day auto balance page loads', async ({ page }) => {
  59 |     const response = await page.goto('/match-day/auto?players=test1,test2,test3,test4&size=5&teams=2')
  60 |     expect(response?.status()).toBeLessThan(400)
  61 |     await expect(page.locator('body')).toBeVisible({ timeout: 10000 })
  62 |     console.log('✓ Test 8: Match day auto balance page loads')
  63 |   })
  64 | 
  65 |   test('Test 9: Points page loads', async ({ page }) => {
  66 |     const response = await page.goto('/points')
  67 |     expect(response?.status()).toBeLessThan(400)
  68 |     await expect(page.locator('body')).toBeVisible({ timeout: 10000 })
  69 |     console.log('✓ Test 9: Points page loads')
  70 |   })
  71 | 
  72 |   test('Test 10: Coins page loads', async ({ page }) => {
  73 |     const response = await page.goto('/coins')
  74 |     expect(response?.status()).toBeLessThan(400)
  75 |     await expect(page.locator('body')).toBeVisible({ timeout: 10000 })
  76 |     console.log('✓ Test 10: Coins page loads')
  77 |   })
  78 | })
```