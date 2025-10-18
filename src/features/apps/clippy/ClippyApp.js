import { Application } from '../../core/Application.js';
import { launchClippyApp } from './clippy.js';

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
        launchClippyApp();
    }
}