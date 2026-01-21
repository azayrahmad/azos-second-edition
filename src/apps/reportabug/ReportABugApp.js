import { Application } from "../Application.js";
import { getIcon } from "../../utils/iconManager.js";
import "./reportabug.css";

export default class ReportABugApp extends Application {
  static config = {
    id: "reportabug",
    title: "Report a Bug",
    get icon() {
      return getIcon("SHELL32_24");
    },
    width: 400,
    height: 320,
    resizable: false,
  };

  _createWindow() {
    const win = new $Window({
      title: this.title,
      icon: this.icon,
      width: this.width,
      height: this.height,
      resizable: this.resizable,
    });

    const container = document.createElement("div");
    container.className = "reportabug-container";
    win.$content.appendChild(container);

    const preface = document.createElement("p");
    preface.className = "reportabug-preface";
    preface.textContent =
      "We are sorry you are experiencing an issue. Please provide a detailed description of the bug you encountered. Your feedback is valuable and helps us improve the system.";
    container.appendChild(preface);

    this.textarea = document.createElement("textarea");
    this.textarea.className = "reportabug-textarea";
    this.textarea.placeholder = "Describe the bug here...";
    container.appendChild(this.textarea);

    const buttonContainer = document.createElement("div");
    buttonContainer.className = "reportabug-buttons";
    container.appendChild(buttonContainer);

    this.sendButton = document.createElement("button");
    this.sendButton.textContent = "Send";
    this.sendButton.onclick = () => this.handleSend();
    buttonContainer.appendChild(this.sendButton);

    return win;
  }

  async _onLaunch() {
    // No additional logic needed on launch for this app
  }

  async handleSend() {
    const { ShowDialogWindow } = await import(
      "../../components/DialogWindow.js"
    );

    if (!this.textarea.value.trim()) {
      ShowDialogWindow({
        title: "Error",
        text: "Please enter a bug description.",
        buttons: [{ label: "OK", isDefault: true }],
        parentWindow: this.win,
      });
      return;
    }

    this.sendButton.disabled = true;

    const progressDialogContent = document.createElement("div");
    progressDialogContent.style.padding = "20px";
    progressDialogContent.innerHTML = `
      <p>Sending bug report...</p>
      <div class="progress-indicator segmented" style="width: 100%;">
        <span class="progress-indicator-bar" style="width: 40%;"></span>
      </div>
    `;

    const progressDialog = ShowDialogWindow({
      title: "Sending Report",
      content: progressDialogContent,
      buttons: [],
      width: 300,
    });

    try {
      const response = await fetch("https://resume-chat-api-nine.vercel.app/api/jules-proxy", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          prompt: this.textarea.value,
          source: "win98-web",
        }),
      });

      const result = await response.json();
      progressDialog.close();

      if (response.ok) {
        ShowDialogWindow({
          title: "Report Sent",
          text: `The bug report has been sent with the title '${result.title}'.`,
          buttons: [{ label: "OK", isDefault: true }],
          parentWindow: this.win,
        }).onClosed(() => {
          this.textarea.value = "";
          this.sendButton.disabled = false;
        });
      } else {
        ShowDialogWindow({
          title: "Error",
          text: result.error || "Failed to send the bug report. Please try again in a couple of seconds.",
          buttons: [{ label: "OK", isDefault: true }],
          parentWindow: this.win,
        }).onClosed(() => {
          this.sendButton.disabled = false;
        });
      }
    } catch (error) {
      progressDialog.close();
      ShowDialogWindow({
        title: "Error",
        text: "An unexpected error occurred. Please check your internet connection and try again.",
        buttons: [{ label: "OK", isDefault: true }],
        parentWindow: this.win,
      }).onClosed(() => {
        this.sendButton.disabled = false;
      });
    }
  }
}
