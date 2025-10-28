import "./styles/cursors.css";
import "./style.css";
import { themes } from "./config/themes.js";
import { setupCounter } from "./counter.js";
import { initDesktop } from "./components/desktop.js";
import { getItem, LOCAL_STORAGE_KEYS } from "./utils/localStorage.js";
import { apps, appClasses } from "./config/apps.js";
import { ICONS } from "./config/icons.js";
import { Application } from "./apps/Application.js";
import { registerCustomApp } from "./utils/customAppManager.js";
import desktopConfig from "./config/desktop.json";
import { taskbar } from "./components/taskbar.js";
import { ShowDialogWindow } from "./components/DialogWindow.js";
import { playSound } from "./utils/soundManager.js";

// Window Management System
class WindowManagerSystem {
  constructor() {
    this._zIndex = 1000;
    this.minimizedWindows = new Map();
  }

  incrementZIndex() {
    return ++this._zIndex;
  }

  getHighestZIndex() {
    return this._zIndex;
  }

  minimizeWindow(win, skipTaskbarUpdate = false) {
    if (!win?.id) return;

    // Access the $window jQuery object from the DOM element
    const $window = win.$window || $(win).closest(".window").data("$window");
    if ($window && typeof $window.minimize === "function") {
      $window.minimize();
    } else {
      console.warn("Window element does not have minimize method:", win);
      win.style.display = "none";
      win.isMinimized = true;
    }

    // Update taskbar button if needed
    if (!skipTaskbarUpdate) {
      taskbar.updateTaskbarButton(win.id, false, true);
    }
  }

  restoreWindow(win) {
    if (!win?.id) return;

    // Access the $window jQuery object from the DOM element
    const $window = win.$window || $(win).closest(".window").data("$window");

    if ($window && typeof $window.unminimize === "function") {
      $window.unminimize();
      $window.bringToFront();
    } else {
      console.warn("Window element does not have unminimize method:", win);
      win.style.display = "";
      win.isMinimized = false;
    }

    // Update taskbar button
    taskbar.updateTaskbarButton(win.id, true, false);
  }

  updateTitleBarClasses(win) {
    if (!win) return;

    // Remove active class from all windows
    document.querySelectorAll(".app-window").forEach((w) => {
      w.querySelector(".title-bar")?.classList.remove("active");
    });

    // Add active class to current window
    win.querySelector(".title-bar")?.classList.add("active");
  }
}

// Initialize the systems
window.System = new WindowManagerSystem();

async function initializeOS() {
  // Create and show the progress window using the $Window constructor
  const progressWindow = new $Window({
    title: "Initializing azOS",
    outerWidth: 500,
    resizable: false,
    maximizeButton: false,
    minimizeButton: false,
    closeButton: false,
  });
  progressWindow.$content.append(`
    <div class="progress-bar" style="padding: 10px;">
      <p class="progress-text">Loading...</p>
      <div class="progress-indicator segmented" style="width: 100%; box-sizing: border-box;">
      <span class="progress-indicator-bar" style="width: 0%;"></span>
    </div>
  `);

  $("body").append(progressWindow.$window);
  progressWindow.center();

  // Function to update the progress bar
  function updateProgress(percentage, text = "Loading...") {
    if (!progressWindow) return;
    progressWindow
      .find(".progress-indicator-bar")
      .css("width", `${percentage}%`);
    progressWindow.find(".progress-text").text(text);
  }

  function loadCustomApps() {
    const savedApps = getItem(LOCAL_STORAGE_KEYS.CUSTOM_APPS) || [];
    savedApps.forEach((appInfo) => {
      registerCustomApp(appInfo);
    });
  }

  function loadThemeStylesheets() {
    Object.values(themes).forEach((theme) => {
      if (theme.id === "default") return;
      const link = document.createElement("link");
      link.id = `${theme.id}-theme`;
      link.rel = "stylesheet";
      link.href = `./os-gui/${theme.stylesheet}`;
      link.disabled = true;
      document.head.appendChild(link);
    });
  }

  // Simulate initialization tasks with progress updates
  updateProgress(20, "Loading themes...");
  await new Promise((resolve) => setTimeout(resolve, 50));

  loadThemeStylesheets();
  updateProgress(40, "Loading custom applications...");
  await new Promise((resolve) => setTimeout(resolve, 50));

  loadCustomApps();
  updateProgress(60, "Initializing taskbar...");
  await new Promise((resolve) => setTimeout(resolve, 50));

  taskbar.init();
  updateProgress(80, "Setting up desktop...");
  await new Promise((resolve) => setTimeout(resolve, 50));

  initDesktop();
  updateProgress(100, "azOS Ready!");
  await new Promise((resolve) => setTimeout(resolve, 50));

  // Close the progress window using its own method
  progressWindow.close();

  window.ShowDialogWindow = ShowDialogWindow;
  window.playSound = playSound;
  console.log("azOS initialized");

  playSound("WindowsLogon");
}

initializeOS();
