import { cursors } from "../config/cursors.js";
import { applyAniCursor, clearAniCursor } from "./aniCursor.js";

function createCursorTheme(themeName, cursorSet) {
  return {
    "--cursor-default": { value: `url(${cursorSet.arrow}), auto` },
    "--cursor-pointer": { value: `url(${cursorSet.arrow}), pointer` },
    "--cursor-text": { value: `url(${cursorSet.beam}), text` },
    "--cursor-wait": { value: "wait", animated: true, type: "busy" },
    "--cursor-progress": { value: "progress", animated: true, type: "wait" },
    "--cursor-help": { value: `url(${cursorSet.help}), help` },
    "--cursor-move": { value: `url(${cursorSet.move}), move` },
    "--cursor-not-allowed": { value: `url(${cursorSet.no}), not-allowed` },
    "--cursor-crosshair": { value: `url(${cursorSet.cross}), crosshair` },
    "--cursor-nesw-resize": {
      value: `url(${cursorSet.sizeNESW}), nesw-resize`,
    },
    "--cursor-ns-resize": { value: `url(${cursorSet.sizeNS}), ns-resize` },
    "--cursor-nwse-resize": {
      value: `url(${cursorSet.sizeNWSE}), nwse-resize`,
    },
    "--cursor-we-resize": { value: `url(${cursorSet.sizeWE}), ew-resize` },
  };
}

const cursorThemes = {
  default: createCursorTheme("default", cursors.default),
  "dangerous-creatures": createCursorTheme(
    "dangerous-creatures",
    cursors.dangerousCreatures,
  ),
  "60s-usa": createCursorTheme("60s-usa", cursors.usa60s),
  "inside-your-computer": createCursorTheme(
    "inside-your-computer",
    cursors.insideYourComputer)
};

const allCursorProperties = Object.keys(
  cursorThemes[Object.keys(cursorThemes)[0]],
);
let currentTheme = "default";

export function applyCursor(theme) {
  currentTheme = theme;
  const root = document.documentElement;
  var themeConfig = cursorThemes[theme];
  if (!themeConfig) themeConfig = cursorThemes.default;

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
