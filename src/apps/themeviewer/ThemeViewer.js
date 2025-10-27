import { Application } from '../Application.js';
import { getThemes, setTheme, getCurrentTheme } from '../../utils/themeManager.js';
import './themeviewer.css';

export class ThemeViewer extends Application {
    constructor(config) {
        super(config);
        this.themes = {};
        this.selectedThemeId = null;
        this.previewContainer = null;
        this.themeSelector = null;
    }

    _createWindow() {
        const win = new $Window({
            id: this.id,
            title: this.title,
            width: 400,
            height: 500,
            resizable: false,
            icons: this.icon,
        });

        win.$content.html(`
            <div class="theme-viewer-container">
                <div class="preview-section"></div>
                <div class="controls-section">
                    <label for="theme-select">Theme:</label>
                    <select id="theme-select"></select>
                </div>
                <div class="button-bar">
                    <button class="ok-btn">OK</button>
                    <button class="cancel-btn">Cancel</button>
                    <button class="apply-btn">Apply</button>
                </div>
            </div>
        `);
        return win;
    }

    async _onLaunch() {
        this.previewContainer = this.win.$content.find('.preview-section')[0];
        this.themeSelector = this.win.$content.find('#theme-select')[0];
        const buttonBar = this.win.$content.find('.button-bar')[0];

        await this.loadThemes();
        this.populateThemeSelector();
        this.updatePreview(this.selectedThemeId);

        // Event Listeners
        this.themeSelector.addEventListener('change', (e) => {
            this.selectedThemeId = e.target.value;
            this.updatePreview(this.selectedThemeId);
        });

        buttonBar.addEventListener('click', (e) => {
            if (e.target.classList.contains('ok-btn')) {
                setTheme(this.selectedThemeId);
                this.win.close();
            } else if (e.target.classList.contains('cancel-btn')) {
                this.win.close();
            } else if (e.target.classList.contains('apply-btn')) {
                setTheme(this.selectedThemeId);
            }
        });
    }

    async loadThemes() {
        const themeList = getThemes();
        const themePromises = Object.entries(themeList).map(async ([themeId, themeName]) => {
            if (themeId === 'default') return null;

            const cssPath = `os-gui/${themeId}.css`;
            try {
                const response = await fetch(cssPath);
                if (!response.ok) {
                    throw new Error(`HTTP error! status: ${response.status}`);
                }
                const css = await response.text();
                const colors = this.parseThemeColors(css);
                return { themeId, themeName, colors };
            } catch (error) {
                console.error(`Failed to load theme CSS for '${themeName}' from '${cssPath}':`, error);
                return null;
            }
        });

        const loadedThemes = await Promise.all(themePromises);

        for (const themeData of loadedThemes) {
            if (themeData) {
                this.themes[themeData.themeId] = { name: themeData.themeName, colors: themeData.colors };
            }
        }
    }

    parseThemeColors(css) {
        const colors = {};
        const rootRegex = /:root\s*\{([^}]+)\}/;
        const rootMatch = css.match(rootRegex);

        if (rootMatch) {
            const colorRegex = /--([\w-]+)\s*:\s*([^;]+);/g;
            let match;
            while ((match = colorRegex.exec(rootMatch[1])) !== null) {
                const key = match[1];
                const value = match[2].trim();
                colors[key] = value;
            }
        }
        return colors;
    }

    populateThemeSelector() {
        const currentThemeId = getCurrentTheme();
        this.selectedThemeId = currentThemeId;

        for (const themeId in this.themes) {
            const option = document.createElement('option');
            option.value = themeId;
            option.textContent = this.themes[themeId].name;
            if (themeId === currentThemeId) {
                option.selected = true;
            }
            this.themeSelector.appendChild(option);
        }
    }

    updatePreview(themeId) {
        const theme = this.themes[themeId];
        if (!theme) {
            this.previewContainer.innerHTML = '<p>Theme not found.</p>';
            return;
        }

        let activeStyle = '';
        for (const [key, value] of Object.entries(theme.colors)) {
            activeStyle += `--preview-${key}: ${value};\n`;
        }

        let inactiveStyle = activeStyle;
        inactiveStyle += `--preview-ActiveTitle: ${theme.colors['InactiveTitle'] || '#808080'};\n`;
        inactiveStyle += `--preview-GradientActiveTitle: ${theme.colors['GradientInactiveTitle'] || '#c0c0c0'};\n`;
        inactiveStyle += `--preview-TitleText: ${theme.colors['InactiveTitleText'] || '#c0c0c0'};\n`;

        this.previewContainer.innerHTML = `
            <div class="cascading-windows-container">
                <div class="static-window-preview inactive" style="${inactiveStyle}">
                    <div class="window-titlebar">
                        <span class="window-title">Inactive Window</span>
                    </div>
                </div>
                <div class="static-window-preview active" style="${activeStyle}">
                    <div class="window-titlebar">
                        <span class="window-title">Active Window</span>
                        <div class="window-buttons">
                            <button class="window-button window-minimize-button"><span class="window-button-icon"></span></button>
                            <button class="window-button window-maximize-button"><span class="window-button-icon"></span></button>
                            <button class="window-button window-close-button"><span class="window-button-icon"></span></button>
                        </div>
                    </div>
                    <div class="window-content">
                        <p>Window Text</p>
                        <button>Button</button>
                    </div>
                </div>
            </div>
        `;
    }
}
