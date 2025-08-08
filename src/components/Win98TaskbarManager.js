/**
 * Win98TaskbarManager - Handles taskbar, start menu, and system tray
 */

import windowsStartLogo from "../assets/icons/windows-4.png";
import windowsStartMenuBar from "../assets/img/win98start.bmp";
import computerIcon from "../assets/icons/computer_explorer.ico";
import shell32Icon from "../assets/icons/SHELL32_3.ico";
import keyIcon from "../assets/icons/key_win-4.png";
import shutdownIcon from "../assets/icons/shut_down_normal-0.png";
import showDesktopIcon from "../assets/icons/desktop_old-4.png";
import volumeIcon from "../assets/icons/SYSTRAY_220.ico";


// Start menu functionality
export function showStartMenu() {
  const startMenu = document.getElementById("start-menu");
  const startButton = document.querySelector(".start-button");
  startMenu.classList.remove("hidden");
  startButton.classList.add("active");
}

export function hideStartMenu() {
  const startMenu = document.getElementById("start-menu");
  const startButton = document.querySelector(".start-button");
  startMenu.classList.add("hidden");
  startButton.classList.remove("active");
}

export function toggleStartMenu() {
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
export function showDesktop() {
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
export function updateClock() {
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
export function init() {

  console.log("Initializing Win98 Taskbar Manager...");
  // Set up taskbar
  const taskbar = document.querySelector(".taskbar");
  taskbar.innerHTML = `
    <button class="start-button">
      <img src="${windowsStartLogo}" alt="Windows Logo"> Start
    </button>
    <div class="start-menu-wrapper">
      <div id="start-menu" class="start-menu hidden">
        <div class="blue-rectangle"><img src="${windowsStartMenuBar}" /></div>
        <ul class="start-menu-list">
          <li onclick="/">
            <img src="${computerIcon}" alt="Computer">
            <span>aziz rahmad</span>
          </li>

          <div class="start-menu-divider"></div>
          <li class="start-menu-item" for="/about/">
            <img src="${shell32Icon}" alt="My Documents">
            <span>About</span>
          </li>
          <div class="start-menu-divider"></div>
          <li class="logoff-menu-item"><img src="${keyIcon}" alt="logoff"><span id="logofftext">Log
              Off Guest...</span>
          </li>
          <li onclick="location.reload();"><img src="${shutdownIcon}" alt="shutdown">Shut
            Down...</li>
        </ul>
      </div>
    </div>
    <div class="taskbar-divider"></div>
    <div class="taskbar-divider-handler"></div>
    <div class="taskbar-icon-area">
      <button class="taskbar-icon show-desktop">
        <img src="${showDesktopIcon}" alt="Show Desktop">
      </button>
      <button class="taskbar-icon" onclick="window.open('https://www.linkedin.com/in/aziz-rahmad', '_blank')">
        <img src="https://www.google.com/s2/favicons?domain=linkedin.com" alt="Show Desktop">
      </button>
      <button class="taskbar-icon" onclick="window.open('https://www.github.com/azayrahmad', '_blank')">
        <img src="https://www.google.com/s2/favicons?domain=https://www.github.com/azayrahmad" alt="Show Desktop">
      </button>
    </div>
    <div class="taskbar-divider"></div>
    <div class="taskbar-divider-handler"></div>
    <div class="taskbar-app-area">

    </div>
    <div class="taskbar-divider"></div>
    <div class="system-tray">
      <img src="${volumeIcon}" alt="Volume">
      <div class="taskbar-clock" title="">
        <span id="clock"></span>
      </div>
    </div>`;

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
