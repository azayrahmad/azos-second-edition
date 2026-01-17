import { Application } from "../Application.js";
import directory from "../../config/directory.js";
import { apps } from "../../config/apps.js";
import { fileAssociations } from "../../config/fileAssociations.js";
import { ICONS, SHORTCUT_OVERLAY } from "../../config/icons.js";
import { launchApp } from "../../utils/appManager.js";
import {
  getAssociation,
  findItemByPath,
  getDesktopContents,
} from "../../utils/directory.js";
import {
  convertInternalPathToWindows,
  convertWindowsPathToInternal,
} from "../../utils/path.js";
import { AddressBar } from "../../components/AddressBar.js";
import { FolderView } from "../../shell/FolderView.js";
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
import browseUiIcons from "../../assets/icons/browse-ui-icons.png";
import browseUiIconsGrayscale from "../../assets/icons/browse-ui-icons-grayscale.png";
import { SPECIAL_FOLDER_PATHS } from "../../config/special-folders.js";
import {
  handleDroppedFiles,
  createDragGhost,
} from "../../utils/dragDropManager.js";
import clipboardManager from "../../utils/clipboardManager.js";
import { pasteItems } from "../../utils/fileOperations.js";
import { getItemFromIcon as getItemFromIconUtil } from "../../utils/iconUtils.js";
import { StatusBar } from "../../components/StatusBar.js";
import { downloadFile } from "../../utils/fileDownloader.js";
import { truncateName } from "../../utils/stringUtils.js";
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
    if (item.type === "briefcase") {
      return ICONS.briefcase;
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
  static config = {
    id: "explorer",
    title: "Explorer",
    description: "Browse files and folders.",
    icon: ICONS.computer,
    width: 640,
    height: 480,
    resizable: true,
    isSingleton: false,
  };

  constructor(config) {
    super(config);
    this.initialPath = "/";
    this.history = [];
    this.historyIndex = -1;
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
      id: this.id, // This is the crucial part
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

    // Create the main content area and icon manager first, so the toolbar can reference it
    const content = document.createElement("div");
    content.className = "explorer-content sunken-panel";
    this.content = content;

    const sidebar = document.createElement("div");
    sidebar.className = "explorer-sidebar";
    sidebar.style.backgroundImage = `url(${new URL("../../assets/img/wvleft.bmp", import.meta.url).href})`;
    sidebar.style.backgroundRepeat = "no-repeat";
    content.appendChild(sidebar);
    this.sidebarElement = sidebar;

    const iconContainer = document.createElement("div");
    iconContainer.className = "explorer-icon-view"; // Let FolderView manage layout class
    content.appendChild(iconContainer);
    this.iconContainer = iconContainer;

    this.folderView = new FolderView(iconContainer, {
      isDesktop: false,
      onPathChange: (newPath) => this.navigateTo(newPath),
      onItemLaunch: (item) => this._launchItem(item),
      onSelectionChange: (selection) => {
        this.updateMenuState();
        const selectionCount = selection.size;
        if (selectionCount > 0) {
          this.statusBar.setText(`${selectionCount} object(s) selected`);
        } else {
          this.statusBar.setText("");
        }
      },
    });

    // Now that iconManager exists, we can define and create the toolbar
    const toolbarItems = [
      {
        label: "Back",
        iconName: "back_explorer",
        action: () => this.goBack(),
        enabled: () => this.historyIndex > 0,
        submenu: () =>
          this.history
            .slice(0, this.historyIndex)
            .reverse()
            .map((path, i) => {
              const item = findItemByPath(path);
              const label = item ? item.name : path;
              const targetIndex = this.historyIndex - (i + 1);
              return {
                label: label,
                action: () => {
                  this.historyIndex = targetIndex;
                  this.navigateTo(this.history[this.historyIndex], true);
                },
              };
            }),
      },
      {
        label: "Forward",
        iconName: "forward_explorer",
        action: () => this.goForward(),
        enabled: () => this.historyIndex < this.history.length - 1,
        submenu: () =>
          this.history.slice(this.historyIndex + 1).map((path, i) => {
            const item = findItemByPath(path);
            const label = item ? item.name : path;
            const targetIndex = this.historyIndex + (i + 1);
            return {
              label: label,
              action: () => {
                this.historyIndex = targetIndex;
                this.navigateTo(this.history[this.historyIndex], true);
              },
            };
          }),
      },
      {
        label: "Up",
        iconName: "up",
        action: () => this.goUp(),
        enabled: () => this.currentPath !== "/",
      },
      "divider",
      {
        label: "Cut",
        iconName: "cut",
        action: () => {
          const itemsToOperateOn = [...this.folderView.iconManager.selectedIcons]
            .map((selectedIcon) => this.folderView.getItemFromIcon(selectedIcon))
            .filter(Boolean);
          clipboardManager.set(itemsToOperateOn, "cut");
        },
        enabled: () => {
          const selectedIcons = this.folderView.iconManager.selectedIcons;
          if (selectedIcons.size === 0) return false;

          const itemsToOperateOn = [...selectedIcons]
            .map((selectedIcon) => this.folderView.getItemFromIcon(selectedIcon))
            .filter(Boolean);

          return !itemsToOperateOn.some((item) => item.isStatic);
        },
      },
      {
        label: "Copy",
        iconName: "copy",
        action: () => {
          const itemsToOperateOn = [...this.folderView.iconManager.selectedIcons]
            .map((selectedIcon) => this.folderView.getItemFromIcon(selectedIcon))
            .filter(Boolean);
          clipboardManager.set(itemsToOperateOn, "copy");
        },
        enabled: () => this.folderView.iconManager.selectedIcons.size > 0,
      },
      {
        label: "Paste",
        iconName: "paste",
        action: () => {
          const { items, operation } = clipboardManager.get();
          pasteItems(this.currentPath, items, operation);
          this.render(this.currentPath);
          if (operation === "cut") {
            clipboardManager.clear();
          }
        },
        enabled: () =>
          !clipboardManager.isEmpty() &&
          this.currentPath !== "/" &&
          this.currentPath !== "//network-neighborhood",
      },
      "divider",
      {
        label: "Undo",
        iconName: "undo",
        enabled: false,
      },
      "divider",
      {
        label: "Delete",
        iconName: "delete",
        action: () => {
          const itemsToOperateOn = [...this.folderView.iconManager.selectedIcons]
            .map((selectedIcon) => this.folderView.getItemFromIcon(selectedIcon))
            .filter((item) => item && !item.isStatic);

          if (itemsToOperateOn.length === 0) return;

          const message =
            itemsToOperateOn.length === 1
              ? `Are you sure you want to send '${itemsToOperateOn[0].name}' to the Recycle Bin?`
              : `Are you sure you want to send these ${itemsToOperateOn.length} items to the Recycle Bin?`;

          ShowDialogWindow({
            title: "Confirm File Delete",
            text: message,
            buttons: [
              {
                label: "Yes",
                action: () => {
                  itemsToOperateOn.forEach((item) => this.deleteFile(item));
                },
              },
              { label: "No", isDefault: true },
            ],
          });
        },
        enabled: () => this.folderView.iconManager.selectedIcons.size > 0,
      },
      {
        label: "Properties",
        iconName: "properties",
        action: () => {
          const selectedIcon = this.folderView.iconManager.selectedIcons
            .values()
            .next().value;
          const item = this.folderView.getItemFromIcon(selectedIcon);
          if (item) {
            this.showProperties(item);
          }
        },
        enabled: () => this.folderView.iconManager.selectedIcons.size === 1,
      },
    ];

    this.toolbar = new window.Toolbar(toolbarItems, {
      icons: browseUiIcons,
      iconsGrayscale: browseUiIconsGrayscale,
    });
    win.$content.append(this.toolbar.element);

    this.addressBar = new AddressBar({
      onEnter: (path) => {
        const internalPath = convertWindowsPathToInternal(path);
        if (internalPath && findItemByPath(internalPath)) {
          this.navigateTo(internalPath);
        } else {
          ShowDialogWindow({
            title: "Path not found",
            text: "The system cannot find the path specified.",
            buttons: [{ label: "OK", isDefault: true }],
          });
        }
      },
    });
    win.$content.append(this.addressBar.element);

    const mainContainer = document.createElement("div");
    mainContainer.style.display = "flex";
    mainContainer.style.flexDirection = "column";
    mainContainer.style.height = "100%";

    mainContainer.append(content);

    this.statusBar = new StatusBar();
    mainContainer.append(this.statusBar.element);

    win.$content.append(mainContainer);

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
      if (this.win.element.style.display !== "none") {
        this.render(this.currentPath);
      }
    };
    document.addEventListener("explorer-refresh", this.refreshHandler);

    this.clipboardHandler = () => {
      this.folderView.updateCutIcons();
      this.updateMenuState();
    };
    document.addEventListener("clipboard-change", this.clipboardHandler);

    this.win.onClosed(() => {
      document.removeEventListener("explorer-refresh", this.refreshHandler);
      document.removeEventListener("clipboard-change", this.clipboardHandler);
    });

    // Drag and drop functionality
    this.iconContainer.addEventListener("dragover", (e) => {
      e.preventDefault(); // Allow drop
    });


    this.handleMouseUp = () => {
      this.statusBar.setText("");
    };
    document.addEventListener("mouseup", this.handleMouseUp);

    return win;
  }

  _onClose() {
    if (this.resizeObserver) {
      this.resizeObserver.disconnect();
    }
    document.removeEventListener("explorer-refresh", this.refreshHandler);
    document.removeEventListener("clipboard-change", this.clipboardHandler);
    document.removeEventListener("mouseup", this.handleMouseUp);
  }

  async _onLaunch(filePath) {
    if (filePath) {
      this.navigateTo(filePath);
    }
  }

  navigateTo(path, isHistoryNav = false) {
    if (!isHistoryNav) {
      // If we are at some point in history and not at the end, nuke forward history
      if (this.historyIndex < this.history.length - 1) {
        this.history.splice(this.historyIndex + 1);
      }
      this.history.push(path);
      this.historyIndex = this.history.length - 1;
    }

    this.render(path, true);
    this.updateMenuState();
    this.addressBar.setValue(convertInternalPathToWindows(path));
  }

  render(path, isNewNavigation = true) {
    this.currentPath = path;
    const item = findItemByPath(path);

    if (!item) {
      this.content.innerHTML = "Folder not found.";
      this.win.title("Error");
      return;
    }

    const name = item.type === "drive" ? `(${item.name})` : item.name;
    this.win.title(name);
    this.titleElement.text(name);
    const icon = getIconForPath(path);
    if (icon) {
      this.win.setIcons(icon);
      this.sidebarIcon.src = icon[32];
    }
    this.sidebarTitle.textContent = name;
    this.folderView.render(path, isNewNavigation);
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
      window.open(item.url, "_blank", "width=800,height=600");
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
      this.navigateTo(this.history[this.historyIndex], true);
    }
  }

  goForward() {
    if (this.historyIndex < this.history.length - 1) {
      this.historyIndex++;
      this.navigateTo(this.history[this.historyIndex], true);
    }
  }

  updateMenuState() {
    this.menuBar.element.dispatchEvent(new Event("update"));

    if (this.toolbar) {
      this.toolbar.element.dispatchEvent(new Event("update"));
    }
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
    // Check if the item is an app from the main configuration
    if (item.appId && item.isStatic) {
      const appConfig = apps.find((app) => app.id === item.appId);
      if (appConfig && appConfig.appClass) {
        const tempAppInstance = new appConfig.appClass(appConfig);
        tempAppInstance.showProperties();
        return;
      }
    }

    // Fallback for files, folders, and other items
    const displayName = item.name || item.filename || item.title;
    const itemType = item.type || "File";
    let iconUrl;

    if (item.icon) {
      iconUrl = item.icon[32];
    } else if (item.type === "drive") {
      iconUrl = ICONS.drive[32];
    } else if (item.type === "folder") {
      iconUrl = ICONS.folderClosed[32];
    } else if (item.type === "briefcase") {
      iconUrl = ICONS.briefcase[32];
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

