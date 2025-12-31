import { Application } from "../Application.js";
import { ICONS } from "../../config/icons.js";

export class SolitaireApp extends Application {
  static config = {
    id: "solitaire",
    title: "Solitaire",
    icon: ICONS.solitaire,
    width: 660,
    height: 440,
    resizable: false,
  };

  _createWindow() {
    // Create a new window using the $Window component
    const win = new $Window({
      title: this.constructor.config.title,
      innerWidth: this.constructor.config.width,
      innerHeight: this.constructor.config.height,
      resizable: this.constructor.config.resizable,
      icons: this.constructor.config.icon,
    });
    const iframe = document.createElement("iframe");
    iframe.src = "apps/solitaire/index.html";

    // Style the iframe to fill the window's content area
    iframe.style.width = "100%";
    iframe.style.height = "100%";
    iframe.style.border = "none";
    iframe.style.overflow = "hidden";

    // Append the iframe to the window's content
    win.$content.append(iframe);
    return win;
  }
}
