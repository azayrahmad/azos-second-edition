import { Application } from '../Application.js';
import { ShowDialogWindow } from '../../components/DialogWindow.js';

const ALLOWED_EXTENSIONS = ['.theme', '.wav', '.cur', '.ani', '.jpg', '.ico'];

export class ThemeInstallerApp extends Application {
    _createWindow() {
        const win = new $Window({
            title: 'Theme Installer',
            width: 400,
            height: 300,
            resizable: true,
            id: 'themeinstaller',
        });

        win.$content.html(`
            <div class="theme-installer-app">
                <div class="toolbar">
                    <button class="select-button">Open ThemePack...</button>
                </div>
                <div class="file-list-container">
                    <ul class="file-list"></ul>
                </div>
            </div>
        `);

        this._win = win;
        this._initAppLogic();

        return win;
    }

    _initAppLogic() {
        const selectButton = this._win.$content.find('.select-button');
        const fileList = this._win.$content.find('.file-list');

        selectButton.on('click', () => this._openFilePicker());
        this._fileList = fileList;
    }

    _openFilePicker() {
        const input = document.createElement('input');
        input.type = 'file';
        input.accept = '.themepack';
        input.addEventListener('change', (event) => this._handleFileSelect(event));
        input.click();
    }

    _handleFileSelect(event) {
        const file = event.target.files[0];
        if (!file) return;

        const reader = new FileReader();
        reader.onload = async (e) => {
            try {
                const content = e.target.result;
                const zip = await JSZip.loadAsync(content);
                this._displayZipContents(zip);
            } catch (error) {
                ShowDialogWindow({
                    title: 'Error',
                    text: 'Not a valid themepack file.',
                    soundEvent: 'SystemHand',
                });
                console.error('Error reading zip file:', error);
            }
        };
        reader.readAsArrayBuffer(file);
    }

    _displayZipContents(zip) {
        this._fileList.empty(); // Use jQuery empty()
        const matchingFiles = [];

        zip.forEach((relativePath, zipEntry) => {
            const extension = relativePath.slice(relativePath.lastIndexOf('.')).toLowerCase();
            if (ALLOWED_EXTENSIONS.includes(extension) && !zipEntry.dir) {
                matchingFiles.push(zipEntry.name);
            }
        });

        if (matchingFiles.length === 0) {
            this._fileList.append('<li>No theme files found in this pack.</li>');
        } else {
            matchingFiles.forEach(fileName => {
                this._fileList.append(`<li>${fileName}</li>`);
            });
        }
    }
}
