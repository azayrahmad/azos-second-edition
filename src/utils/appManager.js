import { apps } from "../config/apps.js";
import { applyWaitCursor, clearWaitCursor } from "./cursorManager.js";

const appManager = {
    runningApps: {},

    getRunningApps() {
        return this.runningApps;
    },

    getAppConfig(appId) {
        return apps.find((a) => a.id === appId);
    },

    closeApp(appId) {
        const appInstance = this.runningApps[appId];
        if (appInstance) {
            // Remove the app from the registry immediately to prevent recursion
            delete this.runningApps[appId];
            document.dispatchEvent(new CustomEvent('app-closed', { detail: { appId } }));

            // Now, perform the actual closing/cleanup logic
            if (appInstance.win) {
                appInstance.win.close(true); // Force close the window
            } else if (appInstance.close) {
                appInstance.close(); // For non-windowed apps
            }
        }
    }
};

export async function launchApp(appId, filePath = null) {
    applyWaitCursor();

    const appConfig = appManager.getAppConfig(appId);
    if (!appConfig) {
        console.error(`No application config found for ID: ${appId}`);
        clearWaitCursor();
        return;
    }

    // Prevent duplicate launches of non-windowed apps that are already running
    if (appManager.runningApps[appId] && !appManager.getAppConfig(appId).width) {
        return;
    }

    try {
        if (appConfig.appClass) {
            const appInstance = new appConfig.appClass(appConfig);
            appManager.runningApps[appId] = appInstance;
            await appInstance.launch(filePath);
            document.dispatchEvent(new CustomEvent('app-launched', { detail: { appId } }));
        } else if (appConfig.action?.type === "function") {
            appConfig.action.handler();
        } else {
            console.error(`No application class or legacy action found for ID: ${appId}`);
        }
    } catch (error) {
        console.error(`Failed to launch app: ${appId}`, error);
        alert(`Could not launch ${appId}. See console for details.`);
    } finally {
        clearWaitCursor();
    }
}

export function handleAppAction(app) {
    launchApp(app.id, app.filePath);
}

// Export the manager for use in other modules
export { appManager };
