import { profileManager } from './profileManager.js';
import { getItem, setItem } from './localStorage.js';

const STARTUP_APPS_KEY = 'startup-apps';

function getStartupApps() {
  let startupApps = getItem(STARTUP_APPS_KEY);
  if (startupApps === null) {
    const profile = profileManager.getProfile();
    startupApps = profile.startupApps || [];
    setItem(STARTUP_APPS_KEY, startupApps);
  }
  return startupApps;
}

function addStartupApp(appId) {
  const currentApps = getStartupApps();
  const appSet = new Set(currentApps);
  appSet.add(appId);
  setItem(STARTUP_APPS_KEY, Array.from(appSet));
}

function removeStartupApp(appId) {
  const currentApps = getStartupApps();
  const updatedApps = currentApps.filter(id => id !== appId);
  setItem(STARTUP_APPS_KEY, updatedApps);
}

function isStartupApp(appId) {
  const currentApps = getStartupApps();
  return currentApps.includes(appId);
}

export const startupManager = {
  getStartupApps,
  addStartupApp,
  removeStartupApp,
  isStartupApp,
};
