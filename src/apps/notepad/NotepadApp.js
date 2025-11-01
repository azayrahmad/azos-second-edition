import { Application } from '../Application.js';
import './notepad.css';
import '../../components/notepad-editor.css';
import { languages } from '../../config/languages.js';
import { HIGHLIGHT_JS_THEMES } from '../../config/highlight-js-themes.js';
import { getItem, setItem, LOCAL_STORAGE_KEYS } from '../../utils/localStorage.js';
import { ShowDialogWindow } from '../../components/DialogWindow.js';
import { NotepadEditor } from '../../components/NotepadEditor.js';
import { renderHTML } from '../../utils/domUtils.js';

const DEFAULT_THEME = 'atom-one-light';

export class NotepadApp extends Application {
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

        const mainContainerHTML = `
            <div class="notepad-main-container">
                <div class="line-numbers-gutter"></div>
                <div class="notepad-container"></div>
            </div>
        `;
        win.$content.append(mainContainerHTML);

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
                    action: () => this.editor.codeInput.select(),
                },
                "MENU_DIVIDER",
                {
                    label: "&Word Wrap",
                    checkbox: {
                        check: () => this.editor.wordWrap,
                        toggle: () => this.toggleWordWrap(),
                    },
                },
                {
                    label: "Line &Numbers",
                    checkbox: {
                        check: () => this.lineNumbersVisible,
                        toggle: () => this.toggleLineNumbers(),
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
                            getValue: () => this.editor.currentLanguage,
                            setValue: (value) => this.setLanguage(value),
                        },
                    ]
                },
                {
                    label: "&Theme",
                    submenu: [
                        {
                            radioItems: HIGHLIGHT_JS_THEMES.map(theme => ({ label: theme, value: theme })),
                            getValue: () => this.currentTheme,
                            setValue: (value) => this.setTheme(value),
                        },
                    ]
                },
                {
                    label: "HTML/Markdown Preview",
                    action: () => this.previewMarkdown(),
                },
                "MENU_DIVIDER",
                {
                    label: "&Format",
                    shortcutLabel: "Ctrl+Shift+F",
                    action: () => this.formatCode(),
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
        const lineNumbersGutter = this.win.$content.find('.line-numbers-gutter')[0];

        this.editor = new NotepadEditor(container, {
            win: this.win,
            lineNumbersElement: lineNumbersGutter,
            onInput: () => {
                this.isDirty = true;
                this.updateTitle();
            }
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
            this.setLanguage(this.getLanguageFromExtension(file.name));

            const reader = new FileReader();
            reader.onload = (event) => {
                this.editor.setValue(event.target.result);
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

        this.currentTheme = getItem(LOCAL_STORAGE_KEYS.NOTEPAD_THEME) || DEFAULT_THEME;
        this.setTheme(this.currentTheme, true);

        const lineNumbersEnabled = getItem(LOCAL_STORAGE_KEYS.NOTEPAD_LINE_NUMBERS) === 'true';
        this.lineNumbersVisible = lineNumbersEnabled;
        this.editor.toggleLineNumbers(this.lineNumbersVisible);
    }

    toggleLineNumbers() {
        this.lineNumbersVisible = !this.lineNumbersVisible;
        this.editor.toggleLineNumbers(this.lineNumbersVisible);
        setItem(LOCAL_STORAGE_KEYS.NOTEPAD_LINE_NUMBERS, this.lineNumbersVisible);
        this.win.element.querySelector('.menus').dispatchEvent(new CustomEvent('update'));
    }

    setTheme(theme, isInitialLoad = false) {
        if (!isInitialLoad && theme === this.currentTheme) return;

        const themeUrl = `https://cdnjs.cloudflare.com/ajax/libs/highlight.js/11.9.0/styles/${theme}.min.css`;
        const existingLink = document.getElementById('highlightjs-theme');

        if (existingLink) {
            existingLink.href = themeUrl;
        } else {
            const link = document.createElement('link');
            link.id = 'highlightjs-theme';
            link.rel = 'stylesheet';
            link.href = themeUrl;
            document.head.appendChild(link);
        }

        this.currentTheme = theme;
        setItem(LOCAL_STORAGE_KEYS.NOTEPAD_THEME, theme);

        if (!isInitialLoad) {
            this.win.element.querySelector('.menus').dispatchEvent(new CustomEvent('update'));
        }
    }

    toggleWordWrap() {
        this.editor.toggleWordWrap();
        this.win.element.querySelector('.menus').dispatchEvent(new CustomEvent('update'));
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

        const editor = this.editor.codeInput;
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
                soundEvent: 'SystemHand',
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
        this.win.title(`${dirtyIndicator}${this.fileName} - Notepad`);
        this.win.element.querySelector('.menus')?.dispatchEvent(new CustomEvent('update'));
    }

    previewMarkdown() {
        const html = marked.parse(this.editor.getValue());
        const previewWindow = new $Window({
            title: 'HTML/Markdown Preview',
            innerWidth: 600,
            innerHeight: 400,
            resizable: true,
        });

        const previewContainer = document.createElement('div');
        previewContainer.className = 'markdown-preview-container';
        previewContainer.style.height = '100%';
        previewContainer.style.display = 'flex';
        previewContainer.style.flexDirection = 'column';

        const contentArea = document.createElement('div');
        contentArea.className = 'markdown-preview-content';
        contentArea.style.flexGrow = '1';
        contentArea.style.overflow = 'auto';

        const footer = document.createElement('div');
        footer.className = 'markdown-preview-footer';
        footer.style.textAlign = 'right';
        footer.style.padding = '5px';
        footer.innerHTML = '<button class="copy-button">Copy HTML</button>';

        previewContainer.appendChild(contentArea);
        previewContainer.appendChild(footer);
        previewWindow.$content.append(previewContainer);

        renderHTML(contentArea, html, 'markdown-preview sunken-panel');

        footer.querySelector('.copy-button').addEventListener('click', (e) => {
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
                this.editor.setValue(event.target.result);
                this.isDirty = false;
                this.updateTitle();
            };
            reader.readAsText(file);
        };
        input.click();
    }

    async clearContent() {
        if (await this.checkForUnsavedChanges() === 'cancel') return;
        this.editor.setValue('');
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
                this.editor.statusText.textContent = 'File saved.';
                setTimeout(() => this.editor.statusText.textContent = 'Ready', 2000);
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

    pasteText() {
        this.editor.focus();
        navigator.clipboard.readText().then(text => {
            document.execCommand('insertText', false, text);
        }).catch(() => {
            document.execCommand('paste');
        });
    }

    setLanguage(lang) {
        this.editor.setLanguage(lang);
        this.win.element.querySelector('.menus').dispatchEvent(new CustomEvent('update'));
    }

    getInlineStyledHTML() {
        const tempDiv = document.createElement('div');
        tempDiv.style.cssText = 'position: absolute; visibility: hidden;';
        const tempPre = document.createElement('pre');
        const tempCode = document.createElement('code');
        tempCode.className = this.editor.highlighted.className;
        tempCode.textContent = this.editor.getValue();
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
            this.editor.statusText.textContent = successful ? '✓ Copied to clipboard!' : 'Copy failed!';
        } catch (err) {
            this.editor.statusText.textContent = 'Copy failed!';
        } finally {
            setTimeout(() => this.editor.statusText.textContent = 'Ready', 2000);
        }
    }

    formatCode() {
        if (typeof prettier === 'undefined' || typeof prettierPlugins === 'undefined') {
            this.editor.statusText.textContent = 'Prettier library not loaded.';
            setTimeout(() => this.editor.statusText.textContent = 'Ready', 3000);
            return;
        }

        const language = languages.find(lang => lang.id === this.editor.currentLanguage);
        const parser = language?.prettier;

        if (!parser) {
            this.editor.statusText.textContent = `Formatting not available for ${language?.name || this.editor.currentLanguage}.`;
            setTimeout(() => this.editor.statusText.textContent = 'Ready', 3000);
            return;
        }

        try {
            const formattedCode = prettier.format(this.editor.getValue(), {
                parser: parser,
                plugins: prettierPlugins,
            });
            this.editor.setValue(formattedCode);
            this.isDirty = true;
            this.updateTitle();
            this.editor.statusText.textContent = 'Code formatted successfully.';
        } catch (error) {
            console.error('Prettier formatting error:', error);
            this.editor.statusText.textContent = `Error formatting code: ${error.message.split('\\n')[0]}`;
        } finally {
            setTimeout(() => this.editor.statusText.textContent = 'Ready', 3000);
        }
    }
}
