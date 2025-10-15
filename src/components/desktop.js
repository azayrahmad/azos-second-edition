/**
 * Win98DesktopManager - Handles desktop icons and desktop interactions
 */
import { init } from "./taskbar.js";
import { apps } from "../config/apps.js";
import desktopApps from "../config/desktop.json";
import { handleAppAction } from "../utils/appManager.js";

function getIconId(app, filePath = null) {
  // Create a unique ID for the icon based on app ID or file path
  return filePath ? `file-${filePath.replace(/[^a-zA-Z0-9]/g, '-')}` : `app-${app.id}`;
}

function createDesktopIcon(item, isFile = false) {
  const app = isFile ? apps.find(a => a.id === item.app) : item;
  if (!app) return null;

  const iconDiv = document.createElement("div");
  iconDiv.className = "desktop-icon";
  iconDiv.setAttribute("title", isFile ? item.filename : app.title);

  const iconId = getIconId(app, isFile ? item.path : null);
  iconDiv.setAttribute("data-icon-id", iconId);

  iconDiv.setAttribute("data-app-id", app.id);
  if (isFile) {
    iconDiv.setAttribute("data-file-path", item.path);
  }

  const iconInner = document.createElement("div");
  iconInner.className = "icon";

  const iconImg = document.createElement("img");
  iconImg.src = app.icon; // For now, files use the icon of the app that opens them.
  iconInner.appendChild(iconImg);

  const iconLabel = document.createElement("div");
  iconLabel.className = "icon-label";
  iconLabel.textContent = isFile ? item.filename : app.title;

  iconDiv.appendChild(iconInner);
  iconDiv.appendChild(iconLabel);

  iconDiv.addEventListener("contextmenu", (e) => {
    e.preventDefault();
    showIconContextMenu(e, app); // Context menu might need adjustments for files
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
            newItem.click = () => { };
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
    '60s-usa': '60s USA',
    'dangerous-creatures': 'Dangerous Creatures',
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
      label: 'Sort Icons',
      click: () => {
        // Remove saved positions and redraw icons
        localStorage.removeItem('iconPositions');
        setupIcons();
      },
    },
    '-',
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
    if (menu.activeSubmenu) {
      menu.activeSubmenu.element.dispatchEvent(new CustomEvent('update', {}));
    }
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
  desktop.innerHTML = ""; // Clear existing icons

  const iconPositions = JSON.parse(localStorage.getItem("iconPositions")) || {};

  const placeIcon = (icon, iconId) => {
    if (iconPositions[iconId]) {
      icon.style.position = "absolute";
      icon.style.left = iconPositions[iconId].x;
      icon.style.top = iconPositions[iconId].y;
    }
    desktop.appendChild(icon);
  };

  // Load apps
  const appsToLoad = apps.filter((app) => desktopApps.apps.includes(app.id));
  appsToLoad.forEach((app) => {
    const icon = createDesktopIcon(app, false);
    if (icon) {
      const iconId = getIconId(app);
      configureIcon(icon, app, null);
      placeIcon(icon, iconId);
    }
  });

  // Load files
  desktopApps.files.forEach((file) => {
    const icon = createDesktopIcon(file, true);
    if (icon) {
      const app = apps.find((a) => a.id === file.app);
      const iconId = getIconId(app, file.path);
      configureIcon(icon, app, file.path);
      placeIcon(icon, iconId);
    }
  });
}

function configureIcon(icon, app, filePath = null) {
  let isDragging = false;
  let wasDragged = false;
  let dragStartX, dragStartY;
  let clickTimeout = null;

  const iconId = icon.getAttribute("data-icon-id");

  icon.addEventListener("mousedown", (e) => {
    // Left-click only
    if (e.button !== 0) return;

    e.preventDefault();

    isDragging = true;
    wasDragged = false;
    dragStartX = e.clientX;
    dragStartY = e.clientY;

    const desktopRect = icon.parentElement.getBoundingClientRect();
    const iconRect = icon.getBoundingClientRect();

    const offsetX = e.clientX - iconRect.left;
    const offsetY = e.clientY - iconRect.top;

    const onMouseMove = (moveEvent) => {
      // Check if the mouse has moved a significant distance to be considered a drag
      if (
        !wasDragged &&
        Math.abs(moveEvent.clientX - dragStartX) < 5 &&
        Math.abs(moveEvent.clientY - dragStartY) < 5
      ) {
        return; // Not a drag yet
      }
      wasDragged = true;

      // Now we're dragging
      if (isDragging) {
        // Clear selection to avoid text selection issues
        window.getSelection().removeAllRanges();

        let newX = moveEvent.clientX - desktopRect.left - offsetX;
        let newY = moveEvent.clientY - desktopRect.top - offsetY;

        // Constrain to desktop boundaries
        newX = Math.max(
          0,
          Math.min(newX, desktopRect.width - iconRect.width)
        );
        newY = Math.max(
          0,
          Math.min(newY, desktopRect.height - iconRect.height)
        );

        icon.style.position = "absolute";
        icon.style.left = `${newX}px`;
        icon.style.top = `${newY}px`;
      }
    };

    const onMouseUp = () => {
      isDragging = false;
      document.removeEventListener("mousemove", onMouseMove);
      document.removeEventListener("mouseup", onMouseUp);

      if (wasDragged) {
        // Save position if dragged
        const iconPositions =
          JSON.parse(localStorage.getItem("iconPositions")) || {};
        iconPositions[iconId] = {
          x: icon.style.left,
          y: icon.style.top,
        };
        localStorage.setItem("iconPositions", JSON.stringify(iconPositions));
      }
    };

    document.addEventListener("mousemove", onMouseMove);
    document.addEventListener("mouseup", onMouseUp);
  });

  icon.addEventListener("click", function (e) {
    if (wasDragged) {
      e.stopPropagation(); // Stop click from propagating if it was a drag
      return;
    }
    // Handle single click for selection
    document
      .querySelectorAll(".desktop-icon .icon img, .desktop-icon .icon-label")
      .forEach((element) => {
        element.classList.remove(
          "highlighted-icon",
          "highlighted-label",
          "selected"
        );
      });

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
    if (wasDragged) {
      return; // Don't launch app if the icon was dragged
    }
    if (filePath) {
      const appWithFile = { ...app, filePath: filePath };
      handleAppAction(appWithFile);
    } else {
      handleAppAction(app);
    }
  });
}

function applySavedTheme() {
  const savedTheme = localStorage.getItem('desktop-theme') || 'default';
  const themeIds = ['peggys-pastels-theme', 'blue-theme', '60s-usa-theme', 'dangerous-creatures-theme'];

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
