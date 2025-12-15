import {
  getItem,
  setItem,
  removeItem,
  LOCAL_STORAGE_KEYS,
} from "./localStorage.js";
import { themes } from "../config/themes.js";
import { colorSchemes } from "../config/colorSchemes.js";
import {
  applyCursorTheme,
  applyBusyCursor,
  clearBusyCursor,
} from "./cursorManager.js";
import { preloadThemeAssets } from "./assetPreloader.js";
import screensaverManager from "./screensaverUtils.js";
import { fetchThemeCss, parseCssVariables } from "./themePreview.js";

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

export function getColorSchemes() {
  return colorSchemes;
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
  return getItem(LOCAL_STORAGE_KEYS.COLOR_SCHEME) || getActiveThemeId();
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

function clearRootCssVariables() {
  const root = document.documentElement;
  const style = root.style;
  const toRemove = [];
  for (let i = 0; i < style.length; i++) {
    const propName = style[i];
    if (propName.startsWith("--")) {
      toRemove.push(propName);
    }
  }
  toRemove.forEach((propName) => style.removeProperty(propName));
}

function applyCssVariablesToRoot(variables) {
  const root = document.documentElement;
  for (const [key, value] of Object.entries(variables)) {
    root.style.setProperty(`--${key}`, value);
  }
}

export async function applyTheme() {
  const allThemes = getThemes();
  const allColorSchemes = getColorSchemes();
  const colorSchemeId = getColorSchemeId();
  const cursorSchemeId = getCursorSchemeId();
  const colorScheme = allColorSchemes[colorSchemeId];
  const themeForColors = allThemes[colorSchemeId];

  // --- Cleanup Phase ---
  // Disable all built-in theme stylesheets. Their variables will be applied manually.
  for (const schemeId in allColorSchemes) {
    const stylesheet = document.getElementById(`${schemeId}-theme`);
    if (stylesheet) stylesheet.disabled = true;
  }
  // Clear any variables that were applied inline from a previous run.
  clearRootCssVariables();

  // --- Application Phase ---
  applyCursorTheme(cursorSchemeId);

  let variables = {};

  // Check for built-in color scheme first
  if (colorScheme && colorScheme.url) {
    const cssText = await fetchThemeCss(colorScheme.url);
    if (cssText) {
      variables = parseCssVariables(cssText);
    }
  } else if (themeForColors && themeForColors.colors) {
    // It's a custom or temporary theme with an inline 'colors' object
    for (const [key, value] of Object.entries(themeForColors.colors)) {
      variables[key.replace(/^--/, "")] = value;
    }
  } else {
    // Fallback: If no scheme or colors found, apply the default theme's variables.
    const defaultScheme = allColorSchemes["default"];
    if (defaultScheme && defaultScheme.url) {
      const cssText = await fetchThemeCss(defaultScheme.url);
      if (cssText) {
        variables = parseCssVariables(cssText);
      }
    }
  }

  applyCssVariablesToRoot(variables);
}

export async function setColorScheme(schemeId) {
  applyBusyCursor(document.body);
  try {
    const allSchemes = getColorSchemes();
    const allThemes = getThemes(); // For custom themes
    if (!allSchemes[schemeId] && !allThemes[schemeId]?.colors) {
      console.error(`Color scheme with key "${schemeId}" not found.`);
      clearBusyCursor(document.body);
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
