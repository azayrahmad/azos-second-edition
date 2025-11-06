import { Application } from '../Application.js';
import { getThemes, getCurrentTheme, setTheme } from '../../utils/themeManager.js';
import { ICONS } from '../../config/icons.js';
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
        <div class="theme-preview-container"></div>
        <div class="theme-app-buttons">
          <button class="apply-button">Apply</button>
        </div>
      </div>
    `;

    const select = win.$content.querySelector('#theme-select');
    const applyButton = win.$content.querySelector('.apply-button');
    const previewContainer = win.$content.querySelector('.theme-preview-container');

    const updatePreview = (themeId) => {
      const theme = themes[themeId];
      if (!theme) {
        previewContainer.innerHTML = 'No preview available.';
        return;
      }

      // Default theme is special, it doesn't have a separate CSS file with variables
      if (theme.id === 'default' || !theme.stylesheet) {
          this._renderPreview(previewContainer, {}, theme);
          return;
      }
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
          const themeProps = this._parseThemeProperties(cssText);
          this._renderPreview(previewContainer, themeProps, theme);
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

  _parseThemeProperties(cssText) {
    const rootRegex = /:root\s*\{([^}]+)\}/;
    const rootMatch = cssText.match(rootRegex);
    if (!rootMatch) return {};

    const rootStyles = rootMatch[1];
    const propertyRegex = /(--[\w-]+)\s*:\s*([^;]+);/g;
    const props = {};
    let match;
    while ((match = propertyRegex.exec(rootStyles)) !== null) {
      props[match[1]] = match[2].trim();
    }
    return props;
  }

  _renderPreview(container, themeProps, theme) {
    // Clear previous preview and reset inline styles
    container.innerHTML = '';
    container.style.cssText = '';

    // Apply wallpaper
    if (theme.wallpaper) {
        container.style.backgroundImage = `url(${theme.wallpaper})`;
    }

    // Apply CSS variables as inline styles
    for (const [prop, value] of Object.entries(themeProps)) {
        container.style.setProperty(prop, value);
    }

    const infoIconUrl = ICONS.comctl32[32];

    container.innerHTML = `
      <div class="os-window">
        <div class="window-titlebar">
          <div class="window-title">Active Title</div>
          <div class="window-controls">
            <button class="window-minimize-button" disabled></button>
            <button class="window-maximize-button" disabled></button>
            <button class="window-close-button" disabled></button>
          </div>
        </div>
        <div class="window-content">
            <div class="message-box">
                <img src="${infoIconUrl}" alt="Info" class="message-box-icon">
                <p>Message</p>
            </div>
            <div class="button-row">
                <button disabled>OK</button>
            </div>
        </div>
      </div>
    `;
  }
}
