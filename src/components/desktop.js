/**
 * Win98DesktopManager - Handles desktop icons and desktop interactions
 */
import { init } from "./taskbar.js";
import { apps } from "../config/apps.js";
import { handleAppAction } from "../utils/appManager.js";

function createDesktopIcon(app) {
  const iconDiv = document.createElement("div");
  iconDiv.className = "desktop-icon";
  iconDiv.setAttribute("title", app.title);
  iconDiv.setAttribute("data-app-id", app.id);

  const iconInner = document.createElement("div");
  iconInner.className = "icon";

  const iconImg = document.createElement("img");
  iconImg.src = app.icon;
  iconInner.appendChild(iconImg);

  const iconLabel = document.createElement("div");
  iconLabel.className = "icon-label";
  iconLabel.textContent = app.title;

  iconDiv.appendChild(iconInner);
  iconDiv.appendChild(iconLabel);

  return iconDiv;
}

export function setupIcons() {
  const desktop = document.querySelector(".desktop");

  // Clear existing icons
  desktop.innerHTML = "";

  // Create icons for each app
  apps.forEach((app) => {
    const icon = createDesktopIcon(app);

    // Set up icon click to highlight
    icon.addEventListener("click", function () {
      // Remove highlight from all icons and icon-labels
      document
        .querySelectorAll(".desktop-icon .icon img, .desktop-icon .icon-label")
        .forEach((element) => {
          element.classList.remove(
            "highlighted-icon",
            "highlighted-label",
            "selected",
          );
        });

      // Add highlight to the clicked icon and icon-label
      const iconImg = this.querySelector(".icon img");
      const iconLabel = this.querySelector(".icon-label");
      if (iconImg) iconImg.classList.add("highlighted-icon");
      if (iconLabel) {
        iconLabel.classList.add("highlighted-label");
        iconLabel.classList.add("selected");
      }
    });

    // Double-click to execute app action
    icon.addEventListener("dblclick", () => {
      handleAppAction(app);
    });

    desktop.appendChild(icon);
  });
}

// Initialize desktop behavior
export function initDesktop() {
  console.log("Initializing Win98 Desktop Manager...");
  setupIcons();
  init(); // Initialize the taskbar manager
}
