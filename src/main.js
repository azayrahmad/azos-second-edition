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
import { taskbar } from "./components/taskbar.js";
import { ShowDialogWindow } from "./components/DialogWindow.js";
import { playSound } from "./utils/soundManager.js";
import { setTheme, getCurrentTheme } from "./utils/themeManager.js";
import {
  hideBootScreen,
  updateBootLog,
  promptToContinue,
} from "./components/bootScreen.js";
import { preloadThemeAssets } from "./utils/assetPreloader.js";
import { launchApp } from "./utils/appManager.js";
import { createMainUI } from "./components/ui.js";

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
  // Hide the initial "Initializing azOS..." message
  document.getElementById("initial-boot-message").style.display = "none";
  // Show the main boot screen content with two columns
  document.getElementById("boot-screen-content").style.display = "flex";

  // Insert BIOS info
  const biosTextColumn = document.getElementById("bios-text-column");
  if (biosTextColumn) {
    biosTextColumn.innerHTML = `Award Modular BIOS v4.51PG, An Energy Star Ally<br/>Copyright (C) 1984-85, Award Software, Inc.`;
  }

  const browserInfoEl = document.getElementById("browser-info");
  if (browserInfoEl) {
    //browserInfoEl.textContent = `Client: ${navigator.userAgent}`;
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

  updateBootLog("Detecting keyboard... ");
  await new Promise((resolve) => setTimeout(resolve, 500));
  updateBootLog("OK", true);

  updateBootLog("Detecting mouse... ");
  await new Promise((resolve) => setTimeout(resolve, 500));
  updateBootLog("OK", true);

  updateBootLog("Connecting to network... ");
  await new Promise((resolve) => setTimeout(resolve, 1000));
  updateBootLog(navigator.onLine ? "OK" : "Offline", true);

  updateBootLog("Preloading default theme assets... ");
  await preloadThemeAssets("default");
  await new Promise((resolve) => setTimeout(resolve, 100));
  updateBootLog("OK", true);

  const currentTheme = getCurrentTheme();
  if (currentTheme !== "default") {
    updateBootLog(`Preloading ${currentTheme} theme assets... `);
    await preloadThemeAssets(currentTheme);
    await new Promise((resolve) => setTimeout(resolve, 100));
    updateBootLog("OK", true);
  }

  updateBootLog("Loading theme stylesheets... ");
  loadThemeStylesheets();
  await new Promise((resolve) => setTimeout(resolve, 100));
  updateBootLog("OK", true);

  updateBootLog("Loading custom applications... ");
  await new Promise((resolve) => setTimeout(resolve, 50));
  loadCustomApps();
  updateBootLog("OK", true);

  updateBootLog("Creating main UI... ");
  await new Promise((resolve) => setTimeout(resolve, 50));
  createMainUI();
  updateBootLog("OK", true);

  updateBootLog("Initializing taskbar... ");
  await new Promise((resolve) => setTimeout(resolve, 50));
  taskbar.init();
  updateBootLog("OK", true);

  updateBootLog("Setting up desktop... ");
  await new Promise((resolve) => setTimeout(resolve, 50));
  initDesktop();
  updateBootLog("OK", true);

  updateBootLog("azOS Ready!");
  await new Promise((resolve) => setTimeout(resolve, 50));

  await promptToContinue();
  hideBootScreen();

  window.ShowDialogWindow = ShowDialogWindow;
  window.playSound = playSound;
  window.setTheme = setTheme;
  window.System.launchApp = launchApp;
  console.log("azOS initialized");

  playSound("WindowsLogon");
}

initializeOS();
