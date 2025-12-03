import { apps } from "../config/apps.js";
import { applyWaitCursor, clearWaitCursor } from "./cursorManager.js";
import { openApps } from '../apps/Application.js';
import { playSound } from "./soundManager.js";

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
            playSound("Close");
            // Remove the app from the registries first to prevent re-entry.
            delete this.runningApps[appId];
            openApps.delete(appId);
            document.dispatchEvent(new CustomEvent('app-closed', { detail: { appId } }));

            // Now, perform the app-specific cleanup.
            if (appInstance.win) {
                appInstance.win.close(true); // Force close without firing onClosed.
            } else if (typeof appInstance._cleanup === 'function') {
                appInstance._cleanup(); // For non-windowed apps.
            }
        }
    }
};

export async function launchApp(appId, data = null) {
    applyWaitCursor();

    const appConfig = appManager.getAppConfig(appId);
    playSound("Open");
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
            const appInstance = new appConfig.appClass({ ...appConfig, id: appId });
            appManager.runningApps[appId] = appInstance;
            await appInstance.launch(data);
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
