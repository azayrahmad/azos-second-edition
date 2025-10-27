
import { cursors } from '../config/cursors.js';
import { applyAniCursor, clearAniCursor } from './aniCursor.js';

const cursorThemes = {
  'dangerous-creatures': {
    '--cursor-default': { value: `url(${cursors.dangerousCreatures.arrow}), auto` },
    '--cursor-pointer': { value: `url(${cursors.dangerousCreatures.arrow}), pointer` },
    '--cursor-text': { value: `url(${cursors.dangerousCreatures.beam}), text` },
    '--cursor-wait': { value: 'wait', animated: true, type: 'busy' },
    '--cursor-progress': { value: "progress", animated: true, type: "wait" },
    '--cursor-help': { value: `url(${cursors.dangerousCreatures.help}), help` },
    '--cursor-move': { value: `url(${cursors.dangerousCreatures.move}), move` },
    '--cursor-not-allowed': { value: `url(${cursors.dangerousCreatures.no}), not-allowed` },
    '--cursor-crosshair': { value: `url(${cursors.dangerousCreatures.cross}), crosshair` },
    '--cursor-nesw-resize': { value: `url(${cursors.dangerousCreatures.sizeNESW}), nesw-resize` },
    '--cursor-ns-resize': { value: `url(${cursors.dangerousCreatures.sizeNS}), ns-resize` },
    '--cursor-nwse-resize': { value: `url(${cursors.dangerousCreatures.sizeNWSE}), nwse-resize` },
    '--cursor-we-resize': { value: `url(${cursors.dangerousCreatures.sizeWE}), ew-resize` },
  },
  '60s-usa': {
    '--cursor-default': { value: `url(${cursors.usa60s.arrow}), auto` },
    '--cursor-pointer': { value: `url(${cursors.usa60s.arrow}), pointer` },
    '--cursor-text': { value: `url(${cursors.usa60s.beam}), text` },
    '--cursor-wait': { value: 'wait', animated: true, type: 'busy' },
    '--cursor-progress': { value: "progress", animated: true, type: "wait" },
    '--cursor-help': { value: `url(${cursors.usa60s.help}), help` },
    '--cursor-move': { value: `url(${cursors.usa60s.move}), move` },
    '--cursor-not-allowed': { value: `url(${cursors.usa60s.no}), not-allowed` },
    '--cursor-crosshair': { value: `url(${cursors.usa60s.cross}), crosshair` },
    '--cursor-nesw-resize': { value: `url(${cursors.usa60s.sizeNESW}), nesw-resize` },
    '--cursor-ns-resize': { value: `url(${cursors.usa60s.sizeNS}), ns-resize` },
    '--cursor-nwse-resize': { value: `url(${cursors.usa60s.sizeNWSE}), nwse-resize` },
    '--cursor-we-resize': { value: `url(${cursors.usa60s.sizeWE}), ew-resize` },
  },
};

const allCursorProperties = Object.keys(cursorThemes[Object.keys(cursorThemes)[0]]);
let currentTheme = 'default';

export function applyCursor(theme) {
  currentTheme = theme;
  const root = document.documentElement;
  const themeConfig = cursorThemes[theme];

  clearAniCursor();

  if (themeConfig) {
    for (const [property, config] of Object.entries(themeConfig)) {
      if (config.animated) {
        applyAniCursor(theme, config.type);
      } else {
        root.style.setProperty(property, config.value);
      }
    }
  } else {
    for (const property of allCursorProperties) {
      root.style.removeProperty(property);
    }
  }
}
