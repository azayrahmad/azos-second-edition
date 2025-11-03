import { getCurrentTheme } from "./themeManager.js";
import { themes } from "../config/themes.js";
import { iconSchemes } from "../config/icon-schemes.js";

/**
 * Retrieves the icon for a given identifier, considering the current theme.
 * Falls back to the default theme's icon if the current theme has no specific icon.
 *
 * @param {string} iconIdentifier - The identifier for the icon (e.g., "myComputer").
 * @returns {object} The icon object with 16 and 32 pixel versions, or null if not found.
 */
export function getIcon(iconIdentifier) {
  const currentThemeId = getCurrentTheme();
  const currentTheme = themes[currentThemeId];
  const iconSchemeId = currentTheme?.iconScheme || "default";

  // 1. Try to get the icon from the current theme's scheme
  const scheme = iconSchemes[iconSchemeId] || iconSchemes["default"];

  return scheme[iconIdentifier] || null;
}
