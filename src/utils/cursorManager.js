
import { cursorThemes } from '../config/cursors.js';
import { applyAniCursor, clearAniCursor } from './aniCursor.js';

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
