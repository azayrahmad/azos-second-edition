import { Application } from '../Application.js';
import { aboutContent } from './about.js';

export class AboutApp extends Application {
    constructor(config) {
        super(config);
    }

    _createWindow() {
        const win = new $Window({
            title: this.title,
            width: 500,
            height: 300,
            resizable: false,
            minimizeButton: false,
            maximizeButton: false,
        });

        win.$content.html(aboutContent);
        return win;
    }
}