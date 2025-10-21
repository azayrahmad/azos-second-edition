import { Application } from '../apps/Application.js';
import { apps, appClasses } from '../config/apps.js';
import { ICONS } from '../config/icons.js';
import desktopConfig from '../config/desktop.json';

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
            win.$content.html(appInfo.html);
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
    };

    apps.push(newApp);
    appClasses[appInfo.id] = newApp.appClass;
    desktopConfig.apps.push(appInfo.id);
}
