import { Application } from '../Application.js';
import { ICONS } from '../../config/icons.js';
import { ShowDialogWindow } from '../../components/DialogWindow.js';
import './flashplayer.css';

export class FlashPlayerApp extends Application {
    static config = {
        id: 'flashplayer',
        title: 'Flash Player',
        icon: ICONS.mediaPlayer, // Placeholder icon
        width: 550,
        height: 400,
        resizable: true,
    };

    constructor(config) {
        super(config);
        this.player = null;
    }

    _createWindow() {
        this.win = new $Window({
            title: this.title,
            outerWidth: this.width,
            outerHeight: this.height,
            resizable: this.resizable,
            icons: this.icon,
        });

        const menuBar = this._createMenuBar();
        this.win.setMenuBar(menuBar);

        const container = document.createElement('div');
        container.className = 'flashplayer-container';
        this.win.$content.append(container);

        return this.win;
    }

    _createMenuBar() {
        return new MenuBar({
            '&File': [
                {
                    label: '&Open...',
                    action: () => this.openFile(),
                },
                'MENU_DIVIDER',
                {
                    label: 'E&xit',
                    action: () => this.win.close(),
                },
            ],
        });
    }

    async _onLaunch(data) {
        await this.waitForRuffle();
        if (data) {
            this.loadSwf(data);
        }
    }

    openFile() {
        const input = document.createElement('input');
        input.type = 'file';
        input.accept = '.swf';
        input.onchange = (e) => {
            const file = e.target.files[0];
            if (file) {
                this.loadSwf(file);
            }
        };
        input.click();
    }

    loadSwf(fileOrUrl) {
        if (!window.RufflePlayer) {
            ShowDialogWindow({
                title: 'Error',
                text: 'Ruffle Player is not available.',
                buttons: [{ label: 'OK', isDefault: true }],
            });
            return;
        }

        const container = this.win.element.querySelector('.flashplayer-container');
        container.innerHTML = ''; // Clear previous player

        const ruffle = window.RufflePlayer.newest();
        this.player = ruffle.createPlayer();
        container.appendChild(this.player);

        this.player.load(fileOrUrl).catch((e) => {
            console.error(`Ruffle failed to load the file: ${e}`);
            ShowDialogWindow({
                title: 'Error',
                text: 'Could not load the specified SWF file.',
                buttons: [{ label: 'OK', isDefault: true }],
            });
        });
    }

    waitForRuffle() {
        return new Promise((resolve) => {
            if (window.RufflePlayer) {
                return resolve();
            }
            const interval = setInterval(() => {
                if (window.RufflePlayer) {
                    clearInterval(interval);
                    resolve();
                }
            }, 100);
        });
    }
}
