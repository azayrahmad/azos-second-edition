import { convertAniBinaryToCSS } from 'ani-cursor';
import { cursors } from '../config/cursors';

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

    style.innerText = convertAniBinaryToCSS(`.cursor-${cursorType}`, data);
    styleMap.set(`.cursor-${cursorType}`, style);
    console.log('Animated cursor applied successfully, theme:', theme, 'type:', cursorType);

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
        // document.querySelector(selector).style.cursor = '';
    }
}

/**
 * Applies a busy/wait cursor to a specific element.
 * @param {HTMLElement} [element=document.body] - The element to apply the cursor to.
 */
export function applyBusyCursor(element = document.body) {
  element.classList.add('cursor-busy');
  element.style.cursor = 'var(--cursor-wait, wait)';
}

/**
 * Clears the busy/wait cursor from a specific element.
 * @param {HTMLElement} [element=document.body] - The element to clear the cursor from.
 */
export function clearBusyCursor(element = document.body) {
  // Use a short timeout to prevent the cursor from reverting too quickly,
  // ensuring the browser has time to render the change.
  setTimeout(() => {
    element.classList.remove('cursor-busy');
    // Revert to the default cursor for the body, or let other elements inherit.
    if (element === document.body) {
      element.style.cursor = 'var(--cursor-default, default)';
    } else {
      element.style.cursor = '';
    }
  }, 50);
}

/**
 * Applies a wait/progress cursor to a specific element.
 * @param {HTMLElement} [element=document.body] - The element to apply the cursor to.
 */
export function applyWaitCursor(element = document.body) {
  element.classList.add('cursor-wait');
  element.style.cursor = 'var(--cursor-progress, progress)';
}

/**
 * Clears the wait/progress cursor from a specific element.
 * @param {HTMLElement} [element=document.body] - The element to clear the cursor from.
 */
export function clearWaitCursor(element = document.body) {
  setTimeout(() => {
    element.classList.remove('cursor-wait');
    if (element === document.body) {
      element.style.cursor = 'var(--cursor-default, default)';
    } else {
      element.style.cursor = '';
    }
  }, 50);
}
