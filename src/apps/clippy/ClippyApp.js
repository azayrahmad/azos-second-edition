import { Application, openApps } from '../Application.js';
import { launchClippyApp } from './clippy.js';
import { appManager } from '../../utils/appManager.js';

export class ClippyApp extends Application {
    constructor(config) {
        super(config);
    }

    _createWindow() {
        // This app doesn't create a window.
        return null;
    }

    async _onLaunch(data) {
        // Get the agent name from the config, fallback to data, then default to 'Clippy'
        const agentName = this.config?.agent || data?.agent || "Clippy";

        // Pass this app instance and any provided data to the launcher
        await launchClippyApp(this, agentName, data);
    }

    _cleanup() {
        const agent = window.clippyAgent;
        if (agent) {
            agent.hide();
            $(".clippy, .clippy-balloon").remove();
            $(".os-menu").remove();
            const trayIcon = document.querySelector("#tray-icon-clippy");
            if (trayIcon) {
                trayIcon.remove();
            }
            window.clippyAgent = null;
        }
    }
}
