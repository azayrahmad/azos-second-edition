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

        // Load the game's HTML content from the public directory
        try {
            const response = await fetch('apps/solitaire/index.html');
            if (!response.ok) {
                throw new Error(`Failed to fetch content: ${response.statusText}`);
            }
            const html = await response.text();

            // Inject the HTML and then load the script
            win.$content.html(html);

            const script = document.createElement('script');
            script.src = 'apps/solitaire/main.js';
            script.type = 'text/javascript';
            script.onload = () => {
                console.log('Solitaire script loaded successfully.');
            };
            script.onerror = () => {
                console.error('Failed to load Solitaire script.');
                win.$content.html('<p>Error: Could not load game files.</p>');
            };
            win.$content[0].appendChild(script);

        } catch (error) {
            console.error('Error loading Solitaire app content:', error);
            win.$content.html(`<p>Error loading application: ${error.message}</p>`);
        }
    }
}
