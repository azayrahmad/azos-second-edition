import { Application } from '../Application.js';
import { launchWebampApp } from './webamp.js';

export class WebampApp extends Application {
    constructor() {
        super({
            id: 'webamp',
            title: 'Winamp',
            icon: new URL('../../assets/icons/winamp.png', import.meta.url).href,
            hasTaskbarButton: true, // Webamp can have a taskbar button
        });
    }

    launch() {
        // Webamp is a complex, self-contained app. We just need to trigger its launch.
        launchWebampApp();
    }

    _createWindow() {
        // Webamp creates its own window, so we don't return one from here.
        return null;
    }
}