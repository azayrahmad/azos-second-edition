import { Application } from "../Application.js";
import { getThemes, setTheme } from "../../utils/themeManager.js";
import { ShowDialogWindow } from "../../components/DialogWindow.js";
import { Select } from "/public/os-gui/Select.js";
import "./desktopthemes.css";

export class DesktopThemesApp extends Application {
  constructor(config) {
    super(config);
    this.themeCssCache = {};
    this.previousThemeId = null;
    this.customThemeProperties = null;
  }

  _createWindow() {
    const win = new $Window({
      id: this.id,
      title: this.title,
      outerWidth: this.width,
      // outerHeight: this.height,
      resizable: this.resizable,
      icons: this.icon,
      className: "desktopthemes-app",
    });

    const mainContainer = document.createElement("div");
    mainContainer.className = "main-container";
    win.$content.append(mainContainer);

    const controlsContainer = document.createElement("div");
    controlsContainer.className = "controls";
    mainContainer.appendChild(controlsContainer);
    const themeLabel = document.createElement("label");
    themeLabel.textContent = "Theme:";

    const themes = getThemes();
    const themeOptions = Object.keys(themes).map(themeId => ({
        value: themeId,
        label: themes[themeId].name
    }));

    themeOptions.push({ separator: true });
    themeOptions.push({ value: 'load-custom', label: '<Load Theme>' });

    this.themeSelector = new Select(themeOptions);
    controlsContainer.appendChild(themeLabel);
    controlsContainer.appendChild(this.themeSelector.element);

    this.themeSelector.element.addEventListener("change", (e) => {
        const selectedThemeId = e.detail.value;
      if (selectedThemeId === "load-custom") {
        this.handleCustomThemeLoad();
      } else {
        this.customThemeProperties = null; // Clear custom theme when a standard one is selected
        this.previewTheme(selectedThemeId);
      }
    });

    this.previewContainer = document.createElement("div");
    this.previewContainer.className = "preview-container";
    mainContainer.appendChild(this.previewContainer);

    this.previewContainer.innerHTML = `
      <div class="os-window app-window preview-window">
        <div class="title-bar window-titlebar">
          <div class="title-bar-text">Message Box</div>
          <div class="title-bar-controls">
            <button aria-label="Close" class="close-button window-close-button window-action-close window-button">
            <span class='window-button-icon'></span>
            </button>
          </div>
        </div>
        <div class="window-body">
          <p>Message</p>
          <button>OK</button>
        </div>
      </div>
    `;

    this.previewTheme(this.themeSelector.value);

    const actionsContainer = document.createElement("div");
    actionsContainer.className = "actions";
    mainContainer.appendChild(actionsContainer);

    const applyButton = document.createElement("button");
    applyButton.textContent = "Apply";
    actionsContainer.appendChild(applyButton);

    applyButton.addEventListener("click", () => {
      if (this.customThemeProperties) {
        this.applyCustomTheme();
      } else {
        setTheme(this.themeSelector.value);
      }
    });

    return win;
  }

  _createMenuBar(win) {
    return new MenuBar({
      "&File": [{ label: "E&xit", action: () => win.close() }],
    });
  }

  async applyCustomTheme() {
    // 1. Get the base theme to inherit wallpaper, sounds, etc.
    const themes = getThemes();
    const baseTheme = themes[this.previousThemeId] || themes["default"];

    // 2. Generate the full CSS from the parsed properties
    await this._loadParserScript();
    const cssContent = window.makeThemeCSSFile(this.customThemeProperties);

    // 3. Remove any existing custom theme styles
    const existingStyle = document.getElementById("custom-theme-styles");
    if (existingStyle) {
      existingStyle.remove();
    }

    // 4. Create and inject the new style tag
    const style = document.createElement("style");
    style.id = "custom-theme-styles";
    style.textContent = cssContent;
    document.head.appendChild(style);

    // 5. Create a temporary theme object for setTheme
    const customTheme = {
      ...baseTheme,
      id: "custom",
      name: "Custom Theme",
      stylesheet: null, // We are injecting styles manually
      colors: this.customThemeProperties, // Store the parsed colors
    };

    // 6. Apply the theme (this will handle wallpaper, sounds, cursors from base)
    setTheme("custom", customTheme);
  }

  handleCustomThemeLoad() {
    this.previousThemeId = this.themeSelector.value;

    const input = document.createElement("input");
    input.type = "file";
    input.accept = ".theme";
    input.onchange = (event) => {
      const file = event.target.files[0];
      if (!file) {
        // User cancelled, revert to the previously selected theme
        this.themeSelector.setValue(this.previousThemeId);
        return;
      }
      this.loadFile(file);
    };
    input.click();
  }

  loadFile(file) {
    const reader = new FileReader();
    reader.onload = async (e) => {
      const themeContent = e.target.result;
      try {
        await this._loadParserScript();
        const cssProperties = window.parseThemeFileString(themeContent);
        if (cssProperties) {
          this.customThemeProperties = cssProperties; // Store original with --
          this.themeSelector.setValue(this.previousThemeId); // Revert dropdown

          const normalizedProperties = {};
          for (const [key, value] of Object.entries(cssProperties)) {
            normalizedProperties[key.replace(/^--/, "")] = value;
          }

          this.previewCustomTheme(normalizedProperties); // Use normalized for preview
        } else {
          this.themeSelector.setValue(this.previousThemeId);
          ShowDialogWindow({
            title: "Error",
            text: "Could not parse the selected file. Please ensure it is a valid .theme file.",
            buttons: [{ label: "OK" }],
          });
        }
      } catch (error) {
        console.error(error);
        this.themeSelector.setValue(this.previousThemeId);
        ShowDialogWindow({
          title: "Error",
          text: `An error occurred: ${error.message}`,
          buttons: [{ label: "OK" }],
        });
      }
    };
    reader.readAsText(file);
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

  async previewTheme(themeId) {
    this.customThemeProperties = null;
    const themes = getThemes();
    const theme = themes[themeId];

    if (!theme) return;

    // Apply theme variables first to get fallback background
    const cssText = await this.fetchThemeCss(theme.stylesheet);
    if (cssText) {
      const variables = this.parseCssVariables(cssText);
      this.applyCssVariables(variables);

      // Set wallpaper or fallback background
      if (theme.wallpaper) {
        this.previewContainer.style.backgroundImage = `url('${theme.wallpaper}')`;
        this.previewContainer.style.backgroundColor = "";
      } else {
        this.previewContainer.style.backgroundImage = "none";
        this.previewContainer.style.backgroundColor =
          variables["Background"] || "#008080";
      }
    }
  }

  previewCustomTheme(properties) {
    this.applyCssVariables(properties);
    this.previewContainer.style.backgroundImage = "none";
    this.previewContainer.style.backgroundColor =
      properties["Background"] || "#008080";
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
    if (rootBlock-match) {
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
    console.log(variables);
    const styleProperties = {
      "--preview-active-title-bar-bg":
        variables["ActiveTitle"] || "rgb(0, 0, 128)",
      "--preview-gradient-active-title-bar-bg":
        variables["GradientActiveTitle"] || "rgb(16, 132, 208)",
      "--preview-active-title-bar-text":
        variables["TitleText"] || "rgb(255, 255, 255)",
      "--preview-window-bg": variables["Window"] || "rgb(255, 255, 255)",
      "--preview-window-text": variables["WindowText"] || "rgb(0, 0, 0)",
      "--preview-button-face": variables["ButtonFace"] || "rgb(192, 192, 192)",
      "--preview-button-text": variables["ButtonText"] || "rgb(0, 0, 0)",
      "--preview-button-highlight":
        variables["ButtonHilight"] || "rgb(255, 255, 255)",
      "--preview-button-shadow":
        variables["ButtonShadow"] || "rgb(128, 128, 128)",
      "--preview-button-dk-shadow":
        variables["ButtonDkShadow"] || "rgb(0, 0, 0)",
      "--preview-button-normal-border-image":
        variables["button-normal-border-image"] || "none",
    };

    for (const [property, value] of Object.entries(styleProperties)) {
      this.previewContainer.style.setProperty(property, value);
    }
  }
}
