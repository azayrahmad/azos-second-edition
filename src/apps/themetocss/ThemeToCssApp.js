import { Application } from "../Application.js";
import { NotepadEditor } from "../../components/NotepadEditor.js";
import "./themetocss.css";

export class ThemeToCssApp extends Application {
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
      className: "themetocss-app",
    });

    const menuBar = this._createMenuBar(win);
    win.setMenuBar(menuBar);

    const mainContainer = document.createElement("div");
    mainContainer.className = "themetocss-main-container";
    win.$content.append(mainContainer);

    const editorContainer = document.createElement("div");
    editorContainer.className = "themetocss-editor-container";
    mainContainer.appendChild(editorContainer);

    this.editor = new NotepadEditor(editorContainer, { win });
    this.editor.setLanguage("css");
    this.editor.setValue("/* Open a .theme file to see the CSS output */");

    this.swatchContainer = document.createElement("div");
    this.swatchContainer.className = "themetocss-swatch-container";
    mainContainer.appendChild(this.swatchContainer);

    return win;
  }

  _createMenuBar(win) {
    return new MenuBar({
      "&File": [
        {
          label: "&Open",
          action: () => this._openFile(),
        },
        {
          label: "&Save",
          action: () => this._saveFile(),
        },
        {
          label: "E&xit",
          action: () => win.close(),
        },
      ],
    });
  }

  async _openFile() {
    const input = document.createElement("input");
    input.type = "file";
    input.accept = ".theme,.themepack";
    input.onchange = async (event) => {
      const file = event.target.files[0];
      if (!file) return;

      const reader = new FileReader();
      reader.onload = async (e) => {
        const themeContent = e.target.result;
        try {
          await this._loadParserScript();
          const cssProperties = window.parseThemeFileString(themeContent);
          if (cssProperties) {
            const cssFileContent = window.makeThemeCSSFile(cssProperties);
            this.editor.setValue(cssFileContent);
            this._renderSwatches(cssProperties);
          } else {
            this.editor.setValue(
              "/* Error: Failed to parse theme file. See console for details. */",
            );
          }
        } catch (error) {
          console.error(error);
          this.editor.setValue(`/* Error: ${error.message} */`);
        }
      };
      reader.readAsText(file);
    };
    input.click();
  }

  async _saveFile() {
    const content = this.editor.getValue();
    const blob = new Blob([content], { type: "text/css" });

    try {
      const handle = await window.showSaveFilePicker({
        suggestedName: "theme.css",
        types: [
          {
            description: "CSS Files",
            accept: { "text/css": [".css"] },
          },
        ],
      });
      const writable = await handle.createWritable();
      await writable.write(blob);
      await writable.close();
    } catch (err) {
      // Fallback for browsers that don't support the API
      if (err.name !== "AbortError") {
        const a = document.createElement("a");
        a.href = URL.createObjectURL(blob);
        a.download = "theme.css";
        a.click();
        URL.revokeObjectURL(a.href);
      }
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
    this.swatchContainer.innerHTML = ""; // Clear previous swatches

    // Apply all theme properties to the container to resolve CSS variables in SVGs
    for (const [key, value] of Object.entries(cssProperties)) {
      this.swatchContainer.style.setProperty(key, value);
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
        const img = document.createElement("img");
        img.className = "swatch-image";
        img.src = value.slice(5, -2); // Correctly slice url("...")
        if (img.src.startsWith("data:image/svg+xml"))
          img.src = img.src.slice(0, -9);
        swatchItem.appendChild(img);
      }

      this.swatchContainer.appendChild(swatchItem);
    }
  }
}
