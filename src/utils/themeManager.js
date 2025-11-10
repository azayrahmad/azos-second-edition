import {
  getItem,
  setItem,
  removeItem,
  LOCAL_STORAGE_KEYS,
} from "./localStorage.js";
import { themes } from "../config/themes.js";
import { applyCursorTheme, applyBusyCursor, clearBusyCursor } from "./cursorManager.js";
import { preloadThemeAssets } from "./assetPreloader.js";

let temporaryTheme = null;

export function getCustomThemes() {
  return getItem(LOCAL_STORAGE_KEYS.CUSTOM_THEMES) || {};
}

export function saveCustomTheme(themeId, themeData) {
  const customThemes = getCustomThemes();
  customThemes[themeId] = themeData;
  setItem(LOCAL_STORAGE_KEYS.CUSTOM_THEMES, customThemes);
  document.dispatchEvent(new CustomEvent("custom-themes-changed"));
}

export function deleteCustomTheme(themeId) {
  const customThemes = getCustomThemes();
  delete customThemes[themeId];
  setItem(LOCAL_STORAGE_KEYS.CUSTOM_THEMES, customThemes);
  document.dispatchEvent(new CustomEvent("custom-themes-changed"));
}

export function getThemes() {
  const customThemes = getCustomThemes();
  return { ...themes, ...customThemes };
}

export function getCurrentTheme() {
  return getItem(LOCAL_STORAGE_KEYS.DESKTOP_THEME) || "default";
}

function applyStylesheet(themeId, cssContent) {
  const styleId = `${themeId}-theme-styles`;
  let styleEl = document.getElementById(styleId);
  if (!styleEl) {
    styleEl = document.createElement("style");
    styleEl.id = styleId;
    document.head.appendChild(styleEl);
  }
  styleEl.textContent = cssContent;
}

function removeStylesheet(themeId) {
  const styleId = `${themeId}-theme-styles`;
  const styleEl = document.getElementById(styleId);
  if (styleEl) {
    styleEl.remove();
  }
}

export function applyTheme() {
  const savedThemeKey = getCurrentTheme();
  const allThemes = getThemes();
  const currentTheme = temporaryTheme || allThemes[savedThemeKey];

  // Remove all custom theme styles first
  const customThemes = getCustomThemes();
  for (const themeId in customThemes) {
    removeStylesheet(themeId);
  }

  // Disable all built-in theme stylesheets
  for (const theme of Object.values(themes)) {
    if (theme.id === "default") continue;
    const stylesheet = document.getElementById(`${theme.id}-theme`);
    if (stylesheet) stylesheet.disabled = true;
  }

  // Clear temporary theme object if we are applying a saved theme
  if (!temporaryTheme) {
    const customStyle = document.getElementById("custom-theme-styles");
    if (customStyle) customStyle.remove();
  }

  if (currentTheme) {
    applyCursorTheme(currentTheme.id);

    if (currentTheme.isCustom) {
      // It's a saved custom theme, generate and apply its CSS
      if (window.makeThemeCSSFile && currentTheme.colors) {
        const cssContent = window.makeThemeCSSFile(currentTheme.colors);
        applyStylesheet(currentTheme.id, cssContent);
      }
    } else if (themes[savedThemeKey]) {
      // It's a built-in theme, enable its stylesheet
      const stylesheet = document.getElementById(`${savedThemeKey}-theme`);
      if (stylesheet) stylesheet.disabled = false;
    }
    // Note: The temporary theme (`id: 'custom'`) is handled by `setTheme` directly
  } else {
    applyCursorTheme(savedThemeKey); // Fallback
  }
}


export async function setTheme(themeKey, themeObject = null) {
  applyBusyCursor(document.body);
  try {
    if (themeObject) {
      temporaryTheme = themeObject;
      // Special handling for the temporary theme from the app
      if (themeObject.id === "custom") {
        const customStyle = document.getElementById("custom-theme-styles");
        if (customStyle) {
          // The app is responsible for updating the content of this style tag
        }
      }
    } else {
      temporaryTheme = null;
      const customStyle = document.getElementById("custom-theme-styles");
      if (customStyle) customStyle.remove();
    }

    await preloadThemeAssets(themeKey);

    setItem(LOCAL_STORAGE_KEYS.DESKTOP_THEME, themeKey);
    applyTheme();

    const theme = temporaryTheme || getThemes()[themeKey];
    if (theme) {
      if (theme.wallpaper) {
        setItem(LOCAL_STORAGE_KEYS.WALLPAPER, theme.wallpaper);
      } else {
        removeItem(LOCAL_STORAGE_KEYS.WALLPAPER);
      }
    }

    document.dispatchEvent(new CustomEvent("wallpaper-changed"));
    document.dispatchEvent(new CustomEvent("theme-changed"));
  } finally {
    clearBusyCursor(document.body);
  }
}
