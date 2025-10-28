import { Application } from "../Application.js";
import { ShowDialogWindow } from "../../components/DialogWindow.js";
import "./imageviewer.css";

export class ImageViewerApp extends Application {
  constructor(config) {
    super(config);
    this.file = null;
    this.zoomLevel = 1;
    this.zoomStep = 0.1;
  }

  _createWindow(file) {
    const title = file ? `${file.name} - Image Viewer` : "Image Viewer";
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
        {
          label: "&Save",
          action: () => this.saveFile(),
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
          shortcutLabel: "Scroll Up",
          action: () => this.zoomIn(),
        },
        {
          label: "Zoom &Out",
          shortcutLabel: "Scroll Down",
          action: () => this.zoomOut(),
        },
        {
          label: "&Reset Zoom",
          action: () => this.resetZoom(),
        },
      ],
      "&Edit": [
        {
          label: "&Resize...",
          action: () => this.showResizeDialog(),
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
    this.img = this.win.$content.find("img")[0];

    if (file) {
      this.loadFile(file);
    } else {
      console.log("Image Viewer launched without a file.");
    }

    const imageContainer = this.win.$content.find(".image-viewer-container")[0];
    imageContainer.addEventListener("wheel", (e) => {
      e.preventDefault(); // Prevent page scrolling
      if (e.deltaY < 0) {
        this.zoomIn();
      } else {
        this.zoomOut();
      }
    });
  }

  loadFile(file) {
    this.file = file; // Update the current file being viewed
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
    const input = document.createElement("input");
    input.type = "file";
    input.accept = "image/*";
    input.onchange = (e) => {
      const file = e.target.files[0];
      if (file) {
        this.loadFile(file);
      }
    };
    input.click();
  }

  saveFile() {
    if (!this.img || !this.img.src) {
      alert("There is no image to save.");
      return;
    }

    const link = document.createElement("a");
    link.href = this.img.src;
    link.download = this.file
      ? `resized-${this.file.name}`
      : "resized-image.png";
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  }

  _adjustWindowSize(img) {
    const desktop = document.querySelector(".desktop");
    const desktopRect = desktop.getBoundingClientRect();

    const padding = 20; // 10px margin on each side
    const titleBarHeight =
      this.win.element.querySelector(".window-title-bar").offsetHeight;
    const menuBarHeight =
      this.win.element.querySelector(".menus")?.offsetHeight || 0;
    const windowBorders =
      this.win.element.offsetWidth - this.win.element.clientWidth;

    const maxInnerWidth = desktopRect.width - padding - windowBorders;
    const maxInnerHeight =
      desktopRect.height - padding - titleBarHeight - menuBarHeight;

    const imgWidth = img.naturalWidth;
    const imgHeight = img.naturalHeight;

    let newInnerWidth = Math.max(this.win.options.innerWidth || 380, imgWidth);
    let newInnerHeight = Math.max(
      this.win.options.innerHeight || 260,
      imgHeight,
    );

    const aspectRatio = imgWidth / imgHeight;

    if (newInnerWidth > maxInnerWidth) {
      newInnerWidth = maxInnerWidth;
      newInnerHeight = newInnerWidth / aspectRatio;
    }

    if (newInnerHeight > maxInnerHeight) {
      newInnerHeight = maxInnerHeight;
      newInnerWidth = newInnerHeight * aspectRatio;
    }

    this.win.resize(
      Math.round(newInnerWidth),
      Math.round(newInnerHeight),
      true,
    );
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
      this.img.style.maxWidth = this.zoomLevel === 1 ? "100%" : "none";
      this.img.style.maxHeight = this.zoomLevel === 1 ? "100%" : "none";
    }
  }

  showResizeDialog() {
    if (!this.img || !this.img.src) {
      alert("Please open an image first.");
      return;
    }

    const originalWidth = this.img.naturalWidth;
    const originalHeight = this.img.naturalHeight;

    const dialogContent = `
            <div class="resize-controls">
                <div class="field-row-stacked">
                    <label for="widthInput">Width (px):</label>
                    <input type="number" id="widthInput" min="1" value="${originalWidth}">
                </div>
                <div class="field-row-stacked">
                    <label for="heightInput">Height (px):</label>
                    <input type="number" id="heightInput" min="1" value="${originalHeight}">
                </div>
                <div class="field-row" style="margin-top: 10px;">
                    <input type="checkbox" id="aspectRatio" checked>
                    <label for="aspectRatio">Keep Aspect Ratio</label>
                </div>
            </div>
        `;

    const dialog = ShowDialogWindow({
      title: "Resize Image",
      text: dialogContent,
      modal: true,
      buttons: [
        {
          label: "Resize",
          action: (win) => {
            const widthInput = win.$content.find("#widthInput")[0];
            const heightInput = win.$content.find("#heightInput")[0];
            const newWidth = parseInt(widthInput.value, 10);
            const newHeight = parseInt(heightInput.value, 10);
            this.resizeImage(newWidth, newHeight);
          },
          isDefault: true,
        },
        {
          label: "Cancel",
          action: () => {},
        },
      ],
    });

    // Add aspect ratio logic
    const widthInput = dialog.$content.find("#widthInput")[0];
    const heightInput = dialog.$content.find("#heightInput")[0];
    const aspectRatioCheckbox = dialog.$content.find("#aspectRatio")[0];
    let isUpdatingDimensions = false;

    const updateDimensions = (event) => {
      if (isUpdatingDimensions || !aspectRatioCheckbox.checked) return;

      isUpdatingDimensions = true;
      const ratio = originalHeight / originalWidth;
      if (event.target === widthInput) {
        heightInput.value = Math.round(widthInput.value * ratio);
      } else {
        widthInput.value = Math.round(heightInput.value / ratio);
      }
      isUpdatingDimensions = false;
    };

    widthInput.addEventListener("input", updateDimensions);
    heightInput.addEventListener("input", updateDimensions);
  }

  resizeImage(width, height) {
    if (!this.img || !this.img.src || !width || !height) {
      return;
    }

    const canvas = document.createElement("canvas");
    canvas.width = width;
    canvas.height = height;
    const ctx = canvas.getContext("2d");

    // Create a temporary canvas to get the original image's pixel data
    const originalCanvas = document.createElement("canvas");
    originalCanvas.width = this.img.naturalWidth;
    originalCanvas.height = this.img.naturalHeight;
    const originalCtx = originalCanvas.getContext("2d");
    originalCtx.drawImage(this.img, 0, 0);
    const originalData = originalCtx.getImageData(
      0,
      0,
      originalCanvas.width,
      originalCanvas.height,
    );
    const originalPixels = originalData.data;

    // Create ImageData for the new dimensions
    const newImageData = ctx.createImageData(width, height);
    const newPixels = newImageData.data;

    const scaleX = originalCanvas.width / width;
    const scaleY = originalCanvas.height / height;

    for (let y = 0; y < height; y++) {
      for (let x = 0; x < width; x++) {
        const srcX = Math.floor(x * scaleX);
        const srcY = Math.floor(y * scaleY);

        const srcIdx = (srcY * originalCanvas.width + srcX) * 4;
        const dstIdx = (y * width + x) * 4;

        newPixels[dstIdx] = originalPixels[srcIdx]; // R
        newPixels[dstIdx + 1] = originalPixels[srcIdx + 1]; // G
        newPixels[dstIdx + 2] = originalPixels[srcIdx + 2]; // B
        newPixels[dstIdx + 3] = originalPixels[srcIdx + 3]; // A
      }
    }

    // Put the resized image data onto the canvas
    ctx.putImageData(newImageData, 0, 0);

    // Get the new image as a data URL
    const dataUrl = canvas.toDataURL(); // Defaults to PNG

    // Update the image source
    this.img.src = dataUrl;
    this.img.onload = () => {
      // Reset zoom and adjust window after resize
      this.resetZoom();
      this._adjustWindowSize(this.img);
    };
  }
}
