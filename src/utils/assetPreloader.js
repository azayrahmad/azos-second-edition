import { themes } from '../config/themes.js';
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

export async function preloadThemeAssets(themeId, onProgress = () => {}) {
  const theme = themes[themeId];
  if (!theme) {
    console.warn(`Theme not found: ${themeId}`);
    onProgress(1, 'Theme not found.');
    return;
  }

  const assetsToLoad = [];

  // Wallpaper
  if (theme.wallpaper) {
    assetsToLoad.push({ src: theme.wallpaper, type: 'image' });
  }

  // Sound scheme
  const soundScheme = soundSchemes[theme.soundScheme];
  if (soundScheme) {
    for (const sound in soundScheme) {
      if (soundScheme[sound]) {
        assetsToLoad.push({ src: soundScheme[sound], type: 'audio' });
      }
    }
  }

  // Cursor scheme
  const cursorScheme = cursors[themeId];
  if (cursorScheme) {
    for (const cursor in cursorScheme) {
      if (cursorScheme[cursor]) {
        assetsToLoad.push({ src: cursorScheme[cursor], type: 'cursor' });
      }
    }
  }

  const totalAssets = assetsToLoad.length;
  if (totalAssets === 0) {
    onProgress(1, 'No assets to preload.');
    return;
  }

  let loadedCount = 0;
  onProgress(0, 'Starting preloading...');

  const assetPromises = assetsToLoad.map(asset => {
    let preloadPromise;
    switch (asset.type) {
      case 'image':
        preloadPromise = preloadImage(asset.src);
        break;
      case 'audio':
        preloadPromise = preloadAudio(asset.src);
        break;
      case 'cursor':
        preloadPromise = preloadCursor(asset.src);
        break;
      default:
        preloadPromise = Promise.resolve();
    }

    return preloadPromise
      .then(() => {
        loadedCount++;
        const progress = loadedCount / totalAssets;
        const filename = asset.src.split('/').pop();
        onProgress(progress, `Loading: ${filename}...`);
      })
      .catch(error => {
        loadedCount++;
        const progress = loadedCount / totalAssets;
        const filename = asset.src.split('/').pop();
        onProgress(progress, `Failed: ${filename}`);
        console.warn(`Failed to preload asset: ${asset.src}`, error);
      });
  });

  await Promise.all(assetPromises);
}
