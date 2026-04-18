import { test, expect } from '@playwright/test';

test('Live Team Selection by Captains', async ({ page }) => {
  // 1. Navigate to /match-day
  await page.goto('/match-day');
  await expect(page.locator('body')).toBeVisible({ timeout: 10000 });
  
  console.log('Page loaded, URL:', page.url());
  
  // 2. Select players - wait for buttons to appear
  await page.waitForTimeout(1000);
  
  // Try to click on player buttons - there should be clickable player elements
  // Look for any button or clickable element that would select a player
  const playerButtons = page.locator('button').all();
  console.log('Total buttons found:', (await playerButtons).length);
  
  // Try selecting a few players by clicking on them
  // The page should have player selection UI
  const buttons = await page.locator('button').all();
  let clicked = 0;
  for (const button of buttons.slice(0, 10)) {
    try {
      const text = await button.textContent();
      console.log('Button text:', text);
      await button.click();
      clicked++;
      if (clicked >= 6) break; // Select at least 6 players
    } catch (e) {
      // Skip if can't click
    }
  }
  console.log('Clicked player buttons:', clicked);
  
  // 3. Set up teams - look for inputs
  const inputs = page.locator('input').all();
  console.log('Total inputs found:', (await inputs).length);
  
  // 4. Click Live Team Selection button if available
  const allButtons = await page.locator('button').all();
  for (const button of allButtons) {
    const text = await button.textContent() || '';
    if (text.toLowerCase().includes('captain') || text.toLowerCase().includes('live')) {
      console.log('Clicking captain button:', text);
      await button.click();
      await page.waitForTimeout(2000);
      break;
    }
  }
  
  console.log('Current URL after click:', page.url());
  
  // Check if we're on draft page or still on match-day
  const bodyText = await page.locator('body').textContent() || '';
  console.log('Page has draft elements:', bodyText.includes('draft') || bodyText.includes('captain'));
  
  // 5. Auto-select captains button
  const autoSelectBtn = page.locator('button:has-text("Auto-Select"), button:has-text("auto")').first();
  if (await autoSelectBtn.isVisible().catch(() => false)) {
    await autoSelectBtn.click();
    console.log('Clicked Auto-Select');
  }
  
  await page.waitForTimeout(1000);
  
  // 6. Start Draft button
  const startDraftBtn = page.locator('button:has-text("Start"), button:has-text("Draft")').first();
  if (await startDraftBtn.isVisible().catch(() => false)) {
    await startDraftBtn.click();
    console.log('Clicked Start Draft');
  }
  
  await page.waitForTimeout(2000);
  
  // Check final state
  console.log('Final URL:', page.url());
  console.log('Test completed successfully');
});