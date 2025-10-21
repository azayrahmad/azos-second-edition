import { Application } from '../Application.js';
import './image-resizer.css';

export class ImageResizerApp extends Application {
    _createWindow() {
        const win = this.win = new $Window({
            title: 'Image Resizer',
            width: 920,
            height: 720,
            resizable: true,
            icons: this.icon,
        });

        // win.$content.style.overflow = 'hidden';
        win.$content.append(`
            <div class="container image-resizer-app">
                <h1>🎨 Pixel Perfect Image Enlarger</h1>
                <p class="subtitle">Upload an image and enlarge it with crisp, pixel-perfect scaling</p>

                <div class="upload-area" id="uploadArea">
                    <p style="font-size: 18px; margin-bottom: 10px;">📁 Click or drag an image here</p>
                    <p style="color: #999; font-size: 14px;">Supports PNG, JPG, GIF, and more</p>
                    <input type="file" id="fileInput" accept="image/*">
                </div>

                <div class="controls">
                    <label for="widthInput">Width (px):</label>
                    <input type="number" id="widthInput" min="1" value="800">
                    <label for="heightInput">Height (px):</label>
                    <input type="number" id="heightInput" min="1" value="600">
                    <label style="display: flex; align-items: center; gap: 5px;">
                        <input type="checkbox" id="aspectRatio" checked>
                        Keep Aspect Ratio
                    </label>
                    <button id="enlargeBtn" disabled>Enlarge Image</button>
                    <button id="downloadBtn" disabled>Download Result</button>
                </div>

                <div class="preview-area" id="previewArea">
                    <div class="canvas-container">
                        <div class="canvas-box">
                            <h3>Original Image</h3>
                            <canvas id="originalCanvas"></canvas>
                        </div>
                        <div class="canvas-box">
                            <h3>Enlarged Image</h3>
                            <canvas id="enlargedCanvas"></canvas>
                        </div>
                    </div>
                    <div class="info" id="info"></div>
                </div>
            </div>
        `);
        this.initApp();
    }

    initApp() {
        const content = this.win.$content;
        const elements = {
            uploadArea: content.find('#uploadArea')[0],
            fileInput: content.find('#fileInput')[0],
            widthInput: content.find('#widthInput')[0],
            heightInput: content.find('#heightInput')[0],
            aspectRatio: content.find('#aspectRatio')[0],
            enlargeBtn: content.find('#enlargeBtn')[0],
            downloadBtn: content.find('#downloadBtn')[0],
            previewArea: content.find('#previewArea')[0],
            originalCanvas: content.find('#originalCanvas')[0],
            enlargedCanvas: content.find('#enlargedCanvas')[0],
            info: content.find('#info')[0]
        };

        let originalImage = null;
        let isUpdatingDimensions = false;

        // Upload area interactions
        elements.uploadArea.addEventListener('click', () => elements.fileInput.click());

        elements.uploadArea.addEventListener('dragover', (e) => {
            e.preventDefault();
            elements.uploadArea.classList.add('dragover');
        });

        elements.uploadArea.addEventListener('dragleave', () => {
            elements.uploadArea.classList.remove('dragover');
        });

        elements.uploadArea.addEventListener('drop', (e) => {
            e.preventDefault();
            elements.uploadArea.classList.remove('dragover');
            const file = e.dataTransfer.files[0];
            if (file && file.type.startsWith('image/')) {
                loadImage(file);
            }
        });

        elements.fileInput.addEventListener('change', (e) => {
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

                    // Set default dimensions to 4x the original
                    elements.widthInput.value = img.width * 4;
                    elements.heightInput.value = img.height * 4;

                    elements.enlargeBtn.disabled = false;
                    elements.previewArea.classList.add('active');
                };
                img.src = e.target.result;
            };
            reader.readAsDataURL(file);
        }

        function drawOriginal() {
            elements.originalCanvas.width = originalImage.width;
            elements.originalCanvas.height = originalImage.height;
            const ctx = elements.originalCanvas.getContext('2d');
            ctx.drawImage(originalImage, 0, 0);
        }

        // Handle aspect ratio maintenance
        elements.widthInput.addEventListener('input', () => {
            if (elements.aspectRatio.checked && originalImage && !isUpdatingDimensions) {
                isUpdatingDimensions = true;
                const ratio = originalImage.height / originalImage.width;
                elements.heightInput.value = Math.round(elements.widthInput.value * ratio);
                isUpdatingDimensions = false;
            }
        });

        elements.heightInput.addEventListener('input', () => {
            if (elements.aspectRatio.checked && originalImage && !isUpdatingDimensions) {
                isUpdatingDimensions = true;
                const ratio = originalImage.width / originalImage.height;
                elements.widthInput.value = Math.round(elements.heightInput.value * ratio);
                isUpdatingDimensions = false;
            }
        });

        elements.enlargeBtn.addEventListener('click', enlargeImage);

        function enlargeImage() {
            if (!originalImage) return;

            const targetWidth = parseInt(elements.widthInput.value);
            const targetHeight = parseInt(elements.heightInput.value);

            // Calculate scale factors for width and height
            const scaleX = targetWidth / originalImage.width;
            const scaleY = targetHeight / originalImage.height;

            // Use the smaller scale to maintain aspect ratio within target dimensions
            const scale = Math.min(scaleX, scaleY);

            // Calculate actual output dimensions (maintaining aspect ratio)
            const newWidth = Math.round(originalImage.width * scale);
            const newHeight = Math.round(originalImage.height * scale);

            const srcCanvas = document.createElement('canvas');
            srcCanvas.width = originalImage.width;
            srcCanvas.height = originalImage.height;
            const srcCtx = srcCanvas.getContext('2d');
            srcCtx.drawImage(originalImage, 0, 0);

            const srcData = srcCtx.getImageData(0, 0, srcCanvas.width, srcCanvas.height);
            const srcPixels = srcData.data;

            elements.enlargedCanvas.width = newWidth;
            elements.enlargedCanvas.height = newHeight;
            const dstCtx = elements.enlargedCanvas.getContext('2d');
            const dstData = dstCtx.createImageData(newWidth, newHeight);
            const dstPixels = dstData.data;

            // Pixel-perfect scaling using nearest neighbor
            for (let dstY = 0; dstY < newHeight; dstY++) {
                for (let dstX = 0; dstX < newWidth; dstX++) {
                    // Map destination pixel back to source pixel (nearest neighbor)
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
            elements.downloadBtn.disabled = false;

            elements.info.innerHTML = `
                <strong>Original:</strong> ${originalImage.width}×${originalImage.height}px<br>
                <strong>Target:</strong> ${targetWidth}×${targetHeight}px<br>
                <strong>Enlarged:</strong> ${newWidth}×${newHeight}px (${scale.toFixed(2)}× scale)<br>
                <strong>Method:</strong> Pixel-perfect nearest-neighbor scaling (no interpolation)
            `;
        }

        elements.downloadBtn.addEventListener('click', () => {
            const link = document.createElement('a');
            link.download = `enlarged_${elements.enlargedCanvas.width}x${elements.enlargedCanvas.height}.png`;
            link.href = elements.enlargedCanvas.toDataURL('image/png');
            link.click();
        });
    }
}
