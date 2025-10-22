import { Application } from '../Application.js';
import './appmaker.css';
import { setupIcons } from '../../components/desktop.js';
import { registerCustomApp } from '../../utils/customAppManager.js';

export class AppMakerApp extends Application {
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

        win.$content.append('<div class="appmaker-container"></div>');
        return win;
    }

    _createMenuBar() {
        return new MenuBar({
            "&File": [
                {
                    label: "&Save",
                    shortcutLabel: "Ctrl+S",
                    action: () => this._saveApp(),
                },
                "MENU_DIVIDER",
                {
                    label: "E&xit",
                    action: () => this.win.close(),
                },
            ],
            "&View": [
                {
                    label: "&Preview",
                    action: () => this._previewApp(),
                },
            ],
            "&Help": [
                {
                    label: "&About App Maker",
                    action: () => alert("A simple app maker."),
                },
            ],
        });
    }

    _onLaunch() {
        const container = this.win.$content.find('.appmaker-container')[0];
        container.innerHTML = this._getHTML();

        this.appNameInput = container.querySelector('#appName');
        this.appHtmlInput = container.querySelector('#appHtml');

        container.querySelector('#previewBtn').addEventListener('click', () => this._previewApp());
        container.querySelector('#saveBtn').addEventListener('click', () => this._saveApp());
    }

    _previewApp() {
        const appName = this.appNameInput.value || 'Preview';
        const appHtml = this.appHtmlInput.value;

        const previewWindow = new $Window({
            title: appName,
            width: 400,
            height: 300,
            resizable: true,
        });

        previewWindow.$content.html(appHtml);
    }

    _saveApp() {
        const appName = this.appNameInput.value;
        const appHtml = this.appHtmlInput.value;

        if (!appName) {
            alert('Please enter an app name.');
            return;
        }

        const appId = appName.toLowerCase().replace(/\s/g, '');

        const appInfo = {
            id: appId,
            title: appName,
            html: appHtml,
        };

        registerCustomApp(appInfo);

        const savedApps = JSON.parse(localStorage.getItem('customApps')) || [];
        savedApps.push(appInfo);
        localStorage.setItem('customApps', JSON.stringify(savedApps));

        setupIcons();
    }

    _getHTML() {
        return `
            <div class="main-container">
                <div class="input-container">
                    <label for="appName">App Name:</label>
                    <input type="text" id="appName" class="app-name-input" placeholder="Enter app name">
                    <label for="appHtml">HTML Content:</label>
                    <textarea id="appHtml" class="html-input" placeholder="Enter HTML here"></textarea>
                </div>
                <div class="button-container">
                    <button id="previewBtn">Preview</button>
                    <button id="saveBtn">Save App</button>
                </div>
            </div>
        `;
    }
}
