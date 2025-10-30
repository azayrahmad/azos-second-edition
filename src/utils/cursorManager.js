import { themes } from "../config/themes.js";
import { cursorSchemes } from "../config/cursor-schemes.js";
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

const allCursorProperties = Object.keys(
  createCursorTheme("default", cursorSchemes.Default),
);
let currentTheme = "default";

export function applyCursor(themeKey) {
  currentTheme = themeKey;
  const root = document.documentElement;
  const theme = themes[themeKey] || themes.default;
  const cursorSchemeName = theme.cursorScheme || "Default";
  const cursorSet = cursorSchemes[cursorSchemeName] || cursorSchemes.Default;
  const themeConfig = createCursorTheme(cursorSchemeName, cursorSet);

  clearAniCursor();

  if (themeConfig) {
    for (const [property, config] of Object.entries(themeConfig)) {
      if (config.animated) {
        applyAniCursor(themeKey, config.type);
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
