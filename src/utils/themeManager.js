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

export function setTheme(themeKey) {
  applyBusyCursor(document.body);
  const dialog = ShowDialogWindow({
    title: "Theme",
    text: "Applying theme...",
    modal: true,
    buttons: [],
  });

  setTimeout(() => {
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

    dialog.close();
    clearBusyCursor(document.body);
  }, 50);
}
