import { Application } from '../Application.js';
import { ShowDialogWindow } from '../../components/DialogWindow.js';

export class PinballApp extends Application {
    constructor(config) {
        super(config);
        this.gameLoaded = false;
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

        const content = `
            <div class="pinball-container" style="height: 100%; display: flex; flex-direction: column; justify-content: center; align-items: center;">
                <div class="emscripten" id="status" style="margin: 40px 32px;">Downloading...</div>
                <div class="emscripten">
                    <progress hidden id="progress" max="100" value="0"></progress>
                </div>
                <canvas class="emscripten" id="canvas" oncontextmenu="event.preventDefault()" style="display:none;" tabindex="-1"></canvas>
            </div>
        `;
        win.$content.html(content);

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
        const statusElement = this.win.element.querySelector('#status');
        const progressElement = this.win.element.querySelector('#progress');
        const canvas = this.win.element.querySelector('#canvas');

        window.Module = {
            preRun: [],
            postRun: [],
            print: (text) => console.log(text),
            printErr: (text) => console.error(text),
            canvas: canvas,
            setStatus: (text) => {
                if (!window.Module.setStatus.last) {
                    window.Module.setStatus.last = { time: Date.now(), text: '' };
                }
                if (text === window.Module.setStatus.last.text) {
                    return;
                }
                const m = text.match(/([^(]+)\((\d+(\.\d+)?)\/(\d+)\)/);
                const now = Date.now();
                if (m && now - window.Module.setStatus.last.time < 30) {
                    return; // if this is a progress update, throttle it to 30ms
                }
                window.Module.setStatus.last.time = now;
                window.Module.setStatus.last.text = text;
                if (m) {
                    text = m[1];
                    progressElement.value = parseInt(m[2]) * 100;
                    progressElement.max = parseInt(m[4]) * 100;
                    progressElement.hidden = false;
                } else {
                    progressElement.value = null;
                    progressElement.max = null;
                    progressElement.hidden = true;

                    if (text === '') {
                        canvas.style.display = 'block';
                        this.gameLoaded = true;
                    }
                }
                statusElement.innerHTML = text;
            },
            totalDependencies: 0,
            monitorRunDependencies: (left) => {
                this.totalDependencies = Math.max(this.totalDependencies, left);
                window.Module.setStatus(left ? 'Preparing... (' + (this.totalDependencies - left) + '/' + this.totalDependencies + ')' : 'All downloads complete.');
            }
        };

        window.Module.setStatus('Downloading...');

        const script = document.createElement('script');
        script.src = '/games/pinball/SpaceCadetPinball.js';
        script.async = true;
        document.body.appendChild(script);

        script.onload = () => {
            console.log('Pinball script loaded.');
        };
    }

    sendKey(key) {
        if (!this.gameLoaded) return;
        const canvas = this.win.element.querySelector('#canvas');
        canvas.focus();
        // Emscripten forwards keyboard events from the canvas.
        // A full keydown/keyup cycle is most reliable.
        canvas.dispatchEvent(new KeyboardEvent('keydown', { 'key': key, 'code': key }));
        setTimeout(() => {
            canvas.dispatchEvent(new KeyboardEvent('keyup', { 'key': key, 'code': key }));
        }, 100);
    }

    toggleFullScreen() {
        const canvas = this.win.element.querySelector('#canvas');
        if (document.fullscreenElement) {
            document.exitFullscreen();
        } else {
            canvas.requestFullscreen();
        }
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
