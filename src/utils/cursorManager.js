import { convertAniBinaryToCSS } from "ani-cursor";
import { cursors } from "../config/cursors.js";

const styleMap = new Map();

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
    cursors.insideYourComputer,
  ),
  sports: createCursorTheme("sports", cursors.sports),
};

const allCursorProperties = Object.keys(
  cursorThemes[Object.keys(cursorThemes)[0]],
);
let currentTheme = "default";

export async function applyAniCursor(theme, cursorType) {
  const themeKeyMap = {
    default: "default",
    "60s-usa": "usa60s",
    "dangerous-creatures": "dangerousCreatures",
    "inside-your-computer": "insideYourComputer",
    sports: "sports",
    // Add other theme mappings here
  };
  const themeKey = themeKeyMap[theme] || themeKeyMap.default || theme;
  const cursorUrl = cursors[themeKey]?.[cursorType];

  if (!cursorUrl) {
    console.warn(
      `Animated cursor not found for theme: ${theme}, type: ${cursorType}`,
    );
    return;
  }

  try {
    const response = await fetch(cursorUrl);
    const data = new Uint8Array(await response.arrayBuffer());

    // Use a unique ID for the style element to manage it easily
    const styleId = `ani-cursor-style-${theme}-${cursorType}`;
    let style = document.getElementById(styleId);

    if (!style) {
      style = document.createElement("style");
      style.id = styleId;
      document.head.appendChild(style);
    }

    style.innerText = convertAniBinaryToCSS(`.cursor-${cursorType}`, data);
    styleMap.set(`.cursor-${cursorType}`, style);
    console.log(
      "Animated cursor applied successfully, theme:",
      theme,
      "type:",
      cursorType,
    );
  } catch (error) {
    console.error("Failed to apply animated cursor:", error);
  }
}

export function clearAniCursor() {
  for (const [selector, style] of styleMap.entries()) {
    if (style && style.parentNode) {
      style.parentNode.removeChild(style);
    }
    styleMap.delete(selector);
    // Also reset the cursor property on the element
    // document.querySelector(selector).style.cursor = '';
  }
}

/**
 * Applies a busy/wait cursor to a specific element.
 * @param {HTMLElement} [element=document.body] - The element to apply the cursor to.
 */
export function applyBusyCursor(element = document.body) {
  element.classList.add("cursor-busy");
  element.style.cursor = "var(--cursor-wait, wait)";
}

/**
 * Clears the busy/wait cursor from a specific element.
 * @param {HTMLElement} [element=document.body] - The element to clear the cursor from.
 */
export function clearBusyCursor(element = document.body) {
  // Use a short timeout to prevent the cursor from reverting too quickly,
  // ensuring the browser has time to render the change.
  setTimeout(() => {
    element.classList.remove("cursor-busy");
    // Revert to the default cursor for the body, or let other elements inherit.
    if (element === document.body) {
      element.style.cursor = "var(--cursor-default, default)";
    } else {
      element.style.cursor = "";
    }
  }, 50);
}

/**
 * Applies a wait/progress cursor to a specific element.
 * @param {HTMLElement} [element=document.body] - The element to apply the cursor to.
 */
export function applyWaitCursor(element = document.body) {
  element.classList.add("cursor-wait");
  element.style.cursor = "var(--cursor-progress, progress)";
}

/**
 * Clears the wait/progress cursor from a specific element.
 * @param {HTMLElement} [element=document.body] - The element to clear the cursor from.
 */
export function clearWaitCursor(element = document.body) {
  setTimeout(() => {
    element.classList.remove("cursor-wait");
    if (element === document.body) {
      element.style.cursor = "var(--cursor-default, default)";
    } else {
      element.style.cursor = "";
    }
  }, 50);
}

export function applyCursor(theme) {
  currentTheme = theme;
  const root = document.documentElement;
  let themeConfig = cursorThemes[theme];
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
