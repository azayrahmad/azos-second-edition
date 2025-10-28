import { Application } from '../Application.js';
import './imageviewer.css';

export class ImageViewerApp extends Application {
    constructor(config) {
        super(config);
        this.file = null;
        this.zoomLevel = 1;
        this.zoomStep = 0.1;
    }

    _createWindow(file) {
        const title = file ? `${file.name} - Image Viewer` : 'Image Viewer';
        this.file = file;

        const win = new $Window({
            title: title,
            outerWidth: this.width || 400,
            outerHeight: this.height || 300,
            resizable: this.resizable,
            icons: this.icon,
            id: this.id,
        });

        const menuBar = this._createMenuBar();
        win.setMenuBar(menuBar);

        win.$content.append('<div class="image-viewer-container"><img /></div>');
        return win;
    }

    _createMenuBar() {
        return new MenuBar({
            "&File": [
                {
                    label: "&Open...",
                    action: () => this.openFile(),
                },
                "MENU_DIVIDER",
                {
                    label: "E&xit",
                    action: () => this.win.close(),
                },
            ],
            "&View": [
                {
                    label: "Zoom &In",
                    shortcutLabel: "Ctrl++",
                    action: () => this.zoomIn(),
                },
                {
                    label: "Zoom &Out",
                    shortcutLabel: "Ctrl+-",
                    action: () => this.zoomOut(),
                },
                {
                    label: "&Reset Zoom",
                    shortcutLabel: "Ctrl+0",
                    action: () => this.resetZoom(),
                },
            ],
            "&Help": [
                {
                    label: "&About Image Viewer",
                    action: () => alert("A simple image viewer built for azOS."),
                },
            ],
        });
    }

    async _onLaunch(file) {
        this.img = this.win.$content.find('img')[0];

        if (file) {
            this.loadFile(file);
        } else {
            console.log('Image Viewer launched without a file.');
        }
    }

    loadFile(file) {
        this.win.title(`${file.name} - Image Viewer`);
        const reader = new FileReader();
        reader.onload = (e) => {
            this.img.src = e.target.result;
            this.img.onload = () => {
                this.resetZoom();
                this._adjustWindowSize(this.img);
            };
        };
        reader.readAsDataURL(file);
    }

    openFile() {
        const input = document.createElement('input');
        input.type = 'file';
        input.accept = 'image/*';
        input.onchange = e => {
            const file = e.target.files[0];
            if (file) {
                this.loadFile(file);
            }
        };
        input.click();
    }

    _adjustWindowSize(img) {
        const desktop = document.querySelector('.desktop');
        const desktopRect = desktop.getBoundingClientRect();

        const padding = 20; // 10px margin on each side
        const titleBarHeight = this.win.element.querySelector('.window-title-bar').offsetHeight;
        const menuBarHeight = this.win.element.querySelector('.menus')?.offsetHeight || 0;
        const windowBorders = this.win.element.offsetWidth - this.win.element.clientWidth;


        const maxInnerWidth = desktopRect.width - padding - windowBorders;
        const maxInnerHeight = desktopRect.height - padding - titleBarHeight - menuBarHeight;

        const imgWidth = img.naturalWidth;
        const imgHeight = img.naturalHeight;

        let newInnerWidth = Math.max(this.win.options.innerWidth || 380, imgWidth);
        let newInnerHeight = Math.max(this.win.options.innerHeight || 260, imgHeight);

        const aspectRatio = imgWidth / imgHeight;

        if (newInnerWidth > maxInnerWidth) {
            newInnerWidth = maxInnerWidth;
            newInnerHeight = newInnerWidth / aspectRatio;
        }

        if (newInnerHeight > maxInnerHeight) {
            newInnerHeight = maxInnerHeight;
            newInnerWidth = newInnerHeight * aspectRatio;
        }

        this.win.resize(Math.round(newInnerWidth), Math.round(newInnerHeight), true);
        this.win.center();
    }

    zoomIn() {
        this.zoomLevel += this.zoomStep;
        this.applyZoom();
    }

    zoomOut() {
        this.zoomLevel = Math.max(0.1, this.zoomLevel - this.zoomStep);
        this.applyZoom();
    }

    resetZoom() {
        this.zoomLevel = 1;
        this.applyZoom();
    }

    applyZoom() {
        if (this.img) {
            this.img.style.transform = `scale(${this.zoomLevel})`;
            this.img.style.maxWidth = this.zoomLevel === 1 ? '100%' : 'none';
            this.img.style.maxHeight = this.zoomLevel === 1 ? '100%' : 'none';
        }
    }
}
