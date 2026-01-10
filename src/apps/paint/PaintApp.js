import { Application } from '../Application.js';
import { ICONS } from '../../config/icons.js';

export class PaintApp extends Application {
    static config = {
        id: "paint",
        title: "Paint",
        description: "Create and edit images.",
        icon: ICONS.paint,
        width: 800,
        height: 600,
        resizable: true,
        isSingleton: false,
    };

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
        this.iframe = iframe; // Store a reference to the iframe

        return win;
    }

    _onLaunch(data) {
        let imageUrl = 'https://jspaint.app'; // Default URL

        if (typeof data === 'string') {
            // It's a file path
            const absoluteUrl = new URL(data, window.location.href).href;
            imageUrl = `https://jspaint.app#load:${absoluteUrl}`;
        } else if (data && typeof data === 'object') {
            // It's a file-like object
            let fileUrl = data.contentUrl || (data.path ? new URL(data.path, window.location.href).href : null);

            if (fileUrl) {
                 // Ensure the URL is absolute
                if (!fileUrl.startsWith('http')) {
                    fileUrl = new URL(fileUrl, window.location.href).href;
                }
                imageUrl = `https://jspaint.app#load:${fileUrl}`;
            }
        }

        this.iframe.src = imageUrl;
        this.win.focus();
    }
}
