import './style.css'
import { setupCounter } from './counter.js'
import { initDesktop } from './components/desktop.js'
import { taskbar } from './components/taskbar.js'

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

// Initialize the OS
console.log('azOS initialized');
taskbar.init();
initDesktop();
setupCounter(document.querySelector('#counter'));

// ...existing code...

// Add context menu for desktop
const desktopArea = document.querySelector('.desktop');  // Changed from getElementById to querySelector
if (desktopArea) {
    desktopArea.addEventListener('contextmenu', (e) => {
        e.preventDefault();
        e.stopPropagation();  // Add this to prevent event bubbling

        const contextMenuItems = [
            {
                label: '&View',
                submenu: [
                    { label: 'Large &Icons' },
                    { label: 'Small &Icons' },
                    { label: '&List' },
                    { label: '&Details' }
                ]
            },
            "MENU_DIVIDER",
            {
                label: '&New',
                submenu: [
                    { label: '&Folder' },
                    { label: '&Text Document' },
                    { label: '&Shortcut' }
                ]
            },
            "MENU_DIVIDER",
            { label: '&Paste', enabled: false },
            { label: 'Paste &Shortcut', enabled: false },
            "MENU_DIVIDER",
            { label: 'Properties', click: () => alert('Properties clicked') }
        ];

        // Remove any existing menus
        const existingMenus = document.querySelectorAll('.menu-popup');
        existingMenus.forEach(menu => menu.remove());

        const contextMenu = new OS.MenuList(contextMenuItems);
        document.body.appendChild(contextMenu.element);

        // Position and show the menu
        contextMenu.show(e.clientX, e.clientY);


        // Hide menu when clicking outside
        const hideMenu = (event) => {
            if (!contextMenu.element.contains(event.target)) {
                contextMenu.hide();
                document.removeEventListener('click', hideMenu);
                if (contextMenu.element.parentNode) {
                    document.body.removeChild(contextMenu.element);
                }
            }
        };

        // Add slight delay to prevent immediate hiding
        setTimeout(() => {
            document.addEventListener('click', hideMenu);
        }, 0);
    });
} else {
    console.warn('Desktop element not found');
}
