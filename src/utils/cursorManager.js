
import { cursors } from '../config/cursors.js';

const cursorThemes = {
    'dangerous-creatures': {
        '--cursor-default': `url(${cursors.dangerousCreatures.arrow}), auto`,
        '--cursor-pointer': `url(${cursors.dangerousCreatures.arrow}), pointer`,
        '--cursor-text': `url(${cursors.dangerousCreatures.beam}), text`,
        '--cursor-wait': `url(${cursors.dangerousCreatures.busy}), wait`,
        '--cursor-help': `url(${cursors.dangerousCreatures.help}), help`,
        '--cursor-move': `url(${cursors.dangerousCreatures.move}), move`,
        '--cursor-not-allowed': `url(${cursors.dangerousCreatures.no}), not-allowed`,
        '--cursor-crosshair': `url(${cursors.dangerousCreatures.cross}), crosshair`,
        '--cursor-nesw-resize': `url(${cursors.dangerousCreatures.sizeNESW}), nesw-resize`,
        '--cursor-ns-resize': `url(${cursors.dangerousCreatures.sizeNS}), ns-resize`,
        '--cursor-nwse-resize': `url(${cursors.dangerousCreatures.sizeNWSE}), nwse-resize`,
        '--cursor-we-resize': `url(${cursors.dangerousCreatures.sizeWE}), we-resize`,
    },
    '60s-usa': {
        '--cursor-default': `url(${cursors.usa60s.arrow}), auto`,
        '--cursor-pointer': `url(${cursors.usa60s.arrow}), pointer`,
        '--cursor-text': `url(${cursors.usa60s.beam}), text`,
        '--cursor-wait': `url(${cursors.usa60s.busy}), wait`,
        '--cursor-help': `url(${cursors.usa60s.help}), help`,
        '--cursor-move': `url(${cursors.usa60s.move}), move`,
        '--cursor-not-allowed': `url(${cursors.usa60s.no}), not-allowed`,
        '--cursor-crosshair': `url(${cursors.usa60s.cross}), crosshair`,
        '--cursor-nesw-resize': `url(${cursors.usa60s.sizeNESW}), nesw-resize`,
        '--cursor-ns-resize': `url(${cursors.usa60s.sizeNS}), ns-resize`,
        '--cursor-nwse-resize': `url(${cursors.usa60s.sizeNWSE}), nwse-resize`,
        '--cursor-we-resize': `url(${cursors.usa60s.sizeWE}), we-resize`,
    },
};

const allCursorProperties = Object.keys(cursorThemes[Object.keys(cursorThemes)[0]]);

export function applyCursor(theme) {
    const root = document.documentElement;
    const cursorTheme = cursorThemes[theme];

    if (cursorTheme) {
        for (const [property, value] of Object.entries(cursorTheme)) {
            root.style.setProperty(property, value);
        }
    } else {
        for (const property of allCursorProperties) {
            root.style.removeProperty(property);
        }
    }
}
