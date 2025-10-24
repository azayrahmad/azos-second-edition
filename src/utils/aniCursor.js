import { convertAniBinaryToCSS } from 'ani-cursor';
import { cursors, cursorThemes } from '../config/cursors';
import { getCurrentTheme } from './themeManager.js';

const styleMap = new Map();

export async function applyAniCursor(theme, cursorType) {
  const themeKeyMap = {
    '60s-usa': 'usa60s',
    'dangerous-creatures': 'dangerousCreatures',
    // Add other theme mappings here
  };
  const themeKey = themeKeyMap[theme] || theme;
  const cursorUrl = cursors[themeKey]?.[cursorType];

  if (!cursorUrl) {
    console.warn(`Animated cursor not found for theme: ${theme}, type: ${cursorType}`);
    return;
  }

  // Remove any existing animated cursor style
  clearAniCursor();

  try {
    const response = await fetch(cursorUrl);
    const data = new Uint8Array(await response.arrayBuffer());

    // Use a unique ID for the style element to manage it easily
    const styleId = `ani-cursor-style-${theme}-${cursorType}`;
    let style = document.getElementById(styleId);

    if (!style) {
        style = document.createElement('style');
        style.id = styleId;
        document.head.appendChild(style);
    }

    style.innerText = convertAniBinaryToCSS('body', data);
    styleMap.set('body', style);

  } catch (error) {
    console.error('Failed to apply animated cursor:', error);
  }
}

export function clearAniCursor() {
    for (const [selector, style] of styleMap.entries()) {
        if (style && style.parentNode) {
            style.parentNode.removeChild(style);
        }
        styleMap.delete(selector);
        // Also reset the cursor property on the element
        document.querySelector(selector).style.cursor = '';
    }
}

export function applyBusyCursor() {
    const theme = getCurrentTheme();
    const themeConfig = cursorThemes[theme];

    if (themeConfig && themeConfig['--cursor-wait']?.animated) {
        applyAniCursor(theme, themeConfig['--cursor-wait'].type);
    } else {
        document.body.style.cursor = 'wait';
    }
}

export function clearBusyCursor() {
    const theme = getCurrentTheme();
    const themeConfig = cursorThemes[theme];

    if (themeConfig && themeConfig['--cursor-wait']?.animated) {
        clearAniCursor();
    } else {
        document.body.style.cursor = '';
    }
}
