import { Application } from "../Application.js";

export class TransportTycoonApp extends Application {
  _createWindow() {
    const win = new $Window({
      title: this.config.title,
      icons: this.config.icon,
      outerWidth: this.config.width,
      outerHeight: this.config.height,
      id: this.config.id,
      resizable: true,
      maximizable: true,
      minimizable: true,
      closable: true,
    });

    const iframe = document.createElement("iframe");
    iframe.src = "https://atalbayrak.github.io/openttd/";
    iframe.style.width = "100%";
    iframe.style.height = "100%";
    iframe.style.border = "none";

    win.$content.append(iframe);

    return win;
  }
}
