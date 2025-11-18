import { getItem, setItem, LOCAL_STORAGE_KEYS } from './localStorage.js';

const COLOR_MODES = {
  'true': {
    name: 'True Color (24-bit)',
    filter: '',
  },
  'high': {
    name: 'High Color (16-bit)',
    filter: `contrast(1.1) url('data:image/svg+xml,<svg xmlns="http://www.w3.org/2000/svg"><filter id="posterize"><feComponentTransfer><feFuncR type="discrete" tableValues="0 0.03 0.06 0.1 0.13 0.16 0.19 0.23 0.26 0.29 0.32 0.35 0.39 0.42 0.45 0.48 0.52 0.55 0.58 0.61 0.65 0.68 0.71 0.74 0.77 0.81 0.84 0.87 0.9 0.94 0.97 1"/><feFuncG type="discrete" tableValues="0 0.016 0.032 0.048 0.063 0.079 0.095 0.111 0.127 0.143 0.159 0.175 0.19 0.206 0.222 0.238 0.254 0.27 0.286 0.302 0.317 0.333 0.349 0.365 0.381 0.397 0.413 0.429 0.444 0.460 0.476 0.492 0.508 0.524 0.540 0.556 0.571 0.587 0.603 0.619 0.635 0.651 0.667 0.683 0.698 0.714 0.730 0.746 0.762 0.778 0.794 0.810 0.825 0.841 0.857 0.873 0.889 0.905 0.921 0.937 0.952 0.968 0.984 1"/><feFuncB type="discrete" tableValues="0 0.03 0.06 0.1 0.13 0.16 0.19 0.23 0.26 0.29 0.32 0.35 0.39 0.42 0.45 0.48 0.52 0.55 0.58 0.61 0.65 0.68 0.71 0.74 0.77 0.81 0.84 0.87 0.9 0.94 0.97 1"/></feComponentTransfer></filter></svg>#posterize')`,
  },
  '256': {
    name: '256 Colors (8-bit)',
    filter: `contrast(1.15) saturate(1.1) url('data:image/svg+xml,<svg xmlns="http://www.w3.org/2000/svg"><filter id="posterize256"><feComponentTransfer><feFuncR type="discrete" tableValues="0 0.2 0.4 0.6 0.8 1"/><feFuncG type="discrete" tableValues="0 0.2 0.4 0.6 0.8 1"/><feFuncB type="discrete" tableValues="0 0.2 0.4 0.6 0.8 1"/></feComponentTransfer></filter></svg>#posterize256')`,
  },
  '16': {
    name: '16 Colors (4-bit)',
    filter: `contrast(1.2) saturate(1.2) url('data:image/svg+xml,<svg xmlns="http://www.w3.org/2000/svg"><filter id="posterize16"><feComponentTransfer><feFuncR type="discrete" tableValues="0 0.5 1"/><feFuncG type="discrete" tableValues="0 0.5 1"/><feFuncB type="discrete" tableValues="0 0.5 1"/></feComponentTransfer></filter></svg>#posterize16')`,
  },
};

let targetElement;

function applyColorMode(mode) {
  if (!targetElement || !COLOR_MODES[mode]) return;
  targetElement.style.filter = COLOR_MODES[mode].filter;
}

export function setColorMode(mode) {
  if (COLOR_MODES[mode]) {
    setItem(LOCAL_STORAGE_KEYS.COLOR_MODE, mode);
    applyColorMode(mode);
    document.dispatchEvent(new CustomEvent('color-mode-changed', { detail: { mode } }));
  }
}

export function getCurrentColorMode() {
  return getItem(LOCAL_STORAGE_KEYS.COLOR_MODE) || 'true';
}

export function getColorModes() {
    return COLOR_MODES;
}

export function initColorModeManager(element) {
  targetElement = element;
  const savedMode = getCurrentColorMode();
  applyColorMode(savedMode);
}
