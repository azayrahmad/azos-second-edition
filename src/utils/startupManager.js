import { getItem, setItem } from "./localStorage.js";

const STARTUP_APPS_KEY = "startup_apps";

/**
 * Gets the list of startup app IDs from localStorage.
 * @returns {string[]} An array of app IDs.
 */
export function getStartupApps() {
  return getItem(STARTUP_APPS_KEY) || [];
}

/**
 * Adds an app ID to the startup list.
 * @param {string} appId The ID of the app to add.
 */
export function addStartupApp(appId) {
  const currentApps = getStartupApps();
  if (!currentApps.includes(appId)) {
    const newApps = [...currentApps, appId];
    setItem(STARTUP_APPS_KEY, newApps);
  }
}

/**
 * Removes an app ID from the startup list.
 * @param {string} appId The ID of the app to remove.
 */
export function removeStartupApp(appId) {
  const currentApps = getStartupApps();
  const newApps = currentApps.filter((id) => id !== appId);
  setItem(STARTUP_APPS_KEY, newApps);
}
