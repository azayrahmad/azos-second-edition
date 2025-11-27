import { soundSchemes } from "../config/sound-schemes.js";
import { getSoundSchemeName } from "./themeManager.js";

/**
 * Plays a sound based on the given event name and the current sound scheme.
 * @param {string} eventName - The name of the sound event to play.
 */
export function playSound(eventName) {
  const schemeName = getSoundSchemeName();
  const currentScheme = soundSchemes[schemeName];
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
