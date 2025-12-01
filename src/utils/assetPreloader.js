import { soundSchemes } from '../config/sound-schemes.js';
import { cursors } from '../config/cursors.js';

async function preloadImage(src) {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.src = src;
    img.onload = resolve;
    img.onerror = reject;
  });
}

async function preloadAudio(src) {
  return new Promise((resolve, reject) => {
    const audio = new Audio();
    audio.src = src;
    audio.addEventListener('canplaythrough', resolve, { once: true });
    audio.onerror = reject;
  });
}

async function preloadCursor(src) {
    // For cursors, we just need to fetch the file to get it into the browser cache
    return fetch(src);
}

export async function preloadThemeAssets(themeId, allThemes) {
  const theme = allThemes[themeId];
  if (!theme) {
    console.warn(`Theme not found: ${themeId}`);
    return;
  }

  const assetPromises = [];

  // Wallpaper
  if (theme.wallpaper) {
    assetPromises.push(preloadImage(theme.wallpaper));
  }

  // Sound scheme
  const soundScheme = soundSchemes[theme.soundScheme];
  if (soundScheme) {
    for (const sound in soundScheme) {
      if (soundScheme[sound]) {
        assetPromises.push(preloadAudio(soundScheme[sound]));
      }
    }
  }

  // Cursor scheme
  const cursorScheme = cursors[themeId];
  if (cursorScheme) {
    for (const cursor in cursorScheme) {
      if (cursorScheme[cursor]) {
        assetPromises.push(preloadCursor(cursorScheme[cursor]));
      }
    }
  }

  await Promise.all(assetPromises.map(p => p.catch(e => console.warn('Failed to preload asset:', e))));
}
