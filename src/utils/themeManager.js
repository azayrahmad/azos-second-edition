import { getItem, setItem, LOCAL_STORAGE_KEYS } from "./localStorage.js";

const themes = {
    default: 'Default',
    'peggys-pastels': "Peggy's Pastels",
    blue: 'Blue',
    '60s-usa': '60s USA',
    'dangerous-creatures': 'Dangerous Creatures',
};

const themeIds = Object.keys(themes).filter(key => key !== 'default').map(key => `${key}-theme`);

export function getThemes() {
    return themes;
}

export function getCurrentTheme() {
    return getItem(LOCAL_STORAGE_KEYS.DESKTOP_THEME) || 'default';
}

import { applyCursor } from './cursorManager.js';

export function applyTheme() {
    applyCursor(getCurrentTheme());
    const savedTheme = getCurrentTheme();

    themeIds.forEach(id => {
        const stylesheet = document.getElementById(id);
        if (stylesheet) {
            stylesheet.disabled = (stylesheet.id !== `${savedTheme}-theme`);
        }
    });
}

export function setTheme(theme) {
    setItem(LOCAL_STORAGE_KEYS.DESKTOP_THEME, theme);
    applyTheme();
    document.dispatchEvent(new CustomEvent('theme-changed'));
}