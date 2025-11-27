import { Application } from "../Application.js";
import { ShowDialogWindow } from "../../components/DialogWindow.js";
import { loadThemeParser } from "../../utils/themeManager.js";
import { saveCustomTheme, getThemes } from "../../utils/themeManager.js";
import "./color-scheme-loader.css";

export class ColorSchemeLoaderApp extends Application {
  constructor(config) {
    super(config);
    this.customThemeProperties = null;
    this.originalFilename = "";
  }

  _createWindow() {
    const win = new $Window({
      id: this.id,
      title: this.title,
      outerWidth: 350,
      outerHeight: 400,
      resizable: this.resizable,
      icons: this.icon,
      className: "colorschemeloader-app",
    });
    this.win = win;
    this.showIntroStep();
    return win;
  }

  showIntroStep() {
    this.win.$content.html(
      "<div><h1>Create a new color scheme</h1><p>This wizard will help you create a new color scheme from a .theme file.</p></div><div class='wizard-buttons'><button class='next'>Next</button><button class='cancel'>Cancel</button></div>"
    );
    this.win.$content
      .find(".next")
      .on("click", () => this.showLoadFileStep());
    this.win.$content.find(".cancel").on("click", () => this.win.close());
  }

  showLoadFileStep() {
    this.win.$content.html(
      "<div><h1>Load a .theme file</h1><p>Select a .theme file to load the color scheme from.</p><input type='file' accept='.theme' /></div><div class='wizard-buttons'><button class='next' disabled>Next</button><button class='cancel'>Cancel</button></div>"
    );

    const fileInput = this.win.$content.find("input[type='file']");
    const nextButton = this.win.$content.find(".next");

    fileInput.on("change", (event) => {
      const file = event.target.files[0];
      if (file) {
        this.loadFile(file).then(() => {
          nextButton.prop("disabled", false);
        });
      } else {
        nextButton.prop("disabled", true);
      }
    });

    nextButton.on("click", () => this.showCustomizeStep());
    this.win.$content.find(".cancel").on("click", () => this.win.close());
  }

  async loadFile(file) {
    this.originalFilename = file.name.replace(/\.[^/.]+$/, "");
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = async (e) => {
        const themeContent = e.target.result;
        try {
          await loadThemeParser();
          const colors = window.getColorsFromThemeFile(themeContent);
          if (colors) {
            this.customThemeProperties = window.generateThemePropertiesFromColors(colors);
            resolve();
          } else {
            ShowDialogWindow({
              title: "Error",
              text: "Could not parse the selected file.",
              buttons: [{ label: "OK" }],
            });
            reject();
          }
        } catch (error) {
          ShowDialogWindow({
            title: "Error",
            text: `An error occurred: ${error.message}`,
            buttons: [{ label: "OK" }],
          });
          reject();
        }
      };
      reader.readAsText(file);
    });
  }

  showCustomizeStep() {
    this.win.$content.html("<div><h1>Customize the color scheme</h1><div class='color-list-container'></div></div><div class='wizard-buttons'><button class='next'>Next</button><button class='cancel'>Cancel</button></div>");
    const colorListContainer = this.win.$content.find(".color-list-container");

    for (const [key, value] of Object.entries(this.customThemeProperties)) {
        const colorItem = document.createElement("div");
        colorItem.className = "color-item";

        const colorInput = document.createElement("input");
        colorInput.type = "color";
        colorInput.value = this._rgbToHex(value);
        colorInput.addEventListener("change", (event) => {
            this.customThemeProperties[key] = this._hexToRgb(event.target.value);
        });
        colorItem.appendChild(colorInput);

        const colorLabel = document.createElement("label");
        colorLabel.textContent = key;
        colorItem.appendChild(colorLabel);

        colorListContainer.append(colorItem);
    }

    this.win.$content.find(".next").on("click", () => this.showFinishStep());
    this.win.$content.find(".cancel").on("click", () => this.win.close());
  }

  showFinishStep() {
    this.win.$content.html("<div><h1>Finish</h1><p>Enter a name for your new color scheme.</p><input type='text' id='scheme-name' /></div><div class='wizard-buttons'><button class='finish'>Finish</button><button class='cancel'>Cancel</button></div>");
    this.win.$content.find("#scheme-name").val(this.originalFilename);
    this.win.$content.find(".finish").on("click", () => this.saveScheme());
    this.win.$content.find(".cancel").on("click", () => this.win.close());
  }

  saveScheme() {
    const name = this.win.$content.find("#scheme-name").val();
    if (!name) {
        ShowDialogWindow({
            title: "Error",
            text: "Please enter a name for the color scheme.",
            buttons: [{ label: "OK" }],
        });
        return;
    }

    const themes = getThemes();
    let finalName = name;
    let counter = 2;
    while (Object.values(themes).some((theme) => theme.name === finalName)) {
      finalName = `${name} (${counter++})`;
    }

    const newThemeId = `custom-${finalName.toLowerCase().replace(/\s+/g, "-")}`;
    const newTheme = {
      id: newThemeId,
      name: finalName,
      stylesheet: null,
      colors: this.customThemeProperties,
      isCustom: true,
    };

    saveCustomTheme(newThemeId, newTheme);
    ShowDialogWindow({
      title: "Success",
      text: `Color scheme "${finalName}" saved successfully.`,
      buttons: [{ label: "OK" }],
    });
    this.win.close();
  }

  _rgbToHex(rgbString) {
    if (!rgbString || !rgbString.match) return '#000000';
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
}
