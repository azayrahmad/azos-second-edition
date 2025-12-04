import "./styles/cursors.css";
import "./style.css";

import { themes } from "./config/themes.js";
import { initDesktop } from "./components/desktop.js";
import { getItem, LOCAL_STORAGE_KEYS } from "./utils/localStorage.js";
import { registerCustomApp } from "./utils/customAppManager.js";
import { taskbar } from "./components/taskbar.js";
import { ShowDialogWindow } from "./components/DialogWindow.js";
import { playSound } from "./utils/soundManager.js";
import { setTheme, getCurrentTheme } from "./utils/themeManager.js";
import {
  hideBootScreen,
  startBootProcessStep,
  finalizeBootProcessStep,
  promptToContinue,
} from "./components/bootScreen.js";
import { runDiagnostics } from "./utils/diagnostics.js";
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
    const $window = win.$window || $(win).closest(".window").data("$window");
    if ($window && typeof $window.minimize === "function") {
      $window.minimize();
    } else {
      win.style.display = "none";
      win.isMinimized = true;
    }
    if (!skipTaskbarUpdate) {
      taskbar.updateTaskbarButton(win.id, false, true);
    }
  }

  restoreWindow(win) {
    if (!win?.id) return;
    const $window = win.$window || $(win).closest(".window").data("$window");
    if ($window && typeof $window.unminimize === "function") {
      $window.unminimize();
      $window.bringToFront();
    } else {
      win.style.display = "";
      win.isMinimized = false;
    }
    taskbar.updateTaskbarButton(win.id, true, false);
  }

  updateTitleBarClasses(win) {
    if (!win) return;
    document.querySelectorAll(".app-window").forEach((w) => {
      w.querySelector(".title-bar")?.classList.remove("active");
    });
    win.querySelector(".title-bar")?.classList.add("active");
  }
}

window.System = new WindowManagerSystem();

async function launchDesktopEnvironment() {
  createMainUI();
  initScreenManager();
  initColorModeManager(document.body);
  taskbar.init();
  await initDesktop();
  document.dispatchEvent(new CustomEvent("desktop-refresh"));
}

async function initializeOS() {
  document.body.classList.add("booting");
  document.getElementById("screen").classList.add("boot-mode");
  document.getElementById("initial-boot-message").style.display = "none";
  document.getElementById("boot-screen-content").style.display = "flex";

  const biosTextColumn = document.getElementById("bios-text-column");
  if (biosTextColumn) {
    biosTextColumn.innerHTML = `Award Modular BIOS v4.51PG, An Energy Star Ally<br/>Copyright (C) 1984-85, Award Software, Inc.`;
  }

  const keyPressed = await promptToContinue(true); // Show diag prompt

  if (keyPressed === 'Delete') {
    const diagnosticsPassed = await runDiagnostics();
    if (!diagnosticsPassed) {
      return;
    }
    await promptToContinue(false); // Hide diag prompt
  }

  // --- Unified Loading Sequence ---
  function loadCustomApps() {
    const savedApps = getItem(LOCAL_STORAGE_KEYS.CUSTOM_APPS) || [];
    savedApps.forEach((appInfo) => registerCustomApp(appInfo));
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

  let logElement;
  logElement = startBootProcessStep("Preloading default theme assets...");
  await preloadThemeAssets("default");
  finalizeBootProcessStep(logElement, "OK");

  const currentTheme = getCurrentTheme();
  if (currentTheme !== "default") {
    logElement = startBootProcessStep(`Preloading ${currentTheme} theme assets...`);
    await preloadThemeAssets(currentTheme);
    finalizeBootProcessStep(logElement, "OK");
  }

  logElement = startBootProcessStep("Loading theme stylesheets...");
  loadThemeStylesheets();
  finalizeBootProcessStep(logElement, "OK");

  logElement = startBootProcessStep("Loading custom applications...");
  loadCustomApps();
  finalizeBootProcessStep(logElement, "OK");

  // --- Unified Desktop Launch ---
  await launchDesktopEnvironment();

  document.body.classList.remove("booting");
  document.getElementById("screen").classList.remove("boot-mode");
  hideBootScreen();

  // --- Final OS Setup ---
  window.ShowDialogWindow = ShowDialogWindow;
  window.playSound = playSound;
  window.setTheme = setTheme;
  window.System.launchApp = launchApp;
  console.log("azOS initialized");

  playSound("WindowsLogon");

  // Inactivity timer setup
  let inactivityTimer;
  function resetInactivityTimer() {
    clearTimeout(inactivityTimer);
    if (screensaver.active) screensaver.hide();
    const timeoutDuration = getItem(LOCAL_STORAGE_KEYS.SCREENSAVER_TIMEOUT) || 5 * 60 * 1000;
    inactivityTimer = setTimeout(() => screensaver.show(), timeoutDuration);
  }
  window.System.resetInactivityTimer = resetInactivityTimer;
  window.addEventListener('mousemove', resetInactivityTimer);
  window.addEventListener('mousedown', resetInactivityTimer);
  window.addEventListener('keydown', resetInactivityTimer);
  resetInactivityTimer();
}

initializeOS();
