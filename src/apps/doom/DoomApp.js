import { Application } from '../Application.js';
import '../dos-emulator/dos-emulator.css';

export class DoomApp extends Application {
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

        const menuBar = this._createMenuBar();
        win.setMenuBar(menuBar);

        win.$content.append('<div class="dos-emulator-container" style="width: 100%; height: 100%;"></div>');
        return win;
    }

    _createMenuBar() {
        return new MenuBar({
            "&File": [
                {
                    label: "E&xit",
                    action: () => this.win.close(),
                },
            ],
            "&Help": [
                {
                    label: "&About Doom",
                    action: () => alert("Doom, running on js-dos."),
                },
            ],
        });
    }

    _onLaunch() {
        const container = this.win.$content.find('.dos-emulator-container')[0];
        const doomZipUrl = "https://js-dos.com/cdn/upload/DOOM-@evilution.zip";

        Dos(container, {
            dosboxConf: `
                [autoexec]
                mount c ${doomZipUrl}
                c:
                doom
            `,
        });
    }
}
