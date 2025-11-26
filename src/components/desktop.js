/**
 * Win98DesktopManager - Handles desktop icons and desktop interactions
 */
import { init } from "./taskbar.js";
import { fileAssociations } from "../config/fileAssociations.js";
import { apps } from "../config/apps.js";
import {
  getItem,
  setItem,
  removeItem,
  LOCAL_STORAGE_KEYS,
} from "../utils/localStorage.js";
import { getDesktopContents, getAssociation } from "../utils/directory.js";
import { launchApp, handleAppAction } from "../utils/appManager.js";
import {
  getThemes,
  getCurrentTheme,
  setTheme,
  applyTheme,
  getActiveTheme,
} from "../utils/themeManager.js";
import { ICONS } from "../config/icons.js";
import { playSound } from "../utils/soundManager.js";
import { ShowDialogWindow } from "./DialogWindow.js";
import { IconManager } from "./IconManager.js";
import {
  getRecycleBinItems,
  emptyRecycleBin,
  addToRecycleBin,
} from "../utils/recycleBinManager.js";
import {
  setColorMode,
  getCurrentColorMode,
  getColorModes,
} from "../utils/colorModeManager.js";
import screensaver from "./screensaver.js";
import {
  getAvailableResolutions,
  setResolution,
  getCurrentResolutionId,
} from "../utils/screenManager.js";

function getIconId(app, item = null) {
  if (typeof item === "string") {
    // virtual file path
    return `file-${item.replace(/[^a-zA-Z0-9]/g, "-")}`;
  }
  if (item && typeof item === "object" && item.id) {
    // dropped file object
    return item.id;
  }
  // app
  return `app-${app.id}`;
}

function isAutoArrangeEnabled() {
  const autoArrange = getItem(LOCAL_STORAGE_KEYS.AUTO_ARRANGE_ICONS);
  // Default to true if the setting is not present
  return autoArrange === null ? true : !!autoArrange;
}

function createDesktopIcon(item, isFile = false) {
  const app = isFile ? apps.find((a) => a.id === item.app) : item;
  if (!app) return null;

  const iconDiv = document.createElement("div");
  iconDiv.className = "desktop-icon";
  iconDiv.setAttribute(
    "title",
    isFile ? item.filename : app.description || app.title,
  );

  const iconId = getIconId(app, isFile ? item.path : null);
  iconDiv.setAttribute("data-icon-id", iconId);

  iconDiv.setAttribute("data-app-id", app.id);
  if (isFile) {
    iconDiv.setAttribute("data-file-path", item.path);
  }

  const iconInner = document.createElement("div");
  iconInner.className = "icon";

  const iconImg = document.createElement("img");
  iconImg.draggable = false;
  if (isFile) {
    const association = getAssociation(item.filename);
    iconImg.src = association.icon[32];
  } else {
    iconImg.src = app.icon[32];
  }
  iconInner.appendChild(iconImg);

  const iconLabel = document.createElement("div");
  iconLabel.className = "icon-label";
  iconLabel.textContent = isFile ? item.filename : app.title;

  iconDiv.appendChild(iconInner);
  iconDiv.appendChild(iconLabel);

  return iconDiv;
}

function createDesktopIconForDroppedFile(file) {
  const association = getAssociation(file.name);
  const app = apps.find((a) => a.id === association.appId);
  if (!app) return null;

  const iconDiv = document.createElement("div");
  iconDiv.className = "desktop-icon";
  iconDiv.setAttribute("title", file.name);

  const iconId = getIconId(app, file);
  iconDiv.setAttribute("data-icon-id", iconId);
  iconDiv.setAttribute("data-app-id", app.id);
  iconDiv.setAttribute("data-file-id", file.id); // Store the unique file ID

  const iconInner = document.createElement("div");
  iconInner.className = "icon";

  const iconImg = document.createElement("img");
  iconImg.draggable = false;
  iconImg.src = association.icon[32];
  iconInner.appendChild(iconImg);

  const iconLabel = document.createElement("div");
  iconLabel.className = "icon-label";
  iconLabel.textContent = file.name;

  iconDiv.appendChild(iconInner);
  iconDiv.appendChild(iconLabel);

  return iconDiv;
}

function showIconContextMenu(event, app, fileId = null) {
  let menuItems;
  const appConfig = apps.find((a) => a.id === app.id);

  const contextMenu = appConfig.contextMenu;

  if (fileId) {
    menuItems = [
      {
        label: "&Open",
        default: true,
        action: () => {
          const droppedFiles = getItem(LOCAL_STORAGE_KEYS.DROPPED_FILES) || [];
          const file = droppedFiles.find((f) => f.id === fileId);
          if (file) {
            launchApp(app.id, file);
          }
        },
      },
      {
        label: "&Delete",
        action: () => deleteDroppedFile(fileId),
      },
      "MENU_DIVIDER",
      {
        label: "&Properties",
        action: () => showProperties(app),
      },
    ];
  } else if (contextMenu) {
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
  const theme = getActiveTheme();
  const wallpaper = getItem(LOCAL_STORAGE_KEYS.WALLPAPER) || theme.wallpaper;
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

function captureGridIconPositions() {
  const desktop = document.querySelector(".desktop");
  if (desktop.classList.contains("has-absolute-icons")) {
    // Already in manual mode, no need to capture.
    return;
  }
  const desktopRect = desktop.getBoundingClientRect();
  const allIcons = Array.from(desktop.querySelectorAll(".desktop-icon"));
  const iconPositions = {};

  // Force browser reflow to ensure accurate position values
  desktop.offsetHeight;

  allIcons.forEach((icon) => {
    const id = icon.getAttribute("data-icon-id");
    const rect = icon.getBoundingClientRect();
    const x = `${rect.left - desktopRect.left}px`;
    const y = `${rect.top - desktopRect.top}px`;
    iconPositions[id] = { x, y };
  });

  setItem(LOCAL_STORAGE_KEYS.ICON_POSITIONS, iconPositions);
}

function sortDesktopIcons(sortBy) {
  const desktopContents = getDesktopContents();
  const { apps: appIds, files } = desktopContents;

  // The sorting logic only applies to files. Apps should remain in their order.
  if (sortBy === "name") {
    files.sort((a, b) => a.filename.localeCompare(b.filename));
  } else if (sortBy === "type") {
    files.sort((a, b) => {
      if (a.app < b.app) return -1;
      if (a.app > b.app) return 1;
      // Secondary sort by name
      return a.filename.localeCompare(b.filename);
    });
  }

  const sortedContents = { apps: appIds, files };

  // When sorting, we clear any manual positioning and revert to a grid layout.
  removeItem(LOCAL_STORAGE_KEYS.ICON_POSITIONS);

  // This will cause setupIcons to re-render in grid mode.
  document.querySelector(".desktop").refreshIcons(sortedContents);
}

function showDesktopContextMenu(event, { selectedIcons, clearSelection }) {
  const themes = getThemes();

  const toggleAutoArrange = () => {
    const newSetting = !isAutoArrangeEnabled();
    setItem(LOCAL_STORAGE_KEYS.AUTO_ARRANGE_ICONS, newSetting);

    if (newSetting) {
      // Turning ON: clear saved positions
      removeItem(LOCAL_STORAGE_KEYS.ICON_POSITIONS);
    } else {
      // Turning OFF: capture current grid positions and save them
      captureGridIconPositions();
    }
    document.querySelector(".desktop").refreshIcons();
  };

  const menuItems = [
    {
      label: "Arrange Icons",
      submenu: [
        {
          label: "by Name",
          action: () => sortDesktopIcons("name"),
        },
        {
          label: "by Type",
          action: () => sortDesktopIcons("type"),
        },
        {
          label: "by Size",
          action: () => {},
          enabled: false,
        },
        {
          label: "by Date",
          action: () => {},
          enabled: false,
        },
        "MENU_DIVIDER",
        {
          label: "Auto Arrange",
          checkbox: {
            check: isAutoArrangeEnabled,
            toggle: toggleAutoArrange,
          },
        },
      ],
    },
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
    {
      label: "Color Mode",
      submenu: [
        {
          radioItems: Object.entries(getColorModes()).map(([id, mode]) => ({
            label: mode.name,
            value: id,
          })),
          getValue: () => getCurrentColorMode(),
          setValue: (value) => setColorMode(value),
          ariaLabel: "Color Mode",
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
    "MENU_DIVIDER",
    {
      label: "Screen Resolution",
      submenu: [
        {
          radioItems: getAvailableResolutions().map((res) => ({
            label: res === "fit" ? "Fit Screen" : res,
            value: res,
          })),
          getValue: () => getCurrentResolutionId(),
          setValue: (value) => setResolution(value),
          ariaLabel: "Screen Resolution",
        },
      ],
    },
    "MENU_DIVIDER",
    {
      label: "Screen Saver",
      submenu: [
        {
          radioItems: [
            { label: "None", value: "none" },
            { label: "FlowerBox", value: "flowerbox" },
            { label: "3D Maze", value: "maze" },
          ],
          getValue: () => screensaver.getCurrentScreensaver(),
          setValue: (value) => {
            screensaver.setCurrentScreensaver(value);
          },
          ariaLabel: "Select Screensaver",
        },
        "MENU_DIVIDER",
        {
          label: "Wait Time",
          submenu: [
            {
              radioItems: [
                { label: "1 minute", value: 60000 },
                { label: "5 minutes", value: 300000 },
                { label: "30 minutes", value: 1800000 },
                { label: "1 hour", value: 3600000 },
              ],
              getValue: () =>
                getItem(LOCAL_STORAGE_KEYS.SCREENSAVER_TIMEOUT) || 300000,
              setValue: (value) => {
                setItem(LOCAL_STORAGE_KEYS.SCREENSAVER_TIMEOUT, value);
              },
              ariaLabel: "Screen Saver Wait Time",
            },
          ],
        },
      ],
    },
  ];

  menuItems.push({
    label: "Properties",
    action: () => launchApp("display-properties"),
  });

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

function deleteDroppedFile(fileId) {
  let droppedFiles = getItem(LOCAL_STORAGE_KEYS.DROPPED_FILES) || [];
  const fileToDelete = droppedFiles.find((f) => f.id === fileId);

  if (fileToDelete) {
    addToRecycleBin(fileToDelete);
    droppedFiles = droppedFiles.filter((f) => f.id !== fileId);
    setItem(LOCAL_STORAGE_KEYS.DROPPED_FILES, droppedFiles);
    document.querySelector(".desktop").refreshIcons();
  }
}

function showProperties(app) {
  ShowDialogWindow({
    title: `${app.title} Properties`,
    contentIconUrl: app.icon[32],
    text: `<b>${app.title}</b>`,
    buttons: [{ label: "OK", isDefault: true }],
  });
}

export function setupIcons(options, desktopContents = getDesktopContents()) {
  const { iconManager } = options;
  const desktop = document.querySelector(".desktop");
  desktop.innerHTML = ""; // Clear existing icons

  const desktopApps = desktopContents;

  let iconPositions = {};
  if (!isAutoArrangeEnabled()) {
    iconPositions = getItem(LOCAL_STORAGE_KEYS.ICON_POSITIONS) || {};
  }

  // Set the class based on Auto Arrange, not just the presence of positions.
  if (!isAutoArrangeEnabled()) {
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

  // Default sort only if no positions are saved
  if (Object.keys(iconPositions).length === 0) {
    const defaultOrder = [
      "my-computer",
      "my-documents",
      "internet-explorer",
      "network",
      "recycle-bin",
    ];
    appsToLoad.sort((a, b) => {
      const aIndex = defaultOrder.indexOf(a.id);
      const bIndex = defaultOrder.indexOf(b.id);
      if (aIndex !== -1 && bIndex !== -1) return aIndex - bIndex;
      if (aIndex !== -1) return -1;
      if (bIndex !== -1) return 1;
      return a.title.localeCompare(b.title);
    });
  }

  appsToLoad.forEach((app) => {
    const icon = createDesktopIcon(app, false);
    if (icon) {
      const iconId = getIconId(app);
      configureIcon(icon, app, null, { iconManager });
      placeIcon(icon, iconId);
    }
  });

  // Load files
  desktopApps.files.forEach((file) => {
    const icon = createDesktopIcon(file, true);
    if (icon) {
      const app = apps.find((a) => a.id === file.app);
      const iconId = getIconId(app, file.path);
      configureIcon(icon, app, file.path, { iconManager });
      placeIcon(icon, iconId);
    }
  });

  // Load dropped files
  const droppedFiles = getItem(LOCAL_STORAGE_KEYS.DROPPED_FILES) || [];
  droppedFiles.forEach((file) => {
    const icon = createDesktopIconForDroppedFile(file);
    if (icon) {
      const association = getAssociation(file.name);
      const app = apps.find((a) => a.id === association.appId);
      const iconId = getIconId(app, file);
      configureIcon(icon, app, file, { iconManager });
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

function configureIcon(icon, app, filePath = null, { iconManager }) {
  let isDragging = false;
  let wasDragged = false;
  let dragStartX, dragStartY;
  let dragOffsets = new Map();
  let ghostIcons = new Map(); // Map to store original icon -> ghost icon
  let longPressTimer;
  let isLongPress = false;

  const iconId = icon.getAttribute("data-icon-id");

  const handleDragStart = (e) => {
    // Check if auto-arrange is enabled. If so, disable dragging.
    if (isAutoArrangeEnabled()) {
      // Still allow the icon manager to handle selection, but prevent drag.
      if (e.type === "mousedown") {
        iconManager.handleIconMouseDown(e, icon);
      }
      return;
    }

    if (e.type === "mousedown" && e.button !== 0) return;
    if (e.type === "touchstart" && e.touches.length > 1) return;

    // Allow IconManager to handle selection logic first.
    // We prevent default mousedown behavior and let the icon manager handle it.
    if (e.type === "mousedown") {
      iconManager.handleIconMouseDown(e, icon);
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

    // Clear any previous ghost icons just in case
    ghostIcons.forEach((ghost) => ghost.remove());
    ghostIcons.clear();

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

        // --- Create ghost icons on first drag ---
        const desktop = icon.parentElement;
        const desktopRect = desktop.getBoundingClientRect();
        iconManager.selectedIcons.forEach((selectedIcon) => {
          const iconRect = selectedIcon.getBoundingClientRect();

          const ghost = selectedIcon.cloneNode(true);
          ghost.classList.add("desktop-icon-ghost");
          ghost.style.position = "absolute";
          ghost.style.left = `${iconRect.left - desktopRect.left}px`;
          ghost.style.top = `${iconRect.top - desktopRect.top}px`;
          ghost.style.width = `${iconRect.width}px`;
          ghost.style.height = `${iconRect.height}px`;
          ghost.style.opacity = "0.5";
          ghost.style.zIndex = "9999";
          ghost.style.pointerEvents = "none";
          desktop.appendChild(ghost);

          ghostIcons.set(selectedIcon, ghost);

          const offsetX = dragStartX - iconRect.left;
          const offsetY = dragStartY - iconRect.top;
          dragOffsets.set(ghost, { offsetX, offsetY });
        });
        // --- End ghost icon creation ---
      }
    }

    if (!wasDragged) return;

    if (e.type === "touchmove") {
      e.preventDefault();
    }

    const desktop = icon.parentElement; // `icon` here refers to the initially configured icon
    const desktopRect = desktop.getBoundingClientRect();

    ghostIcons.forEach((ghostIcon, originalSelectedIcon) => {
      const { offsetX, offsetY } = dragOffsets.get(ghostIcon); // Use offsets for the ghost
      const ghostRect = ghostIcon.getBoundingClientRect(); // Use ghost's rect for boundary checks

      let newX = clientX - desktopRect.left - offsetX;
      let newY = clientY - desktopRect.top - offsetY;

      newX = Math.max(0, Math.min(newX, desktopRect.width - ghostRect.width));
      newY = Math.max(0, Math.min(newY, desktopRect.height - ghostRect.height));

      ghostIcon.style.left = `${newX}px`;
      ghostIcon.style.top = `${newY}px`;
    });
  };

  const handleDragEnd = () => {
    clearTimeout(longPressTimer);
    isDragging = false;

    if (wasDragged) {
      iconManager.wasDragged = true; // Set flag on manager
      const iconPositions = getItem(LOCAL_STORAGE_KEYS.ICON_POSITIONS) || {};

      // Move original icons to the ghost's final position and remove ghosts
      ghostIcons.forEach((ghostIcon, originalSelectedIcon) => {
        const id = originalSelectedIcon.getAttribute("data-icon-id");
        const finalX = ghostIcon.style.left;
        const finalY = ghostIcon.style.top;

        iconPositions[id] = { x: finalX, y: finalY };

        originalSelectedIcon.style.left = finalX;
        originalSelectedIcon.style.top = finalY;
        originalSelectedIcon.style.opacity = ""; // Ensure original is fully opaque

        ghostIcon.remove(); // Remove the ghost icon
      });
      setItem(LOCAL_STORAGE_KEYS.ICON_POSITIONS, iconPositions);
    }
    ghostIcons.clear(); // Clear the map of ghost icons
    dragOffsets.clear(); // Clear drag offsets as well

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
    if (isLongPress) {
      e.stopPropagation();
      e.preventDefault();
      return;
    }

    // Icon manager now handles single click selection
    iconManager.handleIconClick(e, icon);
  });

  icon.addEventListener("dblclick", (e) => {
    if (wasDragged || isLongPress) {
      e.stopPropagation();
      e.preventDefault();
      return;
    }
    // If filePath is an object, it's a dropped file. Otherwise, it's a path string.
    const launchData =
      typeof filePath === "object" && filePath !== null ? filePath : filePath;
    launchApp(app.id, launchData);
  });
}

// Initialize desktop behavior
export async function initDesktop() {
  console.log("Initializing Desktop Manager...");
  await applyTheme();
  applyWallpaper();
  applyMonitorType();
  const desktop = document.querySelector(".desktop");

  const iconManager = new IconManager(desktop, {
    onItemContext: (e, icon) => {
      const appId = icon.getAttribute("data-app-id");
      const fileId = icon.getAttribute("data-file-id");
      const app = apps.find((a) => a.id === appId);
      if (app) {
        showIconContextMenu(e, app, fileId);
      }
    },
    onBackgroundContext: (e) => {
      showDesktopContextMenu(e, {
        selectedIcons: iconManager.selectedIcons,
        clearSelection: () => iconManager.clearSelection(),
      });
    },
  });

  // A function to refresh icons, bound to the correct scope
  desktop.refreshIcons = (sortedContents) =>
    setupIcons({ iconManager }, sortedContents);

  desktop.refreshIcons();

  document.addEventListener("theme-changed", () => {
    desktop.refreshIcons();
    applyWallpaper();
  });

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

  // Drag and drop functionality
  desktop.addEventListener("dragover", (e) => {
    e.preventDefault();
    desktop.classList.add("drop-target");
  });

  desktop.addEventListener("dragleave", (e) => {
    if (e.target === desktop) {
      desktop.classList.remove("drop-target");
    }
  });

  desktop.addEventListener("drop", (e) => {
    e.preventDefault();
    desktop.classList.remove("drop-target");

    const files = e.dataTransfer.files;
    if (files.length > 0) {
      handleDroppedFiles(files, desktop);
    }
  });
}

function handleDroppedFiles(files, desktop) {
  const existingFiles = getItem(LOCAL_STORAGE_KEYS.DROPPED_FILES) || [];
  const validFiles = [];
  const oversizedFiles = [];

  Array.from(files).forEach((file) => {
    if (file.size > 5 * 1024 * 1024) {
      oversizedFiles.push(file.name);
    } else {
      validFiles.push(file);
    }
  });

  if (oversizedFiles.length > 0) {
    ShowDialogWindow({
      title: "File(s) Too Large",
      text: `The following files exceed the 5MB size limit and were not added:\n\n${oversizedFiles.join(
        "\n",
      )}`,
      buttons: [{ label: "OK", isDefault: true }],
    });
  }

  if (validFiles.length === 0) {
    return; // No files to process
  }

  const fileReadPromises = validFiles.map((file) => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = (e) => {
        resolve({
          id: `dropped-${Date.now()}-${Math.random()}`,
          name: file.name,
          content: e.target.result,
          type: file.type,
        });
      };
      reader.onerror = reject;
      reader.readAsDataURL(file);
    });
  });

  Promise.all(fileReadPromises).then((newFiles) => {
    const allFiles = [...existingFiles, ...newFiles];
    setItem(LOCAL_STORAGE_KEYS.DROPPED_FILES, allFiles);
    desktop.refreshIcons();
  });
}
