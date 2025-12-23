import { test, expect } from '@playwright/test';

test.describe('WordPad "Find" feature', () => {
  test('should open WordPad and display the "Find" button in the toolbar', async ({ page }) => {
    test.setTimeout(120000); // 2 minutes timeout

    await page.goto('http://localhost:5173/azos-second-edition/');

    // Wait for the network to be idle, giving the app time to initialize
    await page.waitForLoadState('networkidle');

    // Wait for the desktop to be ready
    await page.waitForSelector('.desktop', { timeout: 60000 }); // 60 seconds timeout

    // Check for and close the "Tip of the Day" window
    try {
      const tipWindow = await page.waitForSelector('#tipOfTheDay', { timeout: 5000 });
      if (tipWindow) {
        await page.click('#tipOfTheDay .window-close-button');
      }
    } catch (error) {
      // Tip of the day window did not appear, continue
    }

    // Wait for the WordPad icon to be visible before interacting with it
    const wordpadIcon = page.locator('[data-app-id="wordpad"]');
    await expect(wordpadIcon).toBeVisible({ timeout: 10000 }); // 10 seconds timeout

    // Launch WordPad by double-clicking its desktop icon
    await wordpadIcon.dblclick();

    // Wait for the WordPad window to appear
    const wordpadWindow = page.locator('.os-window[data-app-id="wordpad"]');
    await expect(wordpadWindow).toBeVisible({ timeout: 10000 }); // 10 seconds timeout

    // Verify that the new "Find" button is present
    const findButton = page.locator('#wordpad-find');
    await expect(findButton).toBeVisible();

    // Verify that the "Find" button has the correct icon
    const findButtonIcon = findButton.locator('.toolbar-icon');
    await expect(findButtonIcon).toHaveCSS('background-image', /wordpad-toolbar1\.png/);
  });
});
