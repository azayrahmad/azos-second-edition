import { Application } from '../Application.js';
import * as monaco from 'monaco-editor';
import { MenuBar } from '/public/os-gui/MenuBar.js';
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

        self.MonacoEnvironment = {
            getWorker: function (workerId, label) {
                const getWorkerModule = (moduleUrl, label) => {
                    return new Worker(self.MonacoEnvironment.getWorkerUrl(moduleUrl), {
                        name: label,
                        type: 'module'
                    });
                };

                let workerUrl = `/${label}.worker.js`;

                return getWorkerModule(workerUrl, label);
            }
        };

        this.editor = monaco.editor.create(container, {
            value: ['function x() {', '\tconsole.log("Hello world!");', '}'].join('\\n'),
            language: 'javascript',
            theme: 'vs', // Use the default light theme
            fontFamily: '"Fixedsys Excelsior", monospace',
            fontSize: 16,
        });

        this.editor.onDidChangeCursorPosition(() => this.updateStatusBar());
        this.editor.onDidChangeModel(() => this.updateStatusBar());
        this.editor.onDidChangeModelContent(() => this.updateStatusBar());
        this.updateStatusBar();

        this.win.on('resize', () => {
            this.editor.layout();
        });
    }
}
