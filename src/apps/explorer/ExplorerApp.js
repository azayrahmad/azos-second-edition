import { Application } from "../Application.js";
import directory from "../../config/directory.js";
import { apps } from "../../config/apps.js";
import { fileAssociations } from "../../config/fileAssociations.js";
import { ICONS } from "../../config/icons.js";
import { launchApp } from "../../utils/appManager.js";
import {
  getAssociation,
  findItemByPath,
  getDesktopContents,
} from "../../utils/directory.js";
import { IconManager } from "../../components/IconManager.js";
import {
  getRecycleBinItems,
  removeFromRecycleBin,
  addToRecycleBin,
} from "../../utils/recycleBinManager.js";
import {
  setItem,
  getItem,
  LOCAL_STORAGE_KEYS,
} from "../../utils/localStorage.js";
import { networkNeighborhood } from "../../config/networkNeighborhood.js";
import { ShowDialogWindow } from "../../components/DialogWindow.js";
import { AnimatedLogo } from "../../components/AnimatedLogo.js";
import { SPECIAL_FOLDER_PATHS } from "../../config/special-folders.js";
import { handleDroppedFiles } from "../../utils/dragDropManager.js";
import clipboardManager from "../../utils/clipboardManager.js";
import { pasteItems } from "../../utils/fileOperations.js";
import { getItemFromIcon as getItemFromIconUtil } from "../../utils/iconUtils.js";
import "./explorer.css";

const specialFolderIcons = {
  "/": "my-computer",
  "//recycle-bin": "recycle-bin",
  "//network-neighborhood": "network-neighborhood",
  [SPECIAL_FOLDER_PATHS["my-documents"]]: "my-documents",
};

function getIconForPath(path) {
  const appId = specialFolderIcons[path];
  if (appId) {
    const app = apps.find((a) => a.id === appId);
    if (app) {
      return app.icon;
    }
  }

  const item = findItemByPath(path);
  if (item) {
    if (item.type === "drive") {
      return ICONS.drive;
    }
    if (item.type === "folder") {
      return ICONS.folderOpen;
    }
  }

  // Default icon if no specific icon is found
  return ICONS.folder;
}

function isFileDropEnabled(path) {
  let currentPath = path;
  while (currentPath && currentPath !== "/") {
    const item = findItemByPath(currentPath);
    if (item && item.enableFileDrop) {
      return true;
    }
    const parts = currentPath.split("/").filter(Boolean);
    parts.pop();
    currentPath = "/" + parts.join("/");
  }
  return false;
}

export class ExplorerApp extends Application {
  constructor(config) {
    super(config);
    this.initialPath = "/";
    this.history = [];
    this.historyPointer = -1;
    this.resizeObserver = null;
    this.currentFolderItems = [];
  }

  _createWindow() {
    const win = new window.$Window({
      title: this.title,
      outerWidth: this.width,
      outerHeight: this.height,
      resizable: this.resizable,
      minimizeButton: this.minimizeButton,
      maximizeButton: this.maximizeButton,
      id: this.id,
    });
    this.win = win;

    const menuItems = {
      Go: [
        {
          label: "Up",
          action: () => this.goUp(),
          id: "go-up",
        },
        {
          label: "Back",
          action: () => this.goBack(),
          id: "go-back",
        },
        {
          label: "Forward",
          action: () => this.goForward(),
          id: "go-forward",
        },
      ],
    };
    this.menuBar = new MenuBar(menuItems);
    win.setMenuBar(this.menuBar);

    const logo = new AnimatedLogo();
    const menuBarContainer = document.createElement("div");
    menuBarContainer.style.display = "flex";
    menuBarContainer.style.alignItems = "center";
    menuBarContainer.style.width = "100%";
    menuBarContainer.style.justifyContent = "space-between";

    // Wrap the existing menu bar element
    const menuBarElement = this.menuBar.element;
    menuBarElement.parentNode.insertBefore(menuBarContainer, menuBarElement);
    menuBarContainer.appendChild(menuBarElement);
    menuBarContainer.appendChild(logo);

    const content = document.createElement("div");
    content.className = "explorer-content sunken-panel";
    win.$content.append(content);
    this.content = content;

    const sidebar = document.createElement("div");
    sidebar.className = "explorer-sidebar";
    sidebar.style.backgroundImage = `url(${new URL("../../assets/img/wvleft.bmp", import.meta.url).href})`;
    sidebar.style.backgroundRepeat = "no-repeat";
    content.appendChild(sidebar);
    this.sidebarElement = sidebar;

    const sidebarIcon = document.createElement("img");
    sidebarIcon.className = "sidebar-icon";
    sidebar.appendChild(sidebarIcon);
    this.sidebarIcon = sidebarIcon;

    const sidebarTitle = document.createElement("h1");
    sidebarTitle.className = "sidebar-title";
    sidebar.appendChild(sidebarTitle);
    this.sidebarTitle = sidebarTitle;

    const sidebarLine = document.createElement("img");
    sidebarLine.src = new URL(
      "../../assets/img/wvline.gif",
      import.meta.url,
    ).href;
    sidebarLine.style.width = "100%";
    sidebarLine.style.height = "auto";
    sidebar.appendChild(sidebarLine);

    const titleElement = document.createElement("h1");
    titleElement.className = "explorer-title";
    titleElement.style.fontFamily = "Verdana, sans-serif";
    content.appendChild(titleElement);
    this.titleElement = $(titleElement); // Use jQuery for easier text manipulation

    const iconContainer = document.createElement("div");
    iconContainer.className = "explorer-icon-view";
    content.appendChild(iconContainer);
    this.iconContainer = iconContainer;

    this.iconManager = new IconManager(this.iconContainer, {
      iconSelector: ".explorer-icon",
      onItemContext: (e, icon) => this.showItemContextMenu(e, icon),
      onBackgroundContext: (e) => this.showBackgroundContextMenu(e),
    });

    this.resizeObserver = new ResizeObserver((entries) => {
      for (let entry of entries) {
        if (entry.contentRect.width <= 400) {
          this.content.classList.add("small-width");
          this.content.classList.remove("with-sidebar");
        } else {
          this.content.classList.remove("small-width");
          this.content.classList.add("with-sidebar");
        }
      }
    });
    this.resizeObserver.observe(this.content);

    this.navigateTo(this.initialPath);

    this.refreshHandler = () => {
      if (
        this.currentPath === SPECIAL_FOLDER_PATHS.desktop &&
        this.win.element.style.display !== "none"
      ) {
        this.render(this.currentPath);
      }
    };
    document.addEventListener("explorer-refresh", this.refreshHandler);

    this.clipboardHandler = () => {
      this.updateCutIcons();
    };
    document.addEventListener("clipboard-change", this.clipboardHandler);

    this.win.onClosed(() => {
      document.removeEventListener("explorer-refresh", this.refreshHandler);
      document.removeEventListener("clipboard-change", this.clipboardHandler);
    });

    // Drag and drop functionality
    this.content.addEventListener("dragover", (e) => {
      e.preventDefault();
      if (isFileDropEnabled(this.currentPath)) {
        this.content.classList.add("drop-target");
      }
    });

    this.content.addEventListener("dragleave", (e) => {
      if (e.target === this.content) {
        this.content.classList.remove("drop-target");
      }
    });

    this.content.addEventListener("drop", (e) => {
      e.preventDefault();
      this.content.classList.remove("drop-target");

      if (isFileDropEnabled(this.currentPath)) {
        const files = e.dataTransfer.files;
        if (files.length > 0) {
          handleDroppedFiles(files, this.currentPath, () => {
            this.render(this.currentPath);
            if (this.currentPath === SPECIAL_FOLDER_PATHS.desktop) {
              document.dispatchEvent(new CustomEvent("desktop-refresh"));
            }
          });
        }
      }
    });

    this.content.addEventListener("click", (e) => {
      if (this.iconManager.wasLassoing || e.target.closest(".explorer-icon")) {
        return;
      }
      this.iconManager.clearSelection();
      if (clipboardManager.operation === "cut") {
        clipboardManager.clear();
      }
    });

    return win;
  }

  _onClose() {
    if (this.resizeObserver) {
      this.resizeObserver.disconnect();
    }
    document.removeEventListener("explorer-refresh", this.refreshHandler);
    document.removeEventListener("clipboard-change", this.clipboardHandler);
  }

  async _onLaunch(filePath) {
    if (filePath) {
      this.navigateTo(filePath);
    }
  }

  navigateTo(path) {
    // Truncate history if navigating from a previous state
    if (this.historyPointer < this.history.length - 1) {
      this.history = this.history.slice(0, this.historyPointer + 1);
    }
    this.history.push(path);
    this.historyPointer++;

    this.render(path);
    this.updateMenuState();
  }

  render(path) {
    this.currentPath = path;
    const item = findItemByPath(path);

    if (!item) {
      this.content.innerHTML = "Folder not found.";
      this.win.title("Error");
      return;
    }

    this.win.title(item.name);
    this.titleElement.text(item.name);
    const icon = getIconForPath(path);
    if (icon) {
      this.win.setIcons(icon);
      this.sidebarIcon.src = icon[32];
    }
    this.sidebarTitle.textContent = item.name;
    this.iconContainer.innerHTML = ""; // Clear previous content
    this.iconManager.clearSelection();

    let children = [];
    if (path === SPECIAL_FOLDER_PATHS.desktop) {
      const desktopContents = getDesktopContents();
      const desktopApps = desktopContents.apps.map((appId) => {
        const app = apps.find((a) => a.id === appId);
        return { ...app, appId: app.id, isStatic: true };
      });
      const allDroppedFiles = getItem(LOCAL_STORAGE_KEYS.DROPPED_FILES) || [];
      const desktopFiles = allDroppedFiles.filter(
        (file) => file.path === SPECIAL_FOLDER_PATHS.desktop,
      );
      const staticFiles = desktopContents.files.map((file) => ({
        ...file,
        isStatic: true,
      }));
      children = [...desktopApps, ...staticFiles, ...desktopFiles];
    } else {
      const staticChildren = (item.children || []).map((child) => ({
        ...child,
        isStatic: true,
      }));
      const allDroppedFiles = getItem(LOCAL_STORAGE_KEYS.DROPPED_FILES) || [];
      const droppedFilesInThisFolder = allDroppedFiles.filter(
        (file) => file.path === path,
      );
      children = [...staticChildren, ...droppedFilesInThisFolder];
    }

    // Sort children alphabetically by name
    children.sort((a, b) => {
      const nameA = a.name || a.title || a.filename || "";
      const nameB = b.name || b.title || b.filename || "";
      return nameA.localeCompare(nameB);
    });

    this.currentFolderItems = children;

    this.currentFolderItems.forEach((child) => {
      let iconData = { ...child };

      // Resolve shortcuts
      if (child.type === "shortcut") {
        const target = this.findItemInDirectory(child.targetId);
        if (target) {
          iconData = { ...target, name: child.name };
        }
      }

      const app = apps.find((a) => a.id === iconData.appId);
      if (app) {
        iconData.icon = app.icon;
        iconData.title = app.title;
      }

      const icon = this.createExplorerIcon(iconData);
      this.iconManager.configureIcon(icon, iconData); // Pass iconData
      this.iconContainer.appendChild(icon);
    });
  }

  createExplorerIcon(item) {
    const app = apps.find((a) => a.id === item.appId) || {};
    const displayName = item.name || item.filename || item.title || app.title;

    const iconDiv = document.createElement("div");
    iconDiv.className = "explorer-icon";
    iconDiv.setAttribute("title", displayName);
    iconDiv.setAttribute("data-id", item.id);

    const iconInner = document.createElement("div");
    iconInner.className = "icon";

    const iconImg = document.createElement("img");
    if (item.icon) {
      iconImg.src = item.icon[32];
    } else if (item.type === "drive") {
      iconImg.src = ICONS.drive[32];
    } else if (item.type === "folder") {
      iconImg.src = ICONS.folderClosed[32];
    } else if (item.type === "network") {
      iconImg.src = ICONS.networkComputer[32];
    } else {
      // Default to file association for any other type
      const association = getAssociation(displayName);
      iconImg.src = association.icon[32];
    }
    iconImg.draggable = false;
    iconInner.appendChild(iconImg);

    const iconLabel = document.createElement("div");
    iconLabel.className = "icon-label";
    iconLabel.textContent = displayName;

    iconDiv.appendChild(iconInner);
    iconDiv.appendChild(iconLabel);

    if (this.currentPath !== "//recycle-bin") {
      iconDiv.addEventListener("dblclick", () => {
        this._launchItem(item);
      });
    }

    return iconDiv;
  }

  findItemInDirectory(id, dir = directory) {
    for (const item of dir) {
      if (item.id === id) return item;
      if (item.children) {
        const found = this.findItemInDirectory(id, item.children);
        if (found) return found;
      }
    }
    return null;
  }

  _launchItem(item) {
    // 1. Handle navigation for folders/drives
    if (item.type === "folder" || item.type === "drive") {
      const newPath =
        this.currentPath === "/"
          ? `/${item.id}`
          : `${this.currentPath}/${item.id}`;
      this.navigateTo(newPath);
      return;
    }

    // 2. Handle external URLs
    if (item.url) {
      window.open(item.url, "_blank");
      return;
    }

    // 3. Handle applications/shortcuts
    if (item.appId) {
      launchApp(item.appId);
      return;
    }

    // 4. Handle files (static, dropped, desktop)
    const fileName = item.name || item.filename;
    if (fileName) {
      const appId = item.app || getAssociation(fileName).appId;
      if (appId) {
        const launchData = item.contentUrl ? item.contentUrl : item;
        launchApp(appId, launchData);
      }
    }
  }

  goUp() {
    if (this.currentPath === "/") return;
    const parts = this.currentPath.split("/").filter(Boolean);
    parts.pop();
    const newPath = "/" + parts.join("/");
    this.navigateTo(newPath);
  }

  goBack() {
    if (this.historyIndex > 0) {
      this.historyIndex--;
      this.render(this.history[this.historyIndex]);
      this.updateMenuState();
    }
  }

  goForward() {
    if (this.historyIndex < this.history.length - 1) {
      this.historyIndex++;
      this.render(this.history[this.historyIndex]);
      this.updateMenuState();
    }
  }

  updateMenuState() {
    const backButton = this.menuBar.element.querySelector("#go-back");
    const forwardButton = this.menuBar.element.querySelector("#go-forward");
    const upButton = this.menuBar.element.querySelector("#go-up");

    if (backButton)
      backButton.classList.toggle("disabled", this.historyIndex <= 0);
    if (forwardButton)
      forwardButton.classList.toggle(
        "disabled",
        this.historyIndex >= this.history.length - 1,
      );
    if (upButton)
      upButton.classList.toggle("disabled", this.currentPath === "/");
  }

  updateCutIcons() {
    const { items, operation } = clipboardManager.get();
    const cutIds =
      operation === "cut" ? new Set(items.map((item) => item.id)) : new Set();

    this.iconContainer.querySelectorAll(".explorer-icon").forEach((icon) => {
      const itemId = icon.getAttribute("data-id");
      if (cutIds.has(itemId)) {
        icon.classList.add("cut");
      } else {
        icon.classList.remove("cut");
      }
    });
  }

  getItemFromIcon(icon) {
    const itemId = icon.getAttribute("data-id");
    const item = this.currentFolderItems.find((child) => child.id === itemId);
    if (item) {
      return { ...item, source: "explorer", path: this.currentPath };
    }
    // Fallback for desktop items, which have a different structure
    return getItemFromIconUtil(icon);
  }

  showItemContextMenu(event, icon) {
    if (icon && !this.iconManager.selectedIcons.has(icon)) {
      this.iconManager.clearSelection();
      this.iconManager.selectIcon(icon);
    }

    const clickedItem = this.getItemFromIcon(icon);

    if (!clickedItem) {
      console.warn("Clicked item not found for icon:", icon);
      return;
    }

    const itemsToOperateOn = [...this.iconManager.selectedIcons]
      .map((selectedIcon) => this.getItemFromIcon(selectedIcon))
      .filter(Boolean);

    let menuItems = [];

    if (this.currentPath === "//recycle-bin") {
      menuItems = [
        {
          label: "Restore",
          default: true,
          action: () => {
            const itemToRestore = getRecycleBinItems().find(
              (i) => i.id === clickedItem.id,
            );
            if (itemToRestore) {
              const restoredItemWithName = {
                ...itemToRestore,
                name: itemToRestore.name || itemToRestore.title,
              };
              const droppedFiles =
                getItem(LOCAL_STORAGE_KEYS.DROPPED_FILES) || [];
              droppedFiles.push(restoredItemWithName);
              setItem(LOCAL_STORAGE_KEYS.DROPPED_FILES, droppedFiles);
              removeFromRecycleBin(clickedItem.id);
              this.render(this.currentPath);
              document.dispatchEvent(new CustomEvent("desktop-refresh"));
            }
          },
        },
        "MENU_DIVIDER",
        {
          label: "Delete",
          action: () => {
            ShowDialogWindow({
              title: "Delete Item",
              text: `Are you sure you want to permanently delete "${clickedItem.name}"?`,
              buttons: [
                {
                  label: "Yes",
                  action: () => {
                    removeFromRecycleBin(clickedItem.id);
                    this.render(this.currentPath);
                  },
                },
                { label: "No", isDefault: true },
              ],
            });
          },
        },
      ];
    } else {
      menuItems.push({
        label: "Open",
        default: true,
        action: () => this._launchItem(clickedItem),
      });

      const copyItem = {
        label: "Copy",
        action: () => clipboardManager.set(itemsToOperateOn, "copy"),
      };
      const cutItem = {
        label: "Cut",
        action: () => clipboardManager.set(itemsToOperateOn, "cut"),
        enabled: !itemsToOperateOn.some((item) => item.isStatic),
      };

      if (
        this.currentPath === "/" ||
        this.currentPath === "//network-neighborhood" ||
        clickedItem.isRoot
      ) {
        copyItem.enabled = false;
        cutItem.enabled = false;
      }

      if (clickedItem.type === "folder") {
        const isPasteDisabled =
          clipboardManager.isEmpty() ||
          this.currentPath === "/" ||
          this.currentPath === "//network-neighborhood";

        menuItems.push({
          label: "Paste",
          action: () => {
            const { items, operation } = clipboardManager.get();
            const destinationPath = `${this.currentPath}/${clickedItem.id}`;
            pasteItems(destinationPath, items, operation);
            clipboardManager.clear();
          },
          enabled: !isPasteDisabled,
        });
      }

      menuItems.push(copyItem, cutItem, "MENU_DIVIDER");

      if (clickedItem.type === "drive") {
        menuItems.push({ label: "Format...", enabled: false });
      } else if (clickedItem.type !== "network") {
        menuItems.push({
          label: "Delete",
          action: () => this.deleteFile(clickedItem),
        });
        menuItems.push({ label: "Rename", enabled: false });
      }

      menuItems.push("MENU_DIVIDER", {
        label: "Properties",
        action: () => this.showProperties(clickedItem),
      });
    }

    new window.ContextMenu(menuItems, event);
  }

  showBackgroundContextMenu(event) {
    const isPasteDisabled =
      clipboardManager.isEmpty() ||
      this.currentPath === "/" ||
      this.currentPath === "//network-neighborhood";

    const menuItems = [
      {
        label: "View",
        submenu: [
          { label: "Large Icons", enabled: false },
          { label: "Small Icons", enabled: false },
          { label: "List", enabled: false },
          { label: "Details", enabled: false },
        ],
      },
      "MENU_DIVIDER",
      {
        label: "New",
        submenu: [
          { label: "Folder", enabled: false },
          { label: "Text Document", enabled: false },
        ],
      },
      "MENU_DIVIDER",
      {
        label: "Paste",
        action: () => {
          const { items, operation } = clipboardManager.get();
          pasteItems(this.currentPath, items, operation);
          clipboardManager.clear();
        },
        enabled: !isPasteDisabled,
      },
      { label: "Properties", enabled: false },
    ];
    new window.ContextMenu(menuItems, event);
  }

  deleteFile(item) {
    const allDroppedFiles = getItem(LOCAL_STORAGE_KEYS.DROPPED_FILES) || [];
    const updatedFiles = allDroppedFiles.filter((file) => file.id !== item.id);
    addToRecycleBin(item);
    setItem(LOCAL_STORAGE_KEYS.DROPPED_FILES, updatedFiles);
    this.render(this.currentPath);
    document.dispatchEvent(new CustomEvent("desktop-refresh"));
  }

  showProperties(item) {
    const displayName = item.name || item.filename || item.title;
    const itemType = item.type || "File";
    let iconUrl;

    if (item.icon) {
      iconUrl = item.icon[32];
    } else if (item.type === "drive") {
      iconUrl = ICONS.drive[32];
    } else if (item.type === "folder") {
      iconUrl = ICONS.folderClosed[32];
    } else {
      const association = getAssociation(displayName);
      iconUrl = association.icon[32];
    }

    ShowDialogWindow({
      title: `${displayName} Properties`,
      contentIconUrl: iconUrl,
      text: `<b>${displayName}</b><br>Type: ${itemType}`,
      buttons: [{ label: "OK", isDefault: true }],
    });
  }
}
