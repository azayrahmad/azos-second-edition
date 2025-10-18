import { Application } from '../Application.js';
import { aboutContent } from './about.js';

export class AboutApp extends Application {
    constructor(config) {
        super(config);
    }

    _createWindow() {
        const win = new $Window({
            title: this.title,
            outerWidth: this.width,
            outerHeight: this.height,
            resizable: this.resizable,
            minimizeButton: this.minimizeButton,
            maximizeButton: this.maximizeButton,
        });

        win.$content.html(aboutContent);
        return win;
    }
}