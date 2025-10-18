import { appClasses, apps } from '../config/apps.js';
import { createTrayIcon } from '../components/taskbar.js';

export function launchApp(appId, filePath = null) {
    document.body.style.cursor = 'wait';

    const AppClass = appClasses[appId];
    if (AppClass) {
        try {
            const appInstance = new AppClass();
            appInstance.launch(filePath);

            // Special handling for apps that have a tray icon
            const appConfig = apps.find(a => a.id === appId);
            if (appConfig?.hasTray) {
                createTrayIcon(appConfig);
            }

        } catch (error) {
            console.error(`Failed to launch app: ${appId}`, error);
            alert(`Could not launch ${appId}. See console for details.`);
        } finally {
            setTimeout(() => {
                document.body.style.cursor = 'default';
            }, 50);
        }
    } else {
        // This can be kept for simple, one-off function actions like the alertTest
        const legacyApp = apps.find(a => a.id === appId);
        if (legacyApp && legacyApp.action?.type === 'function') {
             try {
                legacyApp.action.handler();
            } catch (error) {
                console.error(`Failed to launch legacy app: ${appId}`, error);
            }
        } else {
            console.error(`No application class or legacy action found for ID: ${appId}`);
        }

        setTimeout(() => {
            document.body.style.cursor = 'default';
        }, 50);
    }
}

// This function is no longer the primary entry point but can be kept for compatibility
// if anything still calls it. It should delegate to launchApp.
export function handleAppAction(app) {
    launchApp(app.id, app.filePath);
}