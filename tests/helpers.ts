import { Page } from '@playwright/test'

// Player IDs for testing (from constants.ts)
export const PLAYER_IDS = {
  shareef: 'ba7c5acc-c94d-466e-8d5a-0c7773c2bf0c',
  darwish: '6c6b378f-2748-467a-8eca-62c782eacd0a',
  ahmed: '7f1e43d8-80f0-49c6-84ac-6378af6de477',
  fasin: 'd58595c9-cb6c-4b9d-8158-523f6b893580',
  hamsheed: '6e3d931a-dc26-4b90-81f0-59ff53019e50',
  jalal: '6c0ce954-87a5-41b2-8898-1330751155b0',
  shaheen: '10825c4b-23d0-4e93-8c49-eadface5aeb3',
  emaad: 'ac54a34c-4448-4721-8442-5dde27973756',
  luqman: 'df86a60e-5940-406a-8330-f74379c89da3',
  nabeel: '3b16e4b3-82f5-4a0e-80d3-86f6b149891a',
  jinish: 'f5a7c2e1-d4b3-4c8a-9e2f-1d3c5b7a9e0f',
  shammas: 'a1b2c3d4-e5f6-4a7b-8c9d-0e1f2a3b4c5d',
  rathan: 'b2c3d4e5-f6a7-4b8c-9d0e-1f2a3b4c5d6e',
  madan: 'c3d4e5f6-a7b8-4c9d-0e1f-2a3b4c5d6e7f',
  waleed: 'd4e5f6a7-b8c9-4d0e-1f2a-3b4c5d6e7f8a',
  raihan: 'e5f6a7b8-c9d0-4e1f-2a3b-4c5d6e7f8a9b',
  junaid: 'f6a7b8c9-d0e1-4f2a-3b4c-5d6e7f8a9b0c',
  shafeer: 'a7b8c9d0-e1f2-4a3b-4c5d-6e7f8a9b0c1d',
  fathah: 'b8c9d0e1-f2a3-4b4c-5d6e-7f8a9b0c1d2e',
  raed: 'c9d0e1f2-a3b4-4c5d-6e7f-8a9b0c1d2e3f',
  ameen: 'd0e1f2a3-b4c5-4d6e-7f8a-9b0c1d2e3f4a',
}

// Bypass Google OAuth by setting Supabase auth in localStorage
// This simulates being logged in as Shareef
export async function loginAsShareef(page: Page) {
  await page.goto('/')

  // Set the user profile in localStorage to simulate login
  // The app reads from Supabase auth, so we need to set the session
  await page.evaluate(() => {
    // Set a flag that the auth context can read
    localStorage.setItem('supabase.auth.token', JSON.stringify({
      currentSession: {
        access_token: 'test-token',
        user: {
          id: 'test-user-id',
          email: 'test@test.com',
        }
      }
    }))
  })
}

// Helper to wait for page content to load (no skeleton/loading)
export async function waitForContent(page: Page) {
  // Wait for loading states to disappear
  await page.waitForTimeout(1000)
  await page.waitForLoadState('networkidle')
}