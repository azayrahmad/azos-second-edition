import { IFrameApplication } from "../IFrameApplication.js";
import { getIcon } from "../../utils/iconManager.js";

export class CanabaltApp extends IFrameApplication {
  static config = {
    id: "canabalt",
    title: "Canabalt",
    description: "A fast-paced, endless runner game.",
    get icon() {
      return getIcon("canabalt");
    },
    url: "/games/canabalt/index.html",
    width: 800,
    height: 600,
    resizable: true,
  };

  _createWindow() {
    // Create the main window
    this.win = new window.$Window({
      title: this.config.title,
      width: this.config.width,
      height: this.config.height,
      resizable: this.config.resizable,
      icons: this.config.icon,
      id: this.config.id,
    });

    // Create the iframe
    const iframe = document.createElement("iframe");
    iframe.src = this.config.url;
    iframe.style.width = "100%";
    iframe.style.height = "100%";
    iframe.style.border = "none";

    // Append the iframe to the window's content area
    this.win.$content.append(iframe);

    // Setup inactivity listeners
    this._setupIframeForInactivity(iframe);

    return this.win;
  }
}
