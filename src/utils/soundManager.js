import { soundSchemes } from "../config/sound-schemes.js";
import { getCurrentTheme, getThemes } from "./themeManager.js";

/**
 * Plays a sound based on the given event name and the current theme's sound scheme.
 * @param {string} eventName - The name of the sound event to play.
 */
export function playSound(eventName) {
  const themeId = getCurrentTheme();
  const themes = getThemes();
  const themeName = themes[themeId]?.name || "Default";
  const currentScheme = soundSchemes[themeName];
  const defaultScheme = soundSchemes["Default"];

  // Determine the sound file url with fallbacks
  const soundUrl =
    (currentScheme && currentScheme[eventName]) ||
    (defaultScheme && defaultScheme[eventName]);

  // If no sound was found after all checks, exit.
  if (!soundUrl) {
    return;
  }

  const audio = new Audio(soundUrl);
  audio.play().catch((e) => console.error("Error playing sound:", e));
}
