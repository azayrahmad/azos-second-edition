import { Application } from "../Application.js";
import { launchApp } from "../../utils/appManager.js";
import { playSound } from "../../utils/soundManager.js";
import { ICONS } from "../../config/icons.js";
import warningIconUrl from "../../assets/icons/msg_warning-0.png";

export class BuggyProgramApp extends Application {
  static config = {
    id: "buggyprogram",
    title: "buggyprogram.exe",
    description:
      "An intentionally buggy program that leaves trails when moved.",
    icon: ICONS.shell,
    width: 450,
    height: 200,
    resizable: true,
    closeButton: false,
  };

  _createWindow() {
    const win = new window.$Window({
      title: this.config.title,
      width: this.config.width,
      height: this.config.height,
      resizable: this.config.resizable,
      minimizeButton: false,
      maximizeButton: false,
      icons: this.config.icon,
    });

    const content = `
      <div style="display: flex; align-items: flex-start; padding: 10px; gap: 15px;">
        <img src="${warningIconUrl}" alt="Warning" width="32" height="32" />
        <div style="text-align: left; flex-grow: 1;">
          <span>This program has performed an illegal operation and will be shut down.</span>
          <br />
          <span>If the problem persists, contact the program vendor.</span>
        </div>
      </div>

      <div class="button-group" style="text-align: center; display: block;">
        <button class="ok-button" style="min-width: 80px;">OK</button>
      </div>
    `;
    win.$content.html(content);

    const okButton = win.$content.find(".ok-button")[0];
    okButton.addEventListener("click", () => {
      launchApp("buggyprogram");
    });

    setTimeout(() => {
      okButton.focus();
      okButton.classList.add("default");
    }, 0);

    playSound("SystemExclamation");

    setTimeout(() => {
      const desktop = document.querySelector(".desktop");
      if (!desktop) return;

      const trailsParent = document.createElement("div");
      trailsParent.className = "buggy-window-trails";
      desktop.appendChild(trailsParent);

      const observer = new MutationObserver(() => {
        const trail = win.element.cloneNode(true);
        trail.style.pointerEvents = "none";
        trail.style.zIndex = parseInt(win.element.style.zIndex || "0") - 1;
        trailsParent.appendChild(trail);
      });
      observer.observe(win.element, {
        attributes: true,
        attributeFilter: ["style"],
      });

      const dispose = win.onClosed(() => {
        observer.disconnect();
        if (trailsParent.parentNode) {
          desktop.removeChild(trailsParent);
        }
        dispose(); // self-disposing listener
      });
    }, 100);

    win.on("close", () => {
      launchApp("buggyprogram");
    });
    return win;
  }
}
