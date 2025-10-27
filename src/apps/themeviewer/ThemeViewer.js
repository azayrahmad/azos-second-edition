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
            title: this.title,
            width: this.width || 600,
            height: this.height || 500,
            resizable: this.resizable,
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
            const cssPath = `public/os-gui/${themeId}.css`;

            try {
                const response = await fetch(cssPath);
                const css = await response.text();
                const colors = this.parseThemeColors(css);
                this.themes[themeName] = { id: themeId, colors: colors };
            } catch (error) {
                console.error(`Failed to load theme: ${themeName}`, error);
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
                if (value.startsWith('rgb')) {
                    colors[key] = value;
                }
            }
        }
        return colors;
    }

    renderThemes(container) {
        let html = '<div class="header"><h1>Theme Viewer</h1></div>';

        for (const themeName in this.themes) {
            const { id, colors } = this.themes[themeName];
            html += `
                <div class="theme-preview">
                    <div class="theme-header">
                        <h2>${themeName}</h2>
                        <button class="apply-theme-btn" data-theme-name="${themeName}">Apply</button>
                    </div>
                    <div class="preview-container">
                        <div class="window-preview" style="background-color: ${colors['Window'] || '#fff'}; color: ${colors['WindowText'] || '#000'}; border: 1px solid ${colors['WindowFrame'] || '#000'};">
                            <div class="title-bar" style="background: linear-gradient(to right, ${colors['GradientActiveTitle'] || colors['ActiveTitle'] || '#008'}, ${colors['ActiveTitle'] || '#008'}); color: ${colors['TitleText'] || '#fff'};">
                                <span>Active Window</span>
                                <div class="title-buttons">
                                    <span class="title-button">_</span>
                                    <span class="title-button">[]</span>
                                    <span class="title-button">X</span>
                                </div>
                            </div>
                            <div class="window-content">
                                <p>Window Text</p>
                                <button style="background-color: ${colors['ButtonFace'] || '#ccc'}; color: ${colors['ButtonText'] || '#000'}; border: 1px solid ${colors['ButtonShadow'] || '#000'};">Button</button>
                            </div>
                        </div>
                        <div class="color-palette">
            `;

            for (const colorName in colors) {
                html += `
                    <div class="color-swatch">
                        <div class="color-box" style="background-color: ${colors[colorName]};"></div>
                        <span class="color-name">${colorName}</span>
                    </div>
                `;
            }

            html += `
                        </div>
                    </div>
                </div>
            `;
        }

        container.innerHTML = html;
    }
}
