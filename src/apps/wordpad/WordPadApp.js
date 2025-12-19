import { Application } from '../Application.js';
import { ShowDialogWindow } from '../../components/DialogWindow.js';
import './wordpad.css';

export class WordPadApp extends Application {
    constructor(config) {
        super(config);
        this.win = null;
        this.editor = null;
        this.fileHandle = null;
        this.isDirty = false;
        this.fileName = 'Untitled';
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

        this.win.$content.append(`
            <div class="wordpad-container">
                <div class="wordpad-toolbar">
                    <select id="wordpad-font-family">
                        <option>Times New Roman</option>
                        <option>Calisto MT</option>
                        <option>Fixedsys Excelsior</option>
                        <option>MSW98UI</option>
                        <option>OCR A Extended</option>
                        <option>Westminster</option>
                    </select>
                    <select id="wordpad-font-size">
                        <option>8</option>
                        <option>9</option>
                        <option>10</option>
                        <option>11</option>
                        <option>12</option>
                        <option>14</option>
                        <option>16</option>
                        <option>18</option>
                        <option>20</option>
                        <option>24</option>
                        <option>36</option>
                        <option>48</option>
                        <option>72</option>
                    </select>
                    <button id="wordpad-bold"><b>B</b></button>
                    <button id="wordpad-italic"><i>I</i></button>
                    <button id="wordpad-underline"><u>U</u></button>
                </div>
                <div class="wordpad-editor" contenteditable="true"></div>
                <div class="wordpad-statusbar">
                    <div class="wordpad-statusbar-panel">For Help, press F1</div>
                </div>
            </div>
        `);
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
            "&Edit": [],
            "&View": [],
            "&Insert": [],
            "&Format": [],
            "&Help": [
                {
                    label: "&About WordPad",
                    action: () => alert("A simple rich text editor."),
                },
            ],
        });
    }

    async _onLaunch(data) {
        this.editor = this.win.$content.find('.wordpad-editor')[0];
        this._setupToolbarListeners();
        this.updateTitle();

        this.editor.addEventListener('input', () => {
            this.isDirty = true;
            this.updateTitle();
        });

        this.win.on('close', (e) => {
            if (this.isDirty) {
                e.preventDefault();
                this.showUnsavedChangesDialogOnClose();
            }
        });

        this.editor.focus();
        document.execCommand('fontName', false, 'Times New Roman');
        document.execCommand('fontSize', false, '2'); // Corresponds to 10pt
    }

    _setupToolbarListeners() {
        const editor = this.editor;
        const fontFamily = this.win.$content.find('#wordpad-font-family')[0];
        const fontSize = this.win.$content.find('#wordpad-font-size')[0];
        const boldButton = this.win.$content.find('#wordpad-bold')[0];
        const italicButton = this.win.$content.find('#wordpad-italic')[0];
        const underlineButton = this.win.$content.find('#wordpad-underline')[0];

        fontFamily.addEventListener('change', () => {
            document.execCommand('fontName', false, fontFamily.value);
            editor.focus();
        });

        fontSize.addEventListener('change', () => {
            const sizeMap = {
                '8': 1, '9': 2, '10': 2, '11': 3, '12': 3, '14': 4, '16': 5,
                '18': 5, '20': 6, '24': 6, '36': 7, '48': 7, '72': 7
            };
            const size = sizeMap[fontSize.value] || 2; // Default to 10pt
            document.execCommand('fontSize', false, size);
            editor.focus();
        });

        boldButton.addEventListener('click', () => {
            document.execCommand('bold');
            editor.focus();
        });

        italicButton.addEventListener('click', () => {
            document.execCommand('italic');
            editor.focus();
        });

        underlineButton.addEventListener('click', () => {
            document.execCommand('underline');
            editor.focus();
        });

        const updateToolbar = () => {
            const isBold = document.queryCommandState('bold');
            const isItalic = document.queryCommandState('italic');
            const isUnderline = document.queryCommandState('underline');
            const currentFont = document.queryCommandValue('fontName').replace(/['"]/g, '');

            boldButton.classList.toggle('active', isBold);
            italicButton.classList.toggle('active', isItalic);
            underlineButton.classList.toggle('active', isUnderline);

            if (currentFont) {
                fontFamily.value = currentFont;
            }
        };

        editor.addEventListener('keyup', updateToolbar);
        editor.addEventListener('mouseup', updateToolbar);
        editor.addEventListener('focus', updateToolbar);
    }

    updateTitle() {
        const dirtyIndicator = this.isDirty ? '*' : '';
        this.win.title(`${dirtyIndicator}${this.fileName} - WordPad`);
    }

    async clearContent() {
        if (await this.checkForUnsavedChanges() === 'cancel') return;
        this.editor.innerHTML = '';
        this.fileName = 'Untitled';
        this.fileHandle = null;
        this.isDirty = false;
        this.updateTitle();
    }

    async openFile() {
        if (await this.checkForUnsavedChanges() === 'cancel') return;
        const input = document.createElement('input');
        input.type = 'file';
        input.accept = '.html';
        input.onchange = e => {
            const file = e.target.files[0];
            if (!file) return;

            this.fileName = file.name;
            this.fileHandle = null;
            this.isDirty = false;
            this.updateTitle();

            const reader = new FileReader();
            reader.onload = (event) => {
                this.editor.innerHTML = event.target.result;
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
        const fileTypes = [
            { description: 'Rich Text Format', accept: { 'application/rtf': ['.rtf'] } },
            { description: 'HTML Document', accept: { 'text/html': ['.html'] } },
        ];

        if (window.showSaveFilePicker) {
            try {
                const handle = await window.showSaveFilePicker({ types: fileTypes, suggestedName: this.fileName });
                this.fileHandle = handle;
                this.fileName = handle.name;
                await this.writeFile(handle);
                this.isDirty = false;
                this.updateTitle();
            } catch (err) {
                if (err.name !== 'AbortError') console.error('Error saving file:', err);
            }
        } else {
            // Fallback for older browsers
            const fileType = this.fileName.endsWith('.rtf') ? 'rtf' : 'html';
            let content, blob;
            if (fileType === 'rtf') {
                content = html2rtf(this.editor.innerHTML);
                blob = new Blob([content], { type: 'application/rtf' });
            } else {
                content = this.editor.innerHTML;
                blob = new Blob([content], { type: 'text/html' });
            }
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
        let content;
        if (fileHandle.name.endsWith('.rtf')) {
            content = html2rtf(this.editor.innerHTML);
        } else {
            content = this.editor.innerHTML;
        }
        await writable.write(content);
        await writable.close();
    }

    showUnsavedChangesDialog(options = {}) {
        return ShowDialogWindow({
            title: 'WordPad',
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
}
