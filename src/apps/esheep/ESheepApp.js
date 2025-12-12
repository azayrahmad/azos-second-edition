import { Application } from '../Application.js';
import { launchESheepApp, closeAllESheep } from './esheep.js';

export class ESheepApp extends Application {
    constructor(config) {
        super(config);
    }

    _createWindow() {
        // This app doesn't create a window.
        return null;
    }

    _onLaunch() {
        launchESheepApp(this);
    }

    _cleanup() {
        closeAllESheep();
    }
}
