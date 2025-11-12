import { Application } from "../Application.js";
import {
  getThemes,
  setTheme,
  saveCustomTheme,
  deleteCustomTheme,
  getCurrentTheme,
  loadThemeParser,
} from "../../utils/themeManager.js";
import { ShowDialogWindow } from "../../components/DialogWindow.js";
import "./desktopthemes.css";

export class DesktopThemesApp extends Application {
  constructor(config) {
    super(config);
    this.themeCssCache = {};
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
      outerWidth: this.width,
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
      this.handleThemeSelection(),
    );

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

    this.populateThemes();

    const actionsContainer = document.createElement("div");
    actionsContainer.className = "actions";
    mainContainer.appendChild(actionsContainer);

    const applyButton = document.createElement("button");
    applyButton.textContent = "Apply";
    actionsContainer.appendChild(applyButton);

    applyButton.addEventListener("click", async () => {
      await setTheme(this.themeSelector.value);
      this.themeSelector.value = "current-settings";
      this.handleThemeSelection();
    });

    return win;
  }

  _createMenuBar(win) {
    return new MenuBar({
      "&File": [{ label: "E&xit", action: () => win.close() }],
    });
  }

  handleCustomThemeLoad() {
    const input = document.createElement("input");
    input.type = "file";
    input.accept = ".theme";
    input.onchange = (event) => {
      const file = event.target.files[0];
      if (!file) {
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
            const newTheme = {
              ...getCurrentTheme(),
              id: "current-settings",
              name: "Current Windows settings",
              stylesheet: null,
              colors: cssProperties,
              wallpaper: updatedTheme.wallpaper,
              isCustom: true,
            };
            setTheme("current-settings", newTheme);
            this.populateThemes();
          });
        } else {
          ShowDialogWindow({
            title: "Error",
            text: "Could not parse the selected file.",
            buttons: [{ label: "OK" }],
          });
        }
      } catch (error) {
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

    const currentTheme = getCurrentTheme();
    const newTheme = {
      ...currentTheme,
      id: newThemeId,
      name: finalName,
      isCustom: true,
    };

    saveCustomTheme(newThemeId, newTheme);
    this.populateThemes();
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
    const allThemes = getThemes();
    const selectedTheme = allThemes[selectedValue];

    if (selectedValue === "load-custom") {
      this.handleCustomThemeLoad();
      return;
    }

    this.saveButton.disabled = false;
    this.deleteButton.disabled = !selectedTheme?.isCustom;

    this.previewTheme(selectedValue);
  }

  populateThemes() {
    const lastSelected = this.themeSelector.value;
    this.themeSelector.innerHTML = "";

    const themes = getThemes();
    const sortedThemes = Object.entries(themes).sort(([, a], [, b]) =>
      a.name.localeCompare(b.name),
    );

    // Add "Current Windows settings" at the top
    const currentSettingsOption = document.createElement("option");
    currentSettingsOption.value = "current-settings";
    currentSettingsOption.textContent = "Current Windows settings";
    this.themeSelector.appendChild(currentSettingsOption);


    for (const [id, theme] of sortedThemes) {
        if(id === "current-settings") continue;
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

    this.themeSelector.value = "current-settings";

    this.handleThemeSelection();
  }

  async previewTheme(themeId) {
    let theme;
    if (themeId === "current-settings") {
        theme = getCurrentTheme();
    } else {
        theme = getThemes()[themeId];
    }
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
    this.previewContainer.style.backgroundImage = theme.wallpaper
      ? `url('${theme.wallpaper}')`
      : "none";
    this.previewContainer.style.backgroundColor =
      variables["Background"] || "#008080";
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
