import { Application } from "../Application.js";
import "./media-player.css";
import mediaPlayerHTML from "./media-player.html?raw";

export class MediaPlayerApp extends Application {
  constructor(config) {
    super(config);
  }

  _createWindow() {
    const win = new $Window({
      title: this.title,
      outerWidth: this.width || 480,
      outerHeight: this.height || 360,
      resizable: this.resizable,
      icons: this.icon,
    });

    const menuBar = this._createMenuBar();
    win.setMenuBar(menuBar);

    win.$content.append(this._createUI());

    return win;
  }

  _createMenuBar() {
    return new MenuBar({
      "&File": [
        {
          label: "&Open...",
          action: () => this._openFile(),
        },
        "MENU_DIVIDER",
        {
          label: "E&xit",
          action: () => this.win.close(),
        },
      ],
      "&Help": [
        {
          label: "&About Media Player",
          action: () => alert("A simple media player."),
        },
      ],
    });
  }

  _createUI() {
    const container = document.createElement("div");
    container.className = "media-player-container";

    container.innerHTML = mediaPlayerHTML;
    return container;
  }

  _openFile() {
    const input = document.createElement("input");
    input.type = "file";
    input.accept = "audio/*,video/*";
    input.onchange = (e) => {
      const file = e.target.files[0];
      if (file) {
        if (file.type.startsWith("audio/")) {
          this.mediaView.style.display = "none";
          const windowChromeHeight =
            this.win.element.offsetHeight - this.win.$content.get(0).offsetHeight;
          const newHeight = this.mediaControls.offsetHeight + windowChromeHeight;
          this.win.resizeTo(this.win.element.offsetWidth, newHeight);
        } else {
          this.mediaView.style.display = "block";
          this.win.resizeTo(this.win.element.offsetWidth, this.originalHeight);
        }

        const url = URL.createObjectURL(file);
        this.mediaElement.src = url;
        this.mediaElement.play();
        this.win.title(`${file.name} - Media Player`);
      }
    };
    input.click();
  }

  _setControlsDisabled(disabled) {
    this.playPauseButton.disabled = disabled;
    this.stopButton.disabled = disabled;
    this.progressBar.disabled = disabled;
    this.volumeSlider.disabled = disabled;
    this.seekBackwardButton.disabled = disabled;
    this.fastRewindButton.disabled = disabled;
    this.fastForwardButton.disabled = disabled;
    this.seekForwardButton.disabled = disabled;
    this.muteButton.disabled = disabled;

    if (disabled) {
      this.mediaElement.style.display = "none";
      if (this.defaultMediaImage) {
        this.defaultMediaImage.style.display = "block";
      }
      this.win.title(this.config.title); // Reset title to initial app title
      this.mediaElement.src = ""; // Clear media source
    } else {
      this.mediaElement.style.display = "block";
      if (this.defaultMediaImage) {
        this.defaultMediaImage.style.display = "none";
      }
    }
  }

  _onLaunch() {
    this.mediaView = this.win.element.querySelector(".media-view");
    this.mediaControls = this.win.element.querySelector(".media-controls");
    this.mediaElement = this.win.element.querySelector(".media-element");
    this.defaultMediaImage = this.win.element.querySelector(
      ".media-player-default-image",
    );
    this.playPauseButton = this.win.element.querySelector(".play-pause");
    this.stopButton = this.win.element.querySelector(".stop");
    this.originalHeight = this.win.element.offsetHeight;
    this.progressBar = this.win.element.querySelector(".progress-bar");
    this.volumeSlider = this.win.element.querySelector(".volume-slider");
    this.seekBackwardButton = this.win.element.querySelector(".seek-backward");
    this.fastRewindButton = this.win.element.querySelector(".fast-rewind");
    this.fastForwardButton = this.win.element.querySelector(".fast-forward");
    this.seekForwardButton = this.win.element.querySelector(".seek-forward");
    this.muteButton = this.win.element.querySelector(".mute");

    this.playPauseButton.addEventListener("click", () => {
      if (this.mediaElement.paused) {
        this.mediaElement.play();
      } else {
        this.mediaElement.pause();
      }
    });

    this.stopButton.addEventListener("click", () => {
      this.mediaElement.pause();
      this.mediaElement.currentTime = 0;
      this._setControlsDisabled(true);
    });

    this.mediaElement.addEventListener("timeupdate", () => {
      const percentage =
        (this.mediaElement.currentTime / this.mediaElement.duration) * 100;
      this.progressBar.value = percentage;
    });

    this.progressBar.addEventListener("input", () => {
      const time = (this.progressBar.value / 100) * this.mediaElement.duration;
      this.mediaElement.currentTime = time;
    });

    this.volumeSlider.addEventListener("input", () => {
      this.mediaElement.volume = this.volumeSlider.value / 100;
    });

    this.mediaElement.addEventListener("play", () => {
      this.playPauseButton.classList.add("playing");
      this.playPauseButton.title = "Pause";
    });

    this.mediaElement.addEventListener("pause", () => {
      this.playPauseButton.classList.remove("playing");
      this.playPauseButton.title = "Play";
    });

    this.seekBackwardButton.addEventListener("click", () => {
      this.mediaElement.currentTime -= 5;
    });

    this.fastRewindButton.addEventListener("click", () => {
      this.mediaElement.currentTime = 0;
    });

    this.fastForwardButton.addEventListener("click", () => {
      this.mediaElement.currentTime = this.mediaElement.duration;
    });

    this.seekForwardButton.addEventListener("click", () => {
      this.mediaElement.currentTime += 5;
    });

    this.muteButton.addEventListener("click", () => {
      this.mediaElement.muted = !this.mediaElement.muted;
      this.muteButton.classList.toggle("muted", this.mediaElement.muted);
    });

    this.mediaElement.addEventListener("loadeddata", () => {
      this._setControlsDisabled(false);
    });

    this.mediaElement.addEventListener("ended", () => {
      this.playPauseButton.classList.remove("playing");
      this.playPauseButton.title = "Play";
      this._setControlsDisabled(true);
    });

    this._setControlsDisabled(true);
  }
}
