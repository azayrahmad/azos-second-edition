import { createTaskbarButton, createTrayIcon } from '../components/taskbar.js';

const openWindows = new Map();
export const openApps = new Map();

export class Application {
    constructor(config) {
        if (this.constructor === Application) {
            throw new TypeError('Abstract class "Application" cannot be instantiated directly.');
        }

        this.id = config.id;
        this.title = config.title;
        this.icon = config.icon;
        this.hasTaskbarButton = config.hasTaskbarButton !== false;
        this.hasTray = config.hasTray === true;
        this.tray = config.tray;
        this.win = null;

        // Store window properties
        this.width = config.width;
        this.height = config.height;
        this.resizable = config.resizable;
        this.minimizeButton = config.minimizeButton;
        this.maximizeButton = config.maximizeButton;
    }

    launch(filePath = null) {
        const windowId = this._getWindowId(filePath);

        if (openApps.has(this.id)) {
            const existingApp = openApps.get(this.id);

            if (this.id === 'explorer' && typeof existingApp.updateFolder === 'function') {
                existingApp.updateFolder(filePath);
            }

            if (existingApp.win) {
                const $win = $(existingApp.win.element);
                if ($win.is(':visible')) {
                    existingApp.win.focus();
                } else {
                    existingApp.win.restore();
                    setTimeout(() => existingApp.win.focus(), 0);
                }
            }
            return;
        }

        this.win = this._createWindow(filePath);

        if (this.win) {
            this._setupWindow(windowId);
            openWindows.set(windowId, this.win);
        }

        if (this.hasTray) {
            createTrayIcon(this);
        }

        this._onLaunch(filePath);
        openApps.set(this.id, this);
    }

    _getWindowId(filePath) {
        if (typeof filePath === 'object' && filePath !== null) {
            return `${this.id}-${filePath.filename || filePath.name || filePath.id}`;
        }
        return filePath ? `${this.id}-${filePath}` : this.id;
    }

    _createWindow() {
        return new $Window({
            title: this.title,
            width: this.width,
            height: this.height,
            resizable: this.resizable,
            minimizeButton: this.minimizeButton,
            maximizeButton: this.maximizeButton,
            icon: this.icon,
        });
    }

    _onLaunch(filePath) {
        // Optional hook for subclasses to implement for post-launch logic
    }

    _setupWindow(windowId) {
        this.win.element.id = windowId;
        this.win.element.setAttribute('data-testid', `app-window-${this.id}`);

        this.win.onClosed(() => {
            if (this.hasTaskbarButton) {
                const taskbarButton = document.querySelector(`.taskbar-button[for="${windowId}"]`);
                if (taskbarButton) {
                    taskbarButton.remove();
                }
            }
            openWindows.delete(windowId);
            // Also remove from the master app list
            openApps.delete(this.id);
        });

        document.body.appendChild(this.win.element);

        if (this.hasTaskbarButton) {
            const taskbarButton = createTaskbarButton(windowId, this.icon, this.title);
            this.win.element.classList.add('app-window');
            this.win.setMinimizeTarget(taskbarButton);
        }

        this.win.center();
        this.win.focus();
    }
}