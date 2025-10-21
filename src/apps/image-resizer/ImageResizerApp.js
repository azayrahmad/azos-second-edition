import { Application } from '../Application.js';
import './image-resizer.css';

export class ImageResizerApp extends Application {
    _onLaunch() {
        const win = this.win = new $Window({
            title: 'Image Resizer',
            width: 920,
            height: 720,
            resizable: true,
            icons: this.icon,
        });

        win.content.style.overflow = 'hidden';
        win.content.innerHTML = `
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
        `;
        this.initApp();
    }

    initApp() {
        const content = this.win.content;
        const uploadArea = content.querySelector('#uploadArea');
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

        let originalImage = null;
        let isUpdatingDimensions = false;

        // Upload area interactions
        uploadArea.addEventListener('click', () => fileInput.click());

        uploadArea.addEventListener('dragover', (e) => {
            e.preventDefault();
            uploadArea.classList.add('dragover');
        });

        uploadArea.addEventListener('dragleave', () => {
            uploadArea.classList.remove('dragover');
        });

        uploadArea.addEventListener('drop', (e) => {
            e.preventDefault();
            uploadArea.classList.remove('dragover');
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

                    // Set default dimensions to 4x the original
                    widthInput.value = img.width * 4;
                    heightInput.value = img.height * 4;

                    enlargeBtn.disabled = false;
                    previewArea.classList.add('active');
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

        // Handle aspect ratio maintenance
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

            enlargedCanvas.width = newWidth;
            enlargedCanvas.height = newHeight;
            const dstCtx = enlargedCanvas.getContext('2d');
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
            downloadBtn.disabled = false;

            info.innerHTML = `
                <strong>Original:</strong> ${originalImage.width}×${originalImage.height}px<br>
                <strong>Target:</strong> ${targetWidth}×${targetHeight}px<br>
                <strong>Enlarged:</strong> ${newWidth}×${newHeight}px (${scale.toFixed(2)}× scale)<br>
                <strong>Method:</strong> Pixel-perfect nearest-neighbor scaling (no interpolation)
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
