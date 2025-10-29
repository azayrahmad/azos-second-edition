import { Application } from '../Application.js';

export class ThemeToCssApp extends Application {
    constructor(info) {
        super(info);
        const win = this._createWindow();
        win.app = this;
        win.show();
    }

    _createWindow() {
        const win = new $Window({
            title: this.info.name,
            icon: this.info.icon,
            width: 450,
            height: 350,
            resizable: true,
            className: 'themetocss-app',
            id: this.info.id,
        });

        const content = `
            <div class="themetocss-main-content" style="padding: 10px; display: flex; flex-direction: column; height: 100%;">
                <p>Select a .theme file to convert it to CSS.</p>
                <button class="load-theme-btn">Load Theme File</button>
                <textarea class="css-output" style="width: 100%; flex-grow: 1; margin-top: 10px;" readonly></textarea>
            </div>
        `;
        win.$content.html(content);

        this._init(win);

        return win;
    }

    _init(win) {
        const $loadButton = win.$content.find('.load-theme-btn');
        const $outputTextArea = win.$content.find('.css-output');
        let isParserLoaded = false;

        const loadParserScript = () => {
            return new Promise((resolve, reject) => {
                if (window.parseThemeFileString && window.makeThemeCSSFile) {
                    resolve();
                    return;
                }

                if (document.querySelector('script[src="./os-gui/parse-theme.js"]')) {
                    // Script is already loading/loaded, but functions are not yet on window.
                    // This is a simple poll, could be improved with a more robust event system.
                    const interval = setInterval(() => {
                        if (window.parseThemeFileString && window.makeThemeCSSFile) {
                            clearInterval(interval);
                            resolve();
                        }
                    }, 100);
                    return;
                }

                const script = document.createElement('script');
                script.src = './os-gui/parse-theme.js';
                script.onload = () => {
                    isParserLoaded = true;
                    resolve();
                };
                script.onerror = () => reject(new Error('Failed to load theme parser script.'));
                document.head.appendChild(script);
            });
        };

        const handleFileSelect = (event) => {
            const file = event.target.files[0];
            if (!file) {
                return;
            }

            const reader = new FileReader();
            reader.onload = async (e) => {
                const themeContent = e.target.result;
                try {
                    await loadParserScript();
                    const cssProperties = window.parseThemeFileString(themeContent);
                    if (cssProperties) {
                        const cssFileContent = window.makeThemeCSSFile(cssProperties);
                        $outputTextArea.val(cssFileContent);
                    } else {
                        $outputTextArea.val('Error: Failed to parse theme file. See console for details.');
                    }
                } catch (error) {
                    console.error(error);
                    $outputTextArea.val(`Error: ${error.message}`);
                }
            };
            reader.readAsText(file);
        };

        $loadButton.on('click', () => {
            const $fileInput = $('<input type="file" accept=".theme,.themepack" style="display: none;">');
            win.$content.append($fileInput);
            $fileInput.on('change',. handleFileSelect);
            $fileInput.trigger('click');
            $fileInput.remove();
        });
    }
}
