import { apps } from '../config/apps.js';
import { applyBusyCursor, clearBusyCursor } from './aniCursor.js';

export function launchApp(appId, filePath = null) {
    applyBusyCursor();

    const appConfig = apps.find(a => a.id === appId);
    if (!appConfig) {
        console.error(`No application config found for ID: ${appId}`);
        clearBusyCursor();
        return;
    }

    if (appConfig.appClass) {
        try {
            const appInstance = new appConfig.appClass(appConfig);
            appInstance.launch(filePath);
        } catch (error) {
            console.error(`Failed to launch app: ${appId}`, error);
            alert(`Could not launch ${appId}. See console for details.`);
        } finally {
            clearBusyCursor();
        }
    } else if (appConfig.action?.type === 'function') {
        try {
            appConfig.action.handler();
        } catch (error) {
            console.error(`Failed to launch legacy app: ${appId}`, error);
        } finally {
            clearBusyCursor();
        }
    } else {
        console.error(`No application class or legacy action found for ID: ${appId}`);
        clearBusyCursor();
    }
}

export function handleAppAction(app) {
    launchApp(app.id, app.filePath);
}