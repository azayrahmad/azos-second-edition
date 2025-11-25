export const LOCAL_STORAGE_KEYS = {
  ACTIVE_THEME: 'activeTheme',
  CUSTOM_THEMES: 'customThemes',
  CUSTOM_APPS: 'customApps',
  SHOW_TIPS_AT_STARTUP: 'showTipsAtStartup',
  CLIPPY_AGENT_NAME: 'clippyAgentName',
  CLIPPY_TTS_ENABLED: 'clippyTTSEnabled',
  NOTEPAD_THEME: 'notepad-theme',
  WALLPAPER_MODE: 'wallpaperMode',
  ICON_POSITIONS: 'iconPositions',
  AUTO_ARRANGE_ICONS: 'autoArrangeIcons',
  MONITOR_TYPE: 'monitorType',
  RECYCLE_BIN: 'recycleBin',
  SCREENSAVER_TIMEOUT: 'screensaverTimeout',
  SCREENSAVER: 'screensaver',
  COLOR_MODE: 'colorMode',
  SCREEN_RESOLUTION: 'screenResolution',
  DROPPED_FILES: 'droppedFiles',
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
