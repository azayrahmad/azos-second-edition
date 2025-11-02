/**
 * Win98DesktopManager - Handles desktop icons and desktop interactions
 */
import { init } from "./taskbar.js";
import { apps } from "../config/apps.js";
import {
  getItem,
  setItem,
  removeItem,
  LOCAL_STORAGE_KEYS,
} from "../utils/localStorage.js";
import { getDesktopContents } from "../utils/directory.js";
import { launchApp, handleAppAction } from "../utils/appManager.js";
import {
  getThemes,
  getCurrentTheme,
  setTheme,
  applyTheme,
} from "../utils/themeManager.js";
import { ICONS } from "../config/icons.js";
import { playSound } from "../utils/soundManager.js";
import { ShowDialogWindow } from "./DialogWindow.js";

function getIconId(app, filePath = null) {
  // Create a unique ID for the icon based on app ID or file path
  return filePath
    ? `file-${filePath.replace(/[^a-zA-Z0-9]/g, "-")}`
    : `app-${app.id}`;
}

function createDesktopIcon(item, isFile = false) {
  const app = isFile ? apps.find((a) => a.id === item.app) : item;
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
  console.log("Showing app context menu");
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
            console.log("Opening app");
            newItem.action = () => launchApp(app.id);
            newItem.default = true;
            break;
          case "properties":
            newItem.action = () => showProperties(app);
            break;
          default:
            newItem.action = () => {};
            break;
        }
      } else if (typeof newItem.action === "function") {
        // newItem.click = newItem.action;
      }
      // delete newItem.action;
      return newItem;
    });
  } else {
    menuItems = [
      {
        label: "&Open",
        default: true,
        action: () => handleAppAction(app),
      },
      {
        label: "&Properties",
        action: () => showProperties(app),
      },
    ];
  }

  new window.ContextMenu(menuItems, event);
}

function setWallpaper() {
  const input = document.createElement("input");
  input.type = "file";
  input.accept = "image/*";
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
  return getItem(LOCAL_STORAGE_KEYS.WALLPAPER_MODE) || "tile";
}

function setWallpaperMode(mode) {
  setItem(LOCAL_STORAGE_KEYS.WALLPAPER_MODE, mode);
  applyWallpaper();
  document.dispatchEvent(new CustomEvent("wallpaper-changed"));
}

function applyWallpaper() {
  const wallpaper = getItem(LOCAL_STORAGE_KEYS.WALLPAPER);
  const desktop = document.querySelector(".desktop");
  if (wallpaper) {
    const mode = getWallpaperMode();
    desktop.style.backgroundImage = `url(${wallpaper})`;
    desktop.style.backgroundPosition = "left top";
    if (mode === "stretch") {
      desktop.style.backgroundRepeat = "no-repeat";
      desktop.style.backgroundSize = "100% 100%";
    } else if (mode === "center") {
      desktop.style.backgroundRepeat = "no-repeat";
      desktop.style.backgroundSize = "auto";
      desktop.style.backgroundPosition = "center";
    } else {
      // 'tile'
      desktop.style.backgroundRepeat = "repeat";
      desktop.style.backgroundSize = "auto";
    }
    desktop.style.backgroundColor = ""; // Remove solid color
  } else {
    desktop.style.backgroundImage = "";
    desktop.style.backgroundColor = "var(--Background)"; // Restore solid color
  }
}

function removeWallpaper() {
  removeItem(LOCAL_STORAGE_KEYS.WALLPAPER);
  applyWallpaper();
}

function getMonitorType() {
  return getItem(LOCAL_STORAGE_KEYS.MONITOR_TYPE) || "CRT";
}

function setMonitorType(type) {
  setItem(LOCAL_STORAGE_KEYS.MONITOR_TYPE, type);
  if (type === "CRT") {
    document.body.classList.add("scanlines");
  } else {
    document.body.classList.remove("scanlines");
  }
}

function applyMonitorType() {
  const type = getMonitorType();
  if (type === "CRT") {
    document.body.classList.add("scanlines");
  } else {
    document.body.classList.remove("scanlines");
  }
}

function showDesktopContextMenu(event, { selectedIcons, clearSelection }) {
  const themes = getThemes();

  const menuItems = [
    {
      label: "Sort Icons",
      action: () => {
        // Remove saved positions and redraw icons
        removeItem(LOCAL_STORAGE_KEYS.ICON_POSITIONS);
        setupIcons({ selectedIcons, clearSelection });
      },
    },
    {
      label: "Empty Recycle Bin",
      action: () => {
        playSound("EmptyRecycleBin");
      },
    },
    "MENU_DIVIDER",
    {
      label: "Wallpaper",
      submenu: [
        {
          label: "Set Wallpaper...",
          action: setWallpaper,
        },
        {
          label: "Remove Wallpaper",
          action: removeWallpaper,
        },
        "MENU_DIVIDER",
        {
          radioItems: [
            { label: "Center", value: "center" },
            { label: "Tile", value: "tile" },
            { label: "Stretch", value: "stretch" },
          ],
          getValue: () => getWallpaperMode(),
          setValue: (value) => setWallpaperMode(value),
          ariaLabel: "Wallpaper Mode",
        },
      ],
    },
    "MENU_DIVIDER",
    {
      label: "Theme",
      submenu: [
        {
          radioItems: Object.values(themes).map((theme) => ({
            label: theme.name,
            value: theme.id,
          })),
          getValue: () => getCurrentTheme(),
          setValue: (value) => {
            setTheme(value);
          },
          ariaLabel: "Desktop Theme",
        },
      ],
    },
    {
      label: "Monitor Type",
      submenu: [
        {
          radioItems: [
            { label: "TFT", value: "TFT" },
            { label: "CRT", value: "CRT" },
          ],
          getValue: () => getMonitorType(),
          setValue: (value) => setMonitorType(value),
          ariaLabel: "Monitor Type",
        },
      ],
    },
  ];

  const menu = new window.ContextMenu(menuItems, event);
  const handleThemeChange = () => {
    if (menu.activeSubmenu) {
      menu.activeSubmenu.element.dispatchEvent(new CustomEvent("update", {}));
    }
  };
  const handleWallpaperChange = handleThemeChange; // Same logic

  document.addEventListener("theme-changed", handleThemeChange);
  document.addEventListener("wallpaper-changed", handleWallpaperChange);
}

function showProperties(app) {
  ShowDialogWindow({
    title: `${app.title} Properties`,
    contentIconUrl: app.icon[32],
    text: `<b>${app.title}</b>`,
    buttons: [{ label: "OK", isDefault: true }],
  });
}

export function setupIcons(options) {
  const { selectedIcons, clearSelection } = options;
  const desktop = document.querySelector(".desktop");
  desktop.innerHTML = ""; // Clear existing icons

  const desktopApps = getDesktopContents();
  const iconPositions = getItem(LOCAL_STORAGE_KEYS.ICON_POSITIONS) || {};

  // If there are any saved positions, we are in manual mode.
  if (Object.keys(iconPositions).length > 0) {
    desktop.classList.add("has-absolute-icons");
  } else {
    desktop.classList.remove("has-absolute-icons");
  }

  const placeIcon = (icon, iconId) => {
    if (iconPositions[iconId]) {
      icon.style.position = "absolute";
      icon.style.left = iconPositions[iconId].x;
      icon.style.top = iconPositions[iconId].y;
    } else if (desktop.classList.contains("has-absolute-icons")) {
      // If we're in manual mode but this icon has no position, find one for it.
      const { x, y } = findNextOpenPosition(desktop, iconPositions);
      icon.style.position = "absolute";
      icon.style.left = `${x}px`;
      icon.style.top = `${y}px`;
      // And save it for consistency
      iconPositions[iconId] = { x: `${x}px`, y: `${y}px` };
      setItem(LOCAL_STORAGE_KEYS.ICON_POSITIONS, iconPositions);
    }
    desktop.appendChild(icon);
  };

  // Load apps
  const appsToLoad = apps.filter((app) => desktopApps.apps.includes(app.id));
  appsToLoad.forEach((app) => {
    const icon = createDesktopIcon(app, false);
    if (icon) {
      const iconId = getIconId(app);
      configureIcon(icon, app, null, { selectedIcons, clearSelection });
      placeIcon(icon, iconId);
    }
  });

  // Load files
  desktopApps.files.forEach((file) => {
    const icon = createDesktopIcon(file, true);
    if (icon) {
      const app = apps.find((a) => a.id === file.app);
      const iconId = getIconId(app, file.path);
      configureIcon(icon, app, file.path, { selectedIcons, clearSelection });
      placeIcon(icon, iconId);
    }
  });
}

function findNextOpenPosition(desktop, iconPositions) {
  const desktopRect = desktop.getBoundingClientRect();
  const iconWidth = 75; // Average icon width
  const iconHeight = 75; // Average icon height
  const paddingTop = 5;
  const paddingLeft = 5;

  const cols = Math.floor((desktopRect.width - paddingLeft) / iconWidth);
  const rows = Math.floor((desktopRect.height - paddingTop) / iconHeight);

  const occupiedSlots = new Set();
  Object.values(iconPositions).forEach((pos) => {
    const x = parseInt(pos.x, 10);
    const y = parseInt(pos.y, 10);
    if (!isNaN(x) && !isNaN(y)) {
      const col = Math.round((x - paddingLeft) / iconWidth);
      const row = Math.round((y - paddingTop) / iconHeight);
      occupiedSlots.add(`${col},${row}`);
    }
  });

  for (let c = 0; c < cols; c++) {
    for (let r = 0; r < rows; r++) {
      if (!occupiedSlots.has(`${c},${r}`)) {
        return {
          x: paddingLeft + c * iconWidth,
          y: paddingTop + r * iconHeight,
        };
      }
    }
  }

  // Fallback if no slot is found (e.g., desktop is full)
  return { x: paddingLeft, y: paddingTop };
}

function configureIcon(
  icon,
  app,
  filePath = null,
  { selectedIcons, clearSelection },
) {
  let isDragging = false;
  let wasDragged = false;
  let dragStartX, dragStartY;
  let dragOffsets = new Map();
  let longPressTimer;
  let isLongPress = false;

  const iconId = icon.getAttribute("data-icon-id");

  const handleDragStart = (e) => {
    if (e.type === "mousedown" && e.button !== 0) return;

    if (e.type === "mousedown") {
      e.preventDefault();
    }

    isDragging = true;
    wasDragged = false;
    isLongPress = false;
    dragOffsets.clear();

    const clientX = e.type === "touchstart" ? e.touches[0].clientX : e.clientX;
    const clientY = e.type === "touchstart" ? e.touches[0].clientY : e.clientY;

    dragStartX = clientX;
    dragStartY = clientY;

    if (e.type === "touchstart") {
      longPressTimer = setTimeout(() => {
        isLongPress = true;
        const touch = e.touches[0];
        const mockEvent = {
          pageX: touch.pageX,
          pageY: touch.pageY,
          preventDefault: () => e.preventDefault(),
        };
        showIconContextMenu(mockEvent, app);
      }, 500);
    }

    const desktop = icon.parentElement;
    const desktopRect = desktop.getBoundingClientRect();

    if (!desktop.classList.contains("has-absolute-icons")) {
      // Force browser to calculate layout before we read positions
      desktop.offsetHeight;

      const allIcons = Array.from(desktop.querySelectorAll(".desktop-icon"));
      const iconPositions = {};
      const newPositions = [];

      // 1. Read all positions first
      allIcons.forEach((i) => {
        const id = i.getAttribute("data-icon-id");
        const rect = i.getBoundingClientRect();
        const x = `${rect.left - desktopRect.left}px`;
        const y = `${rect.top - desktopRect.top}px`;
        newPositions.push({ icon: i, x, y });
        iconPositions[id] = { x, y };
      });

      // 2. Then apply them
      newPositions.forEach(({ icon, x, y }) => {
        icon.style.position = "absolute";
        icon.style.left = x;
        icon.style.top = y;
      });

      setItem(LOCAL_STORAGE_KEYS.ICON_POSITIONS, iconPositions);
      desktop.classList.add("has-absolute-icons");
    }

    // If the clicked icon is not part of the current selection,
    // clear the selection and select only this one.
    if (!selectedIcons.has(icon)) {
      clearSelection();
      selectedIcons.add(icon);
      icon.querySelector(".icon img")?.classList.add("highlighted-icon");
      icon
        .querySelector(".icon-label")
        ?.classList.add("highlighted-label", "selected");
    }

    // Prepare all selected icons for dragging
    selectedIcons.forEach((selectedIcon) => {
      const iconRect = selectedIcon.getBoundingClientRect();
      const offsetX = clientX - iconRect.left;
      const offsetY = clientY - iconRect.top;
      dragOffsets.set(selectedIcon, { offsetX, offsetY });
    });

    if (e.type === "mousedown") {
      document.addEventListener("mousemove", handleDragMove);
      document.addEventListener("mouseup", handleDragEnd);
    } else if (e.type === "touchstart") {
      document.addEventListener("touchmove", handleDragMove, {
        passive: false,
      });
      document.addEventListener("touchend", handleDragEnd);
    }
  };

  const handleDragMove = (e) => {
    if (!isDragging) return;

    const clientX = e.type === "touchmove" ? e.touches[0].clientX : e.clientX;
    const clientY = e.type === "touchmove" ? e.touches[0].clientY : e.clientY;

    if (
      Math.abs(clientX - dragStartX) > 5 ||
      Math.abs(clientY - dragStartY) > 5
    ) {
      clearTimeout(longPressTimer);
      if (!wasDragged) {
        wasDragged = true;
        window.getSelection().removeAllRanges();
      }
    }

    if (!wasDragged) return;

    if (e.type === "touchmove") {
      e.preventDefault();
    }

    const desktop = icon.parentElement;
    const desktopRect = desktop.getBoundingClientRect();

    selectedIcons.forEach((selectedIcon) => {
      const { offsetX, offsetY } = dragOffsets.get(selectedIcon);
      const iconRect = selectedIcon.getBoundingClientRect();

      let newX = clientX - desktopRect.left - offsetX;
      let newY = clientY - desktopRect.top - offsetY;

      newX = Math.max(0, Math.min(newX, desktopRect.width - iconRect.width));
      newY = Math.max(0, Math.min(newY, desktopRect.height - iconRect.height));

      selectedIcon.style.left = `${newX}px`;
      selectedIcon.style.top = `${newY}px`;
    });
  };

  const handleDragEnd = () => {
    clearTimeout(longPressTimer);
    isDragging = false;

    if (wasDragged) {
      const iconPositions = getItem(LOCAL_STORAGE_KEYS.ICON_POSITIONS) || {};
      selectedIcons.forEach((selectedIcon) => {
        const id = selectedIcon.getAttribute("data-icon-id");
        iconPositions[id] = {
          x: selectedIcon.style.left,
          y: selectedIcon.style.top,
        };
      });
      setItem(LOCAL_STORAGE_KEYS.ICON_POSITIONS, iconPositions);
    }

    document.removeEventListener("mousemove", handleDragMove);
    document.removeEventListener("mouseup", handleDragEnd);
    document.removeEventListener("touchmove", handleDragMove);
    document.removeEventListener("touchend", handleDragEnd);

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

    clearSelection();
    selectedIcons.add(this);

    const iconImg = this.querySelector(".icon img");
    const iconLabel = this.querySelector(".icon-label");
    if (iconImg) iconImg.classList.add("highlighted-icon");
    if (iconLabel) {
      iconLabel.classList.add("highlighted-label", "selected");
    }
  });

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
  console.log("Initializing Desktop Manager...");
  applyTheme();
  applyWallpaper();
  applyMonitorType();
  const desktop = document.querySelector(".desktop");
  let lasso;
  let isLassoing = false;
  let wasLassoing = false;
  let lassoStartX, lassoStartY;
  let selectedIcons = new Set();

  function clearSelection() {
    selectedIcons.forEach((icon) => {
      const iconImg = icon.querySelector(".icon img");
      const iconLabel = icon.querySelector(".icon-label");
      if (iconImg) iconImg.classList.remove("highlighted-icon");
      if (iconLabel) {
        iconLabel.classList.remove("highlighted-label", "selected");
      }
    });
    selectedIcons.clear();
  }

  function isIntersecting(rect1, rect2) {
    return !(
      rect1.right < rect2.left ||
      rect1.left > rect2.right ||
      rect1.bottom < rect2.top ||
      rect1.top > rect2.bottom
    );
  }

  desktop.addEventListener("mousedown", (e) => {
    if (e.target !== desktop) return; // Only start lasso on desktop itself
    if (e.button !== 0) return; // Only for left click

    isLassoing = true;
    lassoStartX = e.clientX;
    lassoStartY = e.clientY;

    lasso = document.createElement("div");
    lasso.className = "lasso";
    lasso.style.left = `${lassoStartX}px`;
    lasso.style.top = `${lassoStartY}px`;
    desktop.appendChild(lasso);

    clearSelection();
    e.preventDefault();

    const onMouseMove = (moveEvent) => {
      if (!isLassoing) return;

      const currentX = moveEvent.clientX;
      const currentY = moveEvent.clientY;

      const width = Math.abs(currentX - lassoStartX);
      const height = Math.abs(currentY - lassoStartY);
      const left = Math.min(currentX, lassoStartX);
      const top = Math.min(currentY, lassoStartY);

      lasso.style.width = `${width}px`;
      lasso.style.height = `${height}px`;
      lasso.style.left = `${left}px`;
      lasso.style.top = `${top}px`;

      const lassoRect = lasso.getBoundingClientRect();
      const icons = document.querySelectorAll(".desktop-icon");

      icons.forEach((icon) => {
        const iconRect = icon.getBoundingClientRect();
        const iconImg = icon.querySelector(".icon img");
        const iconLabel = icon.querySelector(".icon-label");

        if (isIntersecting(lassoRect, iconRect)) {
          if (!selectedIcons.has(icon)) {
            selectedIcons.add(icon);
            if (iconImg) iconImg.classList.add("highlighted-icon");
            if (iconLabel) {
              iconLabel.classList.add("highlighted-label", "selected");
            }
          }
        } else {
          if (selectedIcons.has(icon)) {
            selectedIcons.delete(icon);
            if (iconImg) iconImg.classList.remove("highlighted-icon");
            if (iconLabel) {
              iconLabel.classList.remove("highlighted-label", "selected");
            }
          }
        }
      });
    };

    const onMouseUp = () => {
      isLassoing = false;
      wasLassoing = true;
      if (lasso && lasso.parentElement) {
        lasso.parentElement.removeChild(lasso);
      }
      lasso = null;
      document.removeEventListener("mousemove", onMouseMove);
      document.removeEventListener("mouseup", onMouseUp);
      setTimeout(() => {
        wasLassoing = false;
      }, 0);
    };

    document.addEventListener("mousemove", onMouseMove);
    document.addEventListener("mouseup", onMouseUp);
  });

  // A function to refresh icons, bound to the correct scope
  desktop.refreshIcons = () => setupIcons({ selectedIcons, clearSelection });

  desktop.refreshIcons();

  desktop.addEventListener("contextmenu", (e) => {
    // Show desktop context menu only if not clicking on an icon
    if (e.target === desktop) {
      e.preventDefault();
      showDesktopContextMenu(e, { selectedIcons, clearSelection });
    }
  });

  // Add click handler to desktop to deselect icons
  desktop.addEventListener("click", (e) => {
    if (wasLassoing) {
      wasLassoing = false;
      return;
    }
    if (
      e.target === desktop &&
      !isLassoing &&
      !e.target.closest(".desktop-icon")
    ) {
      clearSelection();
    }
  });

  init(); // Initialize the taskbar manager

  const showTipsAtStartup = getItem(LOCAL_STORAGE_KEYS.SHOW_TIPS_AT_STARTUP);

  console.log("Show Tips at Startup:", showTipsAtStartup);
  if (
    showTipsAtStartup === null ||
    showTipsAtStartup === "true" ||
    showTipsAtStartup === true
  ) {
    launchApp("tipOfTheDay");
  }

  document.addEventListener("wallpaper-changed", applyWallpaper);
}
