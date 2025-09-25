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
  const defaultContextMenu = [
    { label: '&Open', action: 'open', default: true },
    'MENU_DIVIDER',
    { label: 'Cu&t', enabled: false },
    { label: '&Copy', enabled: false },
    { label: '&Create Shortcut', enabled: false },
    { label: '&Delete', enabled: false },
    'MENU_DIVIDER',
    { label: 'Rena&me', enabled: false },
    { label: 'Proper&ties', action: 'properties' },
  ];

  // Remove any existing menus
  const existingMenus = document.querySelectorAll('.menu-popup');
  existingMenus.forEach(menu => menu.remove());

  const menuItems = (app.contextMenu || defaultContextMenu).map(item => {
    if (typeof item === 'string') {
      return item; // Handle dividers
    }
    return {
      ...item,
      click: () => {
        if (item.action === 'open') {
          handleAppAction(app);
        } else if (item.action === 'properties') {
          showProperties(app);
        }
        // Add more actions as needed
      },
    };
  });

  const menu = new OS.MenuList(menuItems);
  document.body.appendChild(menu.element);

  // Position the menu at click coordinates
  menu.element.style.position = 'absolute';
  menu.element.style.left = `${event.pageX}px`;
  menu.element.style.top = `${event.pageY}px`;
  menu.show();

  // Close menu when clicking outside
  const closeMenu = (e) => {
    if (!menu.element.contains(e.target)) {
      menu.hide();
      if (menu.element.parentNode) {
        document.body.removeChild(menu.element);
      }
      document.removeEventListener('click', closeMenu);
    }
  };

  document.addEventListener('click', closeMenu);
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

// Initialize desktop behavior
export function initDesktop() {
  console.log("Initializing Win98 Desktop Manager...");
  setupIcons();
  init(); // Initialize the taskbar manager
}