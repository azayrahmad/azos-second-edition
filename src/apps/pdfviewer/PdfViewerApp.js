import { Application } from '../Application.js';
import { createPdfViewerContent } from './pdfviewer.js';

export class PdfViewerApp extends Application {
    constructor(config) {
        super(config);
        pdfjsLib.GlobalWorkerOptions.workerSrc = 'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/2.6.347/pdf.worker.min.js';
    }

    _createWindow() {
        this.win = new $Window({
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
                    action: () => this._openFile(),
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
        this.win.setMenuBar(menuBar);

        const content = createPdfViewerContent();
        this.win.$content.html(content);

        return this.win;
    }

    _openFile() {
        const input = document.createElement('input');
        input.type = 'file';
        input.accept = '.pdf';
        input.onchange = (e) => {
            const file = e.target.files[0];
            if (!file) {
                return;
            }

            const reader = new FileReader();
            reader.onload = (event) => {
                const pdfData = new Uint8Array(event.target.result);
                this._renderPdf(pdfData);
                this.win.setTitle(`${file.name} - ${this.title}`);
            };
            reader.readAsArrayBuffer(file);
        };
        input.click();
    }

    async _renderPdf(pdfData) {
        const placeholder = this.win.$content.find('.pdf-viewer-placeholder');
        const canvas = this.win.$content.find('.pdf-canvas')[0];
        const context = canvas.getContext('2d');

        try {
            const pdf = await pdfjsLib.getDocument({ data: pdfData }).promise;
            const page = await pdf.getPage(1); // Render the first page

            const viewport = page.getViewport({ scale: 1.5 });
            canvas.height = viewport.height;
            canvas.width = viewport.width;

            const renderContext = {
                canvasContext: context,
                viewport: viewport,
            };
            await page.render(renderContext).promise;

            placeholder.hide();
            $(canvas).show();
        } catch (error) {
            console.error('Error rendering PDF:', error);
            placeholder.text('Failed to load PDF.');
            placeholder.show();
            $(canvas).hide();
        }
    }
}
