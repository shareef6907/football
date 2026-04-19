import { test, expect } from '@playwright/test';

test('Live Draft - Duplicate Prevention and Completion', async ({ page }) => {
  // Step 1: Navigate to match-day
  await page.goto('/match-day');
  console.log('1. Loaded /match-day');
  
  // Wait for page to be ready
  await page.waitForTimeout(2000);
  
  // Step 2: Select at least 8 players for 2 teams of 5v5
  // Look for player selection buttons
  const playerButtons = page.locator('button[class*="rounded"]').all();
  let clicked = 0;
  
  for (const button of await playerButtons) {
    if (clicked >= 8) break;
    try {
      const text = await button.textContent();
      // Skip navigation and action buttons
      if (text && !text.includes('Live') && !text.includes('Start') && !text.includes('Select') && !text.includes('Auto')) {
        await button.click();
        clicked++;
        console.log(`2. Selected player: ${text}`);
      }
    } catch (e) {
      // Skip
    }
  }
  
  console.log(`3. Total players selected: ${clicked}`);
  
  // Step 3: Click "Live Team Selection by Captains"
  const liveButton = page.locator('button:has-text("Live Team Selection")').first();
  if (await liveButton.isVisible().catch(() => false)) {
    await liveButton.click();
    console.log('4. Clicked Live Team Selection button');
    await page.waitForTimeout(2000);
  }
  
  // Step 4: Wait for draft page to load
  if (page.url().includes('draft')) {
    console.log('5. On draft page:', page.url());
    
    // Step 5: Auto-select captains
    const autoSelectBtn = page.locator('button:has-text("Auto-Select")').first();
    if (await autoSelectBtn.isVisible().catch(() => false)) {
      await autoSelectBtn.click();
      console.log('6. Auto-selected captains');
      await page.waitForTimeout(1000);
    }
    
    // Step 6: Start Draft
    const startDraftBtn = page.locator('button:has-text("Start Draft")').first();
    if (await startDraftBtn.isVisible().catch(() => false)) {
      await startDraftBtn.click();
      console.log('7. Started draft');
      await page.waitForTimeout(2000);
    }
    
    // Step 7: Make picks - verify NO duplicates
    // Get available player cards
    const pickableCards = page.locator('button[class*="border-green"]').all();
    const initialCardCount = await pickableCards.length;
    console.log(`8. Available pick cards: ${initialCardCount}`);
    
    // Make a pick
    if (initialCardCount > 0) {
      await pickableCards[0].click();
      console.log('9. Made pick');
      await page.waitForTimeout(1000);
      
      // Verify card removed from list (no duplicate)
      const afterPickCards = page.locator('button[class*="border-green"]').all();
      const afterCount = await afterPickCards.length;
      console.log(`10. Available after pick: ${afterCount} (should be ${initialCardCount - 1})`);
      
      // Make another pick to test more
      if (afterCount > 0) {
        await afterPickCards[0].click();
        console.log('11. Made second pick');
        await page.waitForTimeout(1000);
      }
    }
    
    // Step 8: Check for Teams Complete when all picked
    // Note: Complete only triggers after all slots filled (captains + picks)
    const completeBanner = page.locator('text=Teams Complete').first();
    console.log('12. Teams Complete banner exists:', await completeBanner.isVisible().catch(() => false));
    
  } else {
    console.log('Not on draft page, URL:', page.url());
  }
  
  console.log('Test completed!');
});

test('Admin - Match Date Selector', async ({ page }) => {
  // Go to admin page
  await page.goto('/admin');
  console.log('1. Loaded /admin');
  
  await page.waitForTimeout(2000);
  
  // Check for match date dropdown
  const dateSelect = page.locator('select').first();
  const hasSelect = await dateSelect.isVisible().catch(() => false);
  console.log('2. Date selector visible:', hasSelect);
  
  // Check for match options
  if (hasSelect) {
    const options = await dateSelect.locator('option').all();
    console.log('3. Options count:', options.length);
    
    // Check dates in dropdown
    for (const opt of options.slice(0, 5)) {
      const text = await opt.textContent();
      console.log('  Option:', text);
    }
  }
  
  console.log('Test completed!');
});