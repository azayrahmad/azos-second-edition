import { getItem, setItem, LOCAL_STORAGE_KEYS } from './localStorage.js';
import { renderHTML } from './domUtils.js';
import { Application } from '../apps/Application.js';
import { apps, appClasses } from '../config/apps.js';
import { ICONS } from '../config/icons.js';
import desktopConfig from '../config/desktop.json';
import { launchApp } from './appManager.js';
import { setupIcons } from '../components/desktop.js';

export function registerCustomApp(appInfo) {
    class CustomApp extends Application {
        constructor(config) {
            super(config);
        }

        _createWindow() {
            const win = new $Window({
                title: this.title,
                width: 400,
                height: 300,
                resizable: true,
                icons: this.icon,
            });
            renderHTML(win.$content[0], appInfo.html);
            return win;
        }
    }

    const newApp = {
        id: appInfo.id,
        title: appInfo.title,
        icon: ICONS.appmaker,
        appClass: CustomApp,
        width: 400,
        height: 300,
        resizable: true,
        contextMenu: [
            {
                label: 'Open',
                action: () => launchApp(appInfo.id),
            },
            'MENU_DIVIDER',
            {
                label: 'Delete',
                action: () => {
                    deleteCustomApp(appInfo.id);
                    setupIcons();
                },
            },
        ],
    };

    apps.push(newApp);
    appClasses[appInfo.id] = newApp.appClass;
    desktopConfig.apps.push(appInfo.id);
}

export function deleteCustomApp(appId) {
    const appIndex = apps.findIndex(app => app.id === appId);
    if (appIndex > -1) {
        apps.splice(appIndex, 1);
    }

    delete appClasses[appId];

    const desktopIndex = desktopConfig.apps.indexOf(appId);
    if (desktopIndex > -1) {
        desktopConfig.apps.splice(desktopIndex, 1);
    }

    const savedApps = getItem(LOCAL_STORAGE_KEYS.CUSTOM_APPS) || [];
    const newSavedApps = savedApps.filter(app => app.id !== appId);
    setItem(LOCAL_STORAGE_KEYS.CUSTOM_APPS, newSavedApps);
}
