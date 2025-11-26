import { Application } from "../Application.js";
import directory from "../../config/directory.js";
import { apps } from "../../config/apps.js";
import { ICONS } from "../../config/icons.js";
import { launchApp } from "../../utils/appManager.js";
import { IconManager } from "../../components/IconManager.js";
import {
  getRecycleBinItems,
  removeFromRecycleBin,
} from "../../utils/recycleBinManager.js";
import { networkNeighborhood } from "../../config/networkNeighborhood.js";
import { registerCustomApp } from "../../utils/customAppManager.js";
import { ShowDialogWindow } from "../../components/DialogWindow.js";
import { AnimatedLogo } from "../../components/AnimatedLogo.js";
import { SPECIAL_FOLDER_PATHS } from "../../config/special-folders.js";

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

function findItemByPath(path) {
  if (path === "//recycle-bin") {
    const recycledItems = getRecycleBinItems();
    return {
      id: "recycle-bin",
      name: "Recycle Bin",
      type: "folder",
      children: recycledItems.map((item) => ({
        ...item,
        name: item.title,
        type: "app",
      })),
    };
  }

  if (path === "//network-neighborhood") {
    return {
      id: "network-neighborhood",
      name: "Network Neighborhood",
      type: "folder",
      children: networkNeighborhood.map((item) => ({
        ...item,
        id: item.title.toLowerCase().replace(/\\s+/g, "-"),
        name: item.title,
        type: "network",
      })),
    };
  }

  if (!path || path === "/") {
    return {
      id: "root",
      name: "My Computer",
      type: "folder",
      children: directory,
    };
  }

  const parts = path.split("/").filter(Boolean);
  let currentLevel = directory;
  let currentItem = null;

  for (const part of parts) {
    const found = currentLevel.find(
      (item) => item.name === part || item.id === part,
    );
    if (found) {
      currentItem = found;
      currentLevel = found.children || [];
    } else {
      return null; // Not found
    }
  }

  return currentItem;
}

export class ExplorerApp extends Application {
  constructor(config) {
    super(config);
    this.initialPath = "/";
    this.history = [];
    this.historyIndex = -1;
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
    console.log("ExplorerApp window created, width:", this.width);
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

    this.iconManager = new IconManager(content, {
      onItemContext: (e, icon) => this.showItemContextMenu(e, icon),
      onBackgroundContext: (e) => this.showBackgroundContextMenu(e),
      iconClass: 'explorer-icon',
      highlightedIconClass: 'explorer-highlighted-icon',
      highlightedLabelClass: 'explorer-highlighted-label',
      selectedClass: 'explorer-selected',
    });

    this.navigateTo(this.initialPath);

    return win;
  }

  async _onLaunch(filePath) {
    if (filePath) {
      this.navigateTo(filePath);
    }
  }

  navigateTo(path) {
    // Truncate history if navigating from a previous state
    if (this.historyIndex < this.history.length - 1) {
      this.history = this.history.slice(0, this.historyIndex + 1);
    }
    this.history.push(path);
    this.historyIndex++;

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
    const icon = getIconForPath(path);
    if (icon) {
      this.win.setIcons(icon);
    }
    this.content.innerHTML = ""; // Clear previous content
    this.iconManager.clearSelection();

    const children = item.children || [];

    children.forEach((child) => {
      let iconData = { ...child };
      let isFile = false;

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
      this.iconManager.configureIcon(icon);
      this.content.appendChild(icon);
    });
  }

  createExplorerIcon(item) {
    const app = apps.find((a) => a.id === item.appId) || {};

    const iconDiv = document.createElement("div");
    iconDiv.className = "explorer-icon";
    iconDiv.setAttribute("title", item.name);
    iconDiv.setAttribute("data-id", item.id);

    const iconInner = document.createElement("div");
    iconInner.className = "icon";

    const iconImg = document.createElement("img");
    if (item.type === "drive") {
      iconImg.src = ICONS.drive[32];
    } else if (item.type === "folder") {
      iconImg.src = ICONS.folderClosed[32];
    } else if (item.type === "network") {
      iconImg.src = ICONS["internet-explorer"][32];
    } else {
      iconImg.src = app.icon ? app.icon[32] : ICONS.folderClosed[32];
    }
    iconInner.appendChild(iconImg);

    const iconLabel = document.createElement("div");
    iconLabel.className = "icon-label";
    iconLabel.textContent = item.name;

    iconDiv.appendChild(iconInner);
    iconDiv.appendChild(iconLabel);

    if (this.currentPath !== "//recycle-bin") {
      iconDiv.addEventListener("dblclick", () => {
        if (item.url) {
          window.open(item.url, "_blank");
        } else if (item.type === "folder" || item.type === "drive") {
          const newPath =
            this.currentPath === "/"
              ? `/${item.id}`
              : `${this.currentPath}/${item.id}`;
          this.navigateTo(newPath);
        } else if (item.appId) {
          launchApp(item.appId);
        }
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

  showItemContextMenu(event, icon) {
    const itemId = icon.getAttribute("data-id");

    if (this.currentPath === "//recycle-bin") {
      const menuItems = [
        {
          label: "Restore",
          default: true,
          action: () => {
            const item = getRecycleBinItems().find((i) => i.id === itemId);
            if (item) {
              registerCustomApp(item);
              removeFromRecycleBin(itemId);
              this.render(this.currentPath);
            }
          },
        },
        "MENU_DIVIDER",
        {
          label: "Delete",
          action: () => {
            ShowDialogWindow({
              title: "Delete Item",
              text: "Are you sure you want to permanently delete this item?",
              buttons: [
                {
                  label: "Yes",
                  action: () => {
                    removeFromRecycleBin(itemId);
                    this.render(this.currentPath);
                  },
                },
                { label: "No", isDefault: true },
              ],
            });
          },
        },
      ];
      new window.ContextMenu(menuItems, event);
    } else {
      const menuItems = [
        { label: "Open", default: true, action: () => {} },
        "MENU_DIVIDER",
        { label: "Cut", action: () => {} },
        { label: "Copy", action: () => {} },
        "MENU_DIVIDER",
        { label: "Delete", action: () => {} },
        { label: "Rename", action: () => {} },
        "MENU_DIVIDER",
        { label: "Properties", action: () => {} },
      ];
      new window.ContextMenu(menuItems, event);
    }
  }

  showBackgroundContextMenu(event) {
    const menuItems = [
      {
        label: "View",
        submenu: [
          { label: "Large Icons", action: () => {} },
          { label: "Details", action: () => {} },
        ],
      },
      "MENU_DIVIDER",
      { label: "New Folder", action: () => {} },
      "MENU_DIVIDER",
      { label: "Paste", action: () => {} },
    ];
    new window.ContextMenu(menuItems, event);
  }
}
