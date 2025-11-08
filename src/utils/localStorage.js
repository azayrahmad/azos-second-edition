import { profileManager } from './profileManager.js';

export const LOCAL_STORAGE_KEYS = {
  DESKTOP_THEME: 'desktop-theme',
  CUSTOM_APPS: 'customApps',
  CLIPPY_AGENT_NAME: 'clippyAgentName',
  CLIPPY_TTS_ENABLED: 'clippyTTSEnabled',
  NOTEPAD_THEME: 'notepad-theme',
  WALLPAPER: 'wallpaper',
  WALLPAPER_MODE: 'wallpaperMode',
  ICON_POSITIONS: 'iconPositions',
  MONITOR_TYPE: 'monitorType',
  RECYCLE_BIN: 'recycleBin',
};

function getPrefixedKey(key) {
  return `${profileManager.getProfileName()}_${key}`;
}

export function getItem(key) {
  const item = localStorage.getItem(getPrefixedKey(key));
  try {
    return JSON.parse(item);
  } catch (e) {
    return item;
  }
}

export function setItem(key, value) {
  if (typeof value === 'object') {
    localStorage.setItem(getPrefixedKey(key), JSON.stringify(value));
  } else {
    localStorage.setItem(getPrefixedKey(key), value);
  }
}

export function removeItem(key) {
    localStorage.removeItem(getPrefixedKey(key))
}
