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
let parserPromise = null;

export function loadThemeParser() {
  if (!parserPromise) {
    parserPromise = new Promise((resolve, reject) => {
      if (window.makeThemeCSSFile) {
        return resolve();
      }
      const script = document.createElement("script");
      script.src = "./os-gui/parse-theme.js";
      script.onload = resolve;
      script.onerror = () => {
        parserPromise = null; // Reset on error
        reject(new Error("Failed to load theme parser."));
      };
      document.head.appendChild(script);
    });
  }
  return parserPromise;
}

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
  const savedTheme = getItem(LOCAL_STORAGE_KEYS.CURRENT_THEME);
  if (savedTheme) {
    return savedTheme;
  }

  // Fallback for first-time users or cleared storage
  const defaultTheme = themes["default"];
  setItem(LOCAL_STORAGE_KEYS.CURRENT_THEME, defaultTheme);
  return defaultTheme;
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

export async function applyTheme() {
  const currentTheme = getCurrentTheme();

  // Disable all built-in theme stylesheets first
  for (const theme of Object.values(themes)) {
    const stylesheet = document.getElementById(`${theme.id}-theme`);
    if (stylesheet) stylesheet.disabled = true;
  }
  // Remove all custom theme styles
  const customThemes = getCustomThemes();
  for (const themeId in customThemes) {
    removeStylesheet(themeId);
  }

  if (currentTheme) {
    applyCursorTheme(currentTheme.id);

    if (currentTheme.stylesheet && themes[currentTheme.id]) {
      // It's a built-in theme, enable its stylesheet
      const stylesheet = document.getElementById(`${currentTheme.id}-theme`);
      if (stylesheet) stylesheet.disabled = false;
    } else {
      // It's a custom or modified theme, generate and apply its CSS
      await loadThemeParser();
      if (window.makeThemeCSSFile && currentTheme.colors) {
        const cssContent = window.makeThemeCSSFile(currentTheme.colors);
        // Use a consistent ID for the "current" theme's style element
        applyStylesheet("current-theme", cssContent);
      }
    }
  } else {
    // Fallback to default if something goes wrong
    const defaultTheme = themes["default"];
    const stylesheet = document.getElementById(`${defaultTheme.id}-theme`);
    if (stylesheet) stylesheet.disabled = false;
    applyCursorTheme(defaultTheme.id);
  }
}


export async function setTheme(themeId, themeObject = null) {
  applyBusyCursor(document.body);
  try {
    let themeToApply;
    if (themeObject) {
      themeToApply = themeObject;
    } else {
      const allThemes = getThemes();
      themeToApply = allThemes[themeId];
    }

    if (!themeToApply) {
      console.error(`Theme '${themeId}' not found.`);
      return;
    }

    setItem(LOCAL_STORAGE_KEYS.CURRENT_THEME, themeToApply);

    await preloadThemeAssets(themeToApply.id);
    await applyTheme();

    if (themeToApply.wallpaper) {
      setItem(LOCAL_STORAGE_KEYS.WALLPAPER, themeToApply.wallpaper);
    } else {
      removeItem(LOCAL_STORAGE_KEYS.WALLPAPER);
    }

    document.dispatchEvent(new CustomEvent("wallpaper-changed"));
    document.dispatchEvent(new CustomEvent("theme-changed"));
  } finally {
    clearBusyCursor(document.body);
  }
}
