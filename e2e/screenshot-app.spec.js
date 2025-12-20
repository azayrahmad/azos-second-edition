import { test, expect } from '@playwright/test';

const appId = process.env.APP_ID;
const appDir = process.env.APP_DIR || appId;
const isWindowless = process.env.WINDOWLESS === 'true';
const isIframe = process.env.IS_IFRAME === 'true';
const isCustom = process.env.IS_CUSTOM === 'true';
const filePath = process.env.FILE_PATH;

if (!appId) {
  throw new Error('APP_ID environment variable is not set.');
}

test(`screenshot ${appId} app`, async ({ page }) => {
  await page.goto('/');

  // Wait for the boot screen to be ready and press Enter
  await page.waitForSelector('#boot-screen-content', { state: 'visible' });
  await page.keyboard.press('Enter');

  // Wait for the OS to fully load
  await page.waitForSelector('#screen.boot-mode', { state: 'hidden' });

  // Disable tips
  await page.evaluate(() => {
    localStorage.setItem('showTipsAtStartup', 'false');
  });

  // Launch the app
  await page.evaluate(
    ({ id, path }) => {
      window.System.launchApp(id, path);
    },
    { id: appId, path: filePath },
  );

  const screenshotPath = `src/apps/${appDir}/screenshot.png`;

  if (isWindowless) {
    // For windowless apps, wait a bit for them to appear and then screenshot the whole page
    await page.waitForTimeout(2000); // Give it a moment to appear
    await page.screenshot({ path: screenshotPath });
  } else if (isIframe) {
    const appWindow = await page.waitForSelector(`.window[data-app-id="${appId}"]`);
    const iframe = page.frameLocator(`[data-app-id="${appId}"] iframe`);
    await iframe.locator('body').waitFor();
    await page.waitForTimeout(2000); // Wait for content to render
    await appWindow.screenshot({ path: screenshotPath });
  } else if (isCustom) {
    let appContainer;
    if (appId === 'webamp') {
      await page.waitForSelector('#webamp', { state: 'visible', timeout: 60000 });
      appContainer = await page.locator('#webamp-container');
    } else {
      appContainer = await page.waitForSelector(`#${appId}-container`);
    }
    await page.waitForTimeout(5000); // Wait for content to render
    await appContainer.screenshot({ path: screenshotPath });
  } else {
    // For windowed apps, wait for the app window to appear and take a screenshot of it
    const appWindow = await page.waitForSelector(`.window[data-app-id="${appId}"]`);
    await page.waitForTimeout(1000); // Wait for content to render
    await appWindow.screenshot({ path: screenshotPath });
  }
});
