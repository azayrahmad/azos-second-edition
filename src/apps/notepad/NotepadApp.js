import { Application } from '../Application.js';
import './notepad.css';
import { languages } from '../../config/languages.js';
import { ShowDialogWindow } from '../../components/DialogWindow.js';

export class NotepadApp extends Application {
    constructor(config) {
        super(config);
    }

    _createWindow() {
        const win = new $Window({
            title: this.title,
            width: 600,
            height: 400,
            resizable: true,
        });

        const menuBar = this._createMenuBar();
        win.setMenuBar(menuBar);

        win.$content.html('<div class="notepad-container"></div>');
        return win;
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
            "&Search": [
                {
                    label: "&Find...",
                    shortcutLabel: "Ctrl+F",
                    action: () => this.showFindDialog(),
                },
                {
                    label: "Find &Next",
                    shortcutLabel: "F3",
                    action: () => this.findNext(),
                    enabled: () => this.findState?.term,
                },
            ],
            "&Code": [
                {
                    label: "&Language",
                    submenu: [
                        {
                            radioItems: languages.map(lang => ({ label: lang.name, value: lang.id })),
                            getValue: () => this.currentLanguage,
                            setValue: (value) => this.setLanguage(value),
                        },
                    ]
                },
                {
                    label: "HTML/Markdown Preview",
                    action: () => this.previewMarkdown(),
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

    _onLaunch() {
        const container = this.win.$content.find('.notepad-container')[0];
        container.innerHTML = this._getHTML();
        this._initEditor();
    }

    _getHTML() {
        return `
            <div class="editor-wrapper">
                <pre><code class="highlighted"></code></pre>
                <textarea class="codeInput" spellcheck="false"></textarea>
            </div>
            <div class="status-bar">
                <p class="status-bar-field statusText">Ready</p>
                <p class="status-bar-field lineCount">Lines: 1</p>
            </div>
        `;
    }

    _initEditor() {
        this.fileHandle = null;
        this.isDirty = false;
        this.fileName = 'Untitled';
        this.findState = {
            term: '',
            caseSensitive: false,
            direction: 'down',
        };

        this.updateTitle();

        const container = this.win.$content;
        this.codeInput = container.find('.codeInput')[0];
        this.highlighted = container.find('.highlighted')[0];
        this.statusText = container.find('.statusText')[0];
        this.lineCount = container.find('.lineCount')[0];
        this.currentLanguage = 'text';

        this.codeInput.addEventListener('input', () => {
            this.isDirty = true;
            this.updateTitle();
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

    showFindDialog() {
        const dialogContent = `
            <div style="display: flex; align-items: center; margin-bottom: 10px;">
                <label for="find-text" style="margin-right: 5px;">Find what:</label>
                <input type="text" id="find-text" value="${this.findState.term}" style="flex-grow: 1;">
            </div>
            <div style="display: flex; justify-content: space-between; align-items: center;">
                <div class="checkbox-container">
                    <input type="checkbox" id="match-case" ${this.findState.caseSensitive ? 'checked' : ''}>
                    <label for="match-case">Match case</label>
                </div>
                <fieldset class="group-box" style="padding: 5px 10px;">
                    <legend>Direction</legend>
                    <div class="field-row">
                        <input type="radio" name="direction" id="dir-up" value="up" ${this.findState.direction === 'up' ? 'checked' : ''}>
                        <label for="dir-up">Up</label>
                    </div>
                    <div class="field-row">
                        <input type="radio" name="direction" id="dir-down" value="down" ${this.findState.direction === 'down' ? 'checked' : ''}>
                        <label for="dir-down">Down</label>
                    </div>
                </fieldset>
            </div>
        `;

        const dialog = ShowDialogWindow({
            title: 'Find',
            width: 380,
            height: 'auto',
            text: dialogContent,
            buttons: [
                {
                    label: 'Find Next',
                    action: (win) => {
                        const findInput = win.element.querySelector('#find-text');
                        const term = findInput.value;
                        if (!term) return false;

                        this.findState.term = term;
                        this.findState.caseSensitive = win.element.querySelector('#match-case').checked;
                        this.findState.direction = win.element.querySelector('input[name="direction"]:checked').value;

                        this.findNext();
                        return true;
                    },
                    isDefault: true,
                },
                { label: 'Cancel' }
            ],
            onclose: (win) => {
                const findInput = win.element.querySelector('#find-text');
                this.findState.term = findInput.value;
                this.findState.caseSensitive = win.element.querySelector('#match-case').checked;
                this.findState.direction = win.element.querySelector('input[name="direction"]:checked').value;
            }
        });
        setTimeout(() => dialog.element.querySelector('#find-text').focus().select(), 0);
    }

    findNext() {
        const { term, caseSensitive, direction } = this.findState;
        if (!term) {
            this.showFindDialog();
            return;
        }

        const editor = this.codeInput;
        const text = editor.value;
        const searchTerm = caseSensitive ? term : term.toLowerCase();
        const textToSearch = caseSensitive ? text : text.toLowerCase();

        let index;
        if (direction === 'down') {
            index = textToSearch.indexOf(searchTerm, editor.selectionEnd);
            if (index === -1) index = textToSearch.indexOf(searchTerm);
        } else {
            index = textToSearch.lastIndexOf(searchTerm, editor.selectionStart - 1);
            if (index === -1) index = textToSearch.lastIndexOf(searchTerm);
        }

        if (index !== -1) {
            editor.focus();
            editor.setSelectionRange(index, index + term.length);
        } else {
            ShowDialogWindow({
                title: 'Notepad',
                text: `Cannot find "${term}"`,
                soundId: "chord",
                buttons: [{ label: 'OK', isDefault: true }],
            });
        }
    }

    showUnsavedChangesDialog(options = {}) {
        return ShowDialogWindow({
            title: 'Notepad',
            text: `<div style="white-space: pre-wrap">The text in the ${this.fileName} file has changed.\n\nDo you want to save the changes?</div>`,
            contentIconUrl: new URL('../../assets/icons/msg_warning-0.png', import.meta.url).href,
            modal: true,
            soundId: 'chord',
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
        this.win.title(`${dirtyIndicator}${this.fileName} - Notepad`);
        this.win.element.querySelector('.menus')?.dispatchEvent(new CustomEvent('update'));
    }

    previewMarkdown() {
        const html = marked.parse(this.codeInput.value);
        const previewWindow = new $Window({
            title: 'HTML/Markdown Preview',
            innerWidth: 600,
            innerHeight: 400,
            resizable: true,
        });
        previewWindow.$content.html(`
            <div class="markdown-preview sunken-panel">${html}</div>
            <div class="markdown-preview-footer" style="text-align: right; padding: 5px;">
                <button class="copy-button">Copy HTML</button>
            </div>
        `);
        previewWindow.element.querySelector('.copy-button').addEventListener('click', (e) => {
            navigator.clipboard.writeText(html).then(() => {
                e.target.textContent = 'Copied!';
                setTimeout(() => e.target.textContent = 'Copy HTML', 2000);
            });
        });
    }

    getLanguageFromExtension(filename) {
        const extension = filename.split('.').pop().toLowerCase();
        const language = languages.find(lang => lang.extensions.includes(extension));
        return language ? language.id : 'text';
    }

    async openFile() {
        if (await this.checkForUnsavedChanges() === 'cancel') return;
        const input = document.createElement('input');
        input.type = 'file';
        input.accept = languages.flatMap(lang => lang.extensions.map(ext => `.${ext}`)).join(',');
        input.onchange = e => {
            const file = e.target.files[0];
            if (!file) return;
            this.fileName = file.name;
            this.fileHandle = null;
            this.isDirty = false;
            this.updateTitle();
            this.setLanguage(this.getLanguageFromExtension(file.name));
            const reader = new FileReader();
            reader.onload = (event) => {
                this.codeInput.value = event.target.result;
                this.isDirty = false;
                this.updateTitle();
                this.updateHighlight();
            };
            reader.readAsText(file);
        };
        input.click();
    }

    async clearContent() {
        if (await this.checkForUnsavedChanges() === 'cancel') return;
        this.codeInput.value = '';
        this.fileName = 'Untitled';
        this.fileHandle = null;
        this.isDirty = false;
        this.updateTitle();
        this.updateHighlight();
    }

    async saveFile() {
        if (this.fileHandle) {
            try {
                await this.writeFile(this.fileHandle);
                this.isDirty = false;
                this.updateTitle();
                this.statusText.textContent = 'File saved.';
                setTimeout(() => this.statusText.textContent = 'Ready', 2000);
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
                const fileTypes = languages.map(lang => ({
                    description: lang.name,
                    accept: { [lang.mimeType || 'text/plain']: lang.extensions.map(ext => `.${ext}`) },
                }));
                const handle = await window.showSaveFilePicker({ types: fileTypes, suggestedName: 'Untitled.txt' });
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
            const blob = new Blob([this.codeInput.value], { type: 'text/plain' });
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
        await writable.write(this.codeInput.value);
        await writable.close();
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

    setLanguage(lang) {
        this.currentLanguage = lang;
        this.updateHighlight();
        this.win.element.querySelector('.menus').dispatchEvent(new CustomEvent('update'));
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

    getInlineStyledHTML() {
        const tempDiv = document.createElement('div');
        tempDiv.style.cssText = 'position: absolute; visibility: hidden;';
        const tempPre = document.createElement('pre');
        const tempCode = document.createElement('code');
        tempCode.className = this.highlighted.className;
        tempCode.textContent = this.codeInput.value;
        tempPre.appendChild(tempCode);
        tempDiv.appendChild(tempPre);
        document.body.appendChild(tempDiv);
        hljs.highlightElement(tempCode);

        function applyInlineStyles(element) {
            const styles = window.getComputedStyle(element);
            let styleStr = '';
            if (styles.color) styleStr += `color: ${styles.color}; `;
            if (styles.backgroundColor) styleStr += `background-color: ${styles.backgroundColor}; `;
            if (styles.fontWeight) styleStr += `font-weight: ${styles.fontWeight}; `;
            if (styles.fontStyle) styleStr += `font-style: ${styles.fontStyle}; `;
            if (styleStr) element.setAttribute('style', styleStr);
            Array.from(element.children).forEach(applyInlineStyles);
        }
        applyInlineStyles(tempCode);

        tempPre.style.cssText = 'background-color: #fafafa; padding: 12px; font-family: monospace; white-space: pre; overflow-x: auto;';
        const html = tempPre.outerHTML;
        document.body.removeChild(tempDiv);
        return html;
    }

    copyFormattedCode() {
        try {
            const htmlContent = this.getInlineStyledHTML();
            const tempEl = document.createElement('div');
            tempEl.style.cssText = 'position: absolute; left: -9999px;';
            tempEl.innerHTML = htmlContent;
            document.body.appendChild(tempEl);
            const range = document.createRange();
            range.selectNode(tempEl);
            window.getSelection().removeAllRanges();
            window.getSelection().addRange(range);
            const successful = document.execCommand('copy');
            document.body.removeChild(tempEl);
            window.getSelection().removeAllRanges();
            this.statusText.textContent = successful ? '✓ Copied to clipboard!' : 'Copy failed!';
        } catch (err) {
            this.statusText.textContent = 'Copy failed!';
        } finally {
            setTimeout(() => this.statusText.textContent = 'Ready', 2000);
        }
    }

    formatCode() {
        const language = languages.find(lang => lang.id === this.currentLanguage);
        const parser = language?.prettier;
        if (!parser) {
            this.statusText.textContent = `Formatting not available for ${language?.name || this.currentLanguage}.`;
            setTimeout(() => this.statusText.textContent = 'Ready', 3000);
            return;
        }
        try {
            this.codeInput.value = prettier.format(this.codeInput.value, { parser, plugins: prettierPlugins });
            this.statusText.textContent = 'Code formatted!';
            this.updateHighlight();
        } catch (error) {
            this.statusText.textContent = 'Error formatting code.';
        } finally {
            setTimeout(() => this.statusText.textContent = 'Ready', 2000);
        }
    }
}