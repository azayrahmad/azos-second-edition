
import { test, expect } from '@playwright/test';

test('WordPad new toolbar and print button test', async ({ page }) => {
  // Set a longer timeout for this specific test
  test.setTimeout(60000);

  await page.goto('http://localhost:5173/azos-second-edition/');

  // Wait for the network to be idle, giving the app time to initialize
  await page.waitForLoadState('networkidle');

  // Wait for the desktop to be ready
  await page.waitForSelector('.desktop', { timeout: 20000 });

  // Check for and close the "Tip of the Day" window
  try {
    const tipOfTheDayWindow = await page.locator('#tipOfTheDay');
    if (await tipOfTheDayWindow.isVisible({ timeout: 5000 })) {
      console.log('"Tip of the Day" window found. Closing it.');
      await tipOfTheDayWindow.locator('.window-close-button').click();
      await expect(tipOfTheDayWindow).not.toBeVisible();
    }
  } catch (error) {
    console.log('"Tip of the Day" window not found, continuing...');
  }

  // Wait for the WordPad icon to be visible before interacting with it
  const wordpadIcon = page.locator('[data-app-id="wordpad"]');
  await expect(wordpadIcon).toBeVisible({ timeout: 20000 });

  // Launch WordPad by double-clicking its desktop icon
  await wordpadIcon.dblclick();

  // Wait for the WordPad window to appear
  const wordpadWindow = page.locator('.os-window[id="wordpad"]');
  await expect(wordpadWindow).toBeVisible({ timeout: 10000 });

  // Check for the new toolbar
  const newToolbar = await wordpadWindow.locator('.wordpad-toolbar:first-child');
  await expect(newToolbar).toBeVisible();

  // Check for the Print button in the new toolbar
  const printButton = await newToolbar.locator('#wordpad-print');
  await expect(printButton).toBeVisible();
  await expect(printButton).toHaveText('Print');

  // Click the print button (we can't test the print dialog itself, but we can ensure no errors are thrown)
  await printButton.click();

  // Take a screenshot
  await page.screenshot({ path: 'wordpad_with_print_button.png' });
});
