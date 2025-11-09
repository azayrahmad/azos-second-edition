import { Application } from "../Application.js";
import {
  getThemes,
  setTheme,
  saveCustomTheme,
  deleteCustomTheme,
  getCurrentTheme,
} from "../../utils/themeManager.js";
import { ShowDialogWindow } from "../../components/DialogWindow.js";
import "./desktopthemes.css";

export class DesktopThemesApp extends Application {
  constructor(config) {
    super(config);
    this.themeCssCache = {};
    this.previousThemeId = null;
    this.customThemeProperties = null;
    this.originalFilename = "";

    this.boundPopulateThemes = this.populateThemes.bind(this);
    document.addEventListener(
      "custom-themes-changed",
      this.boundPopulateThemes
    );
  }

  _createWindow() {
    const win = new $Window({
      id: this.id,
      title: this.title,
      outerWidth: this.width,
      resizable: this.resizable,
      icons: this.icon,
      className: "desktopthemes-app",
    });

    win.on("close", () => {
      document.removeEventListener(
        "custom-themes-changed",
        this.boundPopulateThemes
      );
    });

    const mainContainer = document.createElement("div");
    mainContainer.className = "main-container";
    win.$content.append(mainContainer);

    const controlsContainer = document.createElement("div");
    controlsContainer.className = "controls";
    mainContainer.appendChild(controlsContainer);

    const themeLabel = document.createElement("label");
    themeLabel.textContent = "Theme:";
    controlsContainer.appendChild(themeLabel);

    this.themeSelector = document.createElement("select");
    this.themeSelector.id = "theme-selector";
    themeLabel.setAttribute("for", this.themeSelector.id);
    controlsContainer.appendChild(this.themeSelector);

    this.saveButton = document.createElement("button");
    this.saveButton.textContent = "Save As...";
    this.saveButton.disabled = true;
    controlsContainer.appendChild(this.saveButton);

    this.deleteButton = document.createElement("button");
    this.deleteButton.textContent = "Delete";
    this.deleteButton.disabled = true;
    controlsContainer.appendChild(this.deleteButton);

    this.saveButton.addEventListener("click", () => this.handleSaveTheme());
    this.deleteButton.addEventListener("click", () => this.handleDeleteTheme());
    this.themeSelector.addEventListener("change", () =>
      this.handleThemeSelection()
    );

    this.populateThemes();

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
      if (this.themeSelector.value === "current-settings") {
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
    const themes = getThemes();
    const baseTheme = themes["default"];
    await this._loadParserScript();
    const cssContent = window.makeThemeCSSFile(this.customThemeProperties);

    const existingStyle = document.getElementById("custom-theme-styles");
    if (existingStyle) {
      existingStyle.remove();
    }

    const style = document.createElement("style");
    style.id = "custom-theme-styles";
    style.textContent = cssContent;
    document.head.appendChild(style);

    const customTheme = {
      ...baseTheme,
      id: "custom",
      name: "Current Windows settings",
      stylesheet: null,
      colors: this.customThemeProperties,
    };

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
        this.themeSelector.value = this.previousThemeId;
        return;
      }
      this.loadFile(file);
    };
    input.click();
  }

  loadFile(file) {
    this.originalFilename = file.name.replace(/\.[^/.]+$/, "");
    const reader = new FileReader();
    reader.onload = async (e) => {
      const themeContent = e.target.result;
      try {
        await this._loadParserScript();
        const cssProperties = window.parseThemeFileString(themeContent);
        if (cssProperties) {
          this.customThemeProperties = cssProperties;
          this.addTemporaryThemeOption();
          this.themeSelector.value = "current-settings";
          this.handleThemeSelection(); // Use the handler to update state
        } else {
          this.themeSelector.value = this.previousThemeId;
          ShowDialogWindow({
            title: "Error",
            text: "Could not parse the selected file.",
            buttons: [{ label: "OK" }],
          });
        }
      } catch (error) {
        this.themeSelector.value = this.previousThemeId;
        ShowDialogWindow({
          title: "Error",
          text: `An error occurred: ${error.message}`,
          buttons: [{ label: "OK" }],
        });
      }
    };
    reader.readAsText(file);
  }

  handleSaveTheme() {
    ShowDialogWindow({
      title: "Save Scheme",
      text: "Save this theme as:",
      input: { value: this.originalFilename },
      buttons: [
        {
          label: "OK",
          action: (inputValue) => {
            if (inputValue) this.saveTheme(inputValue);
          },
        },
        { label: "Cancel" },
      ],
    });
  }

  saveTheme(name) {
    const themes = getThemes();
    let finalName = name;
    let counter = 2;
    while (Object.values(themes).some((theme) => theme.name === finalName)) {
      finalName = `${name} (${counter++})`;
    }

    const newThemeId = `custom-${finalName.toLowerCase().replace(/\s+/g, "-")}`;
    const newTheme = {
      ...themes.default,
      id: newThemeId,
      name: finalName,
      stylesheet: null,
      colors: this.customThemeProperties,
      isCustom: true,
    };

    saveCustomTheme(newThemeId, newTheme);

    // We don't call populateThemes directly anymore, the event listener handles it.
    // The event listener will call populateThemes, which will then restore the selection.
    this.themeSelector.value = newThemeId;
  }

  handleDeleteTheme() {
    const selectedThemeId = this.themeSelector.value;
    const selectedTheme = getThemes()[selectedThemeId];

    if (selectedTheme?.isCustom) {
      ShowDialogWindow({
        title: "Delete Scheme",
        text: `Are you sure you want to delete "${selectedTheme.name}"?`,
        buttons: [
          {
            label: "Yes",
            action: () => {
              deleteCustomTheme(selectedThemeId);
              this.themeSelector.value = "default";
            },
          },
          { label: "No" },
        ],
      });
    }
  }

  handleThemeSelection() {
    const selectedValue = this.themeSelector.value;
    const selectedTheme = getThemes()[selectedValue];

    if (selectedValue === "load-custom") {
      this.handleCustomThemeLoad();
      return;
    }

    this.saveButton.disabled = selectedValue !== "current-settings";
    this.deleteButton.disabled = !selectedTheme?.isCustom;

    if (selectedValue === "current-settings") {
      const normalizedProperties = {};
      for (const [key, value] of Object.entries(this.customThemeProperties)) {
        normalizedProperties[key.replace(/^--/, "")] = value;
      }
      this.previewCustomTheme(normalizedProperties);
    } else {
      this.removeTemporaryThemeOption();
      this.customThemeProperties = null;
      this.previewTheme(selectedValue);
    }
  }

  addTemporaryThemeOption() {
    if (!this.themeSelector.querySelector('option[value="current-settings"]')) {
      const option = document.createElement("option");
      option.value = "current-settings";
      option.textContent = "Current Windows settings";
      const separator = this.themeSelector.querySelector("option[disabled]");
      this.themeSelector.insertBefore(option, separator);
    }
  }

  removeTemporaryThemeOption() {
    const option = this.themeSelector.querySelector(
      'option[value="current-settings"]'
    );
    if (option) {
      option.remove();
    }
  }

  _loadParserScript() {
    return new Promise((resolve, reject) => {
      if (window.parseThemeFileString) {
        return resolve();
      }
      const script = document.createElement("script");
      script.src = "./os-gui/parse-theme.js";
      script.onload = resolve;
      script.onerror = () => reject(new Error("Failed to load theme parser."));
      document.head.appendChild(script);
    });
  }

  populateThemes() {
    const lastSelected = this.themeSelector.value;
    this.themeSelector.innerHTML = "";

    const themes = getThemes();
    const sortedThemes = Object.entries(themes).sort(([, a], [, b]) => a.name.localeCompare(b.name));

    for (const [id, theme] of sortedThemes) {
      const option = document.createElement("option");
      option.value = id;
      option.textContent = theme.name;
      this.themeSelector.appendChild(option);
    }

    const separator = document.createElement("option");
    separator.disabled = true;
    separator.textContent = "──────────";
    this.themeSelector.appendChild(separator);

    const loadOption = document.createElement("option");
    loadOption.value = "load-custom";
    loadOption.textContent = "<Load Theme>";
    this.themeSelector.appendChild(loadOption);

    if (this.themeSelector.querySelector(`option[value="${lastSelected}"]`)) {
        this.themeSelector.value = lastSelected;
    } else {
        this.themeSelector.value = getCurrentTheme();
    }
    this.handleThemeSelection();
  }

  async previewTheme(themeId) {
    const theme = getThemes()[themeId];
    if (!theme) return;

    let variables = {};
    if (theme.isCustom && theme.colors) {
        for (const [key, value] of Object.entries(theme.colors)) {
            variables[key.replace(/^--/, "")] = value;
        }
    } else if (theme.stylesheet) {
        const cssText = await this.fetchThemeCss(theme.stylesheet);
        if (cssText) {
            variables = this.parseCssVariables(cssText);
        }
    }

    this.applyCssVariables(variables);
    this.previewContainer.style.backgroundImage = theme.wallpaper ? `url('${theme.wallpaper}')` : "none";
    this.previewContainer.style.backgroundColor = variables["Background"] || "#008080";
  }

  previewCustomTheme(properties) {
    this.applyCssVariables(properties);
    this.previewContainer.style.backgroundImage = "none";
    this.previewContainer.style.backgroundColor = properties["Background"] || "#008080";
  }

  async fetchThemeCss(stylesheet) {
    if (!stylesheet) return null;
    const url = `./os-gui/${stylesheet}`;
    if (this.themeCssCache[url]) return this.themeCssCache[url];
    try {
      const response = await fetch(url);
      if (!response.ok) throw new Error(`Failed to fetch CSS: ${response.statusText}`);
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
      "--preview-active-title-bar-bg": variables["ActiveTitle"] || "rgb(0, 0, 128)",
      "--preview-gradient-active-title-bar-bg": variables["GradientActiveTitle"] || "rgb(16, 132, 208)",
      "--preview-active-title-bar-text": variables["TitleText"] || "rgb(255, 255, 255)",
      "--preview-window-bg": variables["Window"] || "rgb(255, 255, 255)",
      "--preview-window-text": variables["WindowText"] || "rgb(0, 0, 0)",
      "--preview-button-face": variables["ButtonFace"] || "rgb(192, 192, 192)",
      "--preview-button-text": variables["ButtonText"] || "rgb(0, 0, 0)",
      "--preview-button-highlight": variables["ButtonHilight"] || "rgb(255, 255, 255)",
      "--preview-button-shadow": variables["ButtonShadow"] || "rgb(128, 128, 128)",
      "--preview-button-dk-shadow": variables["ButtonDkShadow"] || "rgb(0, 0, 0)",
    };
    for (const [property, value] of Object.entries(styleProperties)) {
      this.previewContainer.style.setProperty(property, value);
    }
  }
}
