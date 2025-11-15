import { getItem, setItem, LOCAL_STORAGE_KEYS } from "./localStorage.js";
import { themes } from "../config/themes.js";
import {
  applyCursorTheme,
  applyBusyCursor,
  clearBusyCursor,
} from "./cursorManager.js";
import { preloadThemeAssets } from "./assetPreloader.js";

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
export function getActiveTheme() {
  if (activeTheme) {
    return activeTheme;
  }

  let savedTheme = getItem(LOCAL_STORAGE_KEYS.ACTIVE_THEME);
  if (!savedTheme || typeof savedTheme.id !== "string") {
    console.warn(
      "Active theme not found or invalid in localStorage, falling back to default.",
    );
    savedTheme = themes.default;
    setItem(LOCAL_STORAGE_KEYS.ACTIVE_THEME, savedTheme);
  }

  activeTheme = savedTheme;
  return activeTheme;
}

// Gets the ID of the current theme for components that need it.
export function getCurrentTheme() {
  return getActiveTheme().id;
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
  const currentTheme = getActiveTheme();

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
  if (!currentTheme) {
    console.error("No active theme found. Applying default cursor.");
    applyCursorTheme("default");
    return;
  }

  applyCursorTheme(currentTheme.id);

  if (currentTheme.stylesheet && themes[currentTheme.id]) {
    // It's a built-in theme, enable its stylesheet.
    const stylesheet = document.getElementById(`${currentTheme.id}-theme`);
    if (stylesheet) {
      stylesheet.disabled = false;
    }
  } else if (currentTheme.colors) {
    // It's a custom or temporary theme, so generate and apply its CSS.
    await loadThemeParser();
    if (window.makeThemeCSSFile) {
      const cssContent = window.makeThemeCSSFile(currentTheme.colors);
      // Use 'custom' id for the temporary theme from the app, otherwise the theme's own id.
      const styleId =
        currentTheme.id === "custom" ? "custom" : currentTheme.id;
      applyStylesheet(styleId, cssContent);
    }
  }
}

export async function setTheme(themeKey, themeObject = null) {
  applyBusyCursor(document.body);
  try {
    const allThemes = getThemes();
    const newTheme = themeObject || allThemes[themeKey];

    if (!newTheme) {
      console.error(`Theme with key "${themeKey}" not found.`);
      clearBusyCursor(document.body);
      return;
    }

    activeTheme = newTheme; // Update in-memory cache
    setItem(LOCAL_STORAGE_KEYS.ACTIVE_THEME, newTheme);

    await preloadThemeAssets(themeKey);
    await applyTheme();

    document.dispatchEvent(new CustomEvent("wallpaper-changed"));
    document.dispatchEvent(new CustomEvent("theme-changed"));
  } finally {
    clearBusyCursor(document.body);
  }
}

function getThemeCSSProperties(element) {
  const keys = [
    "--checker",
    "--button-active-border-image",
    "--button-normal-border-image",
    "--inset-deep-border-image",
    "--button-default-border-image",
    "--button-default-active-border-image",
    "--scrollbar-arrows-ButtonText",
    "--scrollbar-arrows-GrayText",
    "--scrollbar-arrows-ButtonHilight",
    "--scrollbar-size",
    "--scrollbar-button-inner-size",
    "--ActiveBorder",
    "--ActiveTitle",
    "--AppWorkspace",
    "--Background",
    "--ButtonAlternateFace",
    "--ButtonDkShadow",
    "--ButtonFace",
    "--ButtonHilight",
    "--ButtonLight",
    "--ButtonShadow",
    "--ButtonText",
    "--GradientActiveTitle",
    "--GradientInactiveTitle",
    "--GrayText",
    "--Hilight",
    "--HilightText",
    "--HotTrackingColor",
    "--InactiveBorder",
    "--InactiveTitle",
    "--InactiveTitleText",
    "--InfoText",
    "--InfoWindow",
    "--Menu",
    "--MenuText",
    "--Scrollbar",
    "--TitleText",
    "--Window",
    "--WindowFrame",
    "--WindowText",
  ];
  const style = window.getComputedStyle(element);
  const result = {};
  for (const key of keys) {
    result[key] = style.getPropertyValue(key);
  }
  return result;
}

function applyCSSProperties(cssProperties, options = {}) {
  let element;
  let recurseIntoIframes;
  if ("tagName" in options) {
    element = options;
    recurseIntoIframes = false;
  } else {
    ({ element = document.documentElement, recurseIntoIframes = false } =
      options);
  }

  var getProp = (propName) =>
    typeof cssProperties.getPropertyValue === "function"
      ? cssProperties.getPropertyValue(propName)
      : cssProperties[propName];
  for (var k in cssProperties) {
    element.style.setProperty(k, getProp(k));
  }
  if (recurseIntoIframes) {
    var iframes = element.querySelectorAll("iframe");
    for (var i = 0; i < iframes.length; i++) {
      try {
        applyCSSProperties(cssProperties, {
          element: iframes[i].contentDocument?.documentElement,
          recurseIntoIframes: true,
        });
      } catch (error) {
        // ignore
      }
    }
  }
}

export function inheritTheme(target, source) {
  applyCSSProperties(getThemeCSSProperties(source), {
    element: target,
    recurseIntoIframes: true,
  });
}
