import { Application } from '../Application.js';
import { ICONS } from '../../config/icons.js';

export class SolitaireApp extends Application {
    static config = {
        id: 'solitaire',
        title: 'Solitaire',
        icon: ICONS.solitaire,
        width: 670,
        height: 520,
        resizable: false,
    };

    _createWindow() {
        // Create a new window using the $Window component
        const win = new $Window({
            title: this.constructor.config.title,
            width: this.constructor.config.width,
            height: this.constructor.config.height,
            resizable: this.constructor.config.resizable,
            icons: this.constructor.config.icon,
        });

        return win;
    }

    async _onLaunch() {
        const win = this._createWindow();

        // Create an iframe to sandbox the game
        const iframe = document.createElement('iframe');
        iframe.src = 'apps/solitaire/index.html';

        // Style the iframe to fill the window's content area
        iframe.style.width = '100%';
        iframe.style.height = '100%';
        iframe.style.border = 'none';

        // Append the iframe to the window's content
        win.$content.append(iframe);

        return win;
    }
}
