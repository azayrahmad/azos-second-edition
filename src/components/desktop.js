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
import { ICONS, SHORTCUT_OVERLAY } from "../config/icons.js";
import { playSound } from "../utils/soundManager.js";
import { ShowDialogWindow } from "./DialogWindow.js";
import { IconManager } from "./IconManager.js";
import clipboardManager from "../utils/clipboardManager.js";
import { pasteItems } from "../utils/fileOperations.js";
import { getItemFromIcon } from "../utils/iconUtils.js";
import { createDragGhost } from "../utils/dragDropManager.js";
import {
  getRecycleBinItems,
  emptyRecycleBin,
  addToRecycleBin,
} from "../utils/recycleBinManager.js";
import { getStartupApps } from "../utils/startupManager.js";
import {
  setColorMode,
  getCurrentColorMode,
  getColorModes,
} from "../utils/colorModeManager.js";
import screensaver from "../utils/screensaverUtils.js";
import {
  getAvailableResolutions,
  setResolution,
  getCurrentResolutionId,
} from "../utils/screenManager.js";
import { handleDroppedFiles } from "../utils/dragDropManager.js";
import { SPECIAL_FOLDER_PATHS } from "../config/special-folders.js";

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
    if (item.type) {
      iconDiv.setAttribute("data-item-type", item.type);
    }
  }

  const iconInner = document.createElement("div");
  iconInner.className = "icon";

  const iconWrapper = document.createElement("div");
  iconWrapper.className = "icon-wrapper";

  const iconImg = document.createElement("img");
  iconImg.draggable = false;
  if (isFile) {
    const association = getAssociation(item.filename);
    iconImg.src = item.icon?.[32] || association.icon[32];
  } else {
    iconImg.src = app.icon[32];
  }
  iconWrapper.appendChild(iconImg);

  if (isFile && item.type === "shortcut") {
    const overlayImg = document.createElement("img");
    overlayImg.className = "shortcut-overlay shortcut-overlay-32";
    overlayImg.src = SHORTCUT_OVERLAY[32];
    iconWrapper.appendChild(overlayImg);
  }
  iconInner.appendChild(iconWrapper);

  const iconLabel = document.createElement("div");
  iconLabel.className = "icon-label";
  iconLabel.textContent = isFile ? item.filename : app.title;

  iconDiv.appendChild(iconInner);
  iconDiv.appendChild(iconLabel);

  return iconDiv;
}

function createDesktopIconForDroppedFile(file) {
  const association = getAssociation(file.name || file.title);
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

function handlePaste(destinationPath) {
  const { items, operation } = clipboardManager.get();
  pasteItems(destinationPath, items, operation);
  clipboardManager.clear();
}

function showIconContextMenu(event, app, fileId = null, iconManager) {
  let menuItems;
  const appConfig = apps.find((a) => a.id === app.id);
  const contextMenu = appConfig.contextMenu;
  const clickedIcon = event.target.closest(".desktop-icon");

  if (clickedIcon && !iconManager.selectedIcons.has(clickedIcon)) {
    iconManager.clearSelection();
    iconManager.selectIcon(clickedIcon);
  }

  const itemsToOperateOn = [...iconManager.selectedIcons]
    .map(getItemFromIcon)
    .filter(Boolean);

  const copyItem = {
    label: "C&opy",
    action: () => {
      clipboardManager.set(itemsToOperateOn, "copy");
    },
  };

  const cutItem = {
    label: "Cu&t",
    action: () => {
      clipboardManager.set(itemsToOperateOn, "cut");
    },
    enabled: !itemsToOperateOn.some(
      (item) => item.itemType === "app" || item.itemType === "virtual-file",
    ),
  };

  if (app.id === "recycle-bin" || app.id === "network") {
    copyItem.enabled = false;
    cutItem.enabled = false;
  }

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
      copyItem,
      cutItem,
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
    const openItemIndex = contextMenu.findIndex(
      (item) =>
        item.action === "open" || (item.label && item.label.includes("Open")),
    );

    menuItems = contextMenu.map((item) => {
      if (typeof item === "string") {
        return item;
      }
      const newItem = { ...item };
      if (typeof newItem.action === "string") {
        switch (newItem.action) {
          case "open":
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
      }
      return newItem;
    });

    if (openItemIndex !== -1) {
      menuItems.splice(openItemIndex + 1, 0, copyItem, cutItem);
    }
  } else {
    menuItems = [
      {
        label: "&Open",
        default: true,
        action: () => handleAppAction(app),
      },
      copyItem,
      cutItem,
      "MENU_DIVIDER",
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

  const pasteItem = {
    label: "Paste",
    action: () => {
      handlePaste(SPECIAL_FOLDER_PATHS.desktop);
    },
    enabled: !clipboardManager.isEmpty(),
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
    pasteItem,
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
    action: () => launchApp("displayproperties"),
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
  const fileIds = Array.isArray(fileId) ? fileId : [fileId];
  if (fileIds.length === 0) return;

  const dialogText =
    fileIds.length > 1
      ? `Are you sure you want to send these ${fileIds.length} items to the Recycle Bin?`
      : "Are you sure you want to send this item to the Recycle Bin?";

  ShowDialogWindow({
    title: "Confirm File Delete",
    text: dialogText,
    contentIconUrl: ICONS.warning[32],
    soundEvent: "SystemHand",
    buttons: [
      {
        label: "Yes",
        action: () => {
          let droppedFiles = getItem(LOCAL_STORAGE_KEYS.DROPPED_FILES) || [];
          const filesToDelete = droppedFiles.filter((f) =>
            fileIds.includes(f.id),
          );

          if (filesToDelete.length > 0) {
            filesToDelete.forEach((file) => addToRecycleBin(file));
            const newDroppedFiles = droppedFiles.filter(
              (f) => !fileIds.includes(f.id),
            );
            setItem(LOCAL_STORAGE_KEYS.DROPPED_FILES, newDroppedFiles);
            document.querySelector(".desktop").refreshIcons();
            document.dispatchEvent(new CustomEvent("explorer-refresh"));
          }
        },
      },
      {
        label: "No",
        isDefault: true,
        action: () => {},
      },
    ],
    modal: true,
  });
}

function showProperties(app) {
  // The 'app' object here is the configuration from apps.js.
  // We can create a temporary, "headless" instance of the application
  // to call the generic showProperties method. This works because the method
  // only depends on the configuration data, not a live window.
  if (app.appClass) {
    const tempAppInstance = new app.appClass(app);
    tempAppInstance.showProperties();
  } else {
    // Fallback for older apps or configs without a class
    let text = `<b>${app.title}</b>`;
    if (app.description) {
      text += `<br><br>${app.description}`;
    }
    if (app.summary) {
      text += `<br><br>${app.summary}`;
    }

    ShowDialogWindow({
      title: `${app.title} Properties`,
      contentIconUrl: app.icon[32],
      text: text,
      buttons: [{ label: "OK", isDefault: true }],
    });
  }
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
  const allDroppedFiles = getItem(LOCAL_STORAGE_KEYS.DROPPED_FILES) || [];
  const desktopFiles = allDroppedFiles.filter(
    (file) => file.path === SPECIAL_FOLDER_PATHS.desktop,
  );

  desktopFiles.forEach((file) => {
    const icon = createDesktopIconForDroppedFile(file);
    if (icon) {
      const association = getAssociation(file.name || file.title);
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
  let handleDragEndWrapper;
  let isNativeDragActive = false;
  let dragGhost = null;

  const iconId = icon.getAttribute("data-icon-id");

  const item = getItemFromIcon(icon);
  if (item) {
    icon.draggable = true;
  }

  icon.addEventListener("dragstart", (e) => {
    // If the dragged icon is not selected, select it exclusively
    if (!iconManager.selectedIcons.has(icon)) {
      iconManager.clearSelection();
      iconManager.selectIcon(icon);
    }
    isNativeDragActive = true;
    e.stopPropagation();
    const selectedItems = [...iconManager.selectedIcons]
      .map((icon) => getItemFromIcon(icon))
      .filter(Boolean);

    const primaryIconRect = icon.getBoundingClientRect();
    const cursorOffsetX = e.clientX - primaryIconRect.left;
    const cursorOffsetY = e.clientY - primaryIconRect.top;

    const dragOffsets = [...iconManager.selectedIcons].map((selectedIcon) => {
      const rect = selectedIcon.getBoundingClientRect();
      return {
        id: selectedIcon.getAttribute("data-icon-id"),
        offsetX: rect.left - primaryIconRect.left,
        offsetY: rect.top - primaryIconRect.top,
      };
    });

    e.dataTransfer.setData(
      "application/json",
      JSON.stringify({
        items: selectedItems,
        sourcePath: SPECIAL_FOLDER_PATHS.desktop,
        cursorOffsetX,
        cursorOffsetY,
        dragOffsets,
      }),
    );
    e.dataTransfer.effectAllowed = "move";
    dragGhost = createDragGhost(icon, e);
  });

  icon.addEventListener("dragend", () => {
    if (dragGhost && dragGhost.parentElement) {
      dragGhost.parentElement.removeChild(dragGhost);
    }
    dragGhost = null;
    isNativeDragActive = false;
  });

  icon.addEventListener("mousedown", (e) => {
    if (e.button === 0) {
      iconManager.handleIconMouseDown(e, icon);
    }
  });

  icon.addEventListener("touchstart", (e) => {
    iconManager.handleIconMouseDown(e, icon);

    longPressTimer = setTimeout(() => {
      isLongPress = true;
      const touch = e.touches[0];
      const mockEvent = {
        pageX: touch.pageX,
        pageY: touch.pageY,
        preventDefault: () => e.preventDefault(),
      };
      showIconContextMenu(mockEvent, app, null, iconManager);
    }, 500);
  });

  const cancelLongPress = () => {
    clearTimeout(longPressTimer);
  };

  icon.addEventListener("touchend", cancelLongPress);
  icon.addEventListener("touchmove", cancelLongPress);

  icon.addEventListener("dragover", (e) => {
    const targetAppId = icon.getAttribute("data-app-id");
    if (targetAppId === "my-documents" || targetAppId === "recycle-bin") {
      e.preventDefault();
    }
  });

  icon.addEventListener("drop", (e) => {
    e.preventDefault();
    e.stopPropagation();

    const targetAppId = icon.getAttribute("data-app-id");
    const jsonData = e.dataTransfer.getData("application/json");

    if (jsonData) {
      const data = JSON.parse(jsonData);
      const { items } = data;

      if (items) {
        if (targetAppId === "recycle-bin") {
          const fileIds = items
            .filter((item) => item.itemType === "dropped-file")
            .map((item) => item.id);
          if (fileIds.length > 0) {
            deleteDroppedFile(fileIds);
          }
        } else if (targetAppId === "my-documents") {
          pasteItems(SPECIAL_FOLDER_PATHS["my-documents"], items, "cut");
        }
      }
    }
  });

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

    const itemType = icon.getAttribute("data-item-type");
    if (itemType === "shortcut") {
      launchApp(app.id);
      return;
    }

    // If filePath is an object, it's a dropped file. Otherwise, it's a path string.
    const launchData =
      typeof filePath === "object" && filePath !== null ? filePath : filePath;
    launchApp(app.id, launchData);
  });
}

// Initialize desktop behavior
export async function initDesktop(profile = null) {
  console.log("Initializing Desktop Manager...");
  await applyTheme();
  applyWallpaper();
  applyMonitorType();
  const desktop = document.querySelector(".desktop");

  const iconManager = new IconManager(desktop, {
    iconSelector: ".desktop-icon",
    onItemContext: (e, icon) => {
      const appId = icon.getAttribute("data-app-id");
      const fileId = icon.getAttribute("data-file-id");
      const app = apps.find((a) => a.id === appId);
      if (app) {
        showIconContextMenu(e, app, fileId, iconManager);
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

  document.addEventListener("desktop-refresh", () => {
    desktop.refreshIcons();
  });

  document.addEventListener("clipboard-change", () => {
    const { items, operation } = clipboardManager.get();

    // First, remove 'cut' style from all icons
    desktop.querySelectorAll(".desktop-icon.cut").forEach((icon) => {
      icon.classList.remove("cut");
    });

    if (operation === "cut") {
      items.forEach((item) => {
        let icon;
        if (item.itemType === "dropped-file") {
          icon = desktop.querySelector(`[data-file-id="${item.id}"]`);
        } else if (item.itemType === "virtual-file") {
          const iconId = getIconId(item, item.path);
          icon = desktop.querySelector(`[data-icon-id="${iconId}"]`);
        } else if (item.itemType === "app") {
          const iconId = getIconId(item);
          icon = desktop.querySelector(`[data-icon-id="${iconId}"]`);
        }
        if (icon) {
          icon.classList.add("cut");
        }
      });
    }
  });

  // Add click handler to desktop to deselect icons
  desktop.addEventListener("click", (e) => {
    if (iconManager.wasLassoing) {
      return;
    }
    if (e.target === desktop && !e.target.closest(".desktop-icon")) {
      // iconManager.clearSelection();
      // if (clipboardManager.operation === "cut") {
      //   clipboardManager.clear();
      // }
    }
  });

  init(); // Initialize the taskbar manager

  const launchStartupApps = () => {
    if (profile) {
      // Launch apps from profile
      if (profile.startup && profile.startup.length > 0) {
        profile.startup.forEach(app => {
          const appId = typeof app === 'string' ? app : app.appId;
          const data = typeof app === 'object' ? app.data : null;
          launchApp(appId, data);
        });
      }
    } else {
      // Launch startup apps from storage
      const startupApps = getStartupApps();
      if (startupApps && startupApps.length > 0) {
        startupApps.forEach((appId) => {
          launchApp(appId);
        });
      }
    }
  };

  document.addEventListener("logon-sound-finished", launchStartupApps, { once: true });

  document.addEventListener("wallpaper-changed", applyWallpaper);

  // Drag and drop functionality
  desktop.addEventListener("dragover", (e) => {
    e.preventDefault(); // Allow drop
  });

  desktop.addEventListener("drop", (e) => {
    e.preventDefault();

    // Handle files dragged from within the app
    const jsonData = e.dataTransfer.getData("application/json");
    if (jsonData) {
      const data = JSON.parse(jsonData);
      const { items, cursorOffsetX, cursorOffsetY, dragOffsets, sourcePath } =
        data;
      if (sourcePath === SPECIAL_FOLDER_PATHS.desktop) {
        if (isAutoArrangeEnabled()) {
          // When auto-arranging, dropping an icon should just snap it back to the grid.
          // The same logic that runs when toggling the option on.
          removeItem(LOCAL_STORAGE_KEYS.ICON_POSITIONS);
          desktop.refreshIcons();
        } else {
          // This is a manual rearrange operation
          const desktopRect = desktop.getBoundingClientRect();
          const primaryIconX = e.clientX - desktopRect.left - cursorOffsetX;
          const primaryIconY = e.clientY - desktopRect.top - cursorOffsetY;

          const iconPositions =
            getItem(LOCAL_STORAGE_KEYS.ICON_POSITIONS) || {};
          (dragOffsets || []).forEach((offset) => {
            iconPositions[offset.id] = {
              x: `${primaryIconX + offset.offsetX}px`,
              y: `${primaryIconY + offset.offsetY}px`,
            };
          });

          setItem(LOCAL_STORAGE_KEYS.ICON_POSITIONS, iconPositions);
          desktop.refreshIcons();
        }
        return;
      }
      pasteItems("/drive-c/folder-user/folder-desktop", items, "cut");
      return; // Stop processing
    }

    // Handle files dragged from the user's OS
    const files = e.dataTransfer.files;
    if (files.length > 0) {
      // File drops on the desktop are disabled.
      // Users should use "My Briefcase".
    }
  });
}
