import { Application } from '../Application.js';
import './dos-emulator.css';

export class DosEmulatorApp extends Application {
    constructor(config) {
        super(config);
        this.bundleUrl = null;
    }

    _createWindow() {
        const win = new $Window({
            title: this.title,
            outerWidth: this.width,
            outerHeight: this.height,
            resizable: this.resizable,
            icons: this.icon,
        });

        const menuBar = this._createMenuBar();
        win.setMenuBar(menuBar);

        win.$content.append('<div class="dos-emulator-container" style="width: 100%; height: 100%;"></div>');
        return win;
    }

    _createMenuBar() {
        return new MenuBar({
            "&File": [
                {
                    label: "&Open",
                    action: () => this.openFile(),
                },
                "MENU_DIVIDER",
                {
                    label: "E&xit",
                    action: () => this.win.close(),
                },
            ],
            "&Help": [
                {
                    label: "&About DOS Emulator",
                    action: () => alert("A DOS emulator powered by js-dos."),
                },
            ],
        });
    }

    _onLaunch() {
        const container = this.win.$content.find('.dos-emulator-container')[0];

        if (this.bundleUrl) {
            Dos(container, {
                url: this.bundleUrl,
            });
        }
    }

    openFile() {
        const input = document.createElement('input');
        input.type = 'file';
        input.accept = '.zip,.jsdos';
        input.onchange = e => {
            const file = e.target.files[0];
            if (!file) return;

            const url = URL.createObjectURL(file);
            this.bundleUrl = url;

            // Re-launch the emulator with the new bundle
            const container = this.win.$content.find('.dos-emulator-container')[0];
            container.innerHTML = ''; // Clear previous instance
            Dos(container, {
                url: this.bundleUrl,
            });
        };
        input.click();
    }
}
