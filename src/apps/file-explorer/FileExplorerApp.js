import { Application } from "../Application.js";
import { ICONS } from "../../config/icons.js";
import { getItem, setItem } from "../../utils/localStorage.js";
import { ShowDialogWindow } from "../../components/DialogWindow.js";
import { AddressBar } from "../../components/AddressBar.js";
import { IconManager } from "../../components/IconManager.js";
import { StatusBar } from "../../components/StatusBar.js";
import { AnimatedLogo } from "../../components/AnimatedLogo.js";
import browseUiIcons from "../../assets/icons/browse-ui-icons.png";
import browseUiIconsGrayscale from "../../assets/icons/browse-ui-icons-grayscale.png";
import { launchApp } from "../../utils/appManager.js";
import { getAssociation } from "../../utils/directory.js";
import { truncateName } from "../../utils/stringUtils.js";

const FILE_EXPLORER_AUTO_ARRANGE = "file_explorer_auto_arrange";
const FILE_EXPLORER_ICON_POSITIONS = "file_explorer_icon_positions";

function isAutoArrangeEnabled() {
  const autoArrange = getItem(FILE_EXPLORER_AUTO_ARRANGE);
  return autoArrange === null ? false : !!autoArrange;
}

function setAutoArrange(enabled) {
  setItem(FILE_EXPLORER_AUTO_ARRANGE, enabled);
}

export class FileExplorerApp extends Application {
  static config = {
    id: "file-explorer",
    title: "File Explorer",
    description: "Browse project source code.",
    icon: ICONS.computer,
    width: 640,
    height: 480,
    resizable: true,
    isSingleton: false,
  };

  constructor(config) {
    super(config);
    this.fs = null;
    this.path = null;
    this.initialPath = "/";
    this.history = [];
    this.historyIndex = -1;
    this.resizeObserver = null;
    this.currentFolderItems = [];
    this._initFS();
  }

  _initFS() {
    this.fs = window.System.fs;
    this.path = window.System.path;
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

    const iconContainer = document.createElement("div");
    iconContainer.className = "explorer-icon-view has-absolute-icons";
    content.appendChild(iconContainer);
    this.iconContainer = iconContainer;

    this.iconManager = new IconManager(this.iconContainer, {
      iconSelector: ".explorer-icon",
      onItemContext: (e, icon) => this.showItemContextMenu(e, icon),
      onBackgroundContext: (e) => this.showBackgroundContextMenu(e),
      onSelectionChange: () => {
        this.updateMenuState();
        const selectionCount = this.iconManager.selectedIcons.size;
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
      },
      {
        label: "Forward",
        iconName: "forward_explorer",
        action: () => this.goForward(),
        enabled: () => this.historyIndex < this.history.length - 1,
      },
      {
        label: "Up",
        iconName: "up",
        action: () => this.goUp(),
        enabled: () => this.currentPath !== "/",
      },
    ];

    this.toolbar = new window.Toolbar(toolbarItems, {
      icons: browseUiIcons,
      iconsGrayscale: browseUiIconsGrayscale,
    });
    win.$content.append(this.toolbar.element);

    this.addressBar = new AddressBar({
      onEnter: (path) => {
        this.navigateTo(path);
      },
    });
    win.$content.append(this.addressBar.element);

    const mainContainer = document.createElement("div");
    mainContainer.style.display = "flex";
    mainContainer.style.flexDirection = "column";
    mainContainer.style.height = "100%";
    mainContainer.style.overflow = "auto";

    mainContainer.append(content);

    this.statusBar = new StatusBar();
    mainContainer.append(this.statusBar.element);

    win.$content.append(mainContainer);

    this.navigateTo(this.initialPath);

    return win;
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

    this.render(path);
    this.updateMenuState();
    this.addressBar.setValue(path);
  }

  render(path) {
    this.currentPath = path;
    this.win.title(this.currentPath);
    this.statusBar.setRightText(this.currentPath);
    this.iconContainer.innerHTML = "";
    this.currentFolderItems = [];

    const fs = window.System.fs;
    const pathModule = window.System.path;

    if (this.currentPath === "/") {
      const allowedFolders = ["/src", "/public"];
      this.currentFolderItems = allowedFolders.map((folder) => ({
        id: folder,
        name: folder.substring(1),
        type: "folder",
        path: folder,
      }));
      this.renderIcons();
      return;
    }

    fs.readdir(path, (err, files) => {
      if (err) {
        this.content.innerHTML = `Error reading directory: ${err}`;
        return;
      }

      const filePromises = files.map((file) => {
        return new Promise((resolve) => {
          const fullPath = pathModule.join(path, file);
          fs.stat(fullPath, (statErr, stats) => {
            if (statErr) {
              resolve(null);
            } else {
              resolve({
                id: fullPath,
                name: file,
                type: stats.isDirectory() ? "folder" : "file",
                path: fullPath,
              });
            }
          });
        });
      });

      Promise.all(filePromises).then((fileItems) => {
        this.currentFolderItems = fileItems.filter(Boolean);
        this.renderIcons();
      });
    });
  }

  renderIcons() {
    this.currentFolderItems.forEach((item) => {
      const icon = this.createExplorerIcon(item);
      this.iconContainer.appendChild(icon);
    });
  }

  createExplorerIcon(item) {
    const displayName = item.name;
    const iconDiv = document.createElement("div");
    iconDiv.className = "explorer-icon";
    iconDiv.setAttribute("title", displayName);
    iconDiv.setAttribute("data-id", item.id);

    const iconInner = document.createElement("div");
    iconInner.className = "icon";

    const iconWrapper = document.createElement("div");
    iconWrapper.className = "icon-wrapper";

    const iconImg = document.createElement("img");
    if (item.type === "folder") {
      iconImg.src = ICONS.folderClosed[32];
    } else {
      const association = getAssociation(displayName);
      iconImg.src = association.icon[32];
    }
    iconImg.draggable = false;
    iconWrapper.appendChild(iconImg);

    const iconLabel = document.createElement("div");
    iconLabel.className = "icon-label";
    iconLabel.textContent = truncateName(displayName);

    iconDiv.appendChild(iconInner);
    iconDiv.appendChild(iconLabel);

    iconDiv.addEventListener("dblclick", () => {
      this._launchItem(item);
    });

    return iconDiv;
  }

  _launchItem(item) {
    if (item.type === "folder") {
      this.navigateTo(item.path);
    } else {
      const fs = window.System.fs;
      fs.readFile(item.path, (err, data) => {
        if (err) {
          ShowDialogWindow({
            title: "Error",
            text: `Could not read file: ${err}`,
            buttons: [{ label: "OK", isDefault: true }],
          });
          return;
        }

        const association = getAssociation(item.name);
        if (association && association.appId) {
          launchApp(association.appId, {
            name: item.name,
            content: data.toString(),
          });
        }
      });
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
}
