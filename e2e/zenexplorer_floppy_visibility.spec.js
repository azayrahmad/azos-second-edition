import { test, expect } from '@playwright/test';

test('ZenExplorer shows 3½ Floppy (A:) in root', async ({ page }) => {
    test.setTimeout(120000);
    await page.goto('/');

    // Close any startup windows if they appear (sometimes Tip of the Day appears)
    const tipWindow = page.locator('.window:has-text("Welcome")');
    if (await tipWindow.isVisible()) {
        await tipWindow.locator('button:has-text("Close")').click();
    }

    await page.click('button:has-text("Start")');
    await page.click('text=Programs');
    await page.click('text=File Manager (ZenFS)');

    // Wait for Zen Explorer window
    const window = page.locator('#zenexplorer');
    await expect(window).toBeVisible();

    // Check for A: drive icon
    // Using filter to be more precise
    const floppyIcon = window.locator('.explorer-icon').filter({ hasText: '3½ Floppy (A:)' });
    await expect(floppyIcon).toBeVisible();
});
