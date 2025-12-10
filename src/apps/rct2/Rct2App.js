
import { Application } from "../Application.js";

export class Rct2App extends Application {
  constructor(config) {
    super(config);
  }

  _createWindow() {
    const win = new $Window({
      title: "RollerCoaster Tycoon 2",
      id: this.id,
      width: 800,
      height: 600,
      resizable: true,
      icons: this.icon,
    });

    const iframe = document.createElement("iframe");
    iframe.src = "https://orct2.csh.rit.edu/";
    iframe.style.width = "100%";
    iframe.style.height = "100%";
    iframe.style.border = "none";

    win.$content.html(iframe.outerHTML);

    return win;
  }
}
