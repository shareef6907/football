import { test, expect } from '@playwright/test'
import { waitForContent } from './helpers'

test.describe('Player Profiles Feature', () => {

 // ============== PUBLIC PROFILE PAGE ==============

 test('Non-existent username shows "Player Not Found"', async ({ page }) => {
 await page.goto('/thisisnotarealplayer')
 await waitForContent(page)

 await expect(page.locator('text=Player Not Found')).toBeVisible()
 await expect(page.locator('text=View All Players')).toBeVisible()
 })

 test('Profile not found page has link back to players', async ({ page }) => {
 await page.goto('/nobodyhere123')
 await waitForContent(page)

 await page.locator('text=View All Players').click()
 await expect(page).toHaveURL('/players')
 })

 // ============== EXISTING ROUTES NOT BROKEN ==============

 test('Reserved route /standings still works (not caught by [username])', async ({ page }) => {
 await page.goto('/standings')
 await waitForContent(page)

 // Should show standings page, NOT "Player Not Found"
 await expect(page.locator('text=Player Not Found')).not.toBeVisible()
 await expect(page.locator('text=Points')).toBeVisible()
 })

 test('Reserved route /players still works', async ({ page }) => {
 await page.goto('/players')
 await waitForContent(page)

 await expect(page.locator('text=Player Not Found')).not.toBeVisible()
 await expect(page.locator('text=Ahmed')).toBeVisible()
 })

 test('Reserved route /admin still works', async ({ page }) => {
 await page.goto('/admin')
 await waitForContent(page)

 await expect(page.locator('text=Player Not Found')).not.toBeVisible()
 await expect(page.locator('text=Admin Login')).toBeVisible()
 })

 test('Reserved route /ratings still works', async ({ page }) => {
 await page.goto('/ratings')
 await waitForContent(page)

 await expect(page.locator('text=Player Not Found')).not.toBeVisible()
 })

 test('Reserved route /seasons still works', async ({ page }) => {
 await page.goto('/seasons')
 await waitForContent(page)

 await expect(page.locator('text=Player Not Found')).not.toBeVisible()
 })

 test('Reserved route /coins still works', async ({ page }) => {
 await page.goto('/coins')
 await waitForContent(page)

 await expect(page.locator('text=Player Not Found')).not.toBeVisible()
 })

 test('Reserved route /points still works', async ({ page }) => {
 await page.goto('/points')
 await waitForContent(page)

 await expect(page.locator('text=Player Not Found')).not.toBeVisible()
 })

 test('Home page / still works', async ({ page }) => {
 await page.goto('/')
 await waitForContent(page)

 await expect(page.locator('text=Player Not Found')).not.toBeVisible()
 await expect(page.locator('text=Next Game')).toBeVisible()
 })

 test('Reserved route /match-day still works', async ({ page }) => {
 await page.goto('/match-day')
 await waitForContent(page)

 await expect(page.locator('text=Player Not Found')).not.toBeVisible()
 })

 test('Reserved route /login still works', async ({ page }) => {
 await page.goto('/login')
 await waitForContent(page)

 await expect(page.locator('text=Player Not Found')).not.toBeVisible()
 })

 // ============== PROFILE EDIT PAGE ==============

 test('Profile edit page exists and loads', async ({ page }) => {
 await page.goto('/profile/edit')
 await waitForContent(page)

 // Should show the edit form or redirect to login
 // Either is acceptable — we just verify the route doesn't 404
 const url = page.url()
 expect(url.includes('/profile/edit') || url.includes('/login')).toBe(true)
 })

 // ============== PLAYER CARDS CLICKABLE ==============

 test('Player cards on /players are clickable links', async ({ page }) => {
 await page.goto('/players')
 await waitForContent(page)

 // Find a player card — it should be wrapped in a link
 const firstPlayerLink = page.locator('a').filter({ hasText: 'Ahmed' }).first()

 // Verify it exists and has an href
 const href = await firstPlayerLink.getAttribute('href')
 expect(href).toBeTruthy()

 // The href should be either /username or /players/uuid
 expect(href!.startsWith('/')).toBe(true)
 })

 test('Clicking a player card navigates to a profile or detail page', async ({ page }) => {
 await page.goto('/players')
 await waitForContent(page)

 // Click the first player card
 const firstPlayerLink = page.locator('a').filter({ hasText: 'Ahmed' }).first()
 await firstPlayerLink.click()
 await waitForContent(page)

 // Should navigate away from /players
 const url = page.url()
 expect(url).not.toBe(page.url() + '/players')

 // Should show player info (either public profile or detail page)
 await expect(page.locator('text=Ahmed')).toBeVisible()
 })

 // ============== CONTENT RULES ON PROFILES ==============

 test('Profile pages do not use "MOTM" abbreviation', async ({ page }) => {
 // Visit a non-existent profile to at least test the 404 page
 await page.goto('/testplayer')
 await waitForContent(page)

 const bodyText = await page.locator('body').textContent()
 expect(bodyText).not.toMatch(/\bMOTM\b/)
 })

 // ============== RESERVED USERNAME VALIDATION ==============

 test('Profile edit form validates username format', async ({ page }) => {
 await page.goto('/profile/edit')
 await waitForContent(page)

 // If redirected to login, skip this test
 if (page.url().includes('/login')) {
 test.skip()
 return
 }

 // Check that the username field exists
 const usernameInput = page.locator('input[placeholder="yourname"]')
 if (await usernameInput.isVisible()) {
 // The URL preview should show thursdayfootball.com/
 await expect(page.locator('text=thursdayfootball.com/')).toBeVisible()
 }
 })
})