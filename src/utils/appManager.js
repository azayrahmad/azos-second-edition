import { apps } from '../config/apps.js';
import { applyBusyCursor, clearBusyCursor } from './aniCursor.js';

export async function launchApp(appId, filePath = null) {
    applyBusyCursor();

    const appConfig = apps.find(a => a.id === appId);
    if (!appConfig) {
        console.error(`No application config found for ID: ${appId}`);
        clearBusyCursor();
        return;
    }
    try {
        if (appConfig.appClass) {
            const appInstance = new appConfig.appClass(appConfig);
            await appInstance.launch(filePath);
        } else if (appConfig.action?.type === 'function') {
            appConfig.action.handler();
        } else {
            console.error(`No application class or legacy action found for ID: ${appId}`);
        }
    } catch (error) {
        console.error(`Failed to launch app: ${appId}`, error);
        alert(`Could not launch ${appId}. See console for details.`);
    } finally {
        clearBusyCursor();
    }

}

export function handleAppAction(app) {
    launchApp(app.id, app.filePath);
}