import { Application } from "../Application.js";
import { ICONS } from "../../config/icons.js";
import "./explorer.css";
import { launchApp } from "../../utils/appManager.js";

export class ExplorerApp extends Application {
  constructor(folder) {
    super({
      title: folder.name,
      icons: ICONS[folder.icon] || ICONS.folder,
      width: 600,
      height: 400,
      resizable: true,
    });
    this.folder = folder;
    this.history = [folder];
    this.selectedIcons = new Set();
  }

  updateFolder(folder) {
    this.history = [folder];
    this.win.title(folder.name);
    this.renderFolderContents(this.win.content, folder);
    this.win.element
      .querySelector(".menus")
      .dispatchEvent(new CustomEvent("update"));
  }

  _onLaunch(folder) {
    const sunkenPanel = document.createElement('div');
    sunkenPanel.className = 'sunken-panel';
    this.win.element.appendChild(sunkenPanel);

    this.win.content = document.createElement("div");
    this.win.content.className = "explorer-content";
    sunkenPanel.appendChild(this.win.content);

    this.setupSelection(this.win.content);

    this.win.title(folder.name);
    const menuBar = new MenuBar({
      "&File": [
        {
          label: "&Up",
          action: () => this.goUp(),
          enabled: () => this.history.length > 1,
        },
        "MENU_DIVIDER",
        {
          label: "E&xit",
          action: () => this.win.close(),
        },
      ],
    });
    this.win.setMenuBar(menuBar);

    this.renderFolderContents(this.win.content, folder);
  }

  goUp() {
    if (this.history.length > 1) {
      this.history.pop();
      const currentFolder = this.history[this.history.length - 1];
      this.win.title(currentFolder.name);
      this.renderFolderContents(this.win.content, currentFolder);
      this.win.element
        .querySelector(".menus")
        .dispatchEvent(new CustomEvent("update"));
    }
  }

  clearSelection() {
    this.selectedIcons.forEach(icon => {
      const iconImg = icon.querySelector(".icon img");
      const iconLabel = icon.querySelector(".icon-label");
      if (iconImg) iconImg.classList.remove("highlighted-icon");
      if (iconLabel) {
        iconLabel.classList.remove("highlighted-label", "selected");
      }
    });
    this.selectedIcons.clear();
  }

  setupSelection(container) {
    let lasso;
    let isLassoing = false;
    let wasLassoing = false;
    let lassoStartX, lassoStartY;

    function isIntersecting(rect1, rect2) {
      return !(rect1.right < rect2.left ||
               rect1.left > rect2.right ||
               rect1.bottom < rect2.top ||
               rect1.top > rect2.bottom);
    }

    container.addEventListener('mousedown', (e) => {
      if (e.target !== container) return;
      if (e.button !== 0) return;

      isLassoing = true;
      lassoStartX = e.clientX;
      lassoStartY = e.clientY;

      lasso = document.createElement('div');
      lasso.className = 'lasso';
      lasso.style.left = `${lassoStartX}px`;
      lasso.style.top = `${lassoStartY}px`;
      container.appendChild(lasso);

      this.clearSelection();
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
        const icons = container.querySelectorAll('.desktop-icon');

        icons.forEach(icon => {
          const iconRect = icon.getBoundingClientRect();
          const iconImg = icon.querySelector(".icon img");
          const iconLabel = icon.querySelector(".icon-label");

          if (isIntersecting(lassoRect, iconRect)) {
            if (!this.selectedIcons.has(icon)) {
              this.selectedIcons.add(icon);
              if (iconImg) iconImg.classList.add("highlighted-icon");
              if (iconLabel) {
                iconLabel.classList.add("highlighted-label", "selected");
              }
            }
          } else {
            if (this.selectedIcons.has(icon)) {
              this.selectedIcons.delete(icon);
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
        document.removeEventListener('mousemove', onMouseMove);
        document.removeEventListener('mouseup', onMouseUp);
         setTimeout(() => {
          wasLassoing = false;
        }, 0);
      };

      document.addEventListener('mousemove', onMouseMove);
      document.addEventListener('mouseup', onMouseUp);
    });

    container.addEventListener('click', (e) => {
      if (wasLassoing) {
        wasLassoing = false;
        return;
      }
      if (e.target === container && !isLassoing && !e.target.closest('.desktop-icon')) {
        this.clearSelection();
      }
    });
  }

  renderFolderContents(container, folder) {
    container.innerHTML = ""; // Clear existing content
    this.clearSelection();

    folder.children.forEach((item) => {
      const icon = this.createIcon(item);
      container.appendChild(icon);
    });
  }

  createIcon(item) {
    const iconDiv = document.createElement("div");
    iconDiv.className = "desktop-icon";
    iconDiv.setAttribute("title", item.name || item.filename);

    const iconInner = document.createElement("div");
    iconInner.className = "icon";

    const iconImg = document.createElement("img");
    const iconName = item.children
      ? item.icon || "folder"
      : item.icon || "file";
    iconImg.src = (ICONS[iconName] || ICONS.file)[32];
    iconInner.appendChild(iconImg);

    const iconLabel = document.createElement("div");
    iconLabel.className = "icon-label";
    iconLabel.textContent = item.name || item.filename;

    iconDiv.appendChild(iconInner);
    iconDiv.appendChild(iconLabel);

    iconDiv.addEventListener("click", (e) => {
        e.stopPropagation();
        this.clearSelection();
        this.selectedIcons.add(iconDiv);
        iconImg.classList.add("highlighted-icon");
        iconLabel.classList.add("highlighted-label", "selected");
    });

    iconDiv.addEventListener("dblclick", () => {
      if (item.children) {
        // It's a folder
        this.history.push(item);
        this.win.title(item.name);
        this.renderFolderContents(this.win.content, item);
        this.win.element
          .querySelector(".menus")
          .dispatchEvent(new CustomEvent("update"));
      } else {
        // It's a file
        launchApp(item.app, item);
      }
    });

    return iconDiv;
  }
}
