/**
 * Taskbar - Handles taskbar, start menu, and system tray
 * Improved version with better architecture, error handling, and maintainability
 */

// Vite handles these imports automatically and will optimize them
import windowsStartLogo from "../assets/icons/windows-4.png";
import windowsStartMenuBar from "../assets/img/win98start.bmp";
import computerIcon from "../assets/icons/computer_explorer.ico";
import shell32Icon from "../assets/icons/SHELL32_3.ico";
import keyIcon from "../assets/icons/key_win-4.png";
import shutdownIcon from "../assets/icons/shut_down_normal-0.png";
import showDesktopIcon from "../assets/icons/desktop_old-4.png";
import volumeIcon from "../assets/icons/SYSTRAY_220.ico";

// For Vite, you can also use explicit imports with query parameters if needed:
// import windowsStartLogo from "../assets/icons/windows-4.png?url"; // Get URL only
// import windowsStartLogo from "../assets/icons/windows-4.png?inline"; // Inline as base64

// Constants for better maintainability
const SELECTORS = {
  START_MENU: "#start-menu",
  START_BUTTON: ".start-button",
  TASKBAR: ".taskbar",
  TASKBAR_APP_AREA: ".taskbar-app-area",
  SHOW_DESKTOP: ".show-desktop",
  TASKBAR_CLOCK: ".taskbar-clock",
  CLOCK: "#clock",
  START_MENU_ITEM: ".start-menu-item",
  TASKBAR_BUTTON: ".taskbar-button",
  APP_WINDOW: ".app-window"
};

const CLASSES = {
  HIDDEN: "hidden",
  ACTIVE: "active",
  TASKBAR_BUTTON: "taskbar-button"
};

const ANIMATIONS = {
  SCROLL_UP: "scrollUp"
};

/**
 * Main Taskbar class - encapsulates all taskbar functionality
 */
class Taskbar {
  constructor() {
    this.clockInterval = null;
    this.isInitialized = false;
    this.eventListeners = new Map(); // Track event listeners for cleanup
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
      handler
    });
  }

  /**
   * Render the taskbar HTML structure
   */
  renderTaskbar() {
    const taskbar = document.querySelector(SELECTORS.TASKBAR);
    if (!taskbar) {
      throw new Error("Taskbar element not found");
    }

    taskbar.innerHTML = this.getTaskbarHTML();
  }

  /**
   * Generate taskbar HTML template
   */
  getTaskbarHTML() {
    return `
      <button class="start-button">
        <img src="${windowsStartLogo}" alt="Windows Logo" loading="lazy"> Start
      </button>
      <div class="start-menu-wrapper">
        <div id="start-menu" class="start-menu ${CLASSES.HIDDEN}">
          <div class="blue-rectangle">
            <img src="${windowsStartMenuBar}" alt="Start Menu Bar" loading="lazy" />
          </div>
          <ul class="start-menu-list">
            <li role="menuitem" tabindex="0" data-action="home">
              <img src="${computerIcon}" alt="Computer" loading="lazy">
              <span>aziz rahmad</span>
            </li>
            <div class="start-menu-divider" role="separator"></div>
            <li class="start-menu-item" role="menuitem" tabindex="0" for="/about/">
              <img src="${shell32Icon}" alt="My Documents" loading="lazy">
              <span>About</span>
            </li>
            <div class="start-menu-divider" role="separator"></div>
            <li class="logoff-menu-item" role="menuitem" tabindex="0">
              <img src="${keyIcon}" alt="Log off" loading="lazy">
              <span id="logofftext">Log Off Guest...</span>
            </li>
            <li role="menuitem" tabindex="0" data-action="shutdown">
              <img src="${shutdownIcon}" alt="Shutdown" loading="lazy">
              <span>Shut Down...</span>
            </li>
          </ul>
        </div>
      </div>
      <div class="taskbar-divider"></div>
      <div class="taskbar-divider-handler"></div>
      <div class="taskbar-icon-area">
        <button class="taskbar-icon show-desktop" title="Show Desktop" aria-label="Show Desktop">
          <img src="${showDesktopIcon}" alt="Show Desktop" loading="lazy">
        </button>
        <button class="taskbar-icon" 
                title="LinkedIn Profile" 
                aria-label="Open LinkedIn Profile"
                data-url="https://www.linkedin.com/in/aziz-rahmad">
          <img src="https://www.google.com/s2/favicons?domain=linkedin.com" 
               alt="LinkedIn" loading="lazy">
        </button>
        <button class="taskbar-icon" 
                title="GitHub Profile" 
                aria-label="Open GitHub Profile"
                data-url="https://www.github.com/azayrahmad">
          <img src="https://www.google.com/s2/favicons?domain=github.com" 
               alt="GitHub" loading="lazy">
        </button>
      </div>
      <div class="taskbar-divider"></div>
      <div class="taskbar-divider-handler"></div>
      <div class="taskbar-app-area" role="group" aria-label="Application buttons">
      </div>
      <div class="taskbar-divider"></div>
      <div class="system-tray" role="group" aria-label="System tray">
        <img src="${volumeIcon}" alt="Volume" loading="lazy">
        <div class="taskbar-clock" title="" role="timer" aria-live="polite">
          <span id="clock" aria-label="Current time"></span>
        </div>
      </div>`;
  }

  /**
   * Bind all event listeners
   */
  bindEvents() {
    this.bindStartMenuEvents();
    this.bindDesktopEvents();
    this.bindExternalLinkEvents();
    this.bindKeyboardEvents();
  }

  /**
   * Bind start menu related events
   */
  bindStartMenuEvents() {
    const startButton = document.querySelector(SELECTORS.START_BUTTON);
    this.addTrackedEventListener(startButton, "click", () => this.toggleStartMenu());

    // Handle start menu item clicks
    const startMenuItems = document.querySelectorAll(SELECTORS.START_MENU_ITEM);
    startMenuItems.forEach(item => {
      this.addTrackedEventListener(item, "click", (event) => {
        this.handleStartMenuItemClick(event);
      });
    });

    // Handle special actions
    const shutdownItem = document.querySelector('[data-action="shutdown"]');
    this.addTrackedEventListener(shutdownItem, "click", () => this.handleShutdown());

    const homeItem = document.querySelector('[data-action="home"]');
    this.addTrackedEventListener(homeItem, "click", () => this.handleHome());

    // Hide start menu when clicking outside
    this.addTrackedEventListener(document, "click", (event) => {
      this.handleOutsideClick(event);
    });
  }

  /**
   * Bind desktop and taskbar events
   */
  bindDesktopEvents() {
    const showDesktopButton = document.querySelector(SELECTORS.SHOW_DESKTOP);
    this.addTrackedEventListener(showDesktopButton, "click", () => this.showDesktop());
  }

  /**
   * Bind external link events
   */
  bindExternalLinkEvents() {
    const externalButtons = document.querySelectorAll('[data-url]');
    externalButtons.forEach(button => {
      this.addTrackedEventListener(button, "click", (event) => {
        const url = event.currentTarget.dataset.url;
        if (url) {
          this.openExternalLink(url);
        }
      });
    });
  }

  /**
   * Bind keyboard events for accessibility
   */
  bindKeyboardEvents() {
    // Handle Enter/Space for menu items
    const menuItems = document.querySelectorAll('[role="menuitem"]');
    menuItems.forEach(item => {
      this.addTrackedEventListener(item, "keydown", (event) => {
        if (event.key === "Enter" || event.key === " ") {
          event.preventDefault();
          item.click();
        }
      });
    });

    // Handle Escape to close start menu
    this.addTrackedEventListener(document, "keydown", (event) => {
      if (event.key === "Escape") {
        this.hideStartMenu();
      }
    });
  }

  /**
   * Start menu visibility controls
   */
  showStartMenu() {
    const startMenu = document.querySelector(SELECTORS.START_MENU);
    const startButton = document.querySelector(SELECTORS.START_BUTTON);

    if (!startMenu || !startButton) return;

    startMenu.classList.remove(CLASSES.HIDDEN);
    startButton.classList.add(CLASSES.ACTIVE);
    startMenu.setAttribute('aria-hidden', 'false');

    // Focus first menu item for accessibility
    const firstMenuItem = startMenu.querySelector('[role="menuitem"]');
    if (firstMenuItem) {
      firstMenuItem.focus();
    }
  }

  hideStartMenu() {
    const startMenu = document.querySelector(SELECTORS.START_MENU);
    const startButton = document.querySelector(SELECTORS.START_BUTTON);

    if (!startMenu || !startButton) return;

    startMenu.classList.add(CLASSES.HIDDEN);
    startButton.classList.remove(CLASSES.ACTIVE);
    startMenu.setAttribute('aria-hidden', 'true');
    startMenu.style.animationName = "";
  }

  toggleStartMenu() {
    const startMenu = document.querySelector(SELECTORS.START_MENU);
    if (!startMenu) return;

    if (startMenu.classList.contains(CLASSES.HIDDEN)) {
      this.showStartMenu();
      startMenu.style.animationName = ANIMATIONS.SCROLL_UP;
    } else {
      this.hideStartMenu();
    }
  }

  /**
   * Event handlers
   */
  handleStartMenuItemClick(event) {
    try {
      if (typeof Win98AppManager !== 'undefined' && Win98AppManager.createAndOpenApp) {
        Win98AppManager.createAndOpenApp(event);
      } else {
        console.warn("Win98AppManager not available");
      }
      this.hideStartMenu();
    } catch (error) {
      console.error("Failed to handle start menu item click:", error);
    }
  }

  handleShutdown() {
    // TODO: Show confirmation window before shutdown
    console.log("Shutting down azOS...");
    if (confirm("Are you sure you want to shut down?")) {
      location.reload();
    }
    this.hideStartMenu();
  }

  handleHome() {
    // TODO: Should open a window with home page content
    console.log("Go to Aziz Rahmad...");
    window.location.href = "/";
    this.hideStartMenu();
  }

  handleOutsideClick(event) {
    const startMenu = document.querySelector(SELECTORS.START_MENU);
    const startButton = document.querySelector(SELECTORS.START_BUTTON);

    if (!startMenu || !startButton) return;

    if (
      !startMenu.classList.contains(CLASSES.HIDDEN) &&
      !startMenu.contains(event.target) &&
      !startButton.contains(event.target)
    ) {
      this.hideStartMenu();
    }
  }

  /**
   * Utility methods
   */
  openExternalLink(url) {
    try {
      window.open(url, '_blank', 'noopener,noreferrer');
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
    const iconHTML = iconSrc ? `<img src="${iconSrc}" alt="App Icon" loading="lazy">` : "";
    taskbarButton.innerHTML = `${iconHTML}${this.escapeHtml(title)}`;

    // Add click handler
    this.addTrackedEventListener(taskbarButton, "click", (event) => {
      this.handleTaskbarButtonClick(event);
    });

    taskbarAppArea.appendChild(taskbarButton);
    return taskbarButton;
  }

  handleTaskbarButtonClick(event) {
    const windowId = event.currentTarget.getAttribute("for");
    const win = document.getElementById(windowId);

    if (!win) {
      console.warn(`Window with id ${windowId} not found`);
      return;
    }

    try {
      if (typeof Win98System !== 'undefined' && typeof Win98WindowManager !== 'undefined') {
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
      if (typeof Win98WindowManager !== 'undefined') {
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
   * Utility function to escape HTML
   */
  escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
  }
}

// Create singleton instance
const taskbar = new Taskbar();

// Export functions for backwards compatibility
export function showStartMenu() {
  taskbar.showStartMenu();
}

export function hideStartMenu() {
  taskbar.hideStartMenu();
}

export function toggleStartMenu() {
  taskbar.toggleStartMenu();
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

// Export the manager instance for advanced usage
export { taskbar };

export default taskbar;