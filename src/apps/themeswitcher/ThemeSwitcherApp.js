import { Application } from "../Application.js";
import { getThemes, setTheme, getCurrentTheme } from "../../utils/themeManager.js";
import "./themeswitcher.css";

export class ThemeSwitcherApp extends Application {
  _createWindow() {
    const win = new $Window({
      title: this.title,
      width: this.width,
      height: this.height,
      resizable: this.resizable,
      icons: this.icon,
    });

    // Add a data attribute to the window for easier selection in tests
    win.element.dataset.appId = this.id;

    win.$content.innerHTML = `
      <div class="theme-switcher-container">
        <div class="field-row">
          <label for="theme-select">Choose a theme:</label>
          <div class="select-wrapper">
            <select id="theme-select"></select>
            <button class="select-arrow" aria-hidden="true"></button>
          </div>
        </div>
        <div class="field-row" style="justify-content: flex-end;">
          <button id="apply-theme-btn">Apply</button>
        </div>
      </div>
    `;
    return win;
  }

  _onLaunch() {
    const select = this.win.$content.find('#theme-select')[0];
    const applyBtn = this.win.$content.find('#apply-theme-btn')[0];
    const themes = getThemes();
    const currentTheme = getCurrentTheme();

    for (const theme of Object.values(themes)) {
      const option = document.createElement('option');
      option.value = theme.id;
      option.textContent = theme.name;
      if (theme.id === currentTheme) {
        option.selected = true;
      }
      select.appendChild(option);
    }

    applyBtn.addEventListener('click', () => {
      const selectedTheme = select.value;
      setTheme(selectedTheme);
    });
  }
}
