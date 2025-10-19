import { Application, openApps } from '../Application.js';
import { closeWebamp, launchWebampApp } from './webamp.js';

export class WebampApp extends Application {
    constructor(config) {
        super(config);
        this.isClosing = false;
    }

    _createWindow() {
        // This app doesn't create a window.
        return null;
    }

    _onLaunch() {
        // Call the legacy launch function.
        launchWebampApp(this);
    }

    close() {
        if (this.isClosing) return;
        this.isClosing = true;

        closeWebamp();
        openApps.delete(this.id);
    }
}