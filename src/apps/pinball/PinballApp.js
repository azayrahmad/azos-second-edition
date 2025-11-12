import { Application } from '../Application.js';
import { ShowDialogWindow } from '../../components/DialogWindow.js';

export class PinballApp extends Application {
    constructor(config) {
        super(config);
    }

    _createWindow() {
        const win = new $Window({
            title: this.title,
            outerWidth: 620,
            outerHeight: 480,
            resizable: false,
            maximizable: false,
            icons: this.icon,
        });

        const menuBar = this._createMenuBar();
        win.setMenuBar(menuBar);

        const iframe = document.createElement('iframe');
        iframe.src = 'games/pinball/index.html';
        iframe.style.width = '100%';
        iframe.style.height = '100%';
        iframe.style.border = 'none';

        win.$content.append(iframe);

        this.iframe = iframe;

        return win;
    }

    _createMenuBar() {
        return new MenuBar({
            "&Game": [
                {
                    label: "&New Game",
                    shortcutLabel: "F2",
                    action: () => this.sendKey('F2'),
                },
                "MENU_DIVIDER",
                {
                    label: "&Launch Ball",
                    shortcutLabel: "Space",
                    action: () => this.sendKey(' '),
                },
                {
                    label: "&Pause/Resume",
                    shortcutLabel: "F3",
                    action: () => this.sendKey('F3'),
                },
                "MENU_DIVIDER",
                {
                    label: "E&xit",
                    action: () => this.win.close(),
                },
            ],
            "&Options": [
                {
                    label: "Full Screen",
                    action: () => this.toggleFullScreen(),
                },
                {
                    label: "Player &Keys...",
                    action: () => this.showPlayerKeysDialog(),
                },
            ],
            "&Help": [
                {
                    label: "&About Pinball",
                    action: () => {
                        ShowDialogWindow({
                            title: 'About Pinball',
                            text: '3D Pinball for Windows - Space Cadet<br>Emscripten port by alula<br><br>Integrated into azOS by Jules.',
                            buttons: [{ label: 'OK', isDefault: true }],
                        });
                    },
                },
            ],
        });
    }

    _onLaunch() {
        // Most of the logic is now handled by the iframe
    }

    sendKey(key) {
        // To send a key to the iframe, we need to dispatch the event on its contentWindow
        const event = new KeyboardEvent('keydown', { key: key, code: key, bubbles: true, cancelable: true });
        this.iframe.contentWindow.dispatchEvent(event);
        setTimeout(() => {
            const eventUp = new KeyboardEvent('keyup', { key: key, code: key, bubbles: true, cancelable: true });
            this.iframe.contentWindow.dispatchEvent(eventUp);
        }, 100);
    }

    toggleFullScreen() {
        this.iframe.requestFullscreen();
    }

    showPlayerKeysDialog() {
        const dialogText = `
            <div style="text-align: left; padding: 0 20px;">
                <p><b>Left Flipper:</b> Z</p>
                <p><b>Right Flipper:</b> / (Slash)</p>
                <p><b>Left Table Bump:</b> X</p>
                <p><b>Right Table Bump:</b> . (Period)</p>
                <p><b>Plunger:</b> Spacebar</p>
            </div>
        `;
        ShowDialogWindow({
            title: 'Player Keys',
            text: dialogText,
            buttons: [{ label: 'OK', isDefault: true }],
        });
    }
}
