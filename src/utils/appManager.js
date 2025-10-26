import { apps } from '../config/apps.js';

export function launchApp(appId, filePath = null) {
    document.body.classList.add('cursor-busy');
    document.body.style.cursor = 'var(--cursor-wait, wait)';


    const appConfig = apps.find(a => a.id === appId);
    if (!appConfig) {
        console.error(`No application config found for ID: ${appId}`);
        setTimeout(() => {
            document.body.style.cursor = 'var(--cursor-default, default)';
            document.body.classList.remove('cursor-busy');
        }, 50);
        return;
    }

    if (appConfig.appClass) {
        try {
            const appInstance = new appConfig.appClass(filePath || appConfig);
            appInstance.launch(filePath);
        } catch (error) {
            console.error(`Failed to launch app: ${appId}`, error);
            alert(`Could not launch ${appId}. See console for details.`);
        } finally {
            setTimeout(() => {
            document.body.style.cursor = 'var(--cursor-default, default)';
            document.body.classList.remove('cursor-busy');
        }, 50);
        }
    } else if (appConfig.action?.type === 'function') {
        try {
            appConfig.action.handler();
        } catch (error) {
            console.error(`Failed to launch legacy app: ${appId}`, error);
        } finally {
            setTimeout(() => {
            document.body.style.cursor = 'var(--cursor-default, default)';
            document.body.classList.remove('cursor-busy');
        }, 50);
        }
    } else {
        console.error(`No application class or legacy action found for ID: ${appId}`);
        setTimeout(() => {
            document.body.style.cursor = 'var(--cursor-default, default)';
            document.body.classList.remove('cursor-busy');
        }, 50);
    }
}

export function handleAppAction(app) {
    launchApp(app.id, app.filePath);
}