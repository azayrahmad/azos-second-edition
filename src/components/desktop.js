/**
 * Win98DesktopManager - Handles desktop icons and desktop interactions
 */
import { init } from "./taskbar.js";
import { apps } from "../config/apps.js";
import { handleAppAction } from "../utils/appManager.js";

function createDesktopIcon(app) {
  const iconDiv = document.createElement("div");
  iconDiv.className = "desktop-icon";
  iconDiv.setAttribute("title", app.title);
  iconDiv.setAttribute("data-app-id", app.id);

  const iconInner = document.createElement("div");
  iconInner.className = "icon";

  const iconImg = document.createElement("img");
  iconImg.src = app.icon;
  iconInner.appendChild(iconImg);

  const iconLabel = document.createElement("div");
  iconLabel.className = "icon-label";
  iconLabel.textContent = app.title;

  iconDiv.appendChild(iconInner);
  iconDiv.appendChild(iconLabel);
  // Add context menu handler
  iconDiv.addEventListener("contextmenu", (e) => {
    e.preventDefault();
    showIconContextMenu(e, app);
  });
  return iconDiv;
}

function showIconContextMenu(event, app) {
  let menuItems;
  const appConfig = apps.find((a) => a.id === app.id);

  const contextMenu = appConfig.contextMenu;

  if (contextMenu) {
    menuItems = contextMenu.map((item) => {
      if (typeof item === "string") {
        return item;
      }
      const newItem = { ...item };
      if (typeof newItem.action === "string") {
        switch (newItem.action) {
          case "open":
            newItem.click = () => handleAppAction(app);
            break;
          case "properties":
            newItem.click = () => showProperties(app);
            break;
          default:
            newItem.click = () => {};
            break;
        }
      } else if (typeof newItem.action === "function") {
        newItem.click = newItem.action;
      }
      delete newItem.action;
      return newItem;
    });
  } else {
    menuItems = [
      {
        label: "&Open",
        click: () => handleAppAction(app),
      },
    ];
  }

  const existingMenus = document.querySelectorAll(".menu-popup");
  existingMenus.forEach((menu) => menu.remove());

  const menu = new OS.MenuList(menuItems);
  document.body.appendChild(menu.element);

  menu.element.style.position = "absolute";
  menu.element.style.left = `${event.pageX}px`;
  menu.element.style.top = `${event.pageY}px`;
  menu.show();

  const closeMenu = (e) => {
    if (!menu.element.contains(e.target)) {
      menu.hide();
      if (menu.element.parentNode) {
        document.body.removeChild(menu.element);
      }
      document.removeEventListener("click", closeMenu);
    }
  };

  document.addEventListener("click", closeMenu);
}

function showDesktopContextMenu(event) {
    const themes = {
        default: 'Default',
        'peggys-pastels': "Peggy's Pastels",
        blue: 'Blue',
    };

    const setTheme = (theme) => {
        // First, set the theme in localStorage
        localStorage.setItem('desktop-theme', theme);

        // Apply the theme immediately
        applySavedTheme();

        // Dispatch a custom event to notify any open menus to update their state
        document.dispatchEvent(new CustomEvent('theme-changed'));
    };

    const menuItems = [
        {
            label: 'Theme',
            submenu: Object.keys(themes).map(themeKey => ({
                label: themes[themeKey],
                checkbox: {
                    check: () => (localStorage.getItem('desktop-theme') || 'default') === themeKey,
                    toggle: () => setTheme(themeKey),
                },
            })),
        },
        {
            label: 'Scanlines',
            checkbox: {
                check: () => document.body.classList.contains('scanlines'),
                toggle: () => {
                    document.body.classList.toggle('scanlines');
                }
            }
        }
    ];

    const existingMenus = document.querySelectorAll('.menu-popup');
    existingMenus.forEach(menu => menu.remove());

    const menu = new OS.MenuList(menuItems);
    document.body.appendChild(menu.element);

    menu.show(event.clientX, event.clientY);

    const handleThemeChange = () => {
        // When the theme changes, we need to manually trigger an update on the menu
        // to re-evaluate the 'check' state of all theme items.
        menu.element.dispatchEvent(new CustomEvent('update', {}));
    };

    const closeMenu = (e) => {
        if (!menu.element.contains(e.target) && !e.target.closest('.menu-popup')) {
            menu.closeAll();
            document.removeEventListener('click', closeMenu);
            document.removeEventListener('theme-changed', handleThemeChange); // Clean up listener
        }
    };

    setTimeout(() => {
        document.addEventListener('click', closeMenu);
        document.addEventListener('theme-changed', handleThemeChange);
    }, 0);
}

function showProperties(app) {
  console.log(`Show properties for: ${app.title}`);
  // TODO: Implement properties dialog
}

export function setupIcons() {
  const desktop = document.querySelector(".desktop");

  // Clear existing icons
  desktop.innerHTML = "";

  // Create icons for each app
  apps.forEach((app) => {
    const icon = createDesktopIcon(app);

    // Set up icon click to highlight
    icon.addEventListener("click", function () {
      // Remove highlight from all icons and icon-labels
      document
        .querySelectorAll(".desktop-icon .icon img, .desktop-icon .icon-label")
        .forEach((element) => {
          element.classList.remove(
            "highlighted-icon",
            "highlighted-label",
            "selected",
          );
        });

      // Add highlight to the clicked icon and icon-label
      const iconImg = this.querySelector(".icon img");
      const iconLabel = this.querySelector(".icon-label");
      if (iconImg) iconImg.classList.add("highlighted-icon");
      if (iconLabel) {
        iconLabel.classList.add("highlighted-label");
        iconLabel.classList.add("selected");
      }
    });

    // Double-click to execute app action
    icon.addEventListener("dblclick", () => {
      handleAppAction(app);
    });

    desktop.appendChild(icon);
  });
}

function applySavedTheme() {
    const savedTheme = localStorage.getItem('desktop-theme') || 'default';
    const themeIds = ['peggys-pastels-theme', 'blue-theme'];

    themeIds.forEach(id => {
        const stylesheet = document.getElementById(id);
        if (stylesheet) {
            // Disable all theme stylesheets except the active one
            stylesheet.disabled = (stylesheet.id !== `${savedTheme}-theme`);
        }
    });
}

// Initialize desktop behavior
export function initDesktop() {
  console.log("Initializing Win98 Desktop Manager...");
  applySavedTheme();
  setupIcons();

  const desktop = document.querySelector('.desktop');
  desktop.addEventListener('contextmenu', (e) => {
    // Show desktop context menu only if not clicking on an icon
    if (e.target === desktop) {
      e.preventDefault();
      showDesktopContextMenu(e);
    }
  });

  // Add click handler to desktop to deselect icons
  desktop.addEventListener('click', (e) => {
    // Only handle clicks directly on the desktop (not on icons)
    if (e.target === desktop) {
      // Remove highlight from all icons and icon-labels
      document
        .querySelectorAll(".desktop-icon .icon img, .desktop-icon .icon-label")
        .forEach((element) => {
          element.classList.remove(
            "highlighted-icon",
            "highlighted-label",
            "selected",
          );
        });
    }
  });

  init(); // Initialize the taskbar manager
}
