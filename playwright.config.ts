import { defineConfig } from '@playwright/test'

export default defineConfig({
  testDir: './tests',
  timeout: 30000,
  retries: 1,
  use: {
    baseURL: 'http://localhost:3000',
    screenshot: 'only-on-failure',
    video: 'retain-on-failure',
  },
  webServer: {
    command: 'NEXT_PUBLIC_SUPABASE_URL=https://dummy.supabase.co NEXT_PUBLIC_SUPABASE_ANON_KEY=dummy npm run dev',
    port: 3000,
    reuseExistingServer: true,
    timeout: 120000,
  },
  projects: [
    {
      name: 'Mobile Chrome',
      use: {
        ...({ viewport: { width: 390, height: 844 } }),
      },
    },
  ],
})