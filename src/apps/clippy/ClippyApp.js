import { Application } from '../Application.js';
import { launchClippyApp } from './clippy.js';

export class ClippyApp extends Application {
    constructor() {
        super({
            id: 'clippy',
            title: 'Assistant',
            icon: new URL('../../assets/icons/msagent_file-1.png', import.meta.url).href,
            hasTaskbarButton: false, // Clippy doesn't have a taskbar button
        });
    }

    // This overrides the default launch behavior
    launch() {
        // Since Clippy manages its own presence and doesn't create a standard window,
        // we just call its legacy launch function.
        // The base class's window management is skipped entirely.
        launchClippyApp();
    }

    // We don't create a window, so this is not needed.
    _createWindow() {
        return null;
    }
}