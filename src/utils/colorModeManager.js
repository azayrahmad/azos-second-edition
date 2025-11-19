import { getItem, setItem, LOCAL_STORAGE_KEYS } from "./localStorage.js";

const html2canvas = window.html2canvas;

const WIN98_PALETTE = [
    [0, 0, 0], [128, 0, 0], [0, 128, 0], [128, 128, 0], [0, 0, 128], [128, 0, 128], [0, 128, 128], [192, 192, 192],
    [128, 128, 128], [255, 0, 0], [0, 255, 0], [255, 255, 0], [0, 0, 255], [255, 0, 255], [0, 255, 255], [255, 255, 255],
    [0, 0, 0], [0, 0, 85], [0, 0, 170], [0, 0, 255], [0, 85, 0], [0, 85, 85], [0, 85, 170], [0, 85, 255],
    [0, 170, 0], [0, 170, 85], [0, 170, 170], [0, 170, 255], [0, 255, 0], [0, 255, 85], [0, 255, 170], [0, 255, 255],
    [85, 0, 0], [85, 0, 85], [85, 0, 170], [85, 0, 255], [85, 85, 0], [85, 85, 85], [85, 85, 170], [85, 85, 255],
    [85, 170, 0], [85, 170, 85], [85, 170, 170], [85, 170, 255], [85, 255, 0], [85, 255, 85], [85, 255, 170], [85, 255, 255],
    [170, 0, 0], [170, 0, 85], [170, 0, 170], [170, 0, 255], [170, 85, 0], [170, 85, 85], [170, 85, 170], [170, 85, 255],
    [170, 170, 0], [170, 170, 85], [170, 170, 170], [170, 170, 255], [170, 255, 0], [170, 255, 85], [170, 255, 170], [170, 255, 255],
    [255, 0, 0], [255, 0, 85], [255, 0, 170], [255, 0, 255], [255, 85, 0], [255, 85, 85], [255, 85, 170], [255, 85, 255],
    [255, 170, 0], [255, 170, 85], [255, 170, 170], [255, 170, 255], [255, 255, 0], [255, 255, 85], [255, 255, 170], [255, 255, 255],
    [0, 51, 102], [51, 153, 204], [255, 255, 204], [204, 255, 255], [102, 0, 102], [255, 128, 128], [0, 102, 204], [204, 204, 255],
    [0, 0, 128], [255, 0, 255], [255, 255, 0], [0, 255, 255], [128, 0, 128], [128, 0, 0], [0, 128, 128], [0, 0, 255],
    [0, 204, 255], [102, 102, 153], [153, 51, 0], [0, 51, 0], [0, 51, 102], [51, 51, 0], [51, 51, 51], [51, 204, 204],
    [236, 233, 216], [221, 221, 221], [222, 222, 222], [223, 223, 223], [224, 224, 224], [225, 225, 225], [226, 226, 226], [227, 227, 227],
    [228, 228, 228], [229, 229, 229], [230, 230, 230], [231, 231, 231], [232, 232, 232], [233, 233, 233], [234, 234, 234], [235, 235, 235],
    [236, 236, 236], [237, 237, 237], [238, 238, 238], [239, 239, 239], [240, 240, 240], [241, 241, 241], [242, 242, 242], [243, 243, 243],
    [244, 244, 244], [245, 245, 245], [246, 246, 246], [247, 247, 247], [248, 248, 248], [249, 249, 249], [250, 250, 250], [251, 251, 251],
    [252, 252, 252], [253, 253, 253], [254, 254, 254], [255, 255, 255], [0, 0, 0], [240, 251, 255], [16, 28, 128], [240, 251, 255]
].slice(0, 256);

const VGA16_PALETTE = [
  [0, 0, 0], [0, 0, 170], [0, 170, 0], [0, 170, 170],
  [170, 0, 0], [170, 0, 170], [170, 85, 0], [170, 170, 170],
  [85, 85, 85], [85, 85, 255], [85, 255, 85], [85, 255, 255],
  [255, 85, 85], [255, 85, 255], [255, 255, 85], [255, 255, 255]
];

const COLOR_MODES = {
  'true': { name: 'True Color (24-bit)', palette: null },
  'high': { name: 'High Color (16-bit)', palette: 'rgb565' },
  '256': { name: '256 Colors (8-bit)', palette: WIN98_PALETTE },
  '16': { name: '16 Colors (4-bit)', palette: VGA16_PALETTE },
};

let worker = null;
let overlay = null;
let targetElement = null;

function getWorker() {
    if (!worker) {
        worker = new Worker(new URL('./colorModeWorker.js', import.meta.url), { type: 'module' });
    }
    return worker;
}

async function applyColorMode(mode) {
    if (mode === 'true') {
        if (overlay) {
            overlay.remove();
            overlay = null;
        }
        return;
    }

    if (typeof html2canvas === 'undefined') {
        console.error('html2canvas is not loaded.');
        return;
    }

    const canvas = await html2canvas(targetElement, {
        backgroundColor: null,
        scale: window.devicePixelRatio,
        logging: false,
    });

    const ctx = canvas.getContext('2d', { willReadFrequently: true });
    const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);

    if (overlay) {
        overlay.remove();
    }

    overlay = document.createElement('canvas');
    overlay.id = 'color-mode-overlay';
    overlay.width = canvas.width;
    overlay.height = canvas.height;
    overlay.style.position = 'fixed';
    overlay.style.top = '0';
    overlay.style.left = '0';
    overlay.style.width = '100vw';
    overlay.style.height = '100vh';
    overlay.style.pointerEvents = 'none';
    overlay.style.zIndex = '100000';
    document.body.appendChild(overlay);

    const workerInstance = getWorker();
    workerInstance.postMessage({
        imageData,
        mode,
        palette: COLOR_MODES[mode].palette,
    });

    workerInstance.onmessage = (e) => {
        const ditheredImageData = e.data;
        if (ditheredImageData) {
            const overlayCtx = overlay.getContext('2d');
            overlayCtx.putImageData(ditheredImageData, 0, 0);
        }
    };
}

export function setColorMode(mode) {
  if (COLOR_MODES[mode]) {
    setItem(LOCAL_STORAGE_KEYS.COLOR_MODE, mode);
    applyColorMode(mode);
    document.dispatchEvent(new CustomEvent('color-mode-changed', { detail: { mode } }));
  }
}

export function getCurrentColorMode() {
  return getItem(LOCAL_STORAGE_KEYS.COLOR_MODE) || 'true';
}

export function getColorModes() {
  return COLOR_MODES;
}

export function initColorModeManager(element) {
    targetElement = element;
    const currentMode = getCurrentColorMode();
    if (currentMode !== 'true') {
        applyColorMode(currentMode);
    }
}
