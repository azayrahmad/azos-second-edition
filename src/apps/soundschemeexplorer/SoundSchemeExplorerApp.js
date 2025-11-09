import { Application } from "../Application.js";
import { soundSchemes } from "../../config/sound-schemes.js";
import { themes } from "../../config/themes.js";
import { getCurrentTheme } from "../../utils/themeManager.js";
import { Select } from "/public/os-gui/Select.js";

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
          <label>Sound Scheme:</label>
        </div>
        <div class="sound-list"></div>
      </div>
    `;
    win.$content.append(content);
    win.$content.addClass("sound-scheme-explorer-content");

    const toolbar = win.$content.find(".toolbar")[0];
    this.soundList = win.$content.find(".sound-list")[0];

    const schemeOptions = Object.keys(soundSchemes).map(name => ({
        value: name,
        label: name
    }));

    this.select = new Select(schemeOptions);
    toolbar.appendChild(this.select.element);

    this._setDefaultScheme();

    this.select.element.addEventListener("change", (e) =>
      this._updateSoundList(e.detail.value),
    );
  }

  _setDefaultScheme() {
    const currentThemeKey = getCurrentTheme();
    const currentTheme = themes[currentThemeKey];
    this.currentSchemeName = currentTheme.soundScheme || "Default";
    this.select.setValue(this.currentSchemeName);
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
