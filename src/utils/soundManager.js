import { soundSchemes } from '../config/sound-schemes.js';
import sounds from '../config/sounds.js';
import { getCurrentTheme, getThemes } from './themeManager.js';

/**
 * Plays a sound based on the given event name and the current theme's sound scheme.
 * @param {string} eventName - The name of the sound event to play.
 */
export function playSound(eventName) {
  const themeId = getCurrentTheme();
  const themes = getThemes();
  const themeName = themes[themeId] || 'Default';
  const currentScheme = soundSchemes[themeName];

  if (!currentScheme) {
    return;
  }

  const soundFileName = currentScheme[eventName];
  if (!soundFileName) {
    return;
  }

  const soundId = soundFileName
    .toLowerCase()
    .replace('.wav', '')
    .replace(/\s/g, '_');

  if (sounds[soundId]) {
    const audio = new Audio(sounds[soundId]);
    audio.play().catch(e => console.error('Error playing sound:', e));
  }
}
