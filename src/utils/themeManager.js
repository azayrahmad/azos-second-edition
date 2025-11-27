import {
  getItem,
  setItem,
  removeItem,
  LOCAL_STORAGE_KEYS,
} from "./localStorage.js";
import { themes } from "../config/themes.js";
import {
  applyCursorTheme,
  applyBusyCursor,
  clearBusyCursor,
} from "./cursorManager.js";
import { preloadThemeAssets } from "./assetPreloader.js";
import screensaverManager from "./screensaverUtils.js";

let parserPromise = null;
let activeTheme = null; // In-memory cache to avoid repeated localStorage access

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

// Gets the full theme object from localStorage, with a fallback to default.
// Gets the ID of the base active theme.
export function getActiveThemeId() {
  return getItem(LOCAL_STORAGE_KEYS.ACTIVE_THEME) || "default";
}

// Gets the full theme object for the base active theme.
export function getActiveTheme() {
  const allThemes = getThemes();
  const activeId = getActiveThemeId();
  return allThemes[activeId] || themes.default;
}

// --- Individual Scheme Getters with Overrides ---

export function getColorSchemeId() {
  return (
    getItem(LOCAL_STORAGE_KEYS.COLOR_SCHEME) || getActiveThemeId()
  );
}

export function getSoundSchemeName() {
  return (
    getItem(LOCAL_STORAGE_KEYS.SOUND_SCHEME) || getActiveTheme().soundScheme
  );
}

export function getIconSchemeName() {
  return (
    getItem(LOCAL_STORAGE_KEYS.ICON_SCHEME) || getActiveTheme().iconScheme
  );
}

export function getCursorSchemeId() {
  return (
    getItem(LOCAL_STORAGE_KEYS.CURSOR_SCHEME) || getActiveThemeId()
  );
}

// Deprecated: for components that still use it. Should be phased out.
export function getCurrentTheme() {
  return getActiveThemeId();
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
  const allThemes = getThemes();
  const colorSchemeId = getColorSchemeId();
  const cursorSchemeId = getCursorSchemeId();
  const colorSchemeTheme = allThemes[colorSchemeId] || themes.default;


  // --- Cleanup Phase ---
  // Disable all built-in theme stylesheets (except 'default', which is the base)
  for (const themeId in themes) {
    if (themeId !== "default") {
      const stylesheet = document.getElementById(`${themeId}-theme`);
      if (stylesheet) stylesheet.disabled = true;
    }
  }

  // Remove all stylesheets for saved custom themes
  const customThemes = getCustomThemes();
  for (const themeId in customThemes) {
    removeStylesheet(themeId);
  }

  // Remove the generic temporary stylesheet if it exists
  removeStylesheet("custom");

  // --- Application Phase ---
  applyCursorTheme(cursorSchemeId);

  if (colorSchemeTheme.stylesheet && themes[colorSchemeTheme.id]) {
    // It's a built-in theme, enable its stylesheet.
    const stylesheet = document.getElementById(`${colorSchemeTheme.id}-theme`);
    if (stylesheet) {
      stylesheet.disabled = false;
    }
  } else if (colorSchemeTheme.colors) {
    // It's a custom or temporary theme, so generate and apply its CSS.
    await loadThemeParser();
    if (window.makeThemeCSSFile) {
      const cssContent = window.makeThemeCSSFile(colorSchemeTheme.colors);
      // Use 'custom' id for the temporary theme from the app, otherwise the theme's own id.
      const styleId =
        colorSchemeTheme.id === "custom" ? "custom" : colorSchemeTheme.id;
      applyStylesheet(styleId, cssContent);
    }
  }
}

export async function setColorScheme(schemeId) {
  applyBusyCursor(document.body);
  try {
    const allThemes = getThemes();
    if (!allThemes[schemeId]) {
      console.error(`Color scheme with key "${schemeId}" not found.`);
      return;
    }
    setItem(LOCAL_STORAGE_KEYS.COLOR_SCHEME, schemeId);
    await applyTheme();
    document.dispatchEvent(new CustomEvent("theme-changed"));
  } finally {
    clearBusyCursor(document.body);
  }
}

export async function setTheme(themeKey) {
  applyBusyCursor(document.body);
  try {
    const allThemes = getThemes();
    const newTheme = allThemes[themeKey];

    if (!newTheme) {
      console.error(`Theme with key "${themeKey}" not found.`);
      return;
    }

    // Set the master theme key
    setItem(LOCAL_STORAGE_KEYS.ACTIVE_THEME, themeKey);

    // Set individual components, clearing any previous overrides
    setItem(LOCAL_STORAGE_KEYS.COLOR_SCHEME, themeKey);
    setItem(LOCAL_STORAGE_KEYS.SOUND_SCHEME, newTheme.soundScheme);
    setItem(LOCAL_STORAGE_KEYS.ICON_SCHEME, newTheme.iconScheme);
    setItem(LOCAL_STORAGE_KEYS.CURSOR_SCHEME, themeKey);

    if (newTheme.wallpaper) {
      setItem(LOCAL_STORAGE_KEYS.WALLPAPER, newTheme.wallpaper);
    } else {
      removeItem(LOCAL_STORAGE_KEYS.WALLPAPER);
    }

    if (newTheme.screensaver) {
      screensaverManager.setCurrentScreensaver(newTheme.screensaver);
    }

    await preloadThemeAssets(themeKey);
    await applyTheme();

    // Notify components to update
    document.dispatchEvent(new CustomEvent("wallpaper-changed"));
    document.dispatchEvent(new CustomEvent("theme-changed"));
  } finally {
    clearBusyCursor(document.body);
  }
}
