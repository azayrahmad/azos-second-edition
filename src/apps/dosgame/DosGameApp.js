import { IFrameApplication } from "../IFrameApplication.js";

export class DosGameApp extends IFrameApplication {
  constructor(config) {
    super(config);
  }

  _createWindow(gameConfig) {
    const win = new $Window({
      title: gameConfig.title || this.title,
      outerWidth: gameConfig.width || this.width,
      outerHeight: gameConfig.height || this.height,
      resizable:
        gameConfig.resizable !== undefined
          ? gameConfig.resizable
          : this.resizable !== undefined
            ? this.resizable
            : false,
      maximizable:
        gameConfig.maximizable !== undefined
          ? gameConfig.maximizable
          : this.maximizable !== undefined
            ? this.maximizable
            : false,
      icons: gameConfig.icon || this.icon,
    });

    const iframe = document.createElement("iframe");
    iframe.src = gameConfig.gameUrl;
    iframe.style.width = "100%";
    iframe.style.height = "100%";
    iframe.style.border = "none";

    // Instead of appending, set the inner HTML to allow $Window.js to observe
    win.$content.html(iframe.outerHTML);

    // Get the actual iframe element that was added to the DOM
    this.iframe = win.$content.find("iframe")[0];
    this._setupIframeForInactivity(this.iframe);

    return win;
  }

  _onLaunch() {
    this.win.focus();
  }
}
