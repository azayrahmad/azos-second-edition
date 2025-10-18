import { createTaskbarButton } from '../components/taskbar.js';

const openWindows = new Map();

export class Application {
    constructor(config) {
        if (this.constructor === Application) {
            throw new TypeError('Abstract class "Application" cannot be instantiated directly.');
        }

        this.id = config.id;
        this.title = config.title;
        this.icon = config.icon;
        this.hasTaskbarButton = config.hasTaskbarButton !== false; // Default to true
        this.win = null;
    }

    launch(filePath = null) {
        const windowId = this._getWindowId(filePath);

        const existingWindow = openWindows.get(windowId);
        if (existingWindow) {
            const $win = $(existingWindow.element);
            if ($win.is(':visible')) {
                existingWindow.focus();
            } else {
                existingWindow.restore();
                setTimeout(() => existingWindow.focus(), 0);
            }
            return;
        }

        this.win = this._createWindow(filePath);
        if (!this.win) {
            console.error(`Application ${this.id} failed to create a window.`);
            return;
        }

        this._setupWindow(windowId);
        this._onLaunch(filePath);
        openWindows.set(windowId, this.win);
    }

    _getWindowId(filePath) {
        return filePath ? `${this.id}-${filePath}` : this.id;
    }

    _createWindow(filePath) {
        throw new Error('Application must implement the _createWindow() method.');
    }

    _onLaunch(filePath) {
        // Optional hook for subclasses to implement for post-launch logic
    }

    _setupWindow(windowId) {
        this.win.element.id = windowId;

        this.win.onClosed(() => {
            if (this.hasTaskbarButton) {
                const taskbarButton = document.querySelector(`.taskbar-button[for="${windowId}"]`);
                if (taskbarButton) {
                    taskbarButton.remove();
                }
            }
            openWindows.delete(windowId);
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