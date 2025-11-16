import { Application } from "./Application.js";

export class IFrameApplication extends Application {
  constructor(config, url) {
    super(config);
    this.url = url;
  }

  _createWindow() {
    const win = new $Window({
      id: this.id,
      title: this.title,
      icons: {
        16: this.icon[16],
      },
      width: this.width,
      height: this.height,
      resizable: this.resizable,
      minimizeButton: this.minimizeButton,
      maximizeButton: this.maximizeButton,
    });

    const iframe = document.createElement("iframe");
    iframe.src = this.url;
    iframe.style.width = "100%";
    iframe.style.height = "100%";
    iframe.style.border = "0";

    win.$content.append(iframe);

    this._setupIframeForInactivity(iframe);

    return win;
  }

  _setupIframeForInactivity(iframe) {
    if (!iframe) return;

    const resetTimer = () => window.System.resetInactivityTimer();

    const setupListeners = () => {
      try {
        const iframeDoc = iframe.contentWindow.document;
        iframeDoc.addEventListener("mousemove", resetTimer);
        iframeDoc.addEventListener("mousedown", resetTimer);
        iframeDoc.addEventListener("keydown", resetTimer);
      } catch (e) {
        console.warn(
          `Could not add inactivity listeners to iframe for app ${this.id}. This might be due to cross-origin restrictions.`,
          e,
        );
      }
    };

    iframe.addEventListener("load", setupListeners);

    // If the iframe is already loaded, setup listeners immediately
    if (iframe.contentWindow && iframe.contentWindow.document.readyState === "complete") {
      setupListeners();
    }
  }
}
