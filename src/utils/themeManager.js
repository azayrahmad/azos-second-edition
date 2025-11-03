import {
  getItem,
  setItem,
  removeItem,
  LOCAL_STORAGE_KEYS,
} from "./localStorage.js";
import { themes } from "../config/themes.js";
import { ShowDialogWindow } from "../components/DialogWindow.js";
import { applyBusyCursor, clearBusyCursor } from "./cursorManager.js";
import { applyCursorTheme } from "./cursorManager.js";
import { preloadThemeAssets } from "./assetPreloader.js";

export function getThemes() {
  return themes;
}

export function getCurrentTheme() {
  return getItem(LOCAL_STORAGE_KEYS.DESKTOP_THEME) || "default";
}

export function applyTheme() {
  const savedThemeKey = getCurrentTheme();
  applyCursorTheme(savedThemeKey);

  Object.values(themes).forEach((theme) => {
    if (theme.id === "default") return;

    const stylesheet = document.getElementById(`${theme.id}-theme`);
    if (stylesheet) {
      stylesheet.disabled = theme.id !== savedThemeKey;
    }
  });
}

export async function setTheme(themeKey) {
  applyBusyCursor(document.body);

  await preloadThemeAssets(themeKey);

  // Clear any temporary theme styles from the Theme to CSS app
  const transientStyle = document.getElementById("transient-theme-styles");
  if (transientStyle) {
    transientStyle.remove();
  }

  setItem(LOCAL_STORAGE_KEYS.DESKTOP_THEME, themeKey);
  applyTheme();

  const theme = themes[themeKey];
  if (theme && theme.wallpaper) {
    setItem(LOCAL_STORAGE_KEYS.WALLPAPER, theme.wallpaper);
  } else {
    removeItem(LOCAL_STORAGE_KEYS.WALLPAPER);
  }
  document.dispatchEvent(new CustomEvent("wallpaper-changed"));
  document.dispatchEvent(new CustomEvent("theme-changed"));

  clearBusyCursor(document.body);
}
