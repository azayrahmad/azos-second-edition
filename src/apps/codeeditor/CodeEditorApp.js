import { Application } from '../Application.js';
import * as monaco from 'monaco-editor';
import { ShowDialogWindow } from '../../components/DialogWindow.js';
// MenuBar is loaded globally from a script tag in index.html
import './codeeditor.css';

export class CodeEditorApp extends Application {
    constructor(config) {
        super(config);
        this.editor = null;
        this.win = null;
        this.wordWrap = false;
        this.statusBar = null;

        this.fileName = 'Untitled';
        this.fileHandle = null;
        this.isDirty = false;
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
                    action: () => this.openFile(),
                },
                {
                    label: "&Save",
                    shortcutLabel: "Ctrl+S",
                    action: () => this.saveFile(),
                },
                {
                    label: "Save &As...",
                    action: () => this.saveAs(),
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

    updateTitle() {
        const dirtyIndicator = this.isDirty ? '*' : '';
        this.win.title(`${dirtyIndicator}${this.fileName} - Code Editor`);
    }

    showUnsavedChangesDialog(options = {}) {
        return ShowDialogWindow({
            title: 'Code Editor',
            text: `<div style="white-space: pre-wrap">The text in the ${this.fileName} file has changed.\n\nDo you want to save the changes?</div>`,
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
                        await this.saveFile();
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

    async openFile() {
        if (await this.checkForUnsavedChanges() === 'cancel') return;

        const input = document.createElement('input');
        input.type = 'file';
        input.accept = '*/*';
        input.onchange = e => {
            const file = e.target.files[0];
            if (!file) return;

            this.fileName = file.name;
            this.fileHandle = null;
            this.isDirty = false;
            this.updateTitle();

            const reader = new FileReader();
            reader.onload = (event) => {
                this.editor.setValue(event.target.result);
                this.isDirty = false;
                this.updateTitle();
            };
            reader.readAsText(file);
        };
        input.click();
    }

    async saveFile() {
        if (this.fileHandle) {
            try {
                await this.writeFile(this.fileHandle);
                this.isDirty = false;
                this.updateTitle();
            } catch (err) {
                console.error('Error saving file:', err);
            }
        } else {
            await this.saveAs();
        }
    }

    async saveAs() {
        if (window.showSaveFilePicker) {
            try {
                const handle = await window.showSaveFilePicker({
                    suggestedName: this.fileName,
                });
                this.fileHandle = handle;
                this.fileName = handle.name;
                await this.writeFile(handle);
                this.isDirty = false;
                this.updateTitle();
            } catch (err) {
                if (err.name !== 'AbortError') console.error('Error saving file:', err);
            }
        } else {
            const newFileName = prompt("Enter a filename:", this.fileName);
            if (!newFileName) return;

            this.fileName = newFileName;
            const blob = new Blob([this.editor.getValue()], { type: 'text/plain' });
            const a = document.createElement('a');
            a.href = URL.createObjectURL(blob);
            a.download = this.fileName;
            a.click();
            URL.revokeObjectURL(a.href);
            this.isDirty = false;
            this.updateTitle();
        }
    }

    async writeFile(fileHandle) {
        const writable = await fileHandle.createWritable();
        await writable.write(this.editor.getValue());
        await writable.close();
    }

    async checkForUnsavedChanges() {
        if (!this.isDirty) return 'continue';
        return new Promise(resolve => {
            this.showUnsavedChangesDialog({
                buttons: [
                    {
                        label: 'Yes',
                        action: async () => {
                            await this.saveFile();
                            resolve(!this.isDirty ? 'continue' : 'cancel');
                        },
                        isDefault: true,
                    },
                    { label: 'No', action: () => resolve('continue') },
                    { label: 'Cancel', action: () => resolve('cancel') }
                ],
            });
        });
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
        });

        this.fileName = 'Untitled';
        this.fileHandle = null;
        this.isDirty = false;
        this.updateTitle();

        this.editor.onDidChangeCursorPosition(() => this.updateStatusBar());
        this.editor.onDidChangeModel(() => this.updateStatusBar());
        this.editor.onDidChangeModelContent(() => {
            this.isDirty = true;
            this.updateTitle();
            this.updateStatusBar();
        });
        this.updateStatusBar();

        this.win.on('resize', () => {
            this.editor.layout();
        });

        this.win.on('close', (e) => {
            if (this.isDirty) {
                e.preventDefault();
                this.showUnsavedChangesDialogOnClose();
            }
        });
    }
}
