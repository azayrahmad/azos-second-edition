import { Application, openApps } from '../Application.js';
import { launchClippyApp, getClippyMenuItems } from './clippy.js';
import { appManager } from '../../utils/appManager.js';
import { ICONS } from '../../config/icons.js';

export class ClippyApp extends Application {
    static config = {
        id: "clippy",
        title: "Assistant",
        description: "Your friendly assistant.",
        icon: ICONS.clippy,
        hasTray: true,
        isSingleton: true,
        tray: {
          contextMenu: getClippyMenuItems,
        },
        tips: [
          "Need help? Try the <a href='#' class='tip-link' data-app='clippy'>Assistant</a> for assistance with azOS features.",
          "You can ask Clippy about Aziz's resume by clicking on it.",
          "Right-click on Clippy to see more options, like changing the agent or making it animate.",
        ],
    };

    constructor(config) {
        super(config);
    }

    _createWindow() {
        // This app doesn't create a window.
        return null;
    }

    async _onLaunch(data) {
        const { getItem, setItem, LOCAL_STORAGE_KEYS } = await import(
            "../../utils/localStorage.js"
        );
        const { removeStartupApp } = await import(
            "../../utils/startupManager.js"
        );

        const agentName = this.config?.agent || data?.agent || "Clippy";

        // Check if the tutorial should run on startup
        const runTutorialAtStartup = getItem(
            LOCAL_STORAGE_KEYS.CLIPPY_TUTORIAL_STARTUP,
        );

        let launchData = data;
        if (runTutorialAtStartup) {
            launchData = { ...data, actionSet: "tutorial" };
            // Reset the flag so it doesn't run again next time
            setItem(LOCAL_STORAGE_KEYS.CLIPPY_TUTORIAL_STARTUP, false);
            removeStartupApp("clippy");
        }

        // Pass this app instance and any provided data to the launcher
        await launchClippyApp(this, agentName, launchData);
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
