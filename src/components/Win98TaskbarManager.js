/**
 * Win98TaskbarManager - Handles taskbar, start menu, and system tray
 */
const Win98TaskbarManager = (function () {
  // Start menu functionality
  function showStartMenu() {
    const startMenu = document.getElementById("start-menu");
    const startButton = document.querySelector(".start-button");
    startMenu.classList.remove("hidden");
    startButton.classList.add("active");
  }

  function hideStartMenu() {
    const startMenu = document.getElementById("start-menu");
    const startButton = document.querySelector(".start-button");
    startMenu.classList.add("hidden");
    startButton.classList.remove("active");
  }

  function toggleStartMenu() {
    const startMenu = document.getElementById("start-menu");
    if (startMenu.classList.contains("hidden")) {
      showStartMenu();
      startMenu.style.animationName = "scrollUp";
    } else {
      hideStartMenu();
      startMenu.style.animationName = "";
    }
  }

  // Taskbar button creation
  function createTaskbarButton(windowId, iconSrc, title) {
    const taskbarAppArea = document.querySelector(".taskbar-app-area");
    if (!taskbarAppArea) return;

    // Create taskbar button
    const taskbarButton = document.createElement("button");
    taskbarButton.className = "taskbar-button";
    taskbarButton.setAttribute("for", windowId);

    // Add icon and title
    taskbarButton.innerHTML = `<img src="${iconSrc}" alt="Icon">${title}`;

    // Add click handler for taskbar button (toggle window visibility)
    taskbarButton.addEventListener("click", function (event) {
      const windowId = this.getAttribute("for");
      const win = document.getElementById(windowId);
      if (win.isMinimized) {
        Win98System.incrementZIndex();
        win.style.zIndex = Win98System.getHighestZIndex();
        Win98WindowManager.restoreWindow(win);
      } else if (win.style.zIndex == Win98System.getHighestZIndex()) {
        Win98WindowManager.minimizeWindow(win);
      } else {
        Win98System.incrementZIndex();
        win.style.zIndex = Win98System.getHighestZIndex();
        Win98WindowManager.updateTitleBarClasses(win);
      }
    });

    // Add button to taskbar
    taskbarAppArea.appendChild(taskbarButton);

    return taskbarButton;
  }

  // Show desktop functionality
  function showDesktop() {
    const windows = document.querySelectorAll(".app-window");
    const allMinimized = Array.from(windows).every((win) => win.isMinimized);

    if (allMinimized) {
      // Restore all windows
      windows.forEach((win) => {
        Win98WindowManager.restoreWindow(win);
      });
    } else {
      // Minimize all windows
      windows.forEach((win) => {
        Win98WindowManager.minimizeWindow(win, true);
      });
    }
  }

  // Clock functionality
  function updateClock() {
    const now = new Date();
    const timeString = now
      .toLocaleTimeString([], {
        hour: "2-digit",
        minute: "2-digit",
        hour12: true,
      })
      .toLocaleUpperCase();
    const dateString = now.toDateString([], {
      weekday: "long",
      year: "numeric",
      month: "long",
      day: "numeric",
    });
    const clockElement = document.getElementById("clock");
    if (clockElement) {
      clockElement.textContent = timeString;
      document.querySelector(".taskbar-clock").title = dateString;
    }
  }

  // Initialize taskbar
  function init() {
    // Set up start button
    const startButton = document.querySelector(".start-button");
    if (startButton) {
      startButton.addEventListener("click", toggleStartMenu);
    }

    // Set up show desktop button
    const showDesktopButton = document.querySelector(".show-desktop");
    if (showDesktopButton) {
      showDesktopButton.addEventListener("click", showDesktop);
    }

    // Set up clock
    setInterval(updateClock, 1000);
    updateClock();

    // Setup taskbar button handlers for existing buttons
    document.querySelectorAll(".taskbar-button").forEach((button) => {
      button.addEventListener("click", function () {
        const windowId = this.getAttribute("for");
        const win = document.getElementById(windowId);
        if (win.isMinimized) {
          Win98System.incrementZIndex();
          win.style.zIndex = Win98System.getHighestZIndex();
          Win98WindowManager.restoreWindow(win);
        } else if (win.style.zIndex == Win98System.getHighestZIndex()) {
          Win98WindowManager.minimizeWindow(win);
        } else {
          Win98System.incrementZIndex();
          win.style.zIndex = Win98System.getHighestZIndex();
          Win98WindowManager.updateTitleBarClasses(win);
        }
      });
    });

    // Hide start menu when clicking outside
    document.addEventListener("click", function (event) {
      const startMenu = document.getElementById("start-menu");
      const startButton = document.querySelector(".start-button");
      if (
        !startMenu.classList.contains("hidden") &&
        !startMenu.contains(event.target) &&
        !startButton.contains(event.target)
      ) {
        hideStartMenu();
      }
    });

    // Set up start menu items
    document.querySelectorAll(".start-menu-item").forEach((icon) => {
      icon.addEventListener("click", function (event) {
        Win98AppManager.createAndOpenApp(event);
        hideStartMenu();
      });
    });
  }

  // Public API
  return {
    createTaskbarButton,
    showStartMenu,
    hideStartMenu,
    toggleStartMenu,
    showDesktop,
    updateClock,
    init,
  };
})();
