/**
 * Taskbar - Handles taskbar, system tray, and taskbar buttons
 * Refactored to use separate StartMenu class
 */

// Vite handles these imports automatically and will optimize them
import windowsStartLogo from "../assets/icons/windows-4.png";
import showDesktopIcon from "../assets/icons/desktop_old-4.png";
import volumeIcon from "../assets/icons/SYSTRAY_220.ico";
import StartMenu from "./StartMenu.js";
import Bar from "./Bar.js";
import { showClippyContextMenu } from "../apps/clippy/clippy.js";

// Constants for better maintainability
const SELECTORS = {
  START_BUTTON: ".start-button",
  TASKBAR: ".taskbar",
  TASKBAR_APP_AREA: ".taskbar-app-area",
  SHOW_DESKTOP: ".show-desktop",
  TASKBAR_CLOCK: ".taskbar-clock",
  CLOCK: "#clock",
  TASKBAR_BUTTON: ".taskbar-button",
  APP_WINDOW: ".app-window",
  SYSTEM_TRAY: ".system-tray",
};

const CLASSES = {
  HIDDEN: "hidden",
  ACTIVE: "active",
  TASKBAR_BUTTON: "toggle selected taskbar-button",
};

/**
 * Main Taskbar class - handles taskbar functionality
 */
class Taskbar {
  constructor() {
    this.clockInterval = null;
    this.isInitialized = false;
    this.eventListeners = new Map(); // Track event listeners for cleanup
    this.startMenu = new StartMenu(); // Create StartMenu instance
  }

  /**
   * Initialize the taskbar manager
   */
  init() {
    if (this.isInitialized) {
      console.warn("Taskbar already initialized");
      return;
    }

    try {
      console.log("Initializing Taskbar...");
      this.renderTaskbar();
      this.startMenu.init(); // Initialize start menu
      this.bindEvents();
      this.initializeClock();
      this.setupExistingTaskbarButtons();
      this.isInitialized = true;
    } catch (error) {
      console.error("Failed to initialize Taskbar:", error);
      throw error;
    }
  }

  /**
   * Clean up resources and event listeners
   */
  destroy() {
    if (this.clockInterval) {
      clearInterval(this.clockInterval);
      this.clockInterval = null;
    }

    // Clean up start menu
    this.startMenu.destroy();

    // Remove all tracked event listeners
    this.eventListeners.forEach(({ element, event, handler }) => {
      element.removeEventListener(event, handler);
    });
    this.eventListeners.clear();

    this.isInitialized = false;
  }

  /**
   * Add event listener and track it for cleanup
   */
  addTrackedEventListener(element, event, handler) {
    if (!element) return;

    element.addEventListener(event, handler);
    this.eventListeners.set(`${element.id || element.className}-${event}`, {
      element,
      event,
      handler,
    });
  }

  /**
   * Render the taskbar HTML structure
   */
  renderTaskbar() {
    const taskbarElement = document.querySelector(SELECTORS.TASKBAR);
    if (!taskbarElement) {
      throw new Error("Taskbar element not found");
    }
    taskbarElement.innerHTML = ''; // Clear existing content

    // Create Start Button
    const startButton = document.createElement('button');
    startButton.className = 'start-button toggle';
    startButton.innerHTML = `
      <img src="${windowsStartLogo}" alt="Windows Logo" loading="lazy">
      <span class="start-button-text">Start</span>
    `;
    taskbarElement.appendChild(startButton);

    // Create Start Menu Wrapper
    const startMenuWrapper = document.createElement('div');
    startMenuWrapper.className = 'start-menu-wrapper';
    taskbarElement.appendChild(startMenuWrapper);

    // Main bar for draggable areas
    const mainBar = new Bar(taskbarElement, { className: 'taskbar-main-bar' });

    // Icon Area
    const iconBar = new Bar(mainBar.element, { className: 'taskbar-icon-area' });
    this.addIconButtons(iconBar.element);
    mainBar.addItem(iconBar, { draggable: true, resizable: true });

    // App Area
    const appAreaBar = new Bar(mainBar.element, { className: 'taskbar-app-area' });
    mainBar.addItem(appAreaBar, { draggable: true, resizable: true });

    // System Tray
    const systemTray = document.createElement('div');
    systemTray.className = 'system-tray';
    systemTray.setAttribute('role', 'group');
    systemTray.setAttribute('aria-label', 'System tray');
    systemTray.innerHTML = `
        <img src="${volumeIcon}" alt="Volume" loading="lazy">
        <div class="taskbar-clock" title="" role="timer" aria-live="polite">
          <span id="clock" aria-label="Current time"></span>
        </div>
    `;
    taskbarElement.appendChild(systemTray);
  }

  /**
   * Adds the initial static icon buttons to the icon bar.
   * @param {HTMLElement} iconBarElement - The element of the icon bar.
   */
  addIconButtons(iconBarElement) {
    const showDesktopButton = document.createElement('button');
    showDesktopButton.className = 'taskbar-icon lightweight show-desktop';
    showDesktopButton.title = 'Show Desktop';
    showDesktopButton.setAttribute('aria-label', 'Show Desktop');
    showDesktopButton.innerHTML = `<img src="${showDesktopIcon}" alt="Show Desktop" loading="lazy">`;
    iconBarElement.appendChild(showDesktopButton);

    const linkedInButton = document.createElement('button');
    linkedInButton.className = 'taskbar-icon lightweight';
    linkedInButton.title = 'LinkedIn Profile';
    linkedInButton.setAttribute('aria-label', 'Open LinkedIn Profile');
    linkedInButton.dataset.url = 'https://www.linkedin.com/in/aziz-rahmad';
    linkedInButton.innerHTML = `<img src="https://www.google.com/s2/favicons?domain=linkedin.com" alt="LinkedIn" loading="lazy">`;
    iconBarElement.appendChild(linkedInButton);

    const githubButton = document.createElement('button');
    githubButton.className = 'taskbar-icon lightweight';
    githubButton.title = 'GitHub Profile';
    githubButton.setAttribute('aria-label', 'Open GitHub Profile');
    githubButton.dataset.url = 'https://www.github.com/azayrahmad';
    githubButton.innerHTML = `<img src="https://www.google.com/s2/favicons?domain=github.com" alt="GitHub" loading="lazy">`;
    iconBarElement.appendChild(githubButton);
  }

  /**
   * Bind all event listeners
   */
  bindEvents() {
    this.bindStartButtonEvents();
    this.bindDesktopEvents();
    this.bindExternalLinkEvents();
  }

  /**
   * Bind start button events
   */
  bindStartButtonEvents() {
    const startButton = document.querySelector(SELECTORS.START_BUTTON);
    this.addTrackedEventListener(startButton, "click", () => {
      this.startMenu.toggle();
    });
  }

  /**
   * Bind desktop and taskbar events
   */
  bindDesktopEvents() {
    const showDesktopButton = document.querySelector(SELECTORS.SHOW_DESKTOP);
    this.addTrackedEventListener(showDesktopButton, "click", () =>
      this.showDesktop(),
    );
  }

  /**
   * Bind external link events
   */
  bindExternalLinkEvents() {
    const externalButtons = document.querySelectorAll("[data-url]");
    externalButtons.forEach((button) => {
      this.addTrackedEventListener(button, "click", (event) => {
        const url = event.currentTarget.dataset.url;
        if (url) {
          this.openExternalLink(url);
        }
      });
    });
  }

  /**
   * Utility methods
   */
  openExternalLink(url) {
    try {
      window.open(url, "_blank", "noopener,noreferrer");
    } catch (error) {
      console.error("Failed to open external link:", error);
    }
  }

  /**
   * Taskbar button management
   */
  createTaskbarButton(windowId, iconSrc, title) {
    const taskbarAppArea = document.querySelector(SELECTORS.TASKBAR_APP_AREA);
    if (!taskbarAppArea || !windowId || !title) {
      console.warn("Invalid parameters for taskbar button creation");
      return null;
    }

    // Prevent duplicate buttons
    const existingButton = taskbarAppArea.querySelector(`[for="${windowId}"]`);
    if (existingButton) {
      return existingButton;
    }

    const taskbarButton = document.createElement("button");
    taskbarButton.className = CLASSES.TASKBAR_BUTTON;
    taskbarButton.setAttribute("for", windowId);
    taskbarButton.setAttribute("aria-label", `Switch to ${title}`);
    taskbarButton.title = title;

    // Safely handle missing icon
    const iconHTML = iconSrc
      ? `<img src="${iconSrc}" alt="App Icon" loading="lazy">`
      : "";
    // Wrap icon and text inside a span
    taskbarButton.innerHTML = `
      <span class="taskbar-button-content">
        ${iconHTML}
        <span class="taskbar-button-text">${this.escapeHtml(title)}</span>
      </span>
    `;

    // Prevent mousedown from unfocusing the window
    this.addTrackedEventListener(taskbarButton, "mousedown", (event) => {
      event.preventDefault();
    });

    // Add click handler
    this.addTrackedEventListener(taskbarButton, "click", (event) => {
      this.handleTaskbarButtonClick(event);
    });

    // Add context menu handler
    this.addTrackedEventListener(taskbarButton, "contextmenu", (e) => {
      e.preventDefault();
      e.stopPropagation();

      const windowId = e.currentTarget.getAttribute("for");
      const win = document.getElementById(windowId);
      if (!win || !win.$window) return;

      const isMinimized = !$(win).is(":visible");
      const contextMenuItems = [
        {
          label: "Restore",
          default: true,
          enabled: isMinimized,
          click: () => {
            if (typeof Win98WindowManager !== "undefined" && isMinimized) {
              Win98WindowManager.restoreWindow(win);
            }
          },
        },
        {
          label: "Close",
          click: () => {
            win.$window.close();
          },
        },
      ];

      // Remove any existing menus
      const existingMenus = document.querySelectorAll(".menu-popup");
      existingMenus.forEach((menu) => menu.remove());

      const contextMenu = new OS.MenuList(contextMenuItems);
      document.body.appendChild(contextMenu.element);

      // Set a z-index higher than the taskbar
      if (window.Win98System) {
        contextMenu.element.style.zIndex = window.Win98System.incrementZIndex();
      }

      // Position and show the menu
      const menuHeight = contextMenu.element.offsetHeight;
      contextMenu.show(e.clientX, e.clientY - menuHeight);

      // Hide menu when clicking outside or pressing Escape
      const hideMenu = (event) => {
        const clickOutside = event.type === 'click' && !contextMenu.element.contains(event.target);
        const escapePressed = event.type === 'keydown' && event.key === 'Escape';

        if (clickOutside || escapePressed) {
          if (escapePressed) {
            event.preventDefault();
            event.stopPropagation();
            event.stopImmediatePropagation();
          }
          contextMenu.hide();
          document.removeEventListener("click", hideMenu);
          document.removeEventListener('keydown', hideMenu);
          if (contextMenu.element.parentNode) {
            document.body.removeChild(contextMenu.element);
          }
        }
      };

      // Add slight delay to prevent immediate hiding
      setTimeout(() => {
        document.addEventListener("click", hideMenu);
        document.addEventListener('keydown', hideMenu);
      }, 0);
    });

    taskbarAppArea.appendChild(taskbarButton);

    // Add window focus/blur and close listeners
    const win = document.getElementById(windowId);
    if (win && win.$window) {
      win.$window.onFocus(() => {
        this.updateTaskbarButton(windowId, true, false);
      });
      win.$window.onBlur(() => {
        this.updateTaskbarButton(windowId, false, false);
      });
      win.$window.onClosed(() => {
        this.removeTaskbarButton(windowId);
      });

      // Listen for title changes to update the taskbar button
      $(win).on('title-change', () => {
        const newTitle = win.$window.title();
        const button = document.querySelector(
          `${SELECTORS.TASKBAR_BUTTON}[for="${windowId}"]`,
        );
        if (button) {
          button.title = newTitle;
          const iconImg = button.querySelector('img');
          button.innerHTML = `
            <span class="taskbar-button-content">
              ${iconImg ? iconImg.outerHTML : ''}
              <span class="taskbar-button-text">${this.escapeHtml(newTitle)}</span>
            </span>
          `;
        }
      });
    }
    return taskbarButton;
  }

  /**
   * Remove taskbar button
   */
  removeTaskbarButton(windowId) {
    const taskbarAppArea = document.querySelector(SELECTORS.TASKBAR_APP_AREA);
    if (!taskbarAppArea) return;

    const button = taskbarAppArea.querySelector(`[for="${windowId}"]`);
    if (button) {
      button.remove();
    }
  }

  /**
 * Update taskbar button state
 */
  updateTaskbarButton(windowId, isActive = false, isMinimized = false) {
    const button = document.querySelector(
      `${SELECTORS.TASKBAR_BUTTON}[for="${windowId}"]`,
    );
    if (!button) return;

    // Add/remove selected class based on window focus state
    if (isActive) {
      button.classList.add('selected');
    } else {
      button.classList.remove('selected');
    }
  }

  handleTaskbarButtonClick(event) {
    const windowId = event.currentTarget.getAttribute("for");
    const win = document.getElementById(windowId);

    if (!win) {
      console.warn(`Window with id ${windowId} not found`);
      return;
    }

    try {
      if (typeof Win98System !== "undefined" && typeof Win98WindowManager !== "undefined") {
        const $win = $(win);
        if ($win.is(":visible")) {
          // If window is visible, either minimize or focus based on current state
          const isActive = $win.hasClass("focused");

          if (isActive) {
            // Window is focused, so minimize it
            Win98WindowManager.minimizeWindow(win);
            this.updateTaskbarButton(windowId, false, true);
          } else {
            // Window is not focused, so bring it to front and focus it
            $win.trigger("refocus-window");
            win.style.zIndex = Win98System.incrementZIndex();
            Win98WindowManager.updateTitleBarClasses(win);
            this.updateTaskbarButton(windowId, true, false);
          }
        } else {
          // Window is hidden/minimized, restore it and focus
          win.style.zIndex = Win98System.incrementZIndex();
          Win98WindowManager.restoreWindow(win);
          // Focus the window after restoration
          setTimeout(() => {
            $win.trigger("refocus-window");
            this.updateTaskbarButton(windowId, true, false);
          }, 0);
        }
      } else {
        console.warn("Win98System or Win98WindowManager not available");
      }
    } catch (error) {
      console.error("Failed to handle taskbar button click:", error);
    }
  }

  /**
   * Show/hide desktop functionality
   */
  showDesktop() {
    const windows = document.querySelectorAll(SELECTORS.APP_WINDOW);
    if (windows.length === 0) return;

    const allMinimized = Array.from(windows).every((win) => win.isMinimized);

    try {
      if (typeof Win98WindowManager !== "undefined") {
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
      } else {
        console.warn("Win98WindowManager not available");
      }
    } catch (error) {
      console.error("Failed to toggle desktop:", error);
    }
  }

  /**
   * Clock functionality
   */
  initializeClock() {
    this.updateClock();
    this.clockInterval = setInterval(() => this.updateClock(), 1000);
  }

  updateClock() {
    try {
      const now = new Date();
      const timeString = now
        .toLocaleTimeString([], {
          hour: "2-digit",
          minute: "2-digit",
          hour12: true,
        })
        .toUpperCase();

      const dateString = now.toDateString();

      const clockElement = document.querySelector(SELECTORS.CLOCK);
      const clockContainer = document.querySelector(SELECTORS.TASKBAR_CLOCK);

      if (clockElement) {
        clockElement.textContent = timeString;
      }

      if (clockContainer) {
        clockContainer.title = dateString;
      }
    } catch (error) {
      console.error("Failed to update clock:", error);
    }
  }

  /**
   * Setup existing taskbar buttons
   */
  setupExistingTaskbarButtons() {
    const existingButtons = document.querySelectorAll(SELECTORS.TASKBAR_BUTTON);
    existingButtons.forEach((button) => {
      this.addTrackedEventListener(button, "click", (event) => {
        this.handleTaskbarButtonClick(event);
      });
    });
  }

  /**
   * Get start menu instance for external access
   */
  getStartMenu() {
    return this.startMenu;
  }

  /**
   * Utility function to escape HTML
   */
  escapeHtml(text) {
    const div = document.createElement("div");
    div.textContent = text;
    return div.innerHTML;
  }
}

// Create singleton instance
const taskbar = new Taskbar();

// Export functions for backwards compatibility
export function showStartMenu() {
  taskbar.getStartMenu().show();
}

export function hideStartMenu() {
  taskbar.getStartMenu().hide();
}

export function toggleStartMenu() {
  taskbar.getStartMenu().toggle();
}

export function showDesktop() {
  taskbar.showDesktop();
}

export function updateClock() {
  taskbar.updateClock();
}

export function init() {
  taskbar.init();
}

export function destroy() {
  taskbar.destroy();
}

export function createTaskbarButton(windowId, iconSrc, title) {
  return taskbar.createTaskbarButton(windowId, iconSrc, title);
}

export function removeTaskbarButton(windowId) {
  return taskbar.removeTaskbarButton(windowId);
}

export function updateTaskbarButton(windowId, isActive, isMinimized) {
  return taskbar.updateTaskbarButton(windowId, isActive, isMinimized);
}

export function createTrayIcon(app) {
  const trayArea = document.querySelector(SELECTORS.SYSTEM_TRAY);
  if (!trayArea) {
    console.warn("System tray area not found");
    return;
  }

  const existingIcon = trayArea.querySelector(`#tray-icon-${app.id}`);
  if (existingIcon) {
    return; // Icon already exists
  }

  const trayIcon = document.createElement("div");
  trayIcon.id = `tray-icon-${app.id}`;
  trayIcon.className = "tray-icon";
  trayIcon.title = app.title;
  trayIcon.setAttribute("data-app-id", app.id);
  trayIcon.innerHTML = `<img src="${app.icon}" alt="${app.title}" loading="lazy">`;

  trayIcon.addEventListener("contextmenu", (e) => {
    e.preventDefault();
    e.stopPropagation();

    if (app.tray?.contextMenu) {
      // Use centralized function for clippy context menu
      if (app.id === 'clippy') {
        showClippyContextMenu(e);
      } else {
        // Handle other tray icons normally
        const menuItems = typeof app.tray.contextMenu === 'function'
          ? app.tray.contextMenu()
          : app.tray.contextMenu;

        const existingMenus = document.querySelectorAll(".menu-popup");
        existingMenus.forEach((menu) => menu.remove());

        const contextMenu = new OS.MenuList(menuItems);
        document.body.appendChild(contextMenu.element);

        if (window.Win98System) {
          contextMenu.element.style.zIndex = window.Win98System.incrementZIndex();
        }

        const menuHeight = contextMenu.element.offsetHeight;
        contextMenu.show(e.clientX, e.clientY - menuHeight);

        const hideMenu = (event) => {
          if (!contextMenu.element.contains(event.target)) {
            contextMenu.hide();
            document.removeEventListener("click", hideMenu);
            if (contextMenu.element.parentNode) {
              document.body.removeChild(contextMenu.element);
            }
          }
        };

        setTimeout(() => {
          document.addEventListener("click", hideMenu);
        }, 0);
      }
    }
  });

  const volumeIcon = trayArea.querySelector('img[alt="Volume"]');
  if (volumeIcon) {
    trayArea.insertBefore(trayIcon, volumeIcon);
  } else {
    trayArea.appendChild(trayIcon);
  }
}

// Export the manager instance for advanced usage
export { taskbar };

export default taskbar;
