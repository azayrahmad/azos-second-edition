import { Application } from '../Application.js';
import { ICONS } from '../../config/icons.js';
import * as themeManager from '../../utils/themeManager.js';
import { themes } from '../../config/themes.js';
import { cursors } from '../../config/cursors.js';
import { parseICO } from 'icojs';
import { convertAniBinaryToCSS } from 'ani-cursor';

export class MousePointersApp extends Application {
    _createWindow() {
        const win = new $Window({
            title: this.title,
            outerWidth: this.width,
            outerHeight: this.height,
            resizable: this.resizable,
            minimizeButton: this.minimizeButton,
            maximizeButton: this.maximizeButton,
            icons: this.icon,
        });

        this._onOpen(win);

        return win;
    }

    _onOpen(win) {
        win.$content.html(`
            <div class="mopo-app" style="padding: 10px; display: flex; flex-direction: column; height: 100%;">
                <div class="field-row" style="margin-bottom: 10px; display: flex; align-items: center;">
                    <label for="theme-select" style="margin-right: 5px;">Scheme:</label>
                    <select id="theme-select" style="flex-grow: 1;"></select>
                </div>
                <div class="cursor-list" style="flex-grow: 1; border: 1px solid var(--button-shadow); background-color: var(--canvas-color, #fff); overflow-y: scroll; padding: 2px;"></div>
            </div>
        `);

        this.select = win.$content.find('#theme-select')[0];
        this.cursorList = win.$content.find('.cursor-list')[0];
        this.win = win;

        this._populateThemes();
        this._setDefaultTheme();

        this.select.addEventListener('change', () => this._loadCursors(this.select.value));
    }

    _populateThemes() {
        for (const [id, theme] of Object.entries(themes)) {
            if (theme.cursorScheme) {
                const option = document.createElement('option');
                option.value = id;
                option.textContent = theme.name;
                this.select.appendChild(option);
            }
        }
    }

    _setDefaultTheme() {
        const currentThemeKey = themeManager.getCurrentTheme();
        this.select.value = currentThemeKey;
        this._loadCursors(currentThemeKey);
    }

    async _loadCursors(themeId) {
        this.cursorList.innerHTML = 'Loading...';
        const theme = themes[themeId];
        const cursorSchemeId = theme.cursorScheme;
        const cursorSet = cursors[cursorSchemeId];

        if (!cursorSet) {
            this.cursorList.innerHTML = 'This theme has no cursor scheme.';
            return;
        }

        const cursorPromises = Object.entries(cursorSet).map(async ([name, path]) => {
            try {
                const response = await fetch(path);
                if (!response.ok) return { name, error: 'Failed to load' };
                const buffer = await response.arrayBuffer();
                return { name, path, buffer };
            } catch (error) {
                return { name, error: error.message };
            }
        });

        const results = await Promise.all(cursorPromises);
        this.cursorList.innerHTML = '';

        let styleSheetContent = '';
        const styleSheet = document.createElement('style');
        document.head.appendChild(styleSheet);
        this.win.on('closed', () => styleSheet.remove());

        for (const cursor of results) {
            const item = document.createElement('div');
            item.style.display = 'flex';
            item.style.alignItems = 'center';
            item.style.padding = '2px';

            const preview = document.createElement('div');
            preview.style.width = '32px';
            preview.style.height = '32px';
            preview.style.border = '1px solid var(--button-shadow)';
            preview.style.display = 'flex';
            preview.style.alignItems = 'center';
            preview.style.justifyContent = 'center';
            preview.style.backgroundColor = 'var(--canvas-color, #fff)';

            const nameEl = document.createElement('span');
            nameEl.textContent = cursor.name;
            nameEl.style.marginLeft = '8px';

            if (cursor.buffer) {
                const byteArray = new Uint8Array(cursor.buffer);
                if (cursor.path.endsWith('.cur')) {
                    try {
                        const images = await parseICO(cursor.buffer, 'image/png');
                        if (images.length > 0) {
                            const img = document.createElement('img');
                            const blob = new Blob([images[0].buffer], { type: 'image/png' });
                            img.src = URL.createObjectURL(blob);
                            preview.appendChild(img);
                        }
                    } catch (e) {
                        console.error('Failed to process .cur file', cursor.name, e);
                        nameEl.textContent += ' (load error)';
                    }
                } else if (cursor.path.endsWith('.ani')) {
                    try {
                        const safeClassName = `cursor-preview-${themeId}-${cursor.name.replace(/\s+/g, '-')}`;
                        const css = convertAniBinaryToCSS(byteArray);
                        styleSheetContent += css.replace(':root', `.${safeClassName}`);
                        item.classList.add(safeClassName);
                        preview.innerHTML = `<span style="font-size: 10px; color: var(--button-text-light);">Hover</span>`;
                    } catch (e) {
                         console.error('Failed to process .ani file', cursor.name, e);
                         nameEl.textContent += ' (load error)';
                    }
                }
            } else {
                 nameEl.textContent += ` (${cursor.error || 'error'})`;
            }

            item.appendChild(preview);
            item.appendChild(nameEl);
            this.cursorList.append(item);
        }
        styleSheet.innerHTML = styleSheetContent;
    }
}
