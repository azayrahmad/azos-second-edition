import { Application } from "../Application.js";
import { NotepadEditor } from "../../components/NotepadEditor.js";
import "./themetocss.css";

export class ThemeToCssApp extends Application {
  constructor(config) {
    super(config);
  }

  _createWindow() {
    const win = new $Window({
      title: this.title,
      outerWidth: this.width,
      outerHeight: this.height,
      resizable: this.resizable,
      icons: this.icon,
      className: "themetocss-app",
    });

    const menuBar = this._createMenuBar(win);
    win.setMenuBar(menuBar);

    const container = document.createElement("div");
    container.className = "themetocss-container";
    win.$content.append(container);

    const editorPane = document.createElement("div");
    editorPane.className = "themetocss-editor-pane";
    container.append(editorPane);

    this.editor = new NotepadEditor(editorPane, { win });
    this.editor.setLanguage("css");
    this.editor.setValue("/* Open a .theme file to see the CSS output */");

    this.previewPane = document.createElement("div");
    this.previewPane.className = "themetocss-preview-pane";
    container.append(this.previewPane);

    this._createPreview();

    return win;
  }

  _createPreview() {
    this.previewPane.innerHTML = `
      <div class="os-window preview-window">
        <div class="title-bar">
          <div class="title-bar-text">Preview Window</div>
          <div class="title-bar-controls">
            <button aria-label="Minimize"></button>
            <button aria-label="Maximize"></button>
            <button aria-label="Close"></button>
          </div>
        </div>
        <div class="window-body">
          <p>This is a preview of the theme.</p>
          <button>OK</button>
        </div>
      </div>
    `;
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

            const previewWindow = this.previewPane.querySelector('.preview-window');
            if (previewWindow) {
              for (const [key, value] of Object.entries(cssProperties)) {
                previewWindow.style.setProperty(key, value);
              }
            }
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
}
