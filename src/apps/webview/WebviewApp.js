import { Application } from "../Application.js";

export class WebviewApp extends Application {
  _createWindow() {
    const win = new window.$Window({
      title: this.title,
      width: this.width,
      height: this.height,
      resizable: this.resizable,
      id: this.id,
    });
    this.win = win;

    const iframe = document.createElement("iframe");
    iframe.style.width = "100%";
    iframe.style.height = "100%";
    iframe.style.border = "none";
    win.$content.append(iframe);

    // Some sites block being embedded in an iframe.
    // We can't directly know this, so we'll use a little hack.
    iframe.addEventListener("load", () => {
      try {
        // Accessing the contentDocument will throw a cross-origin error
        // if the site has prevented embedding.
        const a = iframe.contentDocument;
      } catch (e) {
        // If we get an error, it means the site is likely blocked.
        // Fallback to opening in a new window.
        win.close(); // Close our app window
        window.open(this.url, "_blank");
      }
    });

    iframe.src = this.url;

    return win;
  }

  async _onLaunch(data) {
    if (data && data.url) {
      this.url = data.url;
      this.win.title(data.title || "WebView");
      this.win.$content.find("iframe").attr("src", this.url);
    }
  }
}
