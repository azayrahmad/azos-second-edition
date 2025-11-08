import { ShowDialogWindow } from "./DialogWindow.js";

export class ProgressWindow {
  constructor(options) {
    this.title = options.title || "Progress";
    this.win = null;
    this.progressBar = null;
    this.statusText = null;
    this._createWindow();
  }

  _createWindow() {
    const content = document.createElement("div");
    content.style.padding = "10px";
    content.style.width = "300px";

    this.statusText = document.createElement("div");
    this.statusText.textContent = "Please wait...";
    this.statusText.style.marginBottom = "10px";
    content.appendChild(this.statusText);

    const progressIndicator = document.createElement("div");
    progressIndicator.className = "progress-indicator segmented";
    content.appendChild(progressIndicator);

    this.progressBar = document.createElement("span");
    this.progressBar.className = "progress-indicator-bar";
    this.progressBar.style.width = "0%";
    progressIndicator.appendChild(this.progressBar);

    this.win = ShowDialogWindow({
      title: this.title,
      content: content,
      modal: true,
      buttons: {}, // No buttons
    });
  }

  update(progress, text) {
    if (this.progressBar) {
      this.progressBar.style.width = `${progress * 100}%`;
    }
    if (this.statusText) {
      this.statusText.textContent = text;
    }
  }

  close() {
    if (this.win) {
      this.win.close();
    }
  }
}
