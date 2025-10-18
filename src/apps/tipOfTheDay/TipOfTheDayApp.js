import { Application } from '../Application.js';
import { tipOfTheDayContent, setup as tipOfTheDaySetup } from './tipOfTheDay.js';

export class TipOfTheDayApp extends Application {
    constructor() {
        super({
            id: 'tipOfTheDay',
            title: 'Tip of the Day',
            icon: new URL('../../assets/icons/help_book_cool-0.png', import.meta.url).href,
        });
    }

    _createWindow() {
        const win = new $Window({
            title: this.title,
            width: 400,
            height: 300,
            resizable: false,
            minimizeButton: false,
            maximizeButton: false,
        });

        win.$content.html(tipOfTheDayContent);
        return win;
    }

    _onLaunch() {
        if (tipOfTheDaySetup) {
            tipOfTheDaySetup(this.win.$content[0]);
        }
    }
}