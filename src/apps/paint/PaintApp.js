import { Application } from '../Application.js';

export class PaintApp extends Application {
    constructor(config) {
        super(config);
    }

    _createWindow() {
        const win = new $Window({
            title: this.title,
            outerWidth: this.width,
            outerHeight: this.height,
            resizable: this.resizable,
            icons: this.icon,
        });

        const iframe = document.createElement('iframe');
        iframe.src = 'https://jspaint.app';
        iframe.style.width = '100%';
        iframe.style.height = '100%';
        iframe.style.border = 'none';

        win.$content.append(iframe);

        return win;
    }

    _onLaunch() {
        this.win.focus();
    }
}
