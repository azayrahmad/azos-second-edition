import { IFrameApplication } from "../IFrameApplication.js";
import { ICONS } from "../../config/icons.js";

export class DosGameApp extends IFrameApplication {
  static config = [
    {
      id: "dosgame",
      title: "DOS Game",
      description: "A generic launcher for various DOS games.",
      icon: ICONS.doom,
      width: 640,
      height: 480,
      resizable: false,
      maximizable: false,
      isSingleton: false,
    },
    {
      id: "doom",
      title: "Doom",
      description: "Play the classic game Doom.",
      icon: ICONS.doom,
      gameUrl: "games/doom/index.html",
      width: 800,
      height: 500,
      resizable: true,
      maximizable: true,
    },
    {
      id: "simcity2000",
      title: "SimCity 2000 Demo",
      description: "Play the SimCity 2000 demo.",
      icon: ICONS.simcity2000,
      gameUrl: "games/dos/simcity2000/index.html",
      width: 640,
      height: 480,
      resizable: true,
      maximizable: true,
    },
  ];

  constructor(config) {
    super(config);
  }

  _createWindow() {
    const win = new $Window({
      title: this.title,
      outerWidth: this.width,
      outerHeight: this.height,
      resizable: this.resizable,
      maximizable: this.maximizable,
      icons: this.icon,
    });
    const iframe = document.createElement("iframe");
    iframe.src = this.config.gameUrl;
    iframe.style.width = "100%";
    iframe.style.height = "100%";
    iframe.style.border = "none";

    // Instead of appending, set the inner HTML to allow $Window.js to observe
    win.$content.html(iframe.outerHTML);

    // Get the actual iframe element that was added to the DOM
    this.iframe = win.$content.find("iframe")[0];
    this._setupIframeForInactivity(this.iframe);

    win.on("close", () => {
      if (
        this.iframe &&
        this.iframe.contentWindow &&
        typeof this.iframe.contentWindow.saveDoomProgress === "function"
      ) {
        this.iframe.contentWindow.saveDoomProgress();
      }
    });

    return win;
  }

  _onLaunch() {
    this.win.focus();
  }
}
