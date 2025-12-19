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
                    <div class="toolbar-group">
                        <button id="wordpad-new">New</button>
                        <button id="wordpad-open">Open</button>
                        <button id="wordpad-save">Save</button>
                    </div>
                    <div class="toolbar-separator"></div>
                    <div class="toolbar-group">
                        <button id="wordpad-print">Print</button>
                        <button id="wordpad-print-preview" disabled>Preview</button>
                    </div>
                    <div class="toolbar-separator"></div>
                    <div class="toolbar-group">
                        <button id="wordpad-cut">Cut</button>
                        <button id="wordpad-copy">Copy</button>
                        <button id="wordpad-paste">Paste</button>
                        <button id="wordpad-undo">Undo</button>
                    </div>
                    <div class="toolbar-separator"></div>
                    <div class="toolbar-group">
                        <button id="wordpad-insert-date" disabled>Date</button>
                    </div>
                </div>
                <div class="wordpad-toolbar">
                    <div class="toolbar-group">
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
                    </div>
                    <div class="toolbar-group">
                        <button id="wordpad-bold"><b>B</b></button>
                        <button id="wordpad-italic"><i>I</i></button>
                        <button id="wordpad-underline"><u>U</u></button>
                    </div>
                    <div class="toolbar-group">
                        <div class="wordpad-color-picker">
                            <button id="wordpad-color">A</button>
                            <div id="wordpad-color-palette" class="wordpad-color-palette" style="display: none;"></div>
                        </div>
                    </div>
                    <div class="toolbar-group">
                        <button id="wordpad-align-left">L</button>
                        <button id="wordpad-align-center">C</button>
                        <button id="wordpad-align-right">R</button>
                    </div>
                    <div class="toolbar-group">
                        <button id="wordpad-bullets">•</button>
                    </div>
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
        this._populateColorPalette();
        this.updateTitle();

        this.editor.addEventListener('input', () => {
            this.isDirty = true;
            this.updateTitle();
        });

        const closeButton = this.win.element.querySelector('.window-close-button');
        if (closeButton) {
            const newCloseButton = closeButton.cloneNode(true);
            closeButton.parentNode.replaceChild(newCloseButton, closeButton);
            newCloseButton.addEventListener('click', () => {
                if (this.isDirty) {
                    this.showUnsavedChangesDialogOnClose();
                } else {
                   this.win.close(true); // Force close
                }
            });
        }

        this.editor.focus();
        document.execCommand('fontName', false, 'Times New Roman');
        document.execCommand('fontSize', false, '2'); // Corresponds to 10pt
    }

    _setupToolbarListeners() {
        const editor = this.editor;
        const newButton = this.win.$content.find('#wordpad-new')[0];
        const openButton = this.win.$content.find('#wordpad-open')[0];
        const saveButton = this.win.$content.find('#wordpad-save')[0];
        const printButton = this.win.$content.find('#wordpad-print')[0];
        const cutButton = this.win.$content.find('#wordpad-cut')[0];
        const copyButton = this.win.$content.find('#wordpad-copy')[0];
        const pasteButton = this.win.$content.find('#wordpad-paste')[0];
        const undoButton = this.win.$content.find('#wordpad-undo')[0];
        const fontFamily = this.win.$content.find('#wordpad-font-family')[0];
        const fontSize = this.win.$content.find('#wordpad-font-size')[0];
        const boldButton = this.win.$content.find('#wordpad-bold')[0];
        const italicButton = this.win.$content.find('#wordpad-italic')[0];
        const underlineButton = this.win.$content.find('#wordpad-underline')[0];
        const colorButton = this.win.$content.find('#wordpad-color')[0];
        const colorPalette = this.win.$content.find('#wordpad-color-palette')[0];
        const alignLeftButton = this.win.$content.find('#wordpad-align-left')[0];
        const alignCenterButton = this.win.$content.find('#wordpad-align-center')[0];
        const alignRightButton = this.win.$content.find('#wordpad-align-right')[0];
        const bulletsButton = this.win.$content.find('#wordpad-bullets')[0];
        const printButton = this.win.$content.find('#wordpad-print')[0];

        newButton.addEventListener('click', () => this.clearContent());
        openButton.addEventListener('click', () => this.openFile());
        saveButton.addEventListener('click', () => this.saveFile());

        printButton.addEventListener('click', () => {
            this._printDocument();
        });

        cutButton.addEventListener('click', () => {
            document.execCommand('cut');
            editor.focus();
        });

        copyButton.addEventListener('click', () => {
            document.execCommand('copy');
            editor.focus();
        });

        pasteButton.addEventListener('click', () => {
            document.execCommand('paste');
            editor.focus();
        });

        undoButton.addEventListener('click', () => {
            document.execCommand('undo');
            editor.focus();
        });

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

        colorButton.addEventListener('click', (e) => {
            e.stopPropagation();
            const isHidden = colorPalette.style.display === 'none';
            colorPalette.style.display = isHidden ? 'grid' : 'none';
        });

        document.addEventListener('click', (e) => {
            if (!colorPalette.contains(e.target) && e.target !== colorButton) {
                colorPalette.style.display = 'none';
            }
        });

        alignLeftButton.addEventListener('click', () => {
            document.execCommand('justifyLeft');
            editor.focus();
            updateToolbar();
        });

        alignCenterButton.addEventListener('click', () => {
            document.execCommand('justifyCenter');
            editor.focus();
            updateToolbar();
        });

        alignRightButton.addEventListener('click', () => {
            document.execCommand('justifyRight');
            editor.focus();
            updateToolbar();
        });

        bulletsButton.addEventListener('click', () => {
            document.execCommand('insertUnorderedList');
            editor.focus();
            updateToolbar();
        });

        const updateToolbar = () => {
            const isBold = document.queryCommandState('bold');
            const isItalic = document.queryCommandState('italic');
            const isUnderline = document.queryCommandState('underline');
            const currentFont = document.queryCommandValue('fontName').replace(/['"]/g, '');

            boldButton.classList.toggle('active', isBold);
            italicButton.classList.toggle('active', isItalic);
            underlineButton.classList.toggle('active', isUnderline);

            alignLeftButton.classList.toggle('active', document.queryCommandState('justifyLeft'));
            alignCenterButton.classList.toggle('active', document.queryCommandState('justifyCenter'));
            alignRightButton.classList.toggle('active', document.queryCommandState('justifyRight'));
            bulletsButton.classList.toggle('active', document.queryCommandState('insertUnorderedList'));

            if (currentFont) {
                fontFamily.value = currentFont;
            }
        };

        editor.addEventListener('keyup', updateToolbar);
        editor.addEventListener('mouseup', updateToolbar);
        editor.addEventListener('focus', updateToolbar);
    }

    _populateColorPalette() {
        const colorPalette = this.win.$content.find('#wordpad-color-palette')[0];
        const colors = [
            { name: 'Black', value: '#000000' }, { name: 'Maroon', value: '#800000' },
            { name: 'Green', value: '#008000' }, { name: 'Olive', value: '#808000' },
            { name: 'Navy', value: '#000080' }, { name: 'Purple', value: '#800080' },
            { name: 'Teal', value: '#008080' }, { name: 'Gray', value: '#808080' },
            { name: 'Silver', value: '#C0C0C0' }, { name: 'Red', value: '#FF0000' },
            { name: 'Lime', value: '#00FF00' }, { name: 'Yellow', value: '#FFFF00' },
            { name: 'Blue', value: '#0000FF' }, { name: 'Fuchsia', value: '#FF00FF' },
            { name: 'Aqua', value: '#00FFFF' }, { name: 'White', value: '#FFFFFF' },
        ];

        let paletteHTML = '';
        colors.forEach(color => {
            paletteHTML += `
                <div class="color-swatch" data-color="${color.value}" style="background-color: ${color.value};"></div>
                <div class="color-label" data-color="${color.value}">${color.name}</div>
            `;
        });
        paletteHTML += `
            <div class="color-swatch" data-color="#000000" style="background-color: #000000; border: 1px solid white;"></div>
            <div class="color-label" data-color="#000000">Automatic</div>
        `;
        colorPalette.innerHTML = paletteHTML;

        colorPalette.addEventListener('click', (e) => {
            if (e.target.dataset.color) {
                document.execCommand('foreColor', false, e.target.dataset.color);
                colorPalette.style.display = 'none';
                this.editor.focus();
            }
        });
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
            { description: 'HTML Document', accept: { 'text/html': ['.html'] } },
        ];

        if (window.showSaveFilePicker) {
            try {
                const handle = await window.showSaveFilePicker({ types: fileTypes, suggestedName: 'Untitled.html' });
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
            const content = this.editor.innerHTML;
            const blob = new Blob([content], { type: 'text/html' });
            const a = document.createElement('a');
            a.href = URL.createObjectURL(blob);
            a.download = this.fileName.endsWith('.html') ? this.fileName : 'Untitled.html';
            a.click();
            URL.revokeObjectURL(a.href);
            this.isDirty = false;
            this.fileName = a.download;
            this.updateTitle();
        }
    }

    async writeFile(fileHandle) {
        const writable = await fileHandle.createWritable();
        const content = this.editor.innerHTML;
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

    _printDocument() {
        const printFrame = document.createElement('iframe');
        printFrame.style.position = 'absolute';
        printFrame.style.width = '0';
        printFrame.style.height = '0';
        printFrame.style.border = '0';
        document.body.appendChild(printFrame);

        const frameDoc = printFrame.contentWindow.document;
        frameDoc.open();
        frameDoc.write('<!DOCTYPE html><html><head><title>Print</title></head><body>' + this.editor.innerHTML + '</body></html>');
        frameDoc.close();

        printFrame.contentWindow.focus();
        printFrame.contentWindow.print();

        // Clean up the iframe after printing
        setTimeout(() => {
            document.body.removeChild(printFrame);
        }, 1000);
    }
}
