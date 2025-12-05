import { ShowDialogWindow } from '../../../components/DialogWindow.js';
import { languages } from '../../../config/languages.js';

export class NotepadFileManager {
    constructor(app) {
        this.app = app;
    }

    async openFile() {
        if (await this.checkForUnsavedChanges() === 'cancel') return;
        const input = document.createElement('input');
        input.type = 'file';
        input.accept = languages.flatMap(lang => lang.extensions.map(ext => `.${ext}`)).join(',');
        input.onchange = e => {
            const file = e.target.files[0];
            if (!file) return;
            this.app.fileName = file.name;
            this.app.fileHandle = null;
            this.app.isDirty = false;
            this.app.updateTitle();
            this.app.setLanguage(this.app.getLanguageFromExtension(file.name));
            const reader = new FileReader();
            reader.onload = (event) => {
                this.app.editor.setValue(event.target.result);
                this.app.isDirty = false;
                this.app.updateTitle();
            };
            reader.readAsText(file);
        };
        input.click();
    }

    async clearContent() {
        if (await this.checkForUnsavedChanges() === 'cancel') return;
        this.app.editor.setValue('');
        this.app.fileName = 'Untitled';
        this.app.fileHandle = null;
        this.app.isDirty = false;
        this.app.updateTitle();
    }

    async saveFile() {
        if (this.app.fileHandle) {
            try {
                await this.writeFile(this.app.fileHandle);
                this.app.isDirty = false;
                this.app.updateTitle();
                this.app.editor.statusText.textContent = 'File saved.';
                setTimeout(() => this.app.editor.statusText.textContent = 'Ready', 2000);
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
                this.app.fileHandle = handle;
                this.app.fileName = handle.name;
                await this.writeFile(handle);
                this.app.isDirty = false;
                this.app.updateTitle();
            } catch (err) {
                if (err.name !== 'AbortError') console.error('Error saving file:', err);
            }
        } else {
            const newFileName = prompt("Enter a filename:", this.app.fileName === 'Untitled' ? 'Untitled.txt' : this.app.fileName);
            if (!newFileName) return;
            this.app.fileName = newFileName;
            const blob = new Blob([this.app.editor.getValue()], { type: 'text/plain' });
            const a = document.createElement('a');
            a.href = URL.createObjectURL(blob);
            a.download = this.app.fileName;
            a.click();
            URL.revokeObjectURL(a.href);
            this.app.isDirty = false;
            this.app.updateTitle();
        }
    }

    async writeFile(fileHandle) {
        const writable = await fileHandle.createWritable();
        await writable.write(this.app.editor.getValue());
        await writable.close();
    }

    showUnsavedChangesDialog(options = {}) {
        return ShowDialogWindow({
            title: 'Notepad',
            text: `<div style="white-space: pre-wrap">The text in the ${this.app.fileName} file has changed.\n\nDo you want to save the changes?</div>`,
            contentIconUrl: new URL('../../../assets/icons/msg_warning-0.png', import.meta.url).href,
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
                        if (!this.app.isDirty) this.app.win.close(true);
                        else return false;
                    },
                    isDefault: true,
                },
                { label: 'No', action: () => this.app.win.close(true) },
                { label: 'Cancel' }
            ],
        });
    }

    async checkForUnsavedChanges() {
        if (!this.app.isDirty) return 'continue';
        return new Promise(resolve => {
            this.showUnsavedChangesDialog({
                buttons: [
                    {
                        label: 'Yes',
                        action: async () => {
                            await this.saveFile();
                            resolve(!this.app.isDirty ? 'continue' : 'cancel');
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
