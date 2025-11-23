import { Application } from "./Application.js";

export class IFrameApplication extends Application {
  constructor(config) {
    super(config);
    this.url = config.url; // Store the URL from the config
  }

  _createWindow() {
    const win = new $Window({
      title: this.title,
      icons: this.icon,
      width: this.width,
      height: this.height,
      resizable: this.resizable,
      id: this.id,
    });

    const iframe = document.createElement("iframe");
    iframe.src = this.url;
    iframe.style.width = "100%";
    iframe.style.height = "100%";
    iframe.style.border = "none";

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
    if (
      iframe.contentWindow &&
      iframe.contentWindow.document.readyState === "complete"
    ) {
      setupListeners();
    }
  }
}
