import './style.css'
import { setupCounter } from './counter.js'
import { initDesktop } from './components/desktop.js'
import { apps, appClasses } from './config/apps.js';
import { ICONS } from './config/icons.js';
import { Application } from './apps/Application.js';
import { registerCustomApp } from './utils/customAppManager.js';
import desktopConfig from './config/desktop.json';
import { taskbar } from './components/taskbar.js'
import { ShowDialogWindow } from './components/DialogWindow.js'
import { playSound } from './utils/soundManager.js';

// Window Management System
class WindowManagerSystem {
    constructor() {
        this._zIndex = 1000;
        this.minimizedWindows = new Map();
    }

    incrementZIndex() {
        return ++this._zIndex;
    }

    getHighestZIndex() {
        return this._zIndex;
    }

    minimizeWindow(win, skipTaskbarUpdate = false) {
        if (!win?.id) return;

        // Access the $window jQuery object from the DOM element
        const $window = win.$window || $(win).closest('.window').data('$window');
        console.log('Minimizing window:', win, $window);
        if ($window && typeof $window.minimize === 'function') {
            console.log('Minimizing window via minimize method:', win);
            $window.minimize();
        } else {
            console.warn('Window element does not have minimize method:', win);
            win.style.display = 'none';
            win.isMinimized = true;
        }

        // Update taskbar button if needed
        if (!skipTaskbarUpdate) {
            taskbar.updateTaskbarButton(win.id, false, true);
        }
    }

    restoreWindow(win) {
        if (!win?.id) return;

        // Access the $window jQuery object from the DOM element
        const $window = win.$window || $(win).closest('.window').data('$window');

        if ($window && typeof $window.unminimize === 'function') {
            console.log('Restoring window via unminimize method:', win);
            $window.unminimize();
            $window.bringToFront();
        } else {
            console.warn('Window element does not have unminimize method:', win);
            win.style.display = '';
            win.isMinimized = false;
        }

        // Update taskbar button
        taskbar.updateTaskbarButton(win.id, true, false);
    }

    updateTitleBarClasses(win) {
        if (!win) return;

        // Remove active class from all windows
        document.querySelectorAll('.app-window').forEach(w => {
            w.querySelector('.title-bar')?.classList.remove('active');
        });

        // Add active class to current window
        win.querySelector('.title-bar')?.classList.add('active');
    }
}

// Initialize the systems
const system = new WindowManagerSystem();
window.Win98System = system;
window.Win98WindowManager = system; // Using same instance for both since they're closely related

function loadCustomApps() {
    const savedApps = JSON.parse(localStorage.getItem('customApps')) || [];

    savedApps.forEach(appInfo => {
        registerCustomApp(appInfo);
    });
}

// Initialize the OS
console.log('azOS initialized');

playSound('WindowsLogon');
loadCustomApps();
taskbar.init();
initDesktop();

window.ShowDialogWindow = ShowDialogWindow;
