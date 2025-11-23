import { IFrameApplication } from "../IFrameApplication.js";

export class BuyMeACoffeeApp extends IFrameApplication {
  constructor(config) {
    super(config);
  }

  _createWindow() {
    const win = new $Window({
      title: this.config.title,
      icon: this.config.icon,
      width: 300,
      height: 450,
      resizable: true,
      id: this.id,
    });

    const iframe = document.createElement("iframe");
    iframe.src =
      "https://ko-fi.com/azayrahmad/?hidefeed=true&widget=true&embed=true&preview=true";
    iframe.style.width = "100%";
    iframe.style.height = "100%";
    iframe.style.border = "none";

    win.$content.append(iframe);
    this._setupIframeForInactivity(iframe);

    return win;
  }
}
