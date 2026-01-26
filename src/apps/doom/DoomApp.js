import { IFrameApplication } from "../IFrameApplication.js";
import { ICONS } from "../../config/icons.js";

export class DoomApp extends IFrameApplication {
  static config = {
    id: "doom",
    title: "Doom",
    description: "Play the classic game Doom.",
    icon: ICONS.doom,
    gameUrl: "games/doom/index.html",
    width: 800,
    height: 500,
    resizable: true,
    maximizable: true,
    fullscreenAware: true,
  };

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

    win.$content.html(iframe.outerHTML);

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
