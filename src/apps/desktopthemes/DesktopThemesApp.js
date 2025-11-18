import { Application } from "../Application.js";
import { ICONS } from "../../config/icons.js";
import {
  getThemes,
  setTheme,
  saveCustomTheme,
  deleteCustomTheme,
  getCurrentTheme,
  loadThemeParser,
} from "../../utils/themeManager.js";
import { ShowDialogWindow } from "../../components/DialogWindow.js";
import { AccessKeys } from "/public/os-gui/MenuBar.js";
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
      this.boundPopulateThemes,
    );
  }

  _createWindow() {
    const win = new $Window({
      id: this.id,
      title: this.title,
      outerWidth: 550, // Increased width to accommodate the new layout
      resizable: this.resizable,
      icons: this.icon,
      className: "desktopthemes-app",
    });

    win.on("close", () => {
      document.removeEventListener(
        "custom-themes-changed",
        this.boundPopulateThemes,
      );
    });

    const mainContainer = document.createElement("div");
    mainContainer.className = "main-container";
    win.$content.append(mainContainer);

    // --- Left Panel ---
    const leftPanel = document.createElement("div");
    leftPanel.className = "left-panel";
    mainContainer.appendChild(leftPanel);

    const controlsContainer = document.createElement("div");
    controlsContainer.className = "controls";
    leftPanel.appendChild(controlsContainer);

    const themeLabel = document.createElement("label");
    themeLabel.innerHTML = AccessKeys.toHTML("&Theme:");
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
      this.handleThemeSelection(),
    );

    this.previewContainer = document.createElement("div");
    this.previewContainer.className = "preview-container";
    leftPanel.appendChild(this.previewContainer);

    this.previewContainer.innerHTML = `
      <div class="desktop-icons-preview">
        <div class="desktop-icon-preview" data-icon="my-computer">
          <img src="" alt="My Computer" />
          <span>My Computer</span>
        </div>
        <div class="desktop-icon-preview" data-icon="network">
          <img src="" alt="Network Neighborhood" />
          <span>Network Neighborhood</span>
        </div>
        <div class="desktop-icon-preview" data-icon="recycle-bin">
          <img src="" alt="Recycle Bin" />
          <span>Recycle Bin</span>
        </div>
      </div>
      <div class="os-window app-window preview-window inactive-window-preview">
        <div class="title-bar window-titlebar">
          <div class="title-bar-text">Inactive Window</div>
          <div class="title-bar-controls">
            <button aria-label="Minimize"></button>
            <button aria-label="Maximize"></button>
            <button aria-label="Close"></button>
          </div>
        </div>
        <div class="window-body"></div>
      </div>
      <div class="os-window app-window preview-window active-window-preview">
        <div class="title-bar window-titlebar">
          <div class="title-bar-text">Active Window</div>
          <div class="title-bar-controls">
            <button aria-label="Minimize"></button>
            <button aria-label="Maximize"></button>
            <button aria-label="Close"></button>
          </div>
        </div>
        <div class="window-body">
            <div class="menu-bar"><span>Normal</span><span>Disabled</span><span class="selected">Selected</span></div>
            <div class="main-content"><p>Window Text</p></div>
        </div>
      </div>
      <div class="os-window app-window preview-window message-box-preview">
        <div class="title-bar window-titlebar">
          <div class="title-bar-text">Message Box</div>
          <div class="title-bar-controls">
            <button aria-label="Close" class="close-button window-close-button window-action-close window-button">
            </button>
          </div>
        </div>
        <div class="window-body">
          <p>Message Text</p>
          <button>OK</button>
        </div>
      </div>
    `;

    this.previewLabel = document.createElement("div");
    this.previewLabel.className = "preview-label";
    leftPanel.appendChild(this.previewLabel);

    this.populateThemes();
    this.previewTheme(this.themeSelector.value);

    // --- Right Panel ---
    const rightPanel = document.createElement("div");
    rightPanel.className = "right-panel";
    mainContainer.appendChild(rightPanel);

    // Previews Group
    const previewsFieldset = document.createElement("fieldset");
    previewsFieldset.className = "previews-fieldset";
    previewsFieldset.innerHTML = "<legend>Previews</legend>";
    rightPanel.appendChild(previewsFieldset);

    const screenSaverButton = document.createElement("button");
    screenSaverButton.textContent = "Screen Saver";
    screenSaverButton.disabled = true;
    previewsFieldset.appendChild(screenSaverButton);

    const pointersButton = document.createElement("button");
    pointersButton.textContent = "Pointers, Sounds, etc...";
    pointersButton.disabled = true;
    previewsFieldset.appendChild(pointersButton);

    // Settings Group
    const settingsFieldset = document.createElement("fieldset");
    settingsFieldset.className = "settings-fieldset";
    settingsFieldset.innerHTML = `
      <legend>Settings</legend>
      <p>Click OK or Apply to apply the selected settings to Windows 98.</p>
      <div class="field-row">
        <input type="checkbox" id="cb-screensaver" checked disabled />
        <label for="cb-screensaver">${AccessKeys.toHTML(
          "Screen &saver",
        )}</label>
      </div>
      <div class="field-row">
        <input type="checkbox" id="cb-sound" checked disabled />
        <label for="cb-sound">${AccessKeys.toHTML("&Sound events")}</label>
      </div>
      <div class="field-row">
        <input type="checkbox" id="cb-mouse" checked disabled />
        <label for="cb-mouse">${AccessKeys.toHTML("&Mouse pointers")}</label>
      </div>
      <div class="field-row">
        <input type="checkbox" id="cb-wallpaper" checked disabled />
        <label for="cb-wallpaper">${AccessKeys.toHTML(
          "Desktop &wallpaper",
        )}</label>
      </div>
      <div class="field-row">
        <input type="checkbox" id="cb-icons" checked disabled />
        <label for="cb-icons">${AccessKeys.toHTML("&Icons")}</label>
      </div>
      <div class="field-row">
        <input type="checkbox" id="cb-colors" checked disabled />
        <label for="cb-colors">${AccessKeys.toHTML("&Colors")}</label>
      </div>
      <div class="field-row">
        <input type="checkbox" id="cb-fontnames" checked disabled />
        <label for="cb-fontnames">${AccessKeys.toHTML(
          "&Font names and styles",
        )}</label>
      </div>
      <div class="field-row">
        <input type="checkbox" id="cb-fontsizes" checked disabled />
        <label for="cb-fontsizes">${AccessKeys.toHTML(
          "Font and window si&zes",
        )}</label>
      </div>
    `;
    rightPanel.appendChild(settingsFieldset);

    // --- Bottom Action Buttons ---
    const actionsContainer = document.createElement("div");
    actionsContainer.className = "actions";
    win.$content.append(actionsContainer);

    const okButton = document.createElement("button");
    okButton.textContent = "OK";
    actionsContainer.appendChild(okButton);

    const cancelButton = document.createElement("button");
    cancelButton.textContent = "Cancel";
    actionsContainer.appendChild(cancelButton);

    const applyButton = document.createElement("button");
    applyButton.textContent = "Apply";
    actionsContainer.appendChild(applyButton);

    const applyCurrentTheme = () => {
      if (this.themeSelector.value === "current-settings") {
        this.applyCustomTheme();
      } else {
        setTheme(this.themeSelector.value);
      }
    };

    applyButton.addEventListener("click", applyCurrentTheme);
    okButton.addEventListener("click", () => {
      applyCurrentTheme();
      win.close();
    });
    cancelButton.addEventListener("click", () => win.close());

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
    await loadThemeParser();
    const cssContent = window.makeThemeCSSFile(this.customThemeProperties);

    const existingStyle = document.getElementById("custom-theme-styles");
    if (existingStyle) {
      existingStyle.remove();
    }

    const style = document.createElement("style");
    style.id = "custom-theme-styles";
    style.textContent = cssContent;
    document.head.appendChild(style);

    const { wallpaper, ...colors } = this.customThemeProperties;
    const customTheme = {
      ...baseTheme,
      id: "custom",
      name: "Current Windows settings",
      stylesheet: null,
      colors: colors,
      wallpaper: wallpaper,
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
        await loadThemeParser();
        const colors = window.getColorsFromThemeFile(themeContent);
        const wallpaper = window.getWallpaperFromThemeFile(themeContent);
        if (colors) {
          this._showThemeWizard(colors, wallpaper, (updatedTheme) => {
            const cssProperties = window.generateThemePropertiesFromColors(
              updatedTheme.colors,
            );
            this.customThemeProperties = {
              ...cssProperties,
              wallpaper: updatedTheme.wallpaper,
            };
            this.addTemporaryThemeOption();
            this.themeSelector.value = "current-settings";
            this.handleThemeSelection(); // Use the handler to update state
          });
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
      title: "Save Theme",
      text: `Do you want to save this theme as "${this.originalFilename}"?`,
      buttons: [
        {
          label: "OK",
          action: () => {
            this.saveTheme(this.originalFilename);
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

    const newThemeId = `custom-${finalName
      .toLowerCase()
      .replace(/\s+/g, "-")}`;
    const { wallpaper, ...colors } = this.customThemeProperties;
    const newTheme = {
      ...themes.default,
      id: newThemeId,
      name: finalName,
      stylesheet: null,
      colors: colors,
      wallpaper: wallpaper,
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
      this.previewLabel.textContent = `Preview of 'Current Windows settings'`;
    } else {
      this.removeTemporaryThemeOption();
      this.customThemeProperties = null;
      this.previewTheme(selectedValue);
      this.previewLabel.textContent = `Preview of '${
        selectedTheme ? selectedTheme.name : ""
      }'`;
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
      'option[value="current-settings"]',
    );
    if (option) {
      option.remove();
    }
  }

  populateThemes() {
    const lastSelected = this.themeSelector.value;
    this.themeSelector.innerHTML = "";

    const themes = getThemes();
    const sortedThemes = Object.entries(themes).sort(([, a], [, b]) =>
      a.name.localeCompare(b.name),
    );

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

  updatePreviewIcons() {
    const computerIcon = this.previewContainer.querySelector(
      '[data-icon="my-computer"] img',
    );
    const networkIcon = this.previewContainer.querySelector(
      '[data-icon="network"] img',
    );
    const recycleBinIcon = this.previewContainer.querySelector(
      '[data-icon="recycle-bin"] img',
    );

    if (computerIcon) computerIcon.src = ICONS.computer[32];
    if (networkIcon) networkIcon.src = ICONS.folder[32]; // Using folder as placeholder
    if (recycleBinIcon) recycleBinIcon.src = ICONS.recycleBinEmpty[32];
  }

  async previewTheme(themeId) {
    const theme = getThemes()[themeId];
    if (!theme) return;

    this.updatePreviewIcons();

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
    this.previewContainer.style.backgroundImage = theme.wallpaper
      ? `url('${theme.wallpaper}')`
      : "none";
    this.previewContainer.style.backgroundColor =
      variables["Background"] || "#008080";
  }

  previewCustomTheme(properties) {
    this.updatePreviewIcons();
    this.applyCssVariables(properties);
    this.previewContainer.style.backgroundImage = properties.wallpaper
      ? `url('${properties.wallpaper}')`
      : "none";
    this.previewContainer.style.backgroundColor =
      properties["Background"] || "#008080";
  }

  async fetchThemeCss(stylesheet) {
    if (!stylesheet) return null;
    const url = `./os-gui/${stylesheet}`;
    if (this.themeCssCache[url]) return this.themeCssCache[url];
    try {
      const response = await fetch(url);
      if (!response.ok)
        throw new Error(`Failed to fetch CSS: ${response.statusText}`);
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
      "--preview-active-title-bar-bg":
        variables["ActiveTitle"] || "rgb(0, 0, 128)",
      "--preview-gradient-active-title-bar-bg":
        variables["GradientActiveTitle"] || "rgb(16, 132, 208)",
      "--preview-active-title-bar-text":
        variables["TitleText"] || "rgb(255, 255, 255)",
      "--preview-inactive-title-bar-bg":
        variables["InactiveTitle"] || "rgb(128, 128, 128)",
      "--preview-gradient-inactive-title-bar-bg":
        variables["GradientInactiveTitle"] || "rgb(181, 181, 181)",
      "--preview-inactive-title-bar-text":
        variables["InactiveTitleText"] || "rgb(192, 192, 192)",
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
    };
    for (const [property, value] of Object.entries(styleProperties)) {
      this.previewContainer.style.setProperty(property, value);
    }
  }

  _rgbToHex(rgbString) {
    const match = rgbString.match(/rgb\((\d+), (\d+), (\d+)\)/);
    if (!match) return "#000000";
    const r = parseInt(match[1], 10);
    const g = parseInt(match[2], 10);
    const b = parseInt(match[3], 10);
    return "#" + ((1 << 24) + (r << 16) + (g << 8) + b).toString(16).slice(1);
  }

  _hexToRgb(hex) {
    const bigint = parseInt(hex.slice(1), 16);
    const r = (bigint >> 16) & 255;
    const g = (bigint >> 8) & 255;
    const b = bigint & 255;
    return `rgb(${r}, ${g}, ${b})`;
  }

  _showThemeWizard(colors, wallpaper, callback) {
    const wizardWin = new $Window({
      title: "Theme Wizard",
      outerWidth: 350,
      outerHeight: 400,
      resizable: false,
      icons: this.icon,
      className: "theme-wizard-app",
    });

    let currentColors = JSON.parse(JSON.stringify(colors)); // Deep copy
    let currentWallpaper = wallpaper;
    let wallpaperDataUrl = null;

    const showStep1 = () => {
      wizardWin.$content.html(""); // Clear content

      const colorListContainer = document.createElement("div");
      colorListContainer.className = "color-list-container";

      currentColors.forEach((color) => {
        const colorItem = document.createElement("div");
        colorItem.className = "color-item";

        const colorInput = document.createElement("input");
        colorInput.type = "color";
        colorInput.value = this._rgbToHex(color.value);
        colorInput.addEventListener("change", (event) => {
          color.value = this._hexToRgb(event.target.value);
        });
        colorItem.appendChild(colorInput);

        const colorLabel = document.createElement("label");
        colorLabel.textContent = color.name;
        colorItem.appendChild(colorLabel);

        colorListContainer.appendChild(colorItem);
      });

      wizardWin.$content.append(colorListContainer);

      const buttonContainer = document.createElement("div");
      buttonContainer.className = "wizard-buttons";

      const nextButton = document.createElement("button");
      nextButton.textContent = "Next";
      nextButton.addEventListener("click", showStep2);
      buttonContainer.appendChild(nextButton);

      const cancelButton = document.createElement("button");
      cancelButton.textContent = "Cancel";
      cancelButton.addEventListener("click", () => wizardWin.close());
      buttonContainer.appendChild(cancelButton);

      wizardWin.$content.append(buttonContainer);
    };

    const showStep2 = () => {
      wizardWin.$content.html(""); // Clear content

      const wallpaperContainer = document.createElement("div");
      wallpaperContainer.className = "wallpaper-container";

      const fileInput = document.createElement("input");
      fileInput.type = "file";
      fileInput.accept = "image/*";
      wallpaperContainer.appendChild(fileInput);

      const preview = document.createElement("img");
      preview.className = "wallpaper-preview";
      preview.style.display = "none";
      wallpaperContainer.appendChild(preview);

      if (currentWallpaper) {
        const initialWallpaperText = document.createElement("p");
        initialWallpaperText.textContent = `Current wallpaper: ${currentWallpaper}`;
        wallpaperContainer.insertBefore(
          initialWallpaperText,
          fileInput.nextSibling,
        );
      }

      fileInput.addEventListener("change", (event) => {
        const file = event.target.files[0];
        if (file) {
          const reader = new FileReader();
          reader.onload = (e) => {
            wallpaperDataUrl = e.target.result;
            preview.src = wallpaperDataUrl;
            preview.style.display = "block";
          };
          reader.readAsDataURL(file);
        }
      });

      wizardWin.$content.append(wallpaperContainer);

      const buttonContainer = document.createElement("div");
      buttonContainer.className = "wizard-buttons";

      const backButton = document.createElement("button");
      backButton.textContent = "Back";
      backButton.addEventListener("click", showStep1);
      buttonContainer.appendChild(backButton);

      const nextButton = document.createElement("button");
      nextButton.textContent = "Next";
      nextButton.addEventListener("click", showStep3);
      buttonContainer.appendChild(nextButton);

      wizardWin.$content.append(buttonContainer);
    };

    const showStep3 = () => {
      wizardWin.$content.html(""); // Clear content

      const confirmationText = document.createElement("p");
      confirmationText.textContent =
        "The theme will be previewed. Click Finish to apply the changes.";
      wizardWin.$content.append(confirmationText);

      const buttonContainer = document.createElement("div");
      buttonContainer.className = "wizard-buttons";

      const backButton = document.createElement("button");
      backButton.textContent = "Back";
      backButton.addEventListener("click", showStep2);
      buttonContainer.appendChild(backButton);

      const finishButton = document.createElement("button");
      finishButton.textContent = "Finish";
      finishButton.addEventListener("click", () => {
        callback({ colors: currentColors, wallpaper: wallpaperDataUrl });
        wizardWin.close();
      });
      buttonContainer.appendChild(finishButton);

      wizardWin.$content.append(buttonContainer);
    };

    showStep1();
  }
}
