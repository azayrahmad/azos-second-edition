export const LOCAL_STORAGE_KEYS = {
  DESKTOP_THEME: 'desktop-theme',
  CUSTOM_APPS: 'customApps',
  SHOW_TIPS_AT_STARTUP: 'showTipsAtStartup',
  CLIPPY_AGENT_NAME: 'clippyAgentName',
  WALLPAPER: 'wallpaper',
  WALLPAPER_MODE: 'wallpaperMode',
  ICON_POSITIONS: 'iconPositions',
};

export function getItem(key) {
  const item = localStorage.getItem(key);
  try {
    return JSON.parse(item);
  } catch (e) {
    return item;
  }
}

export function setItem(key, value) {
  if (typeof value === 'object') {
    localStorage.setItem(key, JSON.stringify(value));
  } else {
    localStorage.setItem(key, value);
  }
}

export function removeItem(key) {
    localStorage.removeItem(key)
}
