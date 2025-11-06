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

    this.shadowRoot = this.previewContainer.attachShadow({ mode: "open" });
    this.shadowRoot.innerHTML = `
      <div class="window">
        <div class="title-bar">
          <div class="title-bar-text">A Window</div>
          <div class="title-bar-controls">
            <button aria-label="Minimize"></button>
            <button aria-label="Maximize"></button>
            <button aria-label="Close"></button>
          </div>
        </div>
        <div class="window-body">
          <p>This is a preview of the theme.</p>
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

  previewTheme(themeId) {
    const themes = getThemes();
    const theme = themes[themeId];

    // Remove existing theme link
    const existingLink = this.shadowRoot.querySelector("link");
    if (existingLink) {
      existingLink.remove();
    }

    if (!theme || !theme.stylesheet) {
      return;
    }

    const link = document.createElement("link");
    link.rel = "stylesheet";
    link.href = `./os-gui/${theme.stylesheet}`;
    this.shadowRoot.appendChild(link);
  }

}
