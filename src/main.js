import "./styles/cursors.css";
import "./style.css";
import "./styles/shutdown-screen.css";

import splashBg from "./assets/img/splash.png";
import { themes } from "./config/themes.js";
import { colorSchemes } from "./config/colorSchemes.js";
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
  initTerminal,
  writeToTerminal,
  clearTerminal,
  disposeTerminal,
  hideTerminal,
  promptToContinue as terminalPrompt,
  showSetupScreen,
} from "./components/bootTerminal.js";
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
  let setupEntered = false;

  const handleKeyDown = (e) => {
    if (e.key === "Delete") {
      setupEntered = true;
      showSetupScreen();
      window.removeEventListener("keydown", handleKeyDown);
    }
  };
  window.addEventListener("keydown", handleKeyDown);

  const executeBootStep = async (func) => {
    if (setupEntered) throw new Error("Setup interrupted");
    await func();
  };

  try {
    let bootProcessFinished = false;

    function hideBootAndSplash() {
      hideTerminal();
      document.body.classList.remove("booting");
      document.getElementById("screen").classList.remove("boot-mode");
      playSound("WindowsLogon");
    }

    await executeBootStep(() => {
      document.body.classList.add("booting");
      document.getElementById("screen").classList.add("boot-mode");
      initTerminal();
      writeToTerminal(
        "Award Modular BIOS v4.51PG, An Energy Star Ally\r\nCopyright (C) 1984-85, Award Software, Inc.\r\n\n",
      );
    });

    function loadCustomApps() {
      const savedApps = getItem(LOCAL_STORAGE_KEYS.CUSTOM_APPS) || [];
      savedApps.forEach((appInfo) => {
        registerCustomApp(appInfo);
      });
    }

    function loadThemeStylesheets() {
      Object.entries(colorSchemes).forEach(([id, scheme]) => {
        const link = document.createElement("link");
        link.id = `${id}-theme`;
        link.rel = "stylesheet";
        link.href = `./${scheme.url}`;
        link.disabled = id !== "default"; // Enable default theme initially
        document.head.appendChild(link);
      });
    }

    await executeBootStep(async () => {
      writeToTerminal("Detecting keyboard... ");
      await new Promise((resolve) => setTimeout(resolve, 500));
      writeToTerminal("OK\r\n");
    });

    await executeBootStep(async () => {
      writeToTerminal("Connecting to network... ");
      await new Promise((resolve) => setTimeout(resolve, 1000));
      writeToTerminal(navigator.onLine ? "OK\r\n" : "FAILED\r\n");
    });

    await executeBootStep(async () => {
      writeToTerminal("Preloading default theme assets... ");
      await preloadThemeAssets("default");
      writeToTerminal("OK\r\n");
    });

    await executeBootStep(async () => {
      const currentTheme = getCurrentTheme();
      if (currentTheme !== "default") {
        writeToTerminal(`Preloading ${currentTheme} theme assets... `);
        await preloadThemeAssets(currentTheme);
        writeToTerminal("OK\r\n");
      }
    });

    await executeBootStep(() => {
      writeToTerminal("Loading theme stylesheets... ");
      loadThemeStylesheets();
      writeToTerminal("OK\r\n");
    });

    await executeBootStep(async () => {
      writeToTerminal("Loading custom applications... ");
      await new Promise((resolve) => setTimeout(resolve, 50));
      loadCustomApps();
      writeToTerminal("OK\r\n");
    });

    await executeBootStep(async () => {
      await terminalPrompt();
    });

    await executeBootStep(async () => {
      writeToTerminal("Creating main UI... ");
      await new Promise((resolve) => setTimeout(resolve, 50));
      createMainUI();
      initColorModeManager(document.body);
      writeToTerminal("OK\r\n");
    });

    await executeBootStep(async () => {
      writeToTerminal("Initializing taskbar... ");
      await new Promise((resolve) => setTimeout(resolve, 50));
      taskbar.init();
      writeToTerminal("OK\r\n");
    });

    await executeBootStep(async () => {
      writeToTerminal("Setting up desktop... ");
      await new Promise((resolve) => setTimeout(resolve, 50));
      await initDesktop();
      document.dispatchEvent(new CustomEvent("desktop-refresh"));
      writeToTerminal("OK\r\n");
    });

    await executeBootStep(async () => {
      writeToTerminal("azOS Ready!\r\n");
      await new Promise((resolve) => setTimeout(resolve, 50));
    });

    window.removeEventListener("keydown", handleKeyDown);
    hideBootAndSplash();

    window.ShowDialogWindow = ShowDialogWindow;
    window.playSound = playSound;
    window.setTheme = setTheme;
    window.System.launchApp = launchApp;
    console.log("azOS initialized");

    let inactivityTimer;

    function resetInactivityTimer() {
      clearTimeout(inactivityTimer);
      if (screensaver.active) {
        screensaver.hide();
      }

      const timeoutDuration =
        getItem(LOCAL_STORAGE_KEYS.SCREENSAVER_TIMEOUT) || 5 * 60 * 1000;

      inactivityTimer = setTimeout(() => {
        screensaver.show();
      }, timeoutDuration);
    }

    window.System.resetInactivityTimer = resetInactivityTimer;

    window.addEventListener("mousemove", resetInactivityTimer);
    window.addEventListener("mousedown", resetInactivityTimer);
    window.addEventListener("keydown", resetInactivityTimer);

    resetInactivityTimer();
    initScreenManager(); // Initialize the screen manager
  } catch (error) {
    if (error.message !== "Setup interrupted") {
      console.error("An error occurred during boot:", error);
    }
  }
}

initializeOS();
