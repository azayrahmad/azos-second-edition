import { Application } from '../../core/Application.js';
import { createPdfViewerContent } from './pdfviewer.js';
import { $Window } from '../../components/os-gui/$Window.js';
import { MenuBar } from '../../components/os-gui/MenuBar.js';

export class PdfViewerApp extends Application {
    constructor(config) {
        super(config);
    }

    _createWindow(filePath) {
        const win = new $Window({
            title: this.title,
            outerWidth: this.width,
            outerHeight: this.height,
            resizable: this.resizable,
            icons: this.icon,
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