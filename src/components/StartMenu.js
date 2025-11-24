/**
 * StartMenu - Handles start menu functionality
 * Separated from Taskbar for better code organization
 */

// Import icons
import windowsStartMenuBar from "../assets/img/win98start.png";
import { ICONS } from "../config/icons.js";
import startMenuConfig from "../config/startmenu.js";
import { playSound } from "../utils/soundManager.js";

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
  SCROLL_DOWN: "scrollDown",
};

/**
 * StartMenu class - encapsulates all start menu functionality
 */
class StartMenu {
  constructor() {
    this.isVisible = false;
    this.eventListeners = new Map();
    this.openSubmenus = [];
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

  render() {
    const startMenuWrapper = document.querySelector(".start-menu-wrapper");
    if (!startMenuWrapper) {
      throw new Error("Start menu wrapper not found");
    }

    startMenuWrapper.innerHTML = this.getStartMenuHTML();
  }

  getStartMenuHTML() {
    const dynamicItemsHTML = startMenuConfig
      .map((item) => {
        const hasSubmenu = item.submenu && item.submenu.length > 0;
        return `
        <li class="start-menu-item ${hasSubmenu ? "has-submenu" : ""}" role="menuitem" tabindex="0" data-id="${this.escapeHtml(item.label)}">
          <img src="${item.icon}" alt="${this.escapeHtml(item.label)}">
          <span>${this.escapeHtml(item.label)}</span>
          ${hasSubmenu ? '<span class="submenu-arrow"></span>' : ""}
        </li>
      `;
      })
      .join("");

    return `
      <div id="start-menu" class="start-menu ${CLASSES.HIDDEN}">
        <div class="blue-rectangle">
          <img src="${windowsStartMenuBar}" alt="Start Menu Bar" loading="lazy" />
        </div>
        <ul class="start-menu-list">
          <li role="menuitem" tabindex="0" data-action="home">
            <img src="${ICONS.windowsUpdate[32]}" alt="Computer" loading="lazy">
            <span>aziz rahmad</span>
          </li>
          <div class="start-menu-divider" role="separator"></div>
          ${dynamicItemsHTML}
          <div class="start-menu-divider" role="separator"></div>
          <li class="logoff-menu-item" role="menuitem" tabindex="0">
            <img src="${ICONS.logoff[32]}" alt="Log off" loading="lazy">
            <span id="logofftext">Log Off Guest...</span>
          </li>
          <li role="menuitem" tabindex="0" data-action="shutdown">
            <img src="${ICONS.shutdown[32]}" alt="Shutdown" loading="lazy">
            <span>Shut Down...</span>
          </li>
        </ul>
      </div>`;
  }

  bindEvents() {
    this.bindSpecialActionEvents();
    this.bindKeyboardEvents();
    this.bindOutsideClickEvents();
    this.bindMenuItems();
  }

  attachSubmenu(menuItem, submenuItems) {
    let activeMenu = null;
    let closeTimeout;

    const openMenu = () => {
      clearTimeout(closeTimeout);
      if (activeMenu) return;

      // Close any other open submenus immediately
      if (this.openSubmenus.length > 0) {
        [...this.openSubmenus].forEach((menu) => menu.close());
        this.openSubmenus = [];
      }

      activeMenu = new window.MenuPopup(submenuItems, {
        parentMenuPopup: null,
        useSlideAnimation: true,
        handleKeyDown: (e) => {
          if (e.key === "Escape") {
            closeMenu();
          }
        },
        closeMenus: () => {
          closeMenu();
        },
        setActiveMenuPopup: (menu) => {
          activeMenu = menu;
        },
        send_info_event: () => {},
        refocus_outside_menus: () => {},
      });

      const screen = document.getElementById("screen");
      screen.appendChild(activeMenu.element);
      const rect = menuItem.getBoundingClientRect();
      const screenRect = screen.getBoundingClientRect();
      activeMenu.element.style.left = `${rect.right - screenRect.left}px`;
      activeMenu.element.style.top = `${rect.top - screenRect.top}px`;
      activeMenu.element.style.zIndex = `${window.os_gui_utils.get_new_menu_z_index()}`;
      if (typeof window.playSound === "function") {
        window.playSound("MenuPopup");
      }
      this.openSubmenus.push(activeMenu);

      this.addTrackedEventListener(activeMenu.element, "pointerenter", () => {
        clearTimeout(closeTimeout);
      });
    };

    const closeMenu = (useTimeout = false) => {
      const doClose = () => {
        if (activeMenu) {
          this.openSubmenus = this.openSubmenus.filter((m) => m !== activeMenu);
          activeMenu.close();
          activeMenu = null;
        }
      };

      if (useTimeout) {
        closeTimeout = setTimeout(doClose, 100);
      } else {
        doClose();
      }
    };

    this.addTrackedEventListener(menuItem, "pointerenter", openMenu);
  }

  bindMenuItems() {
    startMenuConfig.forEach((itemConfig) => {
      const menuItem = document.querySelector(
        `.start-menu-item[data-id="${this.escapeHtml(itemConfig.label)}"]`,
      );
      if (!menuItem) return;

      if (itemConfig.submenu) {
        this.attachSubmenu(menuItem, itemConfig.submenu);
      } else if (itemConfig.action) {
        this.addTrackedEventListener(menuItem, "click", () => {
          itemConfig.action();
          this.hide();
        });
      }
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
    const startMenuWrapper = document.querySelector(".start-menu-wrapper");

    if (!startMenu || !startButton || !startMenuWrapper) return;

    playSound("MenuPopup");

    // 1. Make menu visible but off-screen to measure it
    startMenu.classList.remove(CLASSES.HIDDEN);
    startMenu.style.transform = "translateY(100%)"; // Move it down
    startMenu.style.animationName = ""; // Clear animation

    // 2. Measure dimensions
    const menuRect = startMenu.getBoundingClientRect();

    // 3. Set wrapper size and position
    startMenuWrapper.style.width = `${menuRect.width}px`;
    startMenuWrapper.style.height = `${menuRect.height}px`;

    // 4. Reset menu position and trigger animation
    requestAnimationFrame(() => {
      startMenu.style.transform = "";
      startMenu.style.animationName = ANIMATIONS.SCROLL_UP;
    });

    startMenu.classList.add("is-animating");
    startButton.classList.add("selected");
    startButton.setAttribute("aria-pressed", "true");
    startMenu.setAttribute("aria-hidden", "false");
    this.isVisible = true;

    const firstMenuItem = startMenu.querySelector('[role="menuitem"]');
    if (firstMenuItem) {
      setTimeout(() => firstMenuItem.focus(), 50);
    }

    const handleAnimationEnd = () => {
      startMenu.style.animationName = "";
      startMenu.classList.remove("is-animating");
      startMenuWrapper.style.pointerEvents = "auto";
    };
    startMenu.addEventListener("animationend", handleAnimationEnd, {
      once: true,
    });
  }

  /**
   * Hide the start menu
   */
  hide() {
    const startMenu = document.querySelector(SELECTORS.START_MENU);
    const startButton = document.querySelector(SELECTORS.START_BUTTON);
    const startMenuWrapper = document.querySelector(".start-menu-wrapper");

    if (!startMenu || !startButton || !startMenuWrapper || !this.isVisible)
      return;

    startMenu.style.animationName = "";
    startMenu.classList.add("is-animating");
    startMenuWrapper.style.pointerEvents = "none";
    startMenu.style.animationName = ANIMATIONS.SCROLL_DOWN;

    const handleAnimationEnd = () => {
      startMenu.classList.add(CLASSES.HIDDEN);
      startMenu.style.animationName = "";
      startMenu.classList.remove("is-animating");
      startMenu.setAttribute("aria-hidden", "true");
      // Reset wrapper size
      startMenuWrapper.style.width = "0px";
      startMenuWrapper.style.height = "0px";
    };
    startMenu.addEventListener("animationend", handleAnimationEnd, {
      once: true,
    });

    startButton.classList.remove("selected");
    startButton.setAttribute("aria-pressed", "false");
    this.isVisible = false;

    this.openSubmenus.forEach((menu) => menu.close());
    this.openSubmenus = [];
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
   * Handle shutdown action
   */
  handleShutdown() {
    console.log("Shutting down azOS...");
    if (confirm("Are you sure you want to shut down?")) {
      playSound("SystemExit");
      setTimeout(() => location.reload(), 500);
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
