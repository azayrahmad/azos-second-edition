import { apps } from '../config/apps.js';

export async function launchApp(appId, filePath = null) {
    document.body.classList.add('cursor-busy');
    document.body.style.cursor = 'var(--cursor-wait, wait)';

    try {
        const appConfig = apps.find(a => a.id === appId);
        if (!appConfig) {
            console.error(`No application config found for ID: ${appId}`);
            return;
        }

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
        setTimeout(() => {
            document.body.style.cursor = 'var(--cursor-default, default)';
            document.body.classList.remove('cursor-busy');
        }, 50);
    }
}

export function handleAppAction(app) {
    launchApp(app.id, app.filePath);
}