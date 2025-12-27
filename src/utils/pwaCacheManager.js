import { getCurrentTheme } from './themeManager';
import { themes } from '../config/themes';
import { soundSchemes } from '../config/sound-schemes';
import { cursors } from '../config/cursors';
import { iconSchemes } from '../config/icon-schemes';

/**
 * Gathers all asset URLs for the current theme and sends them to the service worker for caching.
 */
export async function cacheCurrentThemeAssets() {
  if (!('serviceWorker' in navigator) || !navigator.serviceWorker.controller) {
    console.log('PWA Cache Manager: Service worker not active. Skipping theme cache.');
    return;
  }

  const currentThemeId = getCurrentTheme();
  const theme = themes[currentThemeId];

  if (!theme) {
    console.error(`PWA Cache Manager: Theme with id '${currentThemeId}' not found.`);
    return;
  }

  console.log(`PWA Cache Manager: Caching assets for theme '${theme.name}'...`);

  const assetUrls = new Set();

  // 1. Wallpaper
  if (theme.wallpaper) {
    assetUrls.add(theme.wallpaper);
  }

  // 2. Sound Scheme
  const soundScheme = soundSchemes[theme.soundScheme];
  if (soundScheme) {
    Object.values(soundScheme).forEach(soundUrl => {
      if (soundUrl) assetUrls.add(soundUrl);
    });
  }

  // 3. Cursor Scheme
  // Note: The theme object in themes.js does not have a `cursorScheme` property.
  // This logic assumes a 1-to-1 mapping between theme id and cursor id.
  const cursorScheme = cursors[theme.id];
  if (cursorScheme) {
    Object.values(cursorScheme).forEach(cursorUrl => {
      if (cursorUrl) assetUrls.add(cursorUrl);
    });
  }

  // 4. Icon Scheme
  const iconScheme = iconSchemes[theme.iconScheme];
  if (iconScheme) {
    Object.values(iconScheme).forEach(iconUrl => {
      if (iconUrl) assetUrls.add(iconUrl);
    });
  }

  // 5. Theme CSS file from public/os-gui
  // This path is relative to the public directory.
  const themeCssPath = `/os-gui/${theme.id}.css`;
  assetUrls.add(themeCssPath);

  const urlsToCache = Array.from(assetUrls);

  if (urlsToCache.length > 0) {
    // The service worker expects paths relative to the origin.
    navigator.serviceWorker.controller.postMessage({
      type: 'CACHE_THEME_ASSETS',
      payload: urlsToCache,
    });
    console.log('PWA Cache Manager: Sent asset list to service worker.', urlsToCache);
  } else {
    console.log('PWA Cache Manager: No new assets to cache for the current theme.');
  }
}
