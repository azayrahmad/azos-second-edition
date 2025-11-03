import { Application } from "../Application.js";
import directory from "../../config/directory.js";
import { apps } from "../../config/apps.js";
import { launchApp } from "../../utils/appManager.js";

function findItemByPath(path) {
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

    const content = document.createElement("div");
    content.className = "explorer-content sunken-panel";
    win.$content.append(content);
    this.content = content;

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
    this.content.innerHTML = ""; // Clear previous content

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
      this.content.appendChild(icon);
    });
  }

  createExplorerIcon(item) {
    const app = apps.find((a) => a.id === item.appId) || {};

    const iconDiv = document.createElement("div");
    iconDiv.className = "desktop-icon";
    iconDiv.setAttribute("title", item.name);
    iconDiv.setAttribute("data-id", item.id);

    const iconInner = document.createElement("div");
    iconInner.className = "icon";

    const iconImg = document.createElement("img");
    // TODO: get proper icon based on file type / folder etc
    iconImg.src = app.icon ? app.icon[32] : "public/icons/folder-32.png";
    iconInner.appendChild(iconImg);

    const iconLabel = document.createElement("div");
    iconLabel.className = "icon-label";
    iconLabel.textContent = item.name;

    iconDiv.appendChild(iconInner);
    iconDiv.appendChild(iconLabel);

    iconDiv.addEventListener("dblclick", () => {
      if (item.type === "folder" || item.type === "drive") {
        const newPath =
          this.currentPath === "/"
            ? `/${item.id}`
            : `${this.currentPath}/${item.id}`;
        this.navigateTo(newPath);
      } else if (item.appId) {
        launchApp(item.appId);
      }
    });

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
}
