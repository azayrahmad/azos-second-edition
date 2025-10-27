import { Application } from '../Application.js';
import { getThemes, setTheme } from '../../utils/themeManager.js';
import './themeviewer.css';

export class ThemeViewer extends Application {
    constructor(config) {
        super(config);
        this.themes = {};
    }

    _createWindow() {
        const win = new $Window({
            id: this.id,
            title: this.title,
            width: this.width || 600,
            height: this.height || 500,
            resizable: true,
            icons: this.icon,
        });

        win.$content.html('<div class="theme-viewer-container"></div>');
        return win;
    }

    async _onLaunch() {
        try {
            const container = this.win.$content.find('.theme-viewer-container')[0];
            container.innerHTML = '<h1>Theme Viewer</h1><p>Loading themes...</p>';

            await this.loadThemes();
            this.renderThemes(container);

            container.addEventListener('click', (e) => {
                if (e.target.classList.contains('apply-theme-btn')) {
                    const themeName = e.target.dataset.themeName;
                    const themeList = getThemes();
                    const themeId = Object.keys(themeList).find(key => themeList[key] === themeName);
                    if (themeId) {
                        setTheme(themeId);
                    }
                }
            });
        } catch (error) {
            console.error('Error in ThemeViewer._onLaunch:', error);
        }
    }

    async loadThemes() {
        const themeList = getThemes();
        for (const themeId in themeList) {
            if (themeId === 'default') continue;

            const themeName = themeList[themeId];
            const cssPath = `os-gui/${themeId}.css`; // Use relative path

            try {
                const response = await fetch(cssPath);
                 if (!response.ok) {
                    throw new Error(`HTTP error! status: ${response.status}`);
                }
                const css = await response.text();
                const colors = this.parseThemeColors(css);
                this.themes[themeName] = { id: themeId, colors: colors };
            } catch (error) {
                console.error(`Failed to load theme CSS for '${themeName}' from '${cssPath}':`, error);
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

    renderThemes(container) {
        container.innerHTML = '<div class="header"><h1>Theme Viewer</h1></div>';

        for (const themeName in this.themes) {
            const theme = this.themes[themeName];
            const themePreviewEl = document.createElement('div');
            themePreviewEl.className = 'theme-preview';

            // Map theme colors to the new --preview- variables for the active window
            let activeStyle = '';
            for (const [key, value] of Object.entries(theme.colors)) {
                activeStyle += `--preview-${key}: ${value};\n`;
            }

            // Create a separate style string for the inactive window
            let inactiveStyle = activeStyle;
            inactiveStyle += `--preview-ActiveTitle: ${theme.colors['InactiveTitle'] || '#808080'};\n`;
            inactiveStyle += `--preview-GradientActiveTitle: ${theme.colors['GradientInactiveTitle'] || '#c0c0c0'};\n`;
            inactiveStyle += `--preview-TitleText: ${theme.colors['InactiveTitleText'] || '#c0c0c0'};\n`;


            themePreviewEl.innerHTML = `
                <div class="theme-header">
                    <h2>${themeName}</h2>
                    <button class="apply-theme-btn" data-theme-name="${themeName}">Apply</button>
                </div>
                <div class="preview-container">
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
                                    <button class="window-button window-minimize-button">
                                        <span class="window-button-icon"></span>
                                    </button>
                                    <button class="window-button window-maximize-button">
                                        <span class="window-button-icon"></span>
                                    </button>
                                    <button class="window-button window-close-button">
                                        <span class="window-button-icon"></span>
                                    </button>
                                </div>
                            </div>
                            <div class="window-content">
                                <p>Window Text</p>
                                <button>Button</button>
                            </div>
                        </div>
                    </div>
                    <div class="color-palette">
                        ${Object.entries(theme.colors)
                            .filter(([key, value]) => value.startsWith('rgb'))
                            .map(([colorName, colorValue]) => `
                                <div class="color-swatch">
                                    <div class="color-box" style="background-color: ${colorValue};"></div>
                                    <span class="color-name">${colorName}</span>
                                </div>
                            `).join('')}
                    </div>
                </div>
            `;
            container.appendChild(themePreviewEl);
        }
    }
}
