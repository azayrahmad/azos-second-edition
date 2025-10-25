import { Application } from '../Application.js';
import { apps } from '../../config/apps.js';
import { launchApp } from '../../utils/appManager.js';
import { ICONS } from '../../config/icons.js';

export class ExplorerApp extends Application {
  constructor(config) {
    super(config);
    this.currentPath = [];
    this.folderData = null;
  }

  _createWindow(folderData) {
    this.folderData = folderData;
    const win = new $Window({
      title: this.title,
      width: this.width || 600,
      height: this.height || 400,
      resizable: this.resizable,
      minimizeButton: this.minimizeButton,
      maximizeButton: this.maximizeButton,
      content: '<div class="explorer-content" style="width: 100%; height: 100%;"></div>',
    });
    return win;
  }

  _onLaunch() {
    this.win.element.querySelector('.explorer-content').addEventListener('dblclick', (e) => {
      const icon = e.target.closest('.desktop-icon');
      if (icon) {
        const itemName = icon.dataset.itemName;
        const itemType = icon.dataset.itemType;
        if (itemType === 'folder') {
            const newFolder = this.currentFolder.children.find(c => c.name === itemName);
            if (newFolder) {
                this.currentPath.push(itemName);
                this._renderContent(newFolder);
            }
        } else {
          const file = this.currentFolder.children.find(c => c.filename === itemName);
          if (file.content) {
            launchApp(file.app, { content: file.content });
          } else {
            launchApp(file.app, file.path);
          }
        }
      }
    });

    this._renderContent(this.folderData);
  }

  _renderContent(folderData) {
    this.currentFolder = folderData;
    if (this.currentFolder.children) {
        this.currentFolder.children.forEach(child => {
            if (child.children) {
                child.parent = this.currentFolder;
            }
        });
    }
    const contentDiv = this.win.element.querySelector('.explorer-content');
    contentDiv.innerHTML = '';
    contentDiv.style.display = 'grid';
    contentDiv.style.gridTemplateColumns = 'repeat(auto-fill, minmax(80px, 1fr))';
    contentDiv.style.gap = '10px';
    contentDiv.style.padding = '10px';


    if (folderData.children) {
      folderData.children.forEach(item => {
        const isFile = !!item.filename;
        const iconDiv = this._createIcon(item, isFile);
        contentDiv.appendChild(iconDiv);
      });
    }

    this.win.setTitle(this.currentPath.length > 0 ? this.currentPath.join('\\\\') : folderData.name);
  }

  _createIcon(item, isFile) {
    let app;
    if (isFile) {
        app = apps.find(a => a.id === item.app);
    } else {
        // Folder
        app = { icon: ICONS[item.icon] };
    }
    if (!app) return null;

    const iconDiv = document.createElement("div");
    iconDiv.className = "desktop-icon";
    iconDiv.setAttribute("title", isFile ? item.filename : item.name);
    iconDiv.dataset.itemName = isFile ? item.filename : item.name;
    iconDiv.dataset.itemType = isFile ? 'file' : 'folder';
    if (!isFile) {
        iconDiv.dataset.folderName = item.name;
    }


    const iconInner = document.createElement("div");
    iconInner.className = "icon";

    const iconImg = document.createElement("img");
    iconImg.src = app.icon[32];
    iconInner.appendChild(iconImg);

    const iconLabel = document.createElement("div");
    iconLabel.className = "icon-label";
    iconLabel.textContent = isFile ? item.filename : item.name;

    iconDiv.appendChild(iconInner);
    iconDiv.appendChild(iconLabel);

    return iconDiv;
  }
}
