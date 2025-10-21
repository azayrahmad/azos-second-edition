import { Application } from '../Application.js';
import './explorer.css';
import { ICONS } from '../../config/icons.js';

export class ExplorerApp extends Application {
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
        win.element.classList.add('explorer-app');

        const headerContainer = document.createElement('div');
        headerContainer.className = 'header-container';

        const menuBar = this._createMenuBar();
        headerContainer.appendChild(menuBar.element);

        const toolbar = this._createToolbar();
        headerContainer.appendChild(toolbar.element);

        const addressBar = this._createAddressBar();
        headerContainer.appendChild(addressBar.element);

        const contentArea = document.createElement('div');
        contentArea.className = 'explorer-content';

        win.$content.append(headerContainer);
        win.$content.append(contentArea);

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
            "&Edit": [
                {
                    label: "Cu&t",
                    shortcutLabel: "Ctrl+X",
                },
                {
                    label: "&Copy",
                    shortcutLabel: "Ctrl+C",
                },
                {
                    label: "&Paste",
                    shortcutLabel: "Ctrl+V",
                },
            ],
            "&View": [],
            "&Go": [],
            "&Favorites": [],
            "&Help": [],
        });
    }

    _createToolbar() {
        const toolbarItems = [
            {
                label: 'Back',
                icon: ICONS.shell[32],
            },
            {
                label: 'Forward',
                icon: ICONS.shell[32],
            },
            {
                label: 'Up',
                icon: ICONS.shell[32],
            },
            {
                label: 'Cut',
                icon: ICONS.shell[32],
            },
            {
                label: 'Copy',
                icon: ICONS.shell[32],
            },
            {
                label: 'Paste',
                icon: ICONS.shell[32],
            },
            {
                label: 'Undo',
                icon: ICONS.shell[32],
            },
            {
                label: 'Delete',
                icon: ICONS.shell[32],
            },
            {
                label: 'Properties',
                icon: ICONS.shell[32],
            },
            {
                label: 'Views',
                icon: ICONS.shell[32],
            }
        ];
        return new Toolbar(toolbarItems);
    }

    _createAddressBar() {
        const addressBarItems = [
            {
                label: "My Computer",
                icon: ICONS.computer[16],
                children: [
                    {
                        label: "3½ Floppy (A:)",
                        icon: ICONS.mmsys[16],
                    },
                    {
                        label: "(C:)",
                        icon: ICONS.mmsys[16],
                    }
                ]
            }
        ];
        return new AddressBar(addressBarItems);
    }
}
