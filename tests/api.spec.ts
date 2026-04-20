import { test, expect } from '@playwright/test'

test.describe('API Routes', () => {

  test('Keep-alive endpoint returns 200', async ({ request }) => {
    const response = await request.get('/api/keep-alive')
    expect(response.status()).toBe(200)

    const data = await response.json()
    expect(data.status).toBe('alive')
    expect(data.players).toBe(21)
  })
})