import { Application } from "../Application.js";
import { getThemes, setTheme } from "../../utils/themeManager.js";
import "./desktopthemes.css";

export class DesktopThemesApp extends Application {
  constructor(config) {
    super(config);
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
    if (!theme || !theme.stylesheet) {
      this.previewContainer.innerHTML = "No preview available.";
      return;
    }

    try {
      const response = await fetch(`./os-gui/${theme.stylesheet}`);
      if (!response.ok) {
        throw new Error(`Failed to fetch theme stylesheet: ${response.statusText}`);
      }
      const themeContent = await response.text();
      await this._loadParserScript();
      const cssProperties = window.parseThemeFileString(themeContent);
      if (cssProperties) {
        this._renderSwatches(cssProperties);
      } else {
        this.previewContainer.innerHTML = "Error parsing theme file.";
      }
    } catch (error) {
      console.error(error);
      this.previewContainer.innerHTML = `Error: ${error.message}`;
    }
  }

  _loadParserScript() {
    return new Promise((resolve, reject) => {
      if (window.parseThemeFileString && window.makeThemeCSSFile) {
        resolve();
        return;
      }

      if (document.querySelector('script[src="./os-gui/parse-theme.js"]')) {
        const interval = setInterval(() => {
          if (window.parseThemeFileString && window.makeThemeCSSFile) {
            clearInterval(interval);
            resolve();
          }
        }, 100);
        return;
      }

      const script = document.createElement("script");
      script.src = "./os-gui/parse-theme.js";
      script.onload = () => resolve();
      script.onerror = () =>
        reject(new Error("Failed to load theme parser script."));
      document.head.appendChild(script);
    });
  }

  _renderSwatches(cssProperties) {
    this.previewContainer.innerHTML = ""; // Clear previous swatches

    // Apply all theme properties to the container to resolve CSS variables in SVGs
    for (const [key, value] of Object.entries(cssProperties)) {
      this.previewContainer.style.setProperty(key, value);
    }

    for (const [key, value] of Object.entries(cssProperties)) {
      const swatchItem = document.createElement("div");
      swatchItem.className = "swatch-item";

      const nameLabel = document.createElement("div");
      nameLabel.className = "swatch-name";
      nameLabel.textContent = key;
      swatchItem.appendChild(nameLabel);

      if (value.startsWith("rgb")) {
        const colorBox = document.createElement("div");
        colorBox.className = "swatch-color";
        colorBox.style.backgroundColor = value;
        swatchItem.appendChild(colorBox);
      } else if (value.startsWith("url(")) {
        // only take the first token (before possible "64 / 2px" stuff)
        const match = value.trim().match(/^url\((['"]?)(.*?)\1\)/);
        if (!match) return;

        const img = document.createElement("img");
        img.className = "swatch-image";
        img.src = match[2]; // only the real data URI
        swatchItem.appendChild(img);
      }

      this.previewContainer.appendChild(swatchItem);
    }
  }
}
