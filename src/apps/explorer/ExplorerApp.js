import { Application } from '../Application.js';
import { ICONS } from '../../config/icons.js';
import './explorer.css';
import { launchApp } from '../../utils/appManager.js';
import { MenuBar } from '../../../public/os-gui/MenuBar.js';

export class ExplorerApp extends Application {
  constructor(folder) {
    super({
      title: folder.name,
      icon: ICONS[folder.icon] || ICONS.folder,
      width: 600,
      height: 400,
      resizable: true,
    });
    this.folder = folder;
    this.history = [folder];
  }

  updateFolder(folder) {
    this.history = [folder];
    this.win.title(folder.name);
    this.renderFolderContents(this.win.content, folder);
    this.win.element.querySelector('.menus').dispatchEvent(new CustomEvent('update'));
  }

  _onLaunch(folder) {
    this.win.content = document.createElement('div');
    this.win.content.className = 'explorer-content';
    this.win.element.appendChild(this.win.content);

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
      this.win.element.querySelector('.menus').dispatchEvent(new CustomEvent('update'));
    }
  }

  renderFolderContents(container, folder) {
    container.innerHTML = ''; // Clear existing content

    folder.children.forEach(item => {
      const icon = this.createIcon(item);
      container.appendChild(icon);
    });
  }

  createIcon(item) {
    const iconDiv = document.createElement('div');
    iconDiv.className = 'desktop-icon';
    iconDiv.setAttribute('title', item.name || item.filename);

    const iconInner = document.createElement('div');
    iconInner.className = 'icon';

    const iconImg = document.createElement('img');
    const iconName = item.children ? (item.icon || 'folder') : (item.icon || 'file');
    iconImg.src = (ICONS[iconName] || ICONS.file)[32];
    iconInner.appendChild(iconImg);

    const iconLabel = document.createElement('div');
    iconLabel.className = 'icon-label';
    iconLabel.textContent = item.name || item.filename;

    iconDiv.appendChild(iconInner);
    iconDiv.appendChild(iconLabel);

    iconDiv.addEventListener('dblclick', () => {
      if (item.children) { // It's a folder
        this.history.push(item);
        this.win.title(item.name);
        this.renderFolderContents(this.win.content, item);
        this.win.element.querySelector('.menus').dispatchEvent(new CustomEvent('update'));
      } else { // It's a file
        launchApp(item.app, item);
      }
    });

    return iconDiv;
  }
}
