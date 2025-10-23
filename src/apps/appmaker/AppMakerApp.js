import { Application } from '../Application.js';
import { ShowDialogWindow } from '../../components/DialogWindow.js';
import './appmaker.css';
import '../../components/notepad-editor.css';
import { setupIcons } from '../../components/desktop.js';
import { getItem, setItem, LOCAL_STORAGE_KEYS } from '../../utils/localStorage.js';
import { registerCustomApp } from '../../utils/customAppManager.js';
import { NotepadEditor } from '../../components/NotepadEditor.js';
import { renderHTML } from '../../utils/domUtils.js';

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
                    label: "&Open HTML...",
                    action: () => this._openHtmlFile(),
                },
                "MENU_DIVIDER",
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
        this.appNameInput.addEventListener('input', () => this._updateTitle());

        const editorContainer = container.querySelector('#editor-container');

        this.editor = new NotepadEditor(editorContainer, {
            win: this.win,
            language: 'html'
        });

        this._updateTitle();
    }

    _updateTitle() {
        const appName = this.appNameInput.value;
        const newTitle = appName ? `${appName} - App Maker` : 'App Maker';
        this.win.setTitle(newTitle);
    }

    _openHtmlFile() {
        const input = document.createElement('input');
        input.type = 'file';
        input.accept = '.html';
        input.onchange = (e) => {
            const file = e.target.files[0];
            if (!file) {
                return;
            }

            const reader = new FileReader();
            reader.onload = (event) => {
                const htmlContent = event.target.result;
                const fileName = file.name.replace(/\.html$/, '');
                this.appNameInput.value = fileName;
                this.editor.setValue(htmlContent);
                this._updateTitle();
            };
            reader.readAsText(file);
        };
        input.click();
    }

    _previewApp() {
        const appName = this.appNameInput.value || 'Preview';
        const appHtml = this.editor.getValue();

        const previewWindow = new $Window({
            title: appName,
            width: 400,
            height: 300,
            resizable: true,
        });

        renderHTML(previewWindow.$content[0], appHtml);
    }

    _saveApp() {
        const appName = this.appNameInput.value;
        const appHtml = this.editor.getValue();

        if (!appName) {
            ShowDialogWindow({
                title: 'Error',
                text: 'Please enter an app name.',
                soundEvent: 'SystemHand',
            });
            return;
        }

        ShowDialogWindow({
            title: 'Save App',
            text: `Are you sure you want to save the app "${appName}"?`,
            modal: true,
            buttons: [
                {
                    label: 'Yes',
                    action: () => {
                        const appId = appName.toLowerCase().replace(/\s/g, '');

                        const appInfo = {
                            id: appId,
                            title: appName,
                            html: appHtml,
                        };

                        registerCustomApp(appInfo);

                        const savedApps = getItem(LOCAL_STORAGE_KEYS.CUSTOM_APPS) || [];
                        const existingAppIndex = savedApps.findIndex(app => app.id === appId);
                        if (existingAppIndex > -1) {
                            savedApps[existingAppIndex] = appInfo;
                        } else {
                            savedApps.push(appInfo);
                        }
                        setItem(LOCAL_STORAGE_KEYS.CUSTOM_APPS, savedApps);

                        setupIcons();
                    },
                    isDefault: true,
                },
                {
                    label: 'No',
                },
            ],
        });
    }

    _getHTML() {
        return `
            <div class="main-container">
                <div class="input-container">
                    <label for="appName">App Name:</label>
                    <input type="text" id="appName" class="app-name-input" placeholder="Enter app name">
                    <label for="appHtml">HTML Content:</label>
                    <div id="editor-container"></div>
                </div>
            </div>
        `;
    }
}
