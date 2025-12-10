import { Application } from '../Application.js';
import { showOpenFilePicker, showSaveFilePicker } from './file-picker.js';
import { getItem, setItem, LOCAL_STORAGE_KEYS } from '../../utils/localStorage.js';
import { findItemByPath } from '../../utils/directory.js';

export class PaintApp extends Application {
    constructor(config) {
        super(config);
        this.jspaint = null;
        this.iframe = null;
    }

    _createWindow() {
        const win = new $Window({
            title: this.title,
            outerWidth: this.width,
            outerHeight: this.height,
            resizable: this.resizable,
            icons: this.icon,
        });

        this.iframe = document.createElement('iframe');
        this.iframe.src = '/azos-second-edition/jspaint/index.html';
        this.iframe.style.width = '100%';
        this.iframe.style.height = '100%';
        this.iframe.style.border = 'none';

        win.$content.append(this.iframe);

        this.iframe.addEventListener('load', () => {
            this.jspaint = this.iframe.contentWindow;
            this._waitForAppReady();
        });

        this.themeChangeHandler = () => this.applyTheme();
        document.addEventListener('theme-changed', this.themeChangeHandler);

        win.onClosed(() => {
            document.removeEventListener('theme-changed', this.themeChangeHandler);
        });

        return win;
    }

    _waitForAppReady() {
        const waitUntil = (test, interval, callback) => {
            if (test()) {
                callback();
            } else {
                setTimeout(() => waitUntil(test, interval, callback), interval);
            }
        };

        waitUntil(() => this.jspaint && this.jspaint.systemHooks && this.jspaint.set_theme && this.jspaint.document.head, 500, () => {
            this.jspaint.set_theme('classic.css');
            this.applyTheme();
            this._setupHooks();
        });
    }

    applyTheme() {
        if (!this.jspaint || !this.jspaint.document) return;

        let style = this.jspaint.document.getElementById('azos-theme-overrides');
        if (!style) {
            style = this.jspaint.document.createElement('style');
            style.id = 'azos-theme-overrides';
            this.jspaint.document.head.appendChild(style);
        }

        const computedStyle = getComputedStyle(document.documentElement);

        const cssVariables = {
            '--ButtonFace': computedStyle.getPropertyValue('--button-face'),
            '--ButtonText': computedStyle.getPropertyValue('--button-text'),
            '--ButtonShadow': computedStyle.getPropertyValue('--button-shadow'),
            '--ButtonHilight': computedStyle.getPropertyValue('--button-hilight'),
            '--ButtonDkShadow': computedStyle.getPropertyValue('--button-dk-shadow'),
            '--AppWorkspace': computedStyle.getPropertyValue('--app-workspace'),
            '--Window': computedStyle.getPropertyValue('--window-bg'),
            '--WindowText': computedStyle.getPropertyValue('--window-text'),
            '--WindowFrame': computedStyle.getPropertyValue('--window-frame'),
            '--ActiveTitle': computedStyle.getPropertyValue('--header-bg-color'),
            '--GradientActiveTitle': computedStyle.getPropertyValue('--header-gradient-start'),
            '--ActiveTitleText': computedStyle.getPropertyValue('--header-text-color'),
            '--InactiveTitle': computedStyle.getPropertyValue('--inactive-header-bg-color'),
            '--InactiveTitleText': computedStyle.getPropertyValue('--inactive-header-text-color'),
            '--Menu': computedStyle.getPropertyValue('--menu-bg'),
            '--MenuText': computedStyle.getPropertyValue('--menu-text'),
            '--Hilight': computedStyle.getPropertyValue('--header-bg-color'),
            '--HilightText': computedStyle.getPropertyValue('--header-text-color'),
            '--GrayText': computedStyle.getPropertyValue('--gray-text'),
        };

        const cssText = `:root { ${Object.entries(cssVariables).map(([key, value]) => `${key}: ${value} !important;`).join(' ')} }`;
        style.textContent = cssText;
    }

    _setupHooks() {
        this.jspaint.systemHooks.showOpenFileDialog = async ({ formats }) => {
            const result = await showOpenFilePicker();
            if (result) {
                return result.handle;
            }
            return null;
        };

        this.jspaint.systemHooks.showSaveFileDialog = async (options) => {
            const result = await showSaveFilePicker(options);
             if (result) {
                if (options.savedCallbackUnreliable) {
                    options.savedCallbackUnreliable({
                        newFileHandle: result.newFileHandle,
                        newBlob: result.newBlob,
                    });
                }
                return result.newFileHandle;
            }
            return null;
        };

        this.jspaint.systemHooks.readBlobFromHandle = async (file_handle) => {
            if (!file_handle || !file_handle.id) {
                return null;
            }

            const allFiles = getItem(LOCAL_STORAGE_KEYS.DROPPED_FILES) || [];
            let fileItem = allFiles.find(f => f.id === file_handle.id);

            if (!fileItem) {
                const path = file_handle.path === '/' ? `/${file_handle.id}` : `${file_handle.path}/${file_handle.id}`;
                fileItem = findItemByPath(path);
            }

            if (!fileItem) {
                console.error("File not found:", file_handle);
                return null;
            }

            try {
                if (fileItem.content) {
                    const byteString = atob(fileItem.content);
                    const ab = new ArrayBuffer(byteString.length);
                    const ia = new Uint8Array(ab);
                    for (let i = 0; i < byteString.length; i++) {
                        ia[i] = byteString.charCodeAt(i);
                    }
                    return new Blob([ab]);
                } else if (fileItem.contentUrl) {
                     const response = await fetch(fileItem.contentUrl);
                     return await response.blob();
                }
                return null;
            } catch (error) {
                console.error('Error reading blob from handle:', error);
                return null;
            }
        };

        this.jspaint.systemHooks.writeBlobToHandle = async (file_handle, blob) => {
            if (!file_handle || !file_handle.id) {
                return false;
            }

            const allFiles = getItem(LOCAL_STORAGE_KEYS.DROPPED_FILES) || [];
            const fileIndex = allFiles.findIndex(f => f.id === file_handle.id);

            if (fileIndex === -1) {
                console.warn("File to write not found, creating new. This should be handled by showSaveFileDialog.");
                return false;
            }

            return new Promise((resolve) => {
                const reader = new FileReader();
                reader.onloadend = () => {
                    const base64Content = reader.result.split(',')[1];
                    allFiles[fileIndex].content = base64Content;
                    delete allFiles[fileIndex].contentUrl;
                    setItem(LOCAL_STORAGE_KEYS.DROPPED_FILES, allFiles);
                    resolve(true);
                };
                reader.onerror = () => {
                     resolve(false);
                };
                reader.readAsDataURL(blob);
            });
        };

        this.jspaint.systemHooks.setWallpaperCentered = (canvas) => {
            canvas.toBlob((blob) => {
                const reader = new FileReader();
                reader.onloadend = () => {
                    const dataUrl = reader.result;
                    setItem(LOCAL_STORAGE_KEYS.WALLPAPER, dataUrl);
                    window.System.setWallpaperMode('center');
                };
                reader.readAsDataURL(blob);
            });
        };

        this.jspaint.systemHooks.setWallpaperTiled = (canvas) => {
            canvas.toBlob((blob) => {
                const reader = new FileReader();
                reader.onloadend = () => {
                    const dataUrl = reader.result;
                    setItem(LOCAL_STORAGE_KEYS.WALLPAPER, dataUrl);
                    window.System.setWallpaperMode('tile');
                };
                reader.readAsDataURL(blob);
            });
        };
    }

    _onLaunch() {
        this.win.focus();
    }
}
