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
import {
  getDesktopContents,
  getAssociation,
  findItemByPath,
} from "../utils/directory.js";
import { launchApp } from "../utils/appManager.js";
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
import { FolderView } from "../shell/FolderView.js";
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
import { downloadFile } from "../utils/fileDownloader.js";
import { truncateName } from "../utils/stringUtils.js";
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
  return getItem(LOCAL_STORAGE_KEYS.MONITOR_TYPE) || "TFT";
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



// Initialize desktop behavior
export async function initDesktop(profile = null) {
  console.log("Initializing Desktop Manager...");
  await applyTheme();
  applyWallpaper();
  applyMonitorType();
  const desktop = document.querySelector(".desktop");

  const folderView = new FolderView(desktop, {
    isDesktop: true,
    path: SPECIAL_FOLDER_PATHS.desktop,
  });

  desktop.refreshIcons = () => folderView.render();
  desktop.refreshIcons();

  document.addEventListener("theme-changed", () => {
    desktop.refreshIcons();
    applyWallpaper();
  });

  document.addEventListener("desktop-refresh", () => {
    desktop.refreshIcons();
  });

  document.addEventListener("clipboard-change", () => {
    folderView.updateCutIcons();
  });

  init(); // Initialize the taskbar manager

  const launchStartupApps = () => {
    if (profile) {
      // Launch apps from profile
      if (profile.startup && profile.startup.length > 0) {
        profile.startup.forEach((app) => {
          const appId = typeof app === "string" ? app : app.appId;
          const data = typeof app === "object" ? app.data : null;
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

  document.addEventListener("desktop-ready-to-launch-apps", launchStartupApps, {
    once: true,
  });

  document.addEventListener("wallpaper-changed", applyWallpaper);

  // Drag and drop functionality
  desktop.addEventListener("dragover", (e) => {
    e.preventDefault(); // Allow drop
  });

  desktop.addEventListener("drop", (e) => {
    e.preventDefault();
    // All drop logic is now handled by FolderView.js
    // We keep this listener to prevent default browser behavior for file drops.
  });
}
