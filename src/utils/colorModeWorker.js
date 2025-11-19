// src/utils/colorModeWorker.js

self.onmessage = (e) => {
    const { imageData, mode, palette } = e.data;

    if (!imageData || !mode) {
        self.postMessage(null);
        return;
    }

    if (mode === 'high') {
        quantizeToRGB565(imageData);
    } else if (palette) {
        const lutObj = buildLUT(palette);
        quantizeWithDither(imageData, palette, lutObj);
    }

    self.postMessage(imageData);
};

function quantizeToRGB565(imageData) {
    const data = imageData.data;
    for (let i = 0; i < data.length; i += 4) {
        const r = data[i];
        const g = data[i + 1];
        const b = data[i + 2];

        // Quantize to RGB565
        const r565 = (r >> 3) << 3;
        const g565 = (g >> 2) << 2;
        const b565 = (b >> 3) << 3;

        data[i] = r565;
        data[i + 1] = g565;
        data[i + 2] = b565;
    }
}

function buildLUT(palette) {
  const size = 32;
  const lut = new Uint8Array(size * size * size);
  for (let r = 0; r < size; r++) {
    for (let g = 0; g < size; g++) {
      for (let b = 0; b < size; b++) {
        const rr = Math.round(r * (255 / (size - 1)));
        const gg = Math.round(g * (255 / (size - 1)));
        const bb = Math.round(b * (255 / (size - 1)));
        let best = 0, bd = Infinity;
        for (let i = 0; i < palette.length; i++) {
          const p = palette[i];
          const d = (rr - p[0]) ** 2 + (gg - p[1]) ** 2 + (bb - p[2]) ** 2;
          if (d < bd) { bd = d; best = i; }
        }
        lut[(r * size + g) * size + b] = best;
      }
    }
  }
  return { lut, size };
}

function lutLookupIndex(lutObj, r, g, b) {
  const s = lutObj.size;
  const rr = Math.round(r * (s - 1) / 255);
  const gg = Math.round(g * (s - 1) / 255);
  const bb = Math.round(b * (s - 1) / 255);
  return lutObj.lut[(rr * s + gg) * s + bb];
}

function quantizeWithDither(imageData, palette, lutObj) {
  const w = imageData.width, h = imageData.height;
  const data = imageData.data;
  const errR = new Float32Array(w * h);
  const errG = new Float32Array(w * h);
  const errB = new Float32Array(w * h);

  function getIdx(x, y) { return y * w + x; }

  for (let y = 0; y < h; y++) {
    const leftToRight = (y % 2 === 0);
    if (leftToRight) {
      for (let x = 0; x < w; x++) {
        processPixel(x, y, true);
      }
    } else {
      for (let x = w - 1; x >= 0; x--) {
        processPixel(x, y, false);
      }
    }
  }

  function processPixel(x, y, leftToRight) {
    const i = (y * w + x) * 4;
    let r = data[i] + errR[getIdx(x, y)];
    let g = data[i + 1] + errG[getIdx(x, y)];
    let b = data[i + 2] + errB[getIdx(x, y)];

    r = Math.max(0, Math.min(255, r));
    g = Math.max(0, Math.min(255, g));
    b = Math.max(0, Math.min(255, b));

    const pi = lutLookupIndex(lutObj, r, g, b);
    const [nr, ng, nb] = palette[pi];
    data[i] = nr; data[i + 1] = ng; data[i + 2] = nb;
    const er = r - nr, eg = g - ng, eb = b - nb;

    const dir = leftToRight ? 1 : -1;

    // Distribute error
    if (x + dir >= 0 && x + dir < w) {
      const idxR = getIdx(x + dir, y);
      errR[idxR] += er * 7 / 16;
      errG[idxR] += eg * 7 / 16;
      errB[idxR] += eb * 7 / 16;
    }
    if (y + 1 < h) {
      if (x - dir >= 0 && x - dir < w) {
        const idxBL = getIdx(x - dir, y + 1);
        errR[idxBL] += er * 3 / 16;
        errG[idxBL] += eg * 3 / 16;
        errB[idxBL] += eb * 3 / 16;
      }
      const idxB = getIdx(x, y + 1);
      errR[idxB] += er * 5 / 16;
      errG[idxB] += eg * 5 / 16;
      errB[idxB] += eb * 5 / 16;

      if (x + dir >= 0 && x + dir < w) {
        const idxBR = getIdx(x + dir, y + 1);
        errR[idxBR] += er * 1 / 16;
        errG[idxBR] += eg * 1 / 16;
        errB[idxBR] += eb * 1 / 16;
      }
    }
  }
}
