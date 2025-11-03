import { Application } from "../Application.js";
import { soundSchemes } from "../../config/sound-schemes.js";
import { themes } from "../../config/themes.js";
import { getCurrentTheme } from "../../utils/themeManager.js";
import { playSound } from "../../utils/soundManager.js";

export class SoundSchemeExplorerApp extends Application {
  constructor(options) {
    super(options);
    this.currentSchemeName = "";
  }

  _createWindow() {
    const win = new $Window({
      title: "Sound Scheme Explorer",
      width: 400,
      height: 300,
      resizable: true,
      id: this.id,
    });

    this._onOpen(win);

    return win;
  }

  _onOpen(win) {
    const content = `
      <div class="sound-scheme-explorer">
        <div class="toolbar">
          <label for="sound-scheme-select">Sound Scheme:</label>
          <select id="sound-scheme-select"></select>
        </div>
        <div class="sound-list"></div>
      </div>
    `;
    win.$content.append(content);
    win.$content.addClass("sound-scheme-explorer-content");

    this.select = win.$content.find("#sound-scheme-select")[0];
    this.soundList = win.$content.find(".sound-list")[0];

    this._populateSchemes();
    this._setDefaultScheme();

    this.select.addEventListener("change", () =>
      this._updateSoundList(this.select.value),
    );
  }

  _populateSchemes() {
    const schemeNames = Object.keys(soundSchemes);
    schemeNames.forEach((name) => {
      const option = document.createElement("option");
      option.value = name;
      option.textContent = name;
      this.select.appendChild(option);
    });
  }

  _setDefaultScheme() {
    const currentThemeKey = getCurrentTheme();
    const currentTheme = themes[currentThemeKey];
    this.currentSchemeName = currentTheme.soundScheme || "Default";
    this.select.value = this.currentSchemeName;
    this._updateSoundList(this.currentSchemeName);
  }

  _updateSoundList(schemeName) {
    this.soundList.innerHTML = "";
    const scheme = soundSchemes[schemeName];
    if (!scheme) return;

    for (const [eventName, soundFile] of Object.entries(scheme)) {
      if (soundFile) {
        const soundItem = document.createElement("div");
        soundItem.className = "sound-item";
        soundItem.innerHTML = `
          <button class="play-btn" data-sound-event="${eventName}">
            <span class="play-icon"></span>
          </button>
          <span>${eventName}</span>
        `;
        this.soundList.appendChild(soundItem);
      }
    }

    this.soundList.querySelectorAll(".play-btn").forEach((button) => {
      button.addEventListener("click", () => {
        const eventName = button.dataset.soundEvent;
        const scheme = soundSchemes[this.select.value];
        const soundToPlay = scheme[eventName];
        if (soundToPlay) {
          const audio = new Audio(soundToPlay);
          audio.play();
        }
      });
    });
  }
}
