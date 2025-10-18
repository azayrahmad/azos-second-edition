/**
 * StartMenu - Handles start menu functionality
 * Separated from Taskbar for better code organization
 */

// Import icons
import windowsStartMenuBar from "../../assets/img/win98start.png";
import { ICONS } from "../../config/icons.js";
import { apps } from "../../config/apps.js";
import startMenuApps from "../../config/startmenu.json";
import { launchApp } from "../../core/appManager.js";
import "./start-menu.css";

// Constants
const SELECTORS = {
  START_MENU: "#start-menu",
  START_MENU_ITEM: ".start-menu-item",
  START_BUTTON: ".start-button",
};

const CLASSES = {
  HIDDEN: "hidden",
  ACTIVE: "active",
};

const ANIMATIONS = {
  SCROLL_UP: "scrollUp",
};

/**
 * StartMenu class - encapsulates all start menu functionality
 */
class StartMenu {
  constructor() {
    this.isVisible = false;
    this.eventListeners = new Map();
  }

  /**
   * Initialize the start menu
   */
  init() {
    try {
      console.log("Initializing StartMenu...");
      this.render();
      this.bindEvents();
    } catch (error) {
      console.error("Failed to initialize StartMenu:", error);
      throw error;
    }
  }

  /**
   * Clean up resources and event listeners
   */
  destroy() {
    // Remove all tracked event listeners
    this.eventListeners.forEach(({ element, event, handler }) => {
      element.removeEventListener(event, handler);
    });
    this.eventListeners.clear();
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
   * Render the start menu HTML
   */
  render() {
    const startMenuWrapper = document.querySelector(".start-menu-wrapper");
    if (!startMenuWrapper) {
      throw new Error("Start menu wrapper not found");
    }

    startMenuWrapper.innerHTML = this.getStartMenuHTML();
  }
  /**
   * Generate app menu items HTML from apps configuration
   */
  generateAppMenuItems() {
    const appsToLoad = apps.filter((app) => startMenuApps.includes(app.id));
    return appsToLoad
      .map(
        (app) => `
          <li class="start-menu-item" role="menuitem" tabindex="0" data-app-id="${app.id}">
              <img src="${app.icon[16]}" alt="${app.title}" loading="lazy">
              <span>${app.title}</span>
          </li>
      `,
      )
      .join("");
  }
  /**
   * Generate start menu HTML template
   */
  getStartMenuHTML() {
    return `
       <div id="start-menu" class="start-menu ${CLASSES.HIDDEN}">
         <div class="blue-rectangle">
           <img src="${windowsStartMenuBar}" alt="Start Menu Bar" loading="lazy" />
         </div>
         <ul class="start-menu-list">
           <li role="menuitem" tabindex="0" data-action="home">
             <img src="${ICONS.computer[16]}" alt="Computer" loading="lazy">
             <span>aziz rahmad</span>
           </li>
           <div class="start-menu-divider" role="separator"></div>
           ${this.generateAppMenuItems()}
           <div class="start-menu-divider" role="separator"></div>
           <li class="logoff-menu-item" role="menuitem" tabindex="0">
             <img src="${ICONS.key[16]}" alt="Log off" loading="lazy">
             <span id="logofftext">Log Off Guest...</span>
           </li>
           <li role="menuitem" tabindex="0" data-action="shutdown">
             <img src="${ICONS.shutdown[16]}" alt="Shutdown" loading="lazy">
             <span>Shut Down...</span>
           </li>
         </ul>
       </div>`;
  }

  /**
   * Bind all start menu event listeners
   */
  bindEvents() {
    this.bindMenuItemEvents();
    this.bindSpecialActionEvents();
    this.bindKeyboardEvents();
    this.bindOutsideClickEvents();
  }

  /**
   * Bind start menu item click events
   */ bindMenuItemEvents() {
    const startMenuItems = document.querySelectorAll(
      ".start-menu-item[data-app-id]",
    );
    startMenuItems.forEach((item) => {
      this.addTrackedEventListener(item, "click", (event) => {
        const appId = item.getAttribute("data-app-id");
        if (appId) {
          launchApp(appId);
          this.hide();
        }
      });
    });
  }

  /**
   * Bind special action events (shutdown, home, etc.)
   */
  bindSpecialActionEvents() {
    const shutdownItem = document.querySelector('[data-action="shutdown"]');
    this.addTrackedEventListener(shutdownItem, "click", () =>
      this.handleShutdown(),
    );

    const homeItem = document.querySelector('[data-action="home"]');
    this.addTrackedEventListener(homeItem, "click", () => this.handleHome());
  }

  /**
   * Bind keyboard events for accessibility
   */
  bindKeyboardEvents() {
    const menuItems = document.querySelectorAll('[role="menuitem"]');
    menuItems.forEach((item) => {
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
        this.hide();
      }
    });
  }

  /**
   * Bind outside click events to hide menu
   */
  bindOutsideClickEvents() {
    this.addTrackedEventListener(document, "click", (event) => {
      this.handleOutsideClick(event);
    });
  }

  /**
   * Show the start menu
   */
  show() {
    const startMenu = document.querySelector(SELECTORS.START_MENU);
    const startButton = document.querySelector(SELECTORS.START_BUTTON);

    if (!startMenu || !startButton) return;

    // Reset animation first to ensure clean state
    startMenu.style.animationName = "";

    startMenu.classList.remove(CLASSES.HIDDEN);
    startButton.classList.add("selected"); // Changed from CLASSES.ACTIVE
    startButton.setAttribute("aria-pressed", "true"); // Added
    startMenu.setAttribute("aria-hidden", "false");
    this.isVisible = true;

    // Apply animation after a brief delay to ensure proper rendering
    requestAnimationFrame(() => {
      startMenu.style.animationName = ANIMATIONS.SCROLL_UP;
    });

    // Focus first menu item for accessibility
    const firstMenuItem = startMenu.querySelector('[role="menuitem"]');
    if (firstMenuItem) {
      // Delay focus until after animation starts
      setTimeout(() => {
        firstMenuItem.focus();
      }, 50);
    }

    // Reset animation after completion to prevent conflicts
    const handleAnimationEnd = () => {
      startMenu.style.animationName = "";
      startMenu.removeEventListener("animationend", handleAnimationEnd);
    };
    startMenu.addEventListener("animationend", handleAnimationEnd);
  }

  /**
   * Hide the start menu
   */
  hide() {
    const startMenu = document.querySelector(SELECTORS.START_MENU);
    const startButton = document.querySelector(SELECTORS.START_BUTTON);

    if (!startMenu || !startButton) return;

    // Clear any running animations first
    startMenu.style.animationName = "";

    startMenu.classList.add(CLASSES.HIDDEN);
    startButton.classList.remove("selected"); // Changed from CLASSES.ACTIVE
    startButton.setAttribute("aria-pressed", "false"); // Added
    startMenu.setAttribute("aria-hidden", "true");
    this.isVisible = false;
  }

  /**
   * Toggle start menu visibility
   */
  toggle() {
    if (this.isVisible) {
      this.hide();
    } else {
      this.show();
    }
  }

  /**
   * Handle menu item clicks
   */
  handleMenuItemClick(event) {
    try {
      if (
        typeof Win98AppManager !== "undefined" &&
        Win98AppManager.createAndOpenApp
      ) {
        Win98AppManager.createAndOpenApp(event);
      } else {
        console.warn("Win98AppManager not available");
      }
      this.hide();
    } catch (error) {
      console.error("Failed to handle menu item click:", error);
    }
  }

  /**
   * Handle shutdown action
   */
  handleShutdown() {
    console.log("Shutting down azOS...");
    if (confirm("Are you sure you want to shut down?")) {
      location.reload();
    }
    this.hide();
  }

  /**
   * Handle home action
   */
  handleHome() {
    console.log("Go to Aziz Rahmad...");
    window.location.href = "/";
    this.hide();
  }

  /**
   * Handle clicks outside the start menu
   */
  handleOutsideClick(event) {
    const startMenu = document.querySelector(SELECTORS.START_MENU);
    const startButton = document.querySelector(SELECTORS.START_BUTTON);

    if (!startMenu || !startButton) return;

    if (
      this.isVisible &&
      !startMenu.contains(event.target) &&
      !startButton.contains(event.target)
    ) {
      this.hide();
    }
  }

  /**
   * Check if start menu is currently visible
   */
  getIsVisible() {
    return this.isVisible;
  }

  /**
   * Add custom menu item
   */
  addMenuItem(config) {
    const { icon, text, action, position = "before-divider" } = config;

    if (!icon || !text || !action) {
      console.warn("Invalid menu item configuration");
      return;
    }

    const startMenuList = document.querySelector(".start-menu-list");
    if (!startMenuList) return;

    const menuItem = document.createElement("li");
    menuItem.className = "start-menu-item";
    menuItem.setAttribute("role", "menuitem");
    menuItem.setAttribute("tabindex", "0");
    menuItem.innerHTML = `
      <img src="${icon}" alt="${text}" loading="lazy">
      <span>${this.escapeHtml(text)}</span>
    `;

    // Add click handler
    this.addTrackedEventListener(menuItem, "click", action);

    // Add keyboard handler
    this.addTrackedEventListener(menuItem, "keydown", (event) => {
      if (event.key === "Enter" || event.key === " ") {
        event.preventDefault();
        action();
      }
    });

    // Insert based on position
    const divider = startMenuList.querySelector(".start-menu-divider");
    if (position === "before-divider" && divider) {
      startMenuList.insertBefore(menuItem, divider);
    } else {
      startMenuList.appendChild(menuItem);
    }

    return menuItem;
  }

  /**
   * Remove menu item by text content
   */
  removeMenuItem(text) {
    const menuItems = document.querySelectorAll(".start-menu-item span");
    menuItems.forEach((span) => {
      if (span.textContent === text) {
        const menuItem = span.closest(".start-menu-item");
        if (menuItem) {
          menuItem.remove();
        }
      }
    });
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

export default StartMenu;
