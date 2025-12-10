import { Application } from '../Application.js';
import './diablo.css';

export class DiabloApp extends Application {
    constructor(config) {
        super(config);
        this.win = null;
    }

    _createWindow() {
        this.win = new $Window({
            title: this.title,
            outerWidth: this.width,
            outerHeight: this.height,
            resizable: this.resizable,
            icons: this.icon,
            id: this.id,
        });

        const iframe = document.createElement('iframe');
        iframe.className = 'diablo-iframe';
        iframe.src = 'https://d07riv.github.io/diabloweb/';

        this.win.$content.append(iframe);

        return this.win;
    }
}
