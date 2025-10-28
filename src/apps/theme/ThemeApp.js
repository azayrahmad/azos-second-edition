import { Application } from '../Application.js';
import { getThemes, getCurrentTheme, setTheme } from '../../utils/themeManager.js';

export class ThemeApp extends Application {
  _createWindow() {
    const win = new $Window({
      title: this.title,
      width: 320,
      height: 380,
      resizable: false,
      icon: this.icon,
      id: this.id,
    });

    const themes = getThemes();
    const currentThemeId = getCurrentTheme();

    const themeOptions = Object.values(themes)
      .map(theme => `<option value="${theme.id}" ${theme.id === currentThemeId ? 'selected' : ''}>${theme.name}</option>`)
      .join('');

    win.$content.innerHTML = `
      <div class="theme-app-container">
        <div class="field-row-stacked">
          <label for="theme-select">Theme:</label>
          <select id="theme-select">
            ${themeOptions}
          </select>
        </div>
        <fieldset class="theme-preview">
            <legend>Preview</legend>
            <div class="color-swatches"></div>
        </fieldset>
        <div class="theme-app-buttons">
          <button class="apply-button">Apply</button>
        </div>
      </div>
    `;

    const select = win.$content.querySelector('#theme-select');
    const applyButton = win.$content.querySelector('.apply-button');
    const previewContainer = win.$content.querySelector('.color-swatches');

    const updatePreview = (themeId) => {
      const theme = themes[themeId];
      if (!theme || !theme.stylesheet) {
        previewContainer.innerHTML = 'No preview available.';
        return;
      }

      // Default theme is special, it doesn't have a separate CSS file with variables
      if (theme.id === 'default') {
          previewContainer.innerHTML = 'Preview not available for Default theme.';
          return;
      }

      const cssPath = `os-gui/${theme.stylesheet}`;
      previewContainer.innerHTML = 'Loading preview...';

      fetch(cssPath)
        .then(response => {
            if (!response.ok) {
                throw new Error('Network response was not ok');
            }
            return response.text();
        })
        .then(cssText => {
          const colors = this._parseCssColors(cssText);
          this._renderSwatches(previewContainer, colors);
        })
        .catch(err => {
          console.error('Failed to load theme CSS for preview:', err);
          previewContainer.innerHTML = 'Could not load preview.';
        });
    };

    select.addEventListener('change', () => {
      updatePreview(select.value);
    });

    applyButton.addEventListener('click', () => {
      setTheme(select.value);
    });

    // Initial preview
    updatePreview(currentThemeId);

    return win;
  }

  _parseCssColors(cssText) {
    const rootRegex = /:root\s*\{([^}]+)\}/;
    const rootMatch = cssText.match(rootRegex);
    if (!rootMatch) return {};

    const rootStyles = rootMatch[1];
    const propertyRegex = /(--[\w-]+)\s*:\s*([^;]+);/g;
    const allColors = {};
    let match;
    while ((match = propertyRegex.exec(rootStyles)) !== null) {
        allColors[match[1]] = match[2].trim();
    }

    const filteredColors = {};
    const keyColors = [
        '--button-face',
        '--button-text',
        '--window-frame',
        '--window-text',
        '--highlight',
        '--highlight-text',
        '--title-bar-text',
        '--inactive-title-bar-text'
    ];
    for (const key of keyColors) {
        if(allColors[key]) {
            filteredColors[key.replace('--', '')] = allColors[key];
        }
    }

    return filteredColors;
  }

  _renderSwatches(container, colors) {
    if (Object.keys(colors).length === 0) {
        container.innerHTML = 'No color preview available.';
        return;
    }

    let swatchesHTML = '';
    for (const [name, value] of Object.entries(colors)) {
      swatchesHTML += `
        <div class="swatch-row">
            <div class="swatch-color" style="background-color: ${value};"></div>
            <span class="swatch-name">${name.replace(/-/g, ' ')}</span>
        </div>
      `;
    }
    container.innerHTML = swatchesHTML;
  }
}
