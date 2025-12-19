import { Application } from '../Application.js';
import * as monaco from 'monaco-editor';
// MenuBar is loaded globally from a script tag in index.html
import './codeeditor.css';

export class CodeEditorApp extends Application {
    constructor(config) {
        super(config);
        this.editor = null;
        this.win = null;
        this.wordWrap = false;
        this.statusBar = null;
    }

    _createWindow() {
        this.win = new $Window({
            id: this.id, // Pass the app ID to the window
            title: this.title,
            outerWidth: this.width,
            outerHeight: this.height,
            resizable: this.resizable,
            icons: this.icon,
        });

        const menuBar = this._createMenuBar();
        this.win.setMenuBar(menuBar);

        const mainContainer = document.createElement('div');
        mainContainer.style.display = 'flex';
        mainContainer.style.flexDirection = 'column';
        mainContainer.style.height = '100%';

        const editorContainer = document.createElement('div');
        editorContainer.className = 'code-editor-container';
        editorContainer.style.flexGrow = '1';
        editorContainer.style.position = 'relative';

        this.statusBar = document.createElement('div');
        this.statusBar.className = 'status-bar';

        mainContainer.appendChild(editorContainer);
        mainContainer.appendChild(this.statusBar);

        this.win.$content.append(mainContainer);

        return this.win;
    }

    _createMenuBar() {
        return new MenuBar({
            "&File": [
                {
                    label: "&New",
                    shortcutLabel: "Ctrl+N",
                    action: () => this.editor.setValue(''),
                },
                {
                    label: "&Open",
                    shortcutLabel: "Ctrl+O",
                    action: () => alert("Open... (not implemented)"),
                },
                {
                    label: "&Save",
                    shortcutLabel: "Ctrl+S",
                    action: () => alert("Save... (not implemented)"),
                },
                {
                    label: "Save &As...",
                    action: () => alert("Save As... (not implemented)"),
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
                    action: () => this.editor.trigger('source', 'undo', null),
                },
                "MENU_DIVIDER",
                {
                    label: "Cu&t",
                    shortcutLabel: "Ctrl+X",
                    action: () => this.editor.trigger('source', 'cut', null),
                },
                {
                    label: "&Copy",
                    shortcutLabel: "Ctrl+C",
                    action: () => this.editor.trigger('source', 'copy', null),
                },
                {
                    label: "&Paste",
                    shortcutLabel: "Ctrl+V",
                    action: () => this.editor.trigger('source', 'paste', null),
                },
                {
                    label: "De&lete",
                    shortcutLabel: "Del",
                    action: () => this.editor.trigger('source', 'delete', null),
                },
                "MENU_DIVIDER",
                {
                    label: "Select &All",
                    shortcutLabel: "Ctrl+A",
                    action: () => {
                        const model = this.editor.getModel();
                        if (model) {
                           this.editor.setSelection(model.getFullModelRange());
                        }
                    },
                },
            ],
            "&View": [
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
                    label: "&About Code Editor",
                    action: () => alert("A code editor powered by Monaco."),
                },
            ],
        });
    }

    toggleWordWrap() {
        this.wordWrap = !this.wordWrap;
        this.editor.updateOptions({ wordWrap: this.wordWrap ? 'on' : 'off' });
        this.win.element.querySelector('.menus').dispatchEvent(new CustomEvent('update'));
    }

    updateStatusBar() {
        const position = this.editor.getPosition();
        const model = this.editor.getModel();
        const language = model ? model.getLanguageId() : 'plaintext';

        if (this.statusBar && position) {
            this.statusBar.innerHTML = `
                <div class="status-bar-field">Ln ${position.lineNumber}, Col ${position.column}</div>
                <div class="status-bar-field">${language.toUpperCase()}</div>
            `;
        }
    }

    async _onLaunch(data) {
        const container = this.win.$content.find('.code-editor-container')[0];

        // Define a custom theme
        monaco.editor.defineTheme('windows-98', {
            base: 'vs',
            inherit: true,
            rules: [],
            colors: {
                'editor.background': '#FFFFFF',
                'editor.foreground': '#000000',
                'editor.selectionBackground': '#000080',
                'editor.selectionForeground': '#FFFFFF',
                'editorCursor.foreground': '#000000',
                'editorWhitespace.foreground': '#BFBFBF'
            }
        });

        this.editor = monaco.editor.create(container, {
            value: ['function x() {', '\tconsole.log("Hello world!");', '}'].join('\n'),
            language: 'javascript',
            theme: 'windows-98', // Set the custom theme
            fontFamily: '"Fixedsys Excelsior", monospace',
            fontSize: 16,
            minimap: {
                enabled: false
            },
        });

        this.editor.onDidChangeCursorPosition(() => this.updateStatusBar());
        this.editor.onDidChangeModel(() => this.updateStatusBar());
        this.editor.onDidChangeModelContent(() => this.updateStatusBar());
        this.updateStatusBar();

        this.win.on('resize', () => {
            this.editor.layout();
        });

        const style = document.createElement('style');
        this.win.onClosed(() => {
            style.remove();
        });
        style.innerHTML = `
            .code-editor-container ::-webkit-scrollbar,
            .code-editor-container ::-webkit-scrollbar-thumb,
            .code-editor-container ::-webkit-scrollbar-button {
                width: 13px;
                height: 13px;
            }

            .code-editor-container ::-webkit-scrollbar {
                background: var(--checker);
                image-rendering: pixelated;
            }
            .code-editor-container ::-webkit-scrollbar-thumb {
                background-color: var(--ButtonFace);
                border-top: 1px solid var(--ButtonFace);
                border-left: 1px solid var(--ButtonFace);
                border-right: 1px solid var(--ButtonDkShadow);
                border-bottom: 1px solid var(--ButtonDkShadow);
                box-shadow: 1px 1px 0 var(--ButtonHilight) inset, -1px -1px 0 var(--ButtonShadow) inset;
            }
            .code-editor-container ::-webkit-scrollbar-corner {
                background-color: var(--ButtonFace);
            }

            .code-editor-container ::-webkit-scrollbar-button {
                background-color: var(--ButtonFace);
                border-top: 1px solid var(--ButtonFace);
                border-left: 1px solid var(--ButtonFace);
                border-right: 1px solid var(--ButtonDkShadow);
                border-bottom: 1px solid var(--ButtonDkShadow);
                box-shadow: 1px 1px 0 var(--ButtonHilight) inset, -1px -1px 0 var(--ButtonShadow) inset;
                background-image: var(--scrollbar-arrows-ButtonText);
                image-rendering: pixelated;
                width: 13px;
                height: 13px;
                box-sizing: border-box;
            }

            .code-editor-container ::-webkit-scrollbar-button:not(.disabled):hover:active {
                border: 1px solid var(--ButtonShadow);
                box-shadow: none;
            }

            .code-editor-container ::-webkit-scrollbar-button:horizontal:decrement {
                background-position: calc(9px * -3 + 1px) 1px;
            }

            .code-editor-container ::-webkit-scrollbar-button:horizontal:increment {
                background-position: calc(9px * -2 + 1px) 1px;
            }

            .code-editor-container ::-webkit-scrollbar-button:vertical:decrement {
                background-position: calc(9px * -1 + 1px) 1px;
            }

            .code-editor-container ::-webkit-scrollbar-button:vertical:increment {
                background-position: calc(9px * -0 + 1px) 1px;
            }
            .code-editor-container ::-webkit-scrollbar-button:start:increment,
            .code-editor-container ::-webkit-scrollbar-button:end:decrement {
                display: none;
            }
        `;
        document.head.appendChild(style);
    }
}
