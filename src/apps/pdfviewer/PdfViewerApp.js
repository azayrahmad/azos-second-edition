import { Application } from '../Application.js';
import { createPdfViewerContent } from './pdfviewer.js';

export class PdfViewerApp extends Application {
    constructor() {
        super({
            id: 'pdfviewer',
            title: 'PDF Viewer',
            icon: new URL('../../assets/icons/word_001.ico', import.meta.url).href,
        });
    }

    _createWindow(filePath) {
        const win = new $Window({
            title: this.title,
            width: 800,
            height: 600,
            resizable: true,
        });

        const menuBar = new MenuBar({
            File: [
                {
                    label: "&Open",
                    action: () => alert("File picker not implemented."),
                    shortcutLabel: "Ctrl+O",
                },
                {
                    label: "&Close",
                    action: () => this.win.close(),
                    shortcutLabel: "Alt+F4",
                },
            ],
            Help: [
                {
                    label: "&About PDF Viewer",
                    action: () => alert("A simple PDF viewer."),
                },
            ],
        });
        win.setMenuBar(menuBar);

        const content = createPdfViewerContent(filePath);
        win.$content.html(content);

        return win;
    }
}