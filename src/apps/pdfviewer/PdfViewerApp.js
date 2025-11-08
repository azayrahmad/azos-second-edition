import { Application } from '../Application.js';
import { createPdfViewerContent } from './pdfviewer.js';

export class PdfViewerApp extends Application {
    constructor(config) {
        super(config);
        pdfjsLib.GlobalWorkerOptions.workerSrc = 'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/2.6.347/pdf.worker.min.js';
        this.pdfDoc = null;
        this.pageNum = 1;
        this.zoomLevel = 1.0;
        this.isPanning = false;
        this.startX = 0;
        this.startY = 0;
        this.scrollLeft = 0;
        this.scrollTop = 0;
    }

    _createWindow() {
        this.win = new $Window({
            title: this.title,
            outerWidth: this.width,
            outerHeight: this.height,
            resizable: this.resizable,
            icons: this.icon,
        });

        const menuBar = this._createMenuBar();
        this.win.setMenuBar(menuBar);

        const toolbar = this._createToolbar();
        this.win.setToolbar(toolbar);

        const content = createPdfViewerContent();
        this.win.$content.html(content);

        this._initPanning();

        return this.win;
    }

    _createMenuBar() {
        return new MenuBar({
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
    }

    _createToolbar() {
        this.toolbar = new Toolbar({
            items: [
                {
                    type: 'button',
                    label: 'Prev',
                    action: () => this.onPrevPage()
                },
                {
                    type: 'text',
                    id: 'page-num',
                    value: '0',
                    width: 30,
                    action: (value) => this.goToPage(value)
                },
                {
                    type: 'label',
                    id: 'page-count',
                    label: '/ 0'
                },
                {
                    type: 'button',
                    label: 'Next',
                    action: () => this.onNextPage()
                },
                {
                    type: 'separator'
                },
                {
                    type: 'button',
                    label: 'Zoom In',
                    action: () => this.zoomIn()
                },
                {
                    type: 'button',
                    label: 'Zoom Out',
                    action: () => this.zoomOut()
                },
                {
                    type: 'button',
                    label: 'Fit Width',
                    action: () => this.fitWidth()
                }
            ]
        });
        return this.toolbar;
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
                this._loadPdf(pdfData);
                this.win.setTitle(`${file.name} - ${this.title}`);
            };
            reader.readAsArrayBuffer(file);
        };
        input.click();
    }

    async _loadPdf(pdfData) {
        try {
            this.pdfDoc = await pdfjsLib.getDocument({ data: pdfData }).promise;
            this.pageNum = 1;
            this._renderPage(this.pageNum);
        } catch (error) {
            console.error('Error loading PDF:', error);
            const placeholder = this.win.$content.find('.pdf-viewer-placeholder');
            placeholder.text('Failed to load PDF.');
            placeholder.show();
            $(this.win.$content.find('.pdf-canvas')[0]).hide();
        }
    }


    onPrevPage() {
        if (this.pageNum <= 1) {
            return;
        }
        this.pageNum--;
        this._renderPage(this.pageNum);
    }

    onNextPage() {
        if (this.pageNum >= this.pdfDoc.numPages) {
            return;
        }
        this.pageNum++;
        this._renderPage(this.pageNum);
    }

    goToPage(num) {
        const pageNum = parseInt(num, 10);
        if (pageNum > 0 && pageNum <= this.pdfDoc.numPages) {
            this.pageNum = pageNum;
            this._renderPage(this.pageNum);
        }
    }

    zoomIn() {
        this.zoomLevel += 0.2;
        this._renderPage(this.pageNum);
    }

    zoomOut() {
        this.zoomLevel = Math.max(0.2, this.zoomLevel - 0.2);
        this._renderPage(this.pageNum);
    }

    fitWidth() {
        this.pdfDoc.getPage(this.pageNum).then(page => {
            const container = this.win.$content.find('.pdf-viewer-content')[0];
            const scale = container.clientWidth / page.getViewport({ scale: 1 }).width;
            this.zoomLevel = scale;
            this._renderPage(this.pageNum);
        });
    }

    async _renderPage(num) {
        if (!this.pdfDoc) {
            return;
        }

        const page = await this.pdfDoc.getPage(num);
        const canvas = this.win.$content.find('.pdf-canvas')[0];
        const context = canvas.getContext('2d');

        // Fit to width by default
        if (this.zoomLevel === 1.0) {
            const container = this.win.$content.find('.pdf-viewer-content')[0];
            const scale = container.clientWidth / page.getViewport({ scale: 1 }).width;
            this.zoomLevel = scale;
        }

        const viewport = page.getViewport({ scale: this.zoomLevel });
        canvas.height = viewport.height;
        canvas.width = viewport.width;

        const renderContext = {
            canvasContext: context,
            viewport: viewport,
        };
        await page.render(renderContext).promise;

        this.win.$content.find('.pdf-viewer-placeholder').hide();
        $(canvas).show();

        this.toolbar.setItemValue('page-num', this.pageNum);
        this.toolbar.setItemLabel('page-count', `/ ${this.pdfDoc.numPages}`);
    }

    _initPanning() {
        const container = this.win.$content.find('.pdf-viewer-content')[0];

        const startPanning = (e) => {
            e.preventDefault();
            this.isPanning = true;
            this.startX = e.pageX - container.offsetLeft;
            this.startY = e.pageY - container.offsetTop;
            this.scrollLeft = container.scrollLeft;
            this.scrollTop = container.scrollTop;
            container.style.cursor = 'grabbing';
        };

        const stopPanning = () => {
            this.isPanning = false;
            container.style.cursor = 'grab';
        };

        const doPan = (e) => {
            if (!this.isPanning) return;
            e.preventDefault();
            const x = e.pageX - container.offsetLeft;
            const y = e.pageY - container.offsetTop;
            const walkX = (x - this.startX);
            const walkY = (y - this.startY);
            container.scrollLeft = this.scrollLeft - walkX;
            container.scrollTop = this.scrollTop - walkY;
        };

        container.addEventListener('mousedown', startPanning);
        container.addEventListener('mouseup', stopPanning);
        container.addEventListener('mouseleave', stopPanning);
        container.addEventListener('mousemove', doPan);
    }
}
