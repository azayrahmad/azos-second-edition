import { Application } from '../Application.js';
import './image-resizer.css';

export class ImageResizerApp extends Application {
    _onLaunch() {
        const win = this.win = new $Window({
            title: 'Image Resizer',
            width: 600,
            height: 480,
            resizable: true,
            icons: this.icon,
        });

        const menuBar = this._createMenuBar();
        win.setMenuBar(menuBar);

        win.content.innerHTML = this._getHTML();
        this.initApp();
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
            "&Help": [
                {
                    label: "&About Image Resizer",
                    action: () => this.showAboutDialog(),
                },
            ],
        });
    }

    _getHTML() {
        return `
            <div class="image-resizer-app">
                <div class="main-content">
                    <fieldset class="controls-group">
                        <legend>Resize Options</legend>
                        <div class="field-row-stacked" style="width: 120px;">
                            <label for="widthInput">Width (px):</label>
                            <input type="number" id="widthInput" min="1" value="800">
                        </div>
                        <div class="field-row-stacked" style="width: 120px;">
                            <label for="heightInput">Height (px):</label>
                            <input type="number" id="heightInput" min="1" value="600">
                        </div>
                        <div class="field-row" style="margin-top: 10px;">
                            <input type="checkbox" id="aspectRatio" checked>
                            <label for="aspectRatio">Keep Aspect Ratio</label>
                        </div>
                        <div class="buttons-container">
                            <button id="enlargeBtn" disabled>Enlarge</button>
                            <button id="downloadBtn" disabled>Download</button>
                        </div>
                    </fieldset>

                    <div class="preview-area" id="previewArea">
                        <div class="canvas-box">
                            <h3>Original</h3>
                            <div class="sunken-panel">
                                <canvas id="originalCanvas"></canvas>
                            </div>
                        </div>
                        <div class="canvas-box">
                            <h3>Enlarged</h3>
                            <div class="sunken-panel">
                                <canvas id="enlargedCanvas"></canvas>
                            </div>
                        </div>
                    </div>
                </div>
                <div class="status-bar" id="info">
                    <p class="status-bar-field">Drag an image onto the window or use File > Open</p>
                </div>
                <input type="file" id="fileInput" accept="image/*" style="display: none;">
            </div>
        `;
    }

    initApp() {
        const content = this.win.content;
        const fileInput = content.querySelector('#fileInput');
        const widthInput = content.querySelector('#widthInput');
        const heightInput = content.querySelector('#heightInput');
        const aspectRatio = content.querySelector('#aspectRatio');
        const enlargeBtn = content.querySelector('#enlargeBtn');
        const downloadBtn = content.querySelector('#downloadBtn');
        const previewArea = content.querySelector('#previewArea');
        const originalCanvas = content.querySelector('#originalCanvas');
        const enlargedCanvas = content.querySelector('#enlargedCanvas');
        const info = content.querySelector('#info');
        const appContainer = content.querySelector('.image-resizer-app');

        let originalImage = null;
        let isUpdatingDimensions = false;

        this.openFile = () => fileInput.click();

        this.showAboutDialog = () => {
            alert("Image Resizer v1.0\\n\\nResizes images with pixel-perfect precision.");
        };

        // Make the entire window content the drop target
        content.addEventListener('dragover', (e) => {
            e.preventDefault();
            e.stopPropagation();
            appContainer.classList.add('dragover');
        });

        content.addEventListener('dragleave', (e) => {
            e.preventDefault();
            e.stopPropagation();
            appContainer.classList.remove('dragover');
        });

        content.addEventListener('drop', (e) => {
            e.preventDefault();
            e.stopPropagation();
            appContainer.classList.remove('dragover');
            const file = e.dataTransfer.files[0];
            if (file && file.type.startsWith('image/')) {
                loadImage(file);
            }
        });

        fileInput.addEventListener('change', (e) => {
            const file = e.target.files[0];
            if (file) {
                loadImage(file);
            }
        });

        function loadImage(file) {
            const reader = new FileReader();
            reader.onload = (e) => {
                const img = new Image();
                img.onload = () => {
                    originalImage = img;
                    drawOriginal();

                    widthInput.value = img.width * 4;
                    heightInput.value = img.height * 4;

                    enlargeBtn.disabled = false;
                    previewArea.style.display = 'flex'; // Make visible
                };
                img.src = e.target.result;
            };
            reader.readAsDataURL(file);
        }

        function drawOriginal() {
            originalCanvas.width = originalImage.width;
            originalCanvas.height = originalImage.height;
            const ctx = originalCanvas.getContext('2d');
            ctx.drawImage(originalImage, 0, 0);
        }

        widthInput.addEventListener('input', () => {
            if (aspectRatio.checked && originalImage && !isUpdatingDimensions) {
                isUpdatingDimensions = true;
                const ratio = originalImage.height / originalImage.width;
                heightInput.value = Math.round(widthInput.value * ratio);
                isUpdatingDimensions = false;
            }
        });

        heightInput.addEventListener('input', () => {
            if (aspectRatio.checked && originalImage && !isUpdatingDimensions) {
                isUpdatingDimensions = true;
                const ratio = originalImage.width / originalImage.height;
                widthInput.value = Math.round(heightInput.value * ratio);
                isUpdatingDimensions = false;
            }
        });

        enlargeBtn.addEventListener('click', enlargeImage);

        function enlargeImage() {
            if (!originalImage) return;

            const targetWidth = parseInt(widthInput.value);
            const targetHeight = parseInt(heightInput.value);
            const scaleX = targetWidth / originalImage.width;
            const scaleY = targetHeight / originalImage.height;
            const scale = Math.min(scaleX, scaleY);

            const newWidth = Math.round(originalImage.width * scale);
            const newHeight = Math.round(originalImage.height * scale);

            const srcCanvas = document.createElement('canvas');
            srcCanvas.width = originalImage.width;
            srcCanvas.height = originalImage.height;
            const srcCtx = srcCanvas.getContext('2d');
            srcCtx.drawImage(originalImage, 0, 0);
            const srcData = srcCtx.getImageData(0, 0, srcCanvas.width, srcCanvas.height);
            const srcPixels = srcData.data;

            enlargedCanvas.width = newWidth;
            enlargedCanvas.height = newHeight;
            const dstCtx = enlargedCanvas.getContext('2d');
            const dstData = dstCtx.createImageData(newWidth, newHeight);
            const dstPixels = dstData.data;

            for (let dstY = 0; dstY < newHeight; dstY++) {
                for (let dstX = 0; dstX < newWidth; dstX++) {
                    const srcX = Math.floor(dstX / scale);
                    const srcY = Math.floor(dstY / scale);

                    const srcIdx = (srcY * originalImage.width + srcX) * 4;
                    const dstIdx = (dstY * newWidth + dstX) * 4;

                    dstPixels[dstIdx] = srcPixels[srcIdx];
                    dstPixels[dstIdx + 1] = srcPixels[srcIdx + 1];
                    dstPixels[dstIdx + 2] = srcPixels[srcIdx + 2];
                    dstPixels[dstIdx + 3] = srcPixels[srcIdx + 3];
                }
            }

            dstCtx.putImageData(dstData, 0, 0);
            downloadBtn.disabled = false;

            info.innerHTML = `
                <p class="status-bar-field">Original: ${originalImage.width}×${originalImage.height}px</p>
                <p class="status-bar-field">Enlarged: ${newWidth}×${newHeight}px (${scale.toFixed(2)}× scale)</p>
            `;
        }

        downloadBtn.addEventListener('click', () => {
            const link = document.createElement('a');
            link.download = `enlarged_${enlargedCanvas.width}x${enlargedCanvas.height}.png`;
            link.href = enlargedCanvas.toDataURL('image/png');
            link.click();
        });
    }
}
