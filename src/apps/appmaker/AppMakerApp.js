import { Application } from '../Application.js';
import './appmaker.css';
import { languages } from '../../config/languages.js';
import { ShowDialogWindow } from '../../components/DialogWindow.js';
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
            "&Edit": [
                {
                    label: "&Undo",
                    shortcutLabel: "Ctrl+Z",
                    action: () => document.execCommand("undo"),
                },
                "MENU_DIVIDER",
                {
                    label: "Cu&t",
                    shortcutLabel: "Ctrl+X",
                    action: () => document.execCommand("cut"),
                },
                {
                    label: "&Copy",
                    shortcutLabel: "Ctrl+C",
                    action: () => this.copyFormattedCode(),
                },
                {
                    label: "&Paste",
                    shortcutLabel: "Ctrl+V",
                    action: () => this.pasteText(),
                },
                {
                    label: "De&lete",
                    shortcutLabel: "Del",
                    action: () => document.execCommand("delete"),
                },
                "MENU_DIVIDER",
                {
                    label: "Select &All",
                    shortcutLabel: "Ctrl+A",
                    action: () => this.codeInput?.select(),
                },
                "MENU_DIVIDER",
                {
                    label: "&Word Wrap",
                    checkbox: {
                        check: () => this.wordWrap,
                        toggle: () => this.toggleWordWrap(),
                    },
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
        this._initEditor();
    }

    _getHTML() {
        return `
            <div class="main-container">
                <div class="input-container">
                    <label for="appName">App Name:</label>
                    <input type="text" id="appName" class="app-name-input" placeholder="Enter app name">
                </div>
                <menu role="tablist">
                    <li role="tab" aria-selected="true"><a href="#code-tab">Code</a></li>
                    <li role="tab"><a href="#preview-tab">Preview</a></li>
                </menu>
                <div class="window" role="tabpanel">
                    <div class="window-body">
                        <div id="code-tab" class="tab-content">
                            <div class="editor-wrapper">
                                <pre><code class="highlighted"></code></pre>
                                <textarea class="codeInput" spellcheck="false"></textarea>
                            </div>
                        </div>
                        <div id="preview-tab" class="tab-content" style="display: none;">
                            <div class="preview-wrapper sunken-panel"></div>
                        </div>
                    </div>
                </div>
            </div>
            <div class="status-bar">
                <p class="status-bar-field statusText">Ready</p>
                <p class="status-bar-field lineCount">Lines: 1</p>
            </div>
        `;
    }

    _initEditor() {
        this.isDirty = false;

        const container = this.win.$content;
        this.appNameInput = container.find('#appName')[0];
        this.codeInput = container.find('.codeInput')[0];
        this.highlighted = container.find('.highlighted')[0];
        this.statusText = container.find('.statusText')[0];
        this.lineCount = container.find('.lineCount')[0];
        this.currentLanguage = 'html';

        this.codeInput.addEventListener('input', () => {
            this.isDirty = true;
            this.updateHighlight();
        });
        this.codeInput.addEventListener('scroll', this.syncScroll.bind(this));

        this.win.on('close', (e) => {
            if (this.isDirty) {
                e.preventDefault();
                this.showUnsavedChangesDialogOnClose();
            }
        });

        this.wordWrap = false;
        this.updateHighlight();
        this.syncPadding();
        this.win.on('resize', this.syncPadding.bind(this));

        const tabs = container.find('[role="tab"]');
        tabs.forEach(tab => {
            tab.addEventListener('click', () => {
                tabs.forEach(t => t.setAttribute('aria-selected', 'false'));
                tab.setAttribute('aria-selected', 'true');
                const tabId = tab.querySelector('a').getAttribute('href');
                container.find('.tab-content').forEach(content => {
                    content.style.display = 'none';
                });
                container.find(tabId)[0].style.display = 'block';

                if (tabId === '#preview-tab') {
                    container.find('.preview-wrapper')[0].innerHTML = this.codeInput.value;
                }
            });
        });
    }

    toggleWordWrap() {
        this.wordWrap = !this.wordWrap;
        this.applyWordWrap();
        this.syncPadding();
        this.win.element.querySelector('.menus').dispatchEvent(new CustomEvent('update'));
    }

    applyWordWrap() {
        const styleValue = this.wordWrap ? 'pre-wrap' : 'pre';
        const overflowValue = this.wordWrap ? 'break-word' : 'normal';
        this.codeInput.style.whiteSpace = styleValue;
        this.codeInput.style.overflowWrap = overflowValue;
        this.highlighted.style.whiteSpace = styleValue;
        this.highlighted.style.overflowWrap = overflowValue;
        this.updateHighlight();
    }

    syncPadding() {
        const scrollbarWidth = this.codeInput.offsetWidth - this.codeInput.clientWidth;
        const scrollbarHeight = this.codeInput.offsetHeight - this.codeInput.clientHeight;
        const preElement = this.highlighted.parentElement;
        preElement.style.paddingRight = `${scrollbarWidth + 8}px`;
        preElement.style.paddingBottom = `${scrollbarHeight + 8}px`;
    }

    showUnsavedChangesDialog(options = {}) {
        return ShowDialogWindow({
            title: 'App Maker',
            text: `<div style="white-space: pre-wrap">The app has been changed.\n\nDo you want to save the changes?</div>`,
            contentIconUrl: new URL('../../assets/icons/msg_warning-0.png', import.meta.url).href,
            modal: true,
            soundEvent: 'SystemQuestion',
            buttons: options.buttons || [],
        });
    }

    showUnsavedChangesDialogOnClose() {
        this.showUnsavedChangesDialog({
            buttons: [
                {
                    label: 'Yes',
                    action: async () => {
                        await this._saveApp();
                        if (!this.isDirty) this.win.close(true);
                        else return false;
                    },
                    isDefault: true,
                },
                { label: 'No', action: () => this.win.close(true) },
                { label: 'Cancel' }
            ],
        });
    }

    pasteText() {
        this.codeInput.focus();
        navigator.clipboard.readText().then(text => {
            document.execCommand('insertText', false, text);
            this.updateHighlight();
        }).catch(() => {
            document.execCommand('paste');
            this.updateHighlight();
        });
    }

    syncScroll() {
        this.highlighted.style.top = `-${this.codeInput.scrollTop}px`;
        this.highlighted.style.left = `-${this.codeInput.scrollLeft}px`;
    }

    updateHighlight() {
        const code = this.codeInput.value;
        const language = languages.find(lang => lang.id === this.currentLanguage);
        this.highlighted.textContent = code + '\n';
        this.highlighted.className = `highlighted language-${language ? language.hljs : 'text'}`;
        this.highlighted.removeAttribute('data-highlighted');
        hljs.highlightElement(this.highlighted);
        this.lineCount.textContent = `Lines: ${code.split('\n').length}`;
        this.syncScroll();
    }

    _saveApp() {
        const appName = this.appNameInput.value;
        const appHtml = this.codeInput.value;

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
        this.isDirty = false;
    }
}
