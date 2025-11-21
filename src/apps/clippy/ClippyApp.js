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

    _onLaunch() {
        // Call the legacy launch function.
        launchClippyApp(this);
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
