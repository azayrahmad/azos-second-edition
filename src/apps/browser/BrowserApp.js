import { Application } from '../Application.js';
import './browser.css';

export class BrowserApp extends Application {
    constructor(config) {
        super(config);
        this.history = [];
        this.historyIndex = -1;
    }

    _createWindow() {
        const win = new $Window({
            title: this.title,
            outerWidth: this.width || 800,
            outerHeight: this.height || 600,
            resizable: this.resizable,
            icons: this.icon,
        });

        const menuBar = this._createMenuBar();
        win.setMenuBar(menuBar);

        const toolbar = this._createToolbar();
        win.$content.append(toolbar);

        const iframeContainer = '<div class="iframe-container"><iframe src="about:blank" frameborder="0"></iframe></div>';
        win.$content.append(iframeContainer);

        return win;
    }

    _createMenuBar() {
        return new MenuBar({
            "&File": [
                {
                    label: "&New Window",
                    action: () => this.launch(),
                },
                "MENU_DIVIDER",
                {
                    label: "E&xit",
                    action: () => this.win.close(),
                },
            ],
            "&Edit": [
                {
                    label: "&Copy",
                    action: () => this.copySelection(),
                },
            ],
            "&View": [
                {
                    label: "&Back",
                    action: () => this.goBack(),
                    enabled: () => this.historyIndex > 0,
                },
                {
                    label: "&Forward",
                    action: () => this.goForward(),
                    enabled: () => this.historyIndex < this.history.length - 1,
                },
                {
                    label: "&Reload",
                    action: () => this.reloadPage(),
                },
            ],
            "&Help": [
                {
                    label: "&About Browser",
                    action: () => alert("A simple web browser for azOS."),
                },
            ],
        });
    }

    _createToolbar() {
        const toolbar = document.createElement('div');
        toolbar.className = 'browser-toolbar';

        toolbar.innerHTML = `
            <div class="address-bar-container">
                <input type="text" class="address-bar" placeholder="Enter web address">
            </div>
            <div class="address-bar-container">
                <select class="address-bar-dropdown"></select>
            </div>
        `;
        return toolbar;
    }

    _onLaunch() {
        this.iframe = this.win.$content.find('iframe')[0];
        this.addressBar = this.win.$content.find('.address-bar')[0];
        this.addressBarDropdown = this.win.$content.find('.address-bar-dropdown')[0];

        this.addressBar.addEventListener('keydown', (e) => {
            if (e.key === 'Enter') {
                this.navigateTo(this.addressBar.value);
            }
        });

        this.addressBarDropdown.addEventListener('change', (e) => {
            this.navigateTo(e.target.value);
        });

        this.win.element.querySelector('.menus').dispatchEvent(new CustomEvent('update'));
    }

    navigateTo(url) {
        if (!url.startsWith('http://') && !url.startsWith('https://')) {
            url = 'http://' + url;
        }

        this.iframe.src = url;
        this.addressBar.value = url;

        if (this.history[this.historyIndex] !== url) {
            this.history = this.history.slice(0, this.historyIndex + 1);
            this.history.push(url);
            this.historyIndex = this.history.length - 1;
            this.updateHistoryDropdown();
        }

        this.win.element.querySelector('.menus').dispatchEvent(new CustomEvent('update'));
    }

    updateHistoryDropdown() {
        this.addressBarDropdown.innerHTML = '';
        this.history.forEach((url, index) => {
            const option = document.createElement('option');
            option.value = url;
            option.textContent = url;
            this.addressBarDropdown.appendChild(option);
        });
        this.addressBarDropdown.selectedIndex = this.historyIndex;
    }

    goBack() {
        if (this.historyIndex > 0) {
            this.historyIndex--;
            this.navigateTo(this.history[this.historyIndex]);
        }
    }

    goForward() {
        if (this.historyIndex < this.history.length - 1) {
            this.historyIndex++;
            this.navigateTo(this.history[this.historyIndex]);
        }
    }

    reloadPage() {
        this.iframe.src = this.iframe.src;
    }

    copySelection() {
        try {
            const selectedText = this.iframe.contentWindow.getSelection().toString();
            if (selectedText) {
                navigator.clipboard.writeText(selectedText);
            }
        } catch (e) {
            console.error("Could not copy text from iframe:", e);
        }
    }
}
