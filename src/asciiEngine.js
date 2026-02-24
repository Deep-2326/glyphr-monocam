const DEFAULT_SCALE = 0.2;
const SCALE_SMOOTHING = 0.15;
const MASK_THRESHOLD = 0.4;
const PROBE_FONT_SIZE = 120;

export class AsciiEngine {
  constructor({ videoEl, frameCanvasEl, asciiEl, viewfinderEl }) {
    this.videoEl = videoEl;
    this.frameCanvas = frameCanvasEl;
    this.asciiEl = asciiEl;
    this.viewfinderEl = viewfinderEl;

    this.frameCtx = this.frameCanvas.getContext('2d', {
      alpha: false,
      willReadFrequently: true
    });

    this.maskCanvas = document.createElement('canvas');
    this.maskCtx = this.maskCanvas.getContext('2d', {
      alpha: false,
      willReadFrequently: true
    });

    this.recordingCanvas = document.createElement('canvas');
    this.recordingCtx = this.recordingCanvas.getContext('2d', {
      alpha: false
    });

    [this.frameCtx, this.maskCtx, this.recordingCtx].forEach((ctx) => {
      ctx.imageSmoothingEnabled = false;
      ctx.imageSmoothingQuality = 'low';
    });

    this.paletteChars = ' .:-=+*#%@';
    this.fontFamily = "'Share Tech Mono', ui-monospace, SFMono-Regular, Menlo, monospace";

    this.currentScale = DEFAULT_SCALE;
    this.targetScale = DEFAULT_SCALE;

    this.fontSize = 8;
    this.charWidthRatio = 0.6;
    this.charHeightRatio = 1;
    this.metricsDirty = true;

    this.facingMode = 'user';
    this.removeBackground = false;
    this.themeIsDark = true;
    this.captureBackground = '#090e11';
    this.captureForeground = '#84f5d8';

    this.lastLines = [];
    this.lastColumns = 0;
    this.lastRows = 0;

    this.handleResize = () => {
      this.metricsDirty = true;
    };
    window.addEventListener('resize', this.handleResize);
  }

  setPalette(palette) {
    this.paletteChars = palette.chars;
    this.fontFamily = palette.font;
    this.asciiEl.style.fontFamily = palette.font;
    this.metricsDirty = true;
  }

  setResolutionFromSlider(sliderValue) {
    const value = Number(sliderValue);
    if (!Number.isFinite(value)) {
      return;
    }

    this.targetScale = Math.min(0.25, Math.max(0.01, (value / 60) * 0.25));
  }

  setRemoveBackground(enabled) {
    this.removeBackground = Boolean(enabled);
  }

  setFacingMode(facingMode) {
    this.facingMode = facingMode;
  }

  setTheme(themeState) {
    this.themeIsDark = Boolean(themeState.isDark);
    this.captureBackground = themeState.captureBackground;
    this.captureForeground = themeState.captureForeground;
  }

  getCurrentChars() {
    return this.paletteChars;
  }

  getRecordingCanvas() {
    return this.recordingCanvas;
  }

  render({ segmentationMask, recording }) {
    if (!this.videoEl.videoWidth || !this.videoEl.videoHeight || !this.paletteChars.length) {
      return null;
    }

    if (this.metricsDirty) {
      this.measureCharacterCell();
    }

    this.updateScale();

    const videoWidth = this.videoEl.videoWidth;
    const videoHeight = this.videoEl.videoHeight;
    const videoAspect = videoWidth / videoHeight;
    const charAspect = this.charWidthRatio / this.charHeightRatio;

    const columns = Math.max(1, Math.floor(videoWidth * this.currentScale));
    const rows = Math.max(1, Math.floor(columns / (videoAspect / charAspect)));

    this.lastColumns = columns;
    this.lastRows = rows;

    if (this.frameCanvas.width !== columns || this.frameCanvas.height !== rows) {
      this.frameCanvas.width = columns;
      this.frameCanvas.height = rows;
    }

    this.frameCtx.clearRect(0, 0, columns, rows);

    const mirror = this.facingMode === 'user';
    if (mirror) {
      this.frameCtx.save();
      this.frameCtx.scale(-1, 1);
      this.frameCtx.drawImage(this.videoEl, -columns, 0, columns, rows);
      this.frameCtx.restore();
    } else {
      this.frameCtx.drawImage(this.videoEl, 0, 0, columns, rows);
    }

    const frameData = this.frameCtx.getImageData(0, 0, columns, rows).data;
    let maskData = null;

    if (this.removeBackground && segmentationMask) {
      if (this.maskCanvas.width !== columns || this.maskCanvas.height !== rows) {
        this.maskCanvas.width = columns;
        this.maskCanvas.height = rows;
      }

      this.maskCtx.clearRect(0, 0, columns, rows);
      if (mirror) {
        this.maskCtx.save();
        this.maskCtx.scale(-1, 1);
        this.maskCtx.drawImage(segmentationMask, -columns, 0, columns, rows);
        this.maskCtx.restore();
      } else {
        this.maskCtx.drawImage(segmentationMask, 0, 0, columns, rows);
      }

      maskData = this.maskCtx.getImageData(0, 0, columns, rows).data;
    }

    this.fitFontSize(columns, rows);

    const maxIndex = this.paletteChars.length - 1;
    const lines = new Array(rows);

    for (let y = 0; y < rows; y += 1) {
      let line = '';
      for (let x = 0; x < columns; x += 1) {
        const index = (y * columns + x) * 4;
        const r = frameData[index];
        const g = frameData[index + 1];
        const b = frameData[index + 2];

        let brightness = 0.2126 * r + 0.7152 * g + 0.0722 * b;
        if (!this.themeIsDark) {
          brightness = 255 - brightness;
        }

        const paletteIndex = Math.floor((brightness / 255) * maxIndex);
        const character = this.paletteChars[paletteIndex] ?? ' ';

        if (maskData) {
          const maskValue = maskData[index] / 255;
          line += maskValue > MASK_THRESHOLD ? character : '.';
        } else {
          line += character;
        }
      }
      lines[y] = line;
    }

    this.lastLines = lines;
    this.asciiEl.textContent = lines.join('\n');

    if (recording) {
      this.drawLinesToCanvas(this.recordingCanvas, this.recordingCtx, lines);
    }

    return this.asciiEl.textContent;
  }

  capturePhotoDataUrl() {
    if (!this.lastLines.length) {
      return null;
    }

    const captureCanvas = document.createElement('canvas');
    const captureCtx = captureCanvas.getContext('2d', { alpha: false });
    this.drawLinesToCanvas(captureCanvas, captureCtx, this.lastLines);
    return captureCanvas.toDataURL('image/png');
  }

  destroy() {
    window.removeEventListener('resize', this.handleResize);
  }

  updateScale() {
    this.currentScale += (this.targetScale - this.currentScale) * SCALE_SMOOTHING;
  }

  fitFontSize(columns, rows) {
    if (!columns || !rows) {
      return;
    }

    const widthLimit = this.viewfinderEl.clientWidth;
    const heightLimit = this.viewfinderEl.clientHeight;

    const sizeFromWidth = widthLimit / (columns * this.charWidthRatio);
    const sizeFromHeight = heightLimit / (rows * this.charHeightRatio);
    const computed = Math.max(2, Math.floor(Math.min(sizeFromWidth, sizeFromHeight)));

    if (computed !== this.fontSize) {
      this.fontSize = computed;
      this.asciiEl.style.fontSize = `${computed}px`;
      this.asciiEl.style.lineHeight = `${computed}px`;
    }
  }

  measureCharacterCell() {
    const probe = document.createElement('span');
    probe.textContent = 'MMMMMMMMMM';
    probe.style.position = 'absolute';
    probe.style.left = '-9999px';
    probe.style.top = '-9999px';
    probe.style.visibility = 'hidden';
    probe.style.fontFamily = this.fontFamily;
    probe.style.fontSize = `${PROBE_FONT_SIZE}px`;
    probe.style.lineHeight = `${PROBE_FONT_SIZE}px`;

    document.body.appendChild(probe);
    const rect = probe.getBoundingClientRect();
    document.body.removeChild(probe);

    const widthRatio = rect.width / (10 * PROBE_FONT_SIZE);
    const heightRatio = rect.height / PROBE_FONT_SIZE;

    if (Number.isFinite(widthRatio) && widthRatio > 0) {
      this.charWidthRatio = widthRatio;
    }

    if (Number.isFinite(heightRatio) && heightRatio > 0) {
      this.charHeightRatio = heightRatio;
    }

    this.metricsDirty = false;
  }

  drawLinesToCanvas(canvas, ctx, lines) {
    const width = Math.max(1, Math.ceil(this.lastColumns * this.charWidthRatio * this.fontSize));
    const height = Math.max(1, lines.length * this.fontSize);

    if (canvas.width !== width || canvas.height !== height) {
      canvas.width = width;
      canvas.height = height;
    }

    ctx.fillStyle = this.captureBackground;
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    ctx.fillStyle = this.captureForeground;
    ctx.font = `${this.fontSize}px ${this.fontFamily}`;
    ctx.textBaseline = 'top';

    for (let i = 0; i < lines.length; i += 1) {
      ctx.fillText(lines[i], 0, i * this.fontSize);
    }
  }
}
