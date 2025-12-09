import { IFrameApplication } from "../IFrameApplication.js";

export class KeenApp extends IFrameApplication {
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
    iframe.src = "games/keen/index.html";
    iframe.style.width = "100%";
    iframe.style.height = "100%";
    iframe.style.border = "none";

    win.$content.html(iframe.outerHTML);

    this.iframe = win.$content.find("iframe")[0];
    this._setupIframeForInactivity(this.iframe);

    return win;
  }

  _onLaunch() {
    this.win.focus();
  }
}
