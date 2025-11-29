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
import { setTheme, getCurrentTheme, getThemes } from "./utils/themeManager.js";
import {
  hideBootScreen,
  startBootProcessStep,
  finalizeBootProcessStep,
  showBlinkingCursor,
  promptToContinue,
} from "./components/bootScreen.js";
import { preloadThemeAssets } from "./utils/assetPreloader.js";
import { launchApp } from "./utils/appManager.js";
import { createMainUI } from "./components/ui.js";
import { initColorModeManager } from "./utils/colorModeManager.js";
import screensaver from "./utils/screensaverUtils.js";
import { initScreenManager } from "./utils/screenManager.js";

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
  document.body.classList.add("booting");
  document.getElementById("screen").classList.add("boot-mode");
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

  let logElement = startBootProcessStep("Detecting keyboard...");
  await new Promise((resolve) => setTimeout(resolve, 500));
  finalizeBootProcessStep(logElement, "OK");
  // showBlinkingCursor();

  logElement = startBootProcessStep("Detecting mouse...");
  await new Promise((resolve) => setTimeout(resolve, 500));
  finalizeBootProcessStep(logElement, "OK");
  // showBlinkingCursor();

  logElement = startBootProcessStep("Connecting to network...");
  await new Promise((resolve) => setTimeout(resolve, 1000));
  finalizeBootProcessStep(logElement, navigator.onLine ? "OK" : "FAILED");
  // showBlinkingCursor();

  const allThemes = getThemes();
  logElement = startBootProcessStep("Preloading default theme assets...");
  await preloadThemeAssets("default", allThemes);
  finalizeBootProcessStep(logElement, "OK");
  // showBlinkingCursor();

  const currentTheme = getCurrentTheme();
  if (currentTheme !== "default") {
    logElement = startBootProcessStep(
      `Preloading ${currentTheme} theme assets...`,
    );
    await preloadThemeAssets(currentTheme, allThemes);
    finalizeBootProcessStep(logElement, "OK");
    // showBlinkingCursor();
  }

  logElement = startBootProcessStep("Loading theme stylesheets...");
  loadThemeStylesheets();
  finalizeBootProcessStep(logElement, "OK");
  // showBlinkingCursor();

  logElement = startBootProcessStep("Loading custom applications...");
  await new Promise((resolve) => setTimeout(resolve, 50));
  loadCustomApps();
  finalizeBootProcessStep(logElement, "OK");
  // showBlinkingCursor();

  logElement = startBootProcessStep("Creating main UI...");
  await new Promise((resolve) => setTimeout(resolve, 50));
  createMainUI();
  initScreenManager(); // Initialize the screen manager
  initColorModeManager(document.body);
  finalizeBootProcessStep(logElement, "OK");
  // showBlinkingCursor();

  logElement = startBootProcessStep("Initializing taskbar...");
  await new Promise((resolve) => setTimeout(resolve, 50));
  taskbar.init();
  finalizeBootProcessStep(logElement, "OK");
  // showBlinkingCursor();

  logElement = startBootProcessStep("Setting up desktop...");
  await new Promise((resolve) => setTimeout(resolve, 50));
  await initDesktop();
  finalizeBootProcessStep(logElement, "OK");
  // showBlinkingCursor();

  const bootLogEl = document.getElementById("boot-log");
  if (bootLogEl) {
      const finalMessage = document.createElement("div");
      finalMessage.textContent = "azOS Ready!";
      bootLogEl.appendChild(finalMessage);
  }
  await new Promise((resolve) => setTimeout(resolve, 50));

  await promptToContinue();

  document.body.classList.remove("booting");
  document.getElementById("screen").classList.remove("boot-mode");

  hideBootScreen();

  window.ShowDialogWindow = ShowDialogWindow;
  window.playSound = playSound;
  window.setTheme = setTheme;
  window.System.launchApp = launchApp;
  console.log("azOS initialized");

  playSound("WindowsLogon");

  let inactivityTimer;

  function resetInactivityTimer() {
    clearTimeout(inactivityTimer);
    if (screensaver.active) {
      screensaver.hide();
    }

    const timeoutDuration = getItem(LOCAL_STORAGE_KEYS.SCREENSAVER_TIMEOUT) || 5 * 60 * 1000;

    inactivityTimer = setTimeout(() => {
      screensaver.show();
    }, timeoutDuration);
  }

  window.System.resetInactivityTimer = resetInactivityTimer;

  window.addEventListener('mousemove', resetInactivityTimer);
  window.addEventListener('mousedown', resetInactivityTimer);
  window.addEventListener('keydown', resetInactivityTimer);

  resetInactivityTimer();
}

initializeOS();
