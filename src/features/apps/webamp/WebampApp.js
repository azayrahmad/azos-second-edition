import { Application } from '../../core/Application.js';
import { launchWebampApp } from './webamp.js';

export class WebampApp extends Application {
    constructor(config) {
        super(config);
    }

    _createWindow() {
        // This app doesn't create a window.
        return null;
    }

    _onLaunch() {
        // Call the legacy launch function.
        launchWebampApp();
    }
}