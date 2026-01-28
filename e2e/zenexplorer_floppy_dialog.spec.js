import { test, expect } from '@playwright/test';

test('ZenExplorer shows Insert floppy dialog when accessing A:', async ({ page }) => {
    page.on('console', msg => console.log('PAGE LOG:', msg.text()));
    test.setTimeout(120000);
    await page.goto('/');

    // Close any startup windows if they appear
    const tipWindow = page.locator('.window:has-text("Welcome")');
    if (await tipWindow.isVisible()) {
        await tipWindow.locator('button:has-text("Close")').click();
    }

    await page.click('button:has-text("Start")');
    await page.click('text=Programs');
    await page.click('text=File Manager (ZenFS)');

    const window = page.locator('#zenexplorer');
    await expect(window).toBeVisible();

    // Double click the A: drive
    const floppyIcon = window.locator('.explorer-icon').filter({ hasText: '3½ Floppy (A:)' });
    // Increase delay to ensure double click is registered
    await floppyIcon.dblclick({ delay: 100 });

    // Check for "Insert floppy" dialog
    const dialog = page.locator('.window:not(#zenexplorer)').filter({ hasText: '3½ Floppy (A:)' });
    await expect(dialog.first()).toBeVisible();

    // Try to click Cancel more reliably
    const cancelButton = dialog.first().locator('button:has-text("Cancel")');
    await cancelButton.click({ force: true });

    await expect(dialog.first()).not.toBeVisible();
});
