# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: app.spec.ts >> Public Pages >> players page loads with 21 players
- Location: tests/app.spec.ts:16:7

# Error details

```
Error: expect(locator).toBeVisible() failed

Locator: locator('.grid')
Expected: visible
Timeout: 15000ms
Error: element(s) not found

Call log:
  - Expect "toBeVisible" with timeout 15000ms
  - waiting for locator('.grid')

```

# Page snapshot

```yaml
- generic [ref=e2]: Internal Server Error
```

# Test source

```ts
  1  | import { test, expect } from '@playwright/test'
  2  | 
  3  | // Test 1: Public pages load
  4  | test.describe('Public Pages', () => {
  5  |   test('home page loads with countdown', async ({ page }) => {
  6  |     await page.goto('/')
  7  |     // Just check page loaded
  8  |     await expect(page.locator('body')).toBeVisible({ timeout: 10000 })
  9  |   })
  10 | 
  11 |   test('standings page loads', async ({ page }) => {
  12 |     await page.goto('/standings')
  13 |     await expect(page.locator('body')).toBeVisible({ timeout: 10000 })
  14 |   })
  15 | 
  16 |   test('players page loads with 21 players', async ({ page }) => {
  17 |     await page.goto('/players')
  18 |     // Wait for players grid to load
> 19 |     await expect(page.locator('.grid')).toBeVisible({ timeout: 15000 })
     |                                         ^ Error: expect(locator).toBeVisible() failed
  20 |     const cards = page.locator('.grid > a, .grid > div')
  21 |     expect(await cards.count()).toBeGreaterThanOrEqual(20)
  22 |   })
  23 | 
  24 |   test('points page loads', async ({ page }) => {
  25 |     await page.goto('/points')
  26 |     await expect(page.locator('body')).toBeVisible({ timeout: 10000 })
  27 |   })
  28 | })
  29 | 
  30 | // Test 2: Auth flow
  31 | test.describe('Auth Flow', () => {
  32 |   test('login page loads', async ({ page }) => {
  33 |     await page.goto('/login')
  34 |     await expect(page.locator('body')).toBeVisible({ timeout: 10000 })
  35 |   })
  36 | 
  37 |   test('profile selection page shows', async ({ page }) => {
  38 |     await page.goto('/profile')
  39 |     await expect(page.locator('body')).toBeVisible({ timeout: 10000 })
  40 |   })
  41 | })
  42 | 
  43 | // Test 3: Match day flow
  44 | test.describe('Match Day Flow', () => {
  45 |   test('match-day page loads', async ({ page }) => {
  46 |     await page.goto('/match-day')
  47 |     await expect(page.locator('body')).toBeVisible({ timeout: 10000 })
  48 |     // Check navigation exists
  49 |     await expect(page.locator('nav')).toBeVisible({ timeout: 5000 })
  50 |   })
  51 | 
  52 |   test('match-day auto page loads without crashing', async ({ page }) => {
  53 |     // Try direct URL with players param
  54 |     const playerIds = '7f1e43d8-80f0-49c6-84ac-6378af6de477,d58595c9-cb6c-4b9d-8158-523f6b893580,d717b3e-9b91-4486-a3d0-1fc50e7c7a91,d7191c8b-8e31-4c5d-9a8c-1a2b3c4d5e6f'
  55 |     await page.goto(`/match-day/auto?players=${playerIds}&size=5&teams=2`)
  56 |     // Just check page loads without crashing
  57 |     await expect(page.locator('body')).toBeVisible({ timeout: 15000 })
  58 |   })
  59 | })
```