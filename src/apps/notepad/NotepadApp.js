import { Application } from '../Application.js';
import './notepad.css';
import '../../components/notepad-editor.css';
import { getItem, setItem, LOCAL_STORAGE_KEYS } from '../../utils/localStorage.js';
import { ShowDialogWindow } from '../../components/DialogWindow.js';
import { NotepadEditor } from '../../components/NotepadEditor.js';
import { renderHTML } from '../../utils/domUtils.js';
import { notepadMenuConfig } from './config/notepadMenuConfig.js';
import { NotepadFileManager } from './services/NotepadFileManager.js';
import { NotepadDialogManager } from './services/NotepadDialogManager.js';
import * as CodeUtils from './utils/NotepadCodeUtils.js';

const DEFAULT_THEME = 'atom-one-light';

export class NotepadApp extends Application {
    constructor(config) {
        super(config);
        this.fileManager = new NotepadFileManager(this);
        this.dialogManager = new NotepadDialogManager(this);
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

        win.$content.append('<div class="notepad-container"></div>');
        return win;
    }

    _createMenuBar() {
        return new MenuBar(notepadMenuConfig(this));
    }

    _onLaunch(data) {
        this._initializeEditor();
        this._setupEventListeners();
        this._handleInitialContentLoad(data);
    }

    _initializeEditor() {
        const container = this.win.$content.find('.notepad-container')[0];
        this.editor = new NotepadEditor(container, {
            win: this.win,
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

        this.currentTheme = getItem(LOCAL_STORAGE_KEYS.NOTEPAD_THEME) || DEFAULT_THEME;
        this.setTheme(this.currentTheme, true);
    }

    _setupEventListeners() {
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

            if (await this.fileManager.checkForUnsavedChanges() === 'cancel') return;

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
                this.fileManager.showUnsavedChangesDialogOnClose();
            }
        });
    }

    _handleInitialContentLoad(data) {
        if (typeof data === "string") {
            fetch(data)
                .then(response => {
                    if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
                    return response.text();
                })
                .then(text => {
                    this.fileName = data.split("/").pop();
                    this.editor.setValue(text);
                    this.isDirty = false;
                    this.updateTitle();
                    this.setLanguage(this.getLanguageFromExtension(this.fileName));
                })
                .catch(e => {
                    console.error("Error loading file:", e);
                    ShowDialogWindow({
                        title: "Error",
                        text: `Could not open file: ${data}`,
                        buttons: [{ label: "OK", isDefault: true }],
                    });
                });
        } else if (data && typeof data === "object") {
            if (data.content) {
                this.fileName = data.name;
                const content = atob(data.content.split(",")[1]);
                this.editor.setValue(content);
                this.isDirty = false;
                this.updateTitle();
                this.setLanguage(this.getLanguageFromExtension(this.fileName));
            } else {
                const file = data;
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
    }

    // Methods that remain in NotepadApp
    updateTitle() {
        const dirtyIndicator = this.isDirty ? '*' : '';
        this.win.title(`${dirtyIndicator}${this.fileName} - Notepad`);
        this.win.element.querySelector('.menus')?.dispatchEvent(new CustomEvent('update'));
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

    setLanguage(lang) {
        this.editor.setLanguage(lang);
        this.win.element.querySelector('.menus').dispatchEvent(new CustomEvent('update'));
    }

    // Delegated methods
    openFile() { this.fileManager.openFile(); }
    saveFile() { this.fileManager.saveFile(); }
    saveAs() { this.fileManager.saveAs(); }
    clearContent() { this.fileManager.clearContent(); }
    showFindDialog() { this.dialogManager.showFindDialog(); }
    findNext() { this.dialogManager.findNext(); }
    copyFormattedCode() { CodeUtils.copyFormattedCode(this); }
    formatCode() { CodeUtils.formatCode(this); }
    pasteText() { CodeUtils.pasteText(this.editor); }
    getLanguageFromExtension(filename) { return CodeUtils.getLanguageFromExtension(filename); }
}