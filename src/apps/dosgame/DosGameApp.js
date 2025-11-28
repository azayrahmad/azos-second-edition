import { IFrameApplication } from "../IFrameApplication.js";

export class DosGameApp extends IFrameApplication {
  constructor(config) {
    super(config);
  }

  _createWindow() {
    const win = new $Window({
      title: this.title,
      outerWidth: 640,
      outerHeight: 480,
      resizable: false,
      maximizable: false,
      icons: this.icon,
    });

    const iframe = document.createElement("iframe");
    iframe.src = "games/dos/index.html";
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
