import { Application } from "../Application.js";
import { getThemes, setTheme } from "../../utils/themeManager.js";
import "./desktopthemes.css";

export class DesktopThemesApp extends Application {
  constructor(config) {
    super(config);
    this.themeCssCache = {};
  }

  _createWindow() {
    const win = new $Window({
      id: this.id,
      title: this.title,
      outerWidth: this.width,
      outerHeight: this.height,
      resizable: this.resizable,
      icons: this.icon,
      className: "desktopthemes-app",
    });

    const menuBar = this._createMenuBar(win);
    win.setMenuBar(menuBar);

    const mainContainer = document.createElement("div");
    mainContainer.className = "main-container";
    win.$content.append(mainContainer);

    const controlsContainer = document.createElement("div");
    controlsContainer.className = "controls";
    mainContainer.appendChild(controlsContainer);

    this.themeSelector = document.createElement("select");
    controlsContainer.appendChild(this.themeSelector);

    this.populateThemes();
    this.themeSelector.addEventListener("change", () => {
      this.previewTheme(this.themeSelector.value);
    });

    this.previewContainer = document.createElement("div");
    this.previewContainer.className = "preview-container";
    mainContainer.appendChild(this.previewContainer);

    this.previewContainer.innerHTML = `
      <div class="window preview-window">
        <div class="title-bar">
          <div class="title-bar-text">Active Window</div>
          <div class="title-bar-controls">
            <button aria-label="Close" class="close-button"></button>
          </div>
        </div>
        <div class="window-body">
          <p>Message</p>
          <button>OK</button>
        </div>
      </div>
    `;

    this.previewTheme(this.themeSelector.value);

    const applyButton = document.createElement("button");
    applyButton.textContent = "Apply";
    controlsContainer.appendChild(applyButton);

    applyButton.addEventListener("click", () => {
      setTheme(this.themeSelector.value);
    });

    return win;
  }

  _createMenuBar(win) {
    return new MenuBar({
      "&File": [{ label: "E&xit", action: () => win.close() }],
    });
  }

  populateThemes() {
    const themes = getThemes();
    for (const themeId in themes) {
      const option = document.createElement("option");
      option.value = themeId;
      option.textContent = themes[themeId].name;
      this.themeSelector.appendChild(option);
    }
  }

  async previewTheme(themeId) {
    const themes = getThemes();
    const theme = themes[themeId];

    if (!theme) return;

    // Set wallpaper
    this.previewContainer.style.backgroundImage = `url('${theme.wallpaper.path}')`;

    // Apply theme variables
    const cssText = await this.fetchThemeCss(theme.stylesheet);
    if (cssText) {
      const variables = this.parseCssVariables(cssText);
      this.applyCssVariables(variables);
    }
  }

  async fetchThemeCss(stylesheet) {
    if (!stylesheet) return null;
    const url = `./os-gui/${stylesheet}`;
    if (this.themeCssCache[url]) {
      return this.themeCssCache[url];
    }
    try {
      const response = await fetch(url);
      if (!response.ok) {
        throw new Error(`Failed to fetch CSS: ${response.statusText}`);
      }
      const cssText = await response.text();
      this.themeCssCache[url] = cssText;
      return cssText;
    } catch (error) {
      console.error("Error fetching theme CSS:", error);
      return null;
    }
  }

  parseCssVariables(cssText) {
    const variables = {};
    const rootBlockMatch = cssText.match(/:root\s*{([^}]+)}/);
    if (rootBlockMatch) {
      const variablesText = rootBlockMatch[1];
      const regex = /--([\w-]+):\s*([^;]+);/g;
      let match;
      while ((match = regex.exec(variablesText)) !== null) {
        variables[match[1]] = match[2].trim();
      }
    }
    return variables;
  }

  applyCssVariables(variables) {
    const styleProperties = {
      '--preview-active-title-bar-bg': variables['active-title-bar-bg'] || '#000080',
      '--preview-active-title-bar-text': variables['active-title-bar-text'] || '#ffffff',
      '--preview-window-bg': variables['window-bg'] || '#c0c0c0',
      '--preview-window-text': variables['window-text'] || '#000000',
    };

    for (const [property, value] of Object.entries(styleProperties)) {
      this.previewContainer.style.setProperty(property, value);
    }
  }
}
