import { startBootProcessStep, finalizeBootProcessStep } from '../components/bootScreen.js';

/**
 * Checks for a new version of the application and forces a reload if an update is found.
 */
export async function checkVersion() {
  const logElement = startBootProcessStep('Checking for updates...');
  const localVersion = import.meta.env.APP_VERSION;

  try {
    const response = await fetch('/version.json?t=' + new Date().getTime());
    if (!response.ok) {
      throw new Error('Failed to fetch version info');
    }
    const serverInfo = await response.json();
    const serverVersion = serverInfo.version;

    if (localVersion !== serverVersion) {
      finalizeBootProcessStep(logElement, 'New version found');
      const updateLog = startBootProcessStep(`Updating from v${localVersion} to v${serverVersion}...`);
      await new Promise(resolve => setTimeout(resolve, 3000)); // Give user time to read
      location.reload(true); // Force reload, bypassing cache
    } else {
      finalizeBootProcessStep(logElement, 'OK');
    }
  } catch (error) {
    console.error('Version check failed:', error);
    finalizeBootProcessStep(logElement, 'WARNING');
  }
}
