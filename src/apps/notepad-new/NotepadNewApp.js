import { Application } from '../Application.js';
import './notepad-new.css';
import { getItem, setItem, LOCAL_STORAGE_KEYS } from '../../utils/localStorage.js';
import { EditorView, keymap } from '@codemirror/view';
import { EditorState, Compartment } from '@codemirror/state';
import { history, defaultKeymap, historyKeymap, undo } from '@codemirror/commands';
import { searchKeymap, search, openSearchPanel } from '@codemirror/search';
import { ShowDialogWindow } from '../../components/DialogWindow.js';
import { notepadTheme } from './notepad-theme.js';

export class NotepadNewApp extends Application {
    constructor(config) {
        super(config);
        this.wordWrap = getItem(LOCAL_STORAGE_KEYS.NOTEPAD_WORD_WRAP) ?? false;
        this.currentLanguage = 'text';
        this.win = null;
        this.editor = null;
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

        this.win.$content.append('<div class="notepad-container"></div>');
        return this.win;
    }

    _createMenuBar() {
        return new MenuBar({
            "&File": [
                {
                    label: "&New",
                    shortcutLabel: "Ctrl+N",
                    action: () => this.clearContent(),
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
                    action: () => undo(this.editor),
                },
                "MENU_DIVIDER",
                {
                    label: "Cu&t",
                    shortcutLabel: "Ctrl+X",
                    action: () => {
                        this.editor.focus();
                        document.execCommand("cut");
                    },
                },
                {
                    label: "&Copy",
                    shortcutLabel: "Ctrl+C",
                    action: () => {
                        this.editor.focus();
                        document.execCommand("copy");
                    },
                },
                {
                    label: "&Paste",
                    shortcutLabel: "Ctrl+V",
                    action: () => this.pasteText(),
                },
                {
                    label: "De&lete",
                    shortcutLabel: "Del",
                    action: () => this.editor.dispatch({
                        changes: { from: this.editor.state.selection.main.from, to: this.editor.state.selection.main.to, insert: '' }
                    }),
                },
                "MENU_DIVIDER",
                {
                    label: "Select &All",
                    shortcutLabel: "Ctrl+A",
                    action: () => this.editor.dispatch({ selection: { anchor: 0, head: this.editor.state.doc.length } }),
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
            "&Search": [
                {
                    label: "&Find...",
                    shortcutLabel: "Ctrl+F",
                    action: () => openSearchPanel(this.editor),
                },
            ],
            "&Help": [
                {
                    label: "&About Notepad",
                    action: () => alert("A simple text editor."),
                },
            ],
        });
    }

    _onLaunch(data) {
        const container = this.win.$content.find('.notepad-container')[0];
        this.wordWrapCompartment = new Compartment();

        const state = EditorState.create({
            doc: '',
            extensions: [
                history(),
                keymap.of([...defaultKeymap, ...historyKeymap, ...searchKeymap]),
                search({ top: true }),
                this.wordWrapCompartment.of(this.wordWrap ? EditorView.lineWrapping : []),
                notepadTheme,
                EditorView.updateListener.of((update) => {
                    if (update.docChanged) {
                        this.isDirty = true;
                        this.updateTitle();
                    }
                }),
            ],
        });

        this.editor = new EditorView({
            state,
            parent: container,
        });

        this.fileHandle = null;
        this.isDirty = false;
        this.fileName = 'Untitled';
        this.findState = {
            term: '',
            caseSensitive: false,
            direction: 'down',
        };

        this.updateTitle();

        if (typeof data === "string") {
          // It's a file path
          fetch(data)
            .then((response) => {
              if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
              }
              return response.text();
            })
            .then((text) => {
              this.fileName = data.split("/").pop();
              this.editor.dispatch({
                changes: { from: 0, to: this.editor.state.doc.length, insert: text }
              });
              this.isDirty = false;
              this.updateTitle();
            })
            .catch((e) => {
              console.error("Error loading file:", e);
              ShowDialogWindow({
                title: "Error",
                text: `Could not open file: ${data}`,
                buttons: [{ label: "OK", isDefault: true }],
              });
            });
        } else if (data && typeof data === "object") {
          // It's a file object from drag-and-drop or file open
          if (data.content) {
            this.fileName = data.name;
            const content = atob(data.content.split(",")[1]);
            this.editor.dispatch({
                changes: { from: 0, to: this.editor.state.doc.length, insert: content }
              });
            this.isDirty = false;
            this.updateTitle();
          } else {
            // Assumes it's a File-like object
            const file = data;
            this.fileName = file.name;
            this.fileHandle = null;
            this.isDirty = false;
            this.updateTitle();

            const reader = new FileReader();
            reader.onload = (event) => {
                this.editor.dispatch({
                    changes: { from: 0, to: this.editor.state.doc.length, insert: event.target.result }
                });
              this.isDirty = false; // Reset dirty flag after loading
              this.updateTitle();
            };
            reader.onerror = (e) => {
              console.error("Error reading file:", e);
              ShowDialogWindow({
                title: "Error",
                text: `Could not read file: ${file.name}`,
                buttons: [{ label: "OK", isDefault: true }],
              });
            };
            reader.readAsText(file);
          }
        }

        const notepadContainer = this.win.$content.find('.notepad-container')[0];
        notepadContainer.addEventListener('dragover', (e) => {
            e.preventDefault();
            e.stopPropagation();
            notepadContainer.classList.add('dragover');
        });

        notepadContainer.addEventListener('dragleave', (e) => {
            e.preventDefault();
            e.stopPropagation();
            notepadContainer.classList.remove('dragover');
        });

        notepadContainer.addEventListener('drop', async (e) => {
            e.preventDefault();
            e.stopPropagation();
            notepadContainer.classList.remove('dragover');

            if (await this.checkForUnsavedChanges() === 'cancel') return;

            const files = e.dataTransfer.files;
            if (files.length !== 1) {
                alert('Please drop a single file.');
                return;
            }
            const file = files[0];

            this.fileName = file.name;
            this.fileHandle = null;
            this.isDirty = false;
            this.updateTitle();

            const reader = new FileReader();
            reader.onload = (event) => {
                this.editor.dispatch({
                    changes: { from: 0, to: this.editor.state.doc.length, insert: event.target.result }
                });
                this.isDirty = false;
                this.updateTitle();
            };
            reader.readAsText(file);
        });

        this.win.on('close', (e) => {
            if (this.isDirty) {
                e.preventDefault();
                this.showUnsavedChangesDialogOnClose();
            }
        });
    }

    toggleWordWrap() {
        this.wordWrap = !this.wordWrap;
        this.editor.dispatch({
            effects: this.wordWrapCompartment.reconfigure(this.wordWrap ? EditorView.lineWrapping : [])
        });
        setItem(LOCAL_STORAGE_KEYS.NOTEPAD_WORD_WRAP, this.wordWrap);
        this.win.element.querySelector('.menus').dispatchEvent(new CustomEvent('update'));
    }

    showUnsavedChangesDialog(options = {}) {
        return ShowDialogWindow({
            title: 'Notepad',
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

    updateTitle() {
        const dirtyIndicator = this.isDirty ? '*' : '';
        this.win.title(`${dirtyIndicator}${this.fileName} - Notepad New`);
        this.win.element.querySelector('.menus')?.dispatchEvent(new CustomEvent('update'));
    }

    async openFile() {
        if (await this.checkForUnsavedChanges() === 'cancel') return;
        const input = document.createElement('input');
        input.type = 'file';
        input.accept = '.txt, text/plain';
        input.onchange = e => {
            const file = e.target.files[0];
            if (!file) return;
            this.fileName = file.name;
            this.fileHandle = null;
            this.isDirty = false;
            this.updateTitle();
            const reader = new FileReader();
            reader.onload = (event) => {
                this.editor.dispatch({
                    changes: { from: 0, to: this.editor.state.doc.length, insert: event.target.result }
                });
                this.isDirty = false;
                this.updateTitle();
            };
            reader.readAsText(file);
        };
        input.click();
    }

    async clearContent() {
        if (await this.checkForUnsavedChanges() === 'cancel') return;
        this.editor.dispatch({
            changes: { from: 0, to: this.editor.state.doc.length, insert: '' }
        });
        this.fileName = 'Untitled';
        this.fileHandle = null;
        this.isDirty = false;
        this.updateTitle();
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
                    types: [{
                        description: 'Text Files',
                        accept: { 'text/plain': ['.txt'] },
                    }],
                    suggestedName: 'Untitled.txt'
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
            const newFileName = prompt("Enter a filename:", this.fileName === 'Untitled' ? 'Untitled.txt' : this.fileName);
            if (!newFileName) return;
            this.fileName = newFileName;
            const blob = new Blob([this.editor.state.doc.toString()], { type: 'text/plain' });
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
        await writable.write(this.editor.state.doc.toString());
        await writable.close();
    }

    pasteText() {
        navigator.clipboard.readText().then(text => {
            this.editor.dispatch({
                changes: { from: this.editor.state.selection.main.from, to: this.editor.state.selection.main.to, insert: text }
            });
        }).catch(() => {
            // Fallback for browsers that don't support clipboard API in this context
            // Note: This is not a reliable fallback.
            alert("Could not paste from clipboard. Your browser might not support this feature in this context.");
        });
    }
}
