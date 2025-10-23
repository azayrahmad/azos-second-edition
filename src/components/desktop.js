/**
 * Win98DesktopManager - Handles desktop icons and desktop interactions
 */
import { init } from "./taskbar.js";
import { apps } from "../config/apps.js";
import { getItem, setItem, removeItem, LOCAL_STORAGE_KEYS } from '../utils/localStorage.js';
import cDrive from "../config/c.json";
const desktopApps = cDrive.User.Desktop;
import { launchApp, handleAppAction } from "../utils/appManager.js";
import { getThemes, getCurrentTheme, setTheme, applyTheme } from "../utils/themeManager.js";
import { ICONS } from "../config/icons.js";
import { playSound } from '../utils/soundManager.js';

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
  iconImg.src = app.icon[32]; // For now, files use the icon of the app that opens them.
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
            newItem.click = () => launchApp(app.id);
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

  const menu = new MenuList(menuItems);
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

function setWallpaper() {
  const input = document.createElement('input');
  input.type = 'file';
  input.accept = 'image/*';
  input.onchange = (e) => {
    const file = e.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (readerEvent) => {
        const dataUrl = readerEvent.target.result;
        setItem(LOCAL_STORAGE_KEYS.WALLPAPER, dataUrl);
        applyWallpaper();
      };
      reader.readAsDataURL(file);
    }
  };
  input.click();
}

function getWallpaperMode() {
  return getItem(LOCAL_STORAGE_KEYS.WALLPAPER_MODE) || 'tile';
}

function setWallpaperMode(mode) {
  setItem(LOCAL_STORAGE_KEYS.WALLPAPER_MODE, mode);
  applyWallpaper();
  document.dispatchEvent(new CustomEvent('wallpaper-changed'));
}

function applyWallpaper() {
  const wallpaper = getItem(LOCAL_STORAGE_KEYS.WALLPAPER);
  const desktop = document.querySelector('.desktop');
  if (wallpaper) {
    const mode = getWallpaperMode();
    desktop.style.backgroundImage = `url(${wallpaper})`;
    if (mode === 'stretch') {
      desktop.style.backgroundRepeat = 'no-repeat';
      desktop.style.backgroundSize = '100% 100%';
    } else { // 'tile'
      desktop.style.backgroundRepeat = 'repeat';
      desktop.style.backgroundSize = 'auto';
    }
    desktop.style.backgroundColor = ''; // Remove solid color
  } else {
    desktop.style.backgroundImage = '';
    desktop.style.backgroundColor = 'var(--desktop-bg)'; // Restore solid color
  }
}

function removeWallpaper() {
  removeItem(LOCAL_STORAGE_KEYS.WALLPAPER);
  applyWallpaper();
}

function getMonitorType() {
  return getItem(LOCAL_STORAGE_KEYS.MONITOR_TYPE) || 'CRT';
}

function setMonitorType(type) {
  setItem(LOCAL_STORAGE_KEYS.MONITOR_TYPE, type);
  if (type === 'CRT') {
    document.body.classList.add('scanlines');
  } else {
    document.body.classList.remove('scanlines');
  }
}

function applyMonitorType() {
    const type = getMonitorType();
    if (type === 'CRT') {
        document.body.classList.add('scanlines');
    } else {
        document.body.classList.remove('scanlines');
    }
}

function showDesktopContextMenu(event) {
  const themes = getThemes();

  const menuItems = [
    {
      label: 'Sort Icons',
      click: () => {
        // Remove saved positions and redraw icons
        removeItem(LOCAL_STORAGE_KEYS.ICON_POSITIONS);
        setupIcons();
      },
    },
    {
      label: 'Empty Recycle Bin',
      click: () => {
        playSound('EmptyRecycleBin');
      },
    },
    'MENU_DIVIDER',
    {
      label: 'Wallpaper',
      submenu: [
        {
          label: 'Set Wallpaper...',
          click: setWallpaper,
        },
        {
          label: 'Remove Wallpaper',
          click: removeWallpaper,
        },
        'MENU_DIVIDER',
        {
          radioItems: [
            { label: 'Tile', value: 'tile' },
            { label: 'Stretch', value: 'stretch' },
          ],
          getValue: () => getWallpaperMode(),
          setValue: (value) => setWallpaperMode(value),
          ariaLabel: 'Wallpaper Mode'
        },
      ],
    },
    'MENU_DIVIDER',
    {
      label: 'Theme',
      submenu: [{
        radioItems: Object.keys(themes).map(themeKey => ({
          label: themes[themeKey],
          value: themeKey,
        })),
        getValue: () => getCurrentTheme(),
        setValue: (value) => setTheme(value),
        ariaLabel: 'Color Theme'
      }],
    },
    {
      label: 'Monitor Type',
      submenu: [{
        radioItems: [
          { label: 'TFT', value: 'TFT' },
          { label: 'CRT', value: 'CRT' },
        ],
        getValue: () => getMonitorType(),
        setValue: (value) => setMonitorType(value),
        ariaLabel: 'Monitor Type'
      }],
    }
  ];

  const existingMenus = document.querySelectorAll('.menu-popup');
  existingMenus.forEach(menu => menu.remove());

  const menu = new MenuList(menuItems);
  document.body.appendChild(menu.element);

  menu.show(event.clientX, event.clientY);

  const updateActiveSubmenu = () => {
    // When the theme changes, we need to manually trigger an update on the menu
    // to re-evaluate the 'check' state of all theme items.
    if (menu.activeSubmenu) {
      menu.activeSubmenu.element.dispatchEvent(new CustomEvent('update', {}));
    }
  };

  // Consolidate event handlers for state changes that affect the menu
  const handleThemeChange = updateActiveSubmenu;
  const handleWallpaperChange = updateActiveSubmenu;

  const closeMenu = (e) => {
    if (!menu.element.contains(e.target) && !e.target.closest('.menu-popup')) {
      menu.closeAll();
      document.removeEventListener('click', closeMenu);
      document.removeEventListener('theme-changed', handleThemeChange); // Clean up listener
      document.removeEventListener('wallpaper-changed', handleWallpaperChange);
    }
  };

  setTimeout(() => {
    document.addEventListener('click', closeMenu);
    document.addEventListener('theme-changed', handleThemeChange);
    document.addEventListener('wallpaper-changed', handleWallpaperChange);
  }, 0);
}

function showProperties(app) {
  console.log(`Show properties for: ${app.title}`);
  // TODO: Implement properties dialog
}

export function setupIcons() {
  const desktop = document.querySelector(".desktop");
  desktop.innerHTML = ""; // Clear existing icons

  const iconPositions = getItem(LOCAL_STORAGE_KEYS.ICON_POSITIONS) || {};

  // If there are any saved positions, we are in manual mode.
  if (Object.keys(iconPositions).length > 0) {
    desktop.classList.add('has-absolute-icons');
  } else {
    desktop.classList.remove('has-absolute-icons');
  }

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
  let offsetX, offsetY;
  let longPressTimer;
  let isLongPress = false;

  const iconId = icon.getAttribute("data-icon-id");

  const handleDragStart = (e) => {
    // For mouse events, only respond to left-click
    if (e.type === 'mousedown' && e.button !== 0) return;

    // We prevent default on mousedown to stop text selection, but not on touchstart
    // to allow the browser to generate click/dblclick events.
    if (e.type === 'mousedown') {
      e.preventDefault();
    }

    isDragging = true;
    wasDragged = false;
    isLongPress = false;

    const clientX = e.type === 'touchstart' ? e.touches[0].clientX : e.clientX;
    const clientY = e.type === 'touchstart' ? e.touches[0].clientY : e.clientY;

    dragStartX = clientX;
    dragStartY = clientY;

    // Long press detection for touch
    if (e.type === 'touchstart') {
      longPressTimer = setTimeout(() => {
        isLongPress = true;
        // Find the touch point to position the context menu
        const touch = e.touches[0];
        const mockEvent = {
          pageX: touch.pageX,
          pageY: touch.pageY,
          preventDefault: () => e.preventDefault(),
        };
        showIconContextMenu(mockEvent, app);
      }, 500); // 500ms for a long press
    }

    const desktop = icon.parentElement;
    const desktopRect = desktop.getBoundingClientRect();

    if (!desktop.classList.contains('has-absolute-icons')) {
      const allIcons = Array.from(desktop.querySelectorAll('.desktop-icon'));
      const initialPositions = allIcons.map(i => ({
        icon: i,
        id: i.getAttribute('data-icon-id'),
        rect: i.getBoundingClientRect()
      }));
      const iconPositions = {};
      initialPositions.forEach(({ icon: i, id, rect }) => {
        const x = `${rect.left - desktopRect.left}px`;
        const y = `${rect.top - desktopRect.top}px`;
        i.style.position = 'absolute';
        i.style.left = x;
        i.style.top = y;
        iconPositions[id] = { x, y };
      });
      setItem(LOCAL_STORAGE_KEYS.ICON_POSITIONS, iconPositions);
      desktop.classList.add('has-absolute-icons');
    }

    const iconRect = icon.getBoundingClientRect();
    offsetX = clientX - iconRect.left;
    offsetY = clientY - iconRect.top;

    if (e.type === 'mousedown') {
      document.addEventListener("mousemove", handleDragMove);
      document.addEventListener("mouseup", handleDragEnd);
    } else if (e.type === 'touchstart') {
      document.addEventListener("touchmove", handleDragMove, { passive: false });
      document.addEventListener("touchend", handleDragEnd);
    }
  };

  const handleDragMove = (e) => {
    if (!isDragging) return;

    const clientX = e.type === 'touchmove' ? e.touches[0].clientX : e.clientX;
    const clientY = e.type === 'touchmove' ? e.touches[0].clientY : e.clientY;

    if (Math.abs(clientX - dragStartX) > 5 || Math.abs(clientY - dragStartY) > 5) {
      clearTimeout(longPressTimer); // Moved too far, not a long press
      if (!wasDragged) {
        wasDragged = true;
        window.getSelection().removeAllRanges();
      }
    }

    if (!wasDragged) return;

    // Prevent scrolling on touch devices ONLY when dragging
    if (e.type === 'touchmove') {
      e.preventDefault();
    }

    const desktop = icon.parentElement;
    const desktopRect = desktop.getBoundingClientRect();
    const iconRect = icon.getBoundingClientRect();

    let newX = clientX - desktopRect.left - offsetX;
    let newY = clientY - desktopRect.top - offsetY;

    newX = Math.max(0, Math.min(newX, desktopRect.width - iconRect.width));
    newY = Math.max(0, Math.min(newY, desktopRect.height - iconRect.height));

    icon.style.left = `${newX}px`;
    icon.style.top = `${newY}px`;
  };

  const handleDragEnd = () => {
    clearTimeout(longPressTimer); // Always clear timer on end
    isDragging = false;

    if (wasDragged) {
      const iconPositions = getItem(LOCAL_STORAGE_KEYS.ICON_POSITIONS) || {};
      iconPositions[iconId] = {
        x: icon.style.left,
        y: icon.style.top,
      };
      setItem(LOCAL_STORAGE_KEYS.ICON_POSITIONS, iconPositions);
    }

    document.removeEventListener("mousemove", handleDragMove);
    document.removeEventListener("mouseup", handleDragEnd);
    document.removeEventListener("touchmove", handleDragMove);
    document.removeEventListener("touchend", handleDragEnd);

    // Reset wasDragged after a short delay to allow click/dblclick to be suppressed
    setTimeout(() => {
      wasDragged = false;
      isLongPress = false;
    }, 0);
  };

  icon.addEventListener("mousedown", handleDragStart);
  icon.addEventListener("touchstart", handleDragStart);

  icon.addEventListener("click", function (e) {
    if (wasDragged || isLongPress) {
      e.stopPropagation();
      e.preventDefault();
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
  icon.addEventListener("dblclick", (e) => {
    if (wasDragged || isLongPress) {
      e.stopPropagation();
      e.preventDefault();
      return;
    }
    launchApp(app.id, filePath);
  });
}

// Initialize desktop behavior
export function initDesktop() {
  console.log("Initializing Win98 Desktop Manager...");
  applyTheme();
  applyWallpaper();
  applyMonitorType();
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

  const showTipsAtStartup = getItem(LOCAL_STORAGE_KEYS.SHOW_TIPS_AT_STARTUP);

  console.log('Show Tips at Startup:', showTipsAtStartup);
  if (showTipsAtStartup === null || showTipsAtStartup === 'true' || showTipsAtStartup === true) {
    launchApp('tipOfTheDay');
  }
}
