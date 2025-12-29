// src/utils/doomFileManager.js

import { getItem, setItem } from './localStorage.js';

const DOOM_SAVE_PREFIX = 'doom_save_';

/**
 * Gets all Doom-related files from localStorage.
 * @returns {Array<Object>} An array of file objects.
 */
export function getDoomFiles() {
  const files = [];
  const saveGames = getDoomSaveGames();
  const config = getDoomConfig();

  files.push(...saveGames);
  if (config) {
    files.push(config);
  }

  return files;
}

/**
 * Gets all Doom save games from localStorage.
 * @returns {Array<Object>} An array of save game file objects.
 */
function getDoomSaveGames() {
  const saveGames = [];
  for (let i = 0; i < localStorage.length; i++) {
    const key = localStorage.key(i);
    if (key.startsWith(DOOM_SAVE_PREFIX)) {
      const filename = key.substring(DOOM_SAVE_PREFIX.length);
      const content = getItem(key);
      saveGames.push({
        id: `file-doom-save-${filename}`,
        name: filename,
        type: 'file',
        content: atob(content), // Decode base64 content
        readOnly: true,
      });
    }
  }
  return saveGames;
}

/**
 * Gets the Doom default.cfg file from localStorage.
 * @returns {Object|null} The config file object or null if not found.
 */
function getDoomConfig() {
  const key = `${DOOM_SAVE_PREFIX}default.cfg`;
  const content = getItem(key);
  if (content) {
    const file = {
      id: 'file-doom-config',
      name: 'default.cfg',
      type: 'file',
      content: atob(content),
      action: (win, file) => {
        // This is a custom action to open the file in Notepad
        window.System.launchApp('notepad', {
          file,
          onSave: (newContent) => {
            updateDoomConfig(newContent);
          },
        });
      },
    };
    return file;
  }
  return null;
}

/**
 * Updates the Doom default.cfg file in localStorage.
 * @param {string} content The new content of the file.
 */
export function updateDoomConfig(content) {
  const key = `${DOOM_SAVE_PREFIX}default.cfg`;
  const encodedContent = btoa(content);
  setItem(key, encodedContent);
}
