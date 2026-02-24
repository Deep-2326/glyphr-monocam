import { CameraController } from './camera.js';
import { AsciiEngine } from './asciiEngine.js';
import { SegmentationController } from './segmentation.js';
import { AsciiRecorder } from './recorder.js';
import { UIController } from './ui.js';
import { getPalette, sanitizeCustomPalette } from './palettes.js';
import { applyThemeClass, getTheme, nextTheme } from './themes.js';

const ui = new UIController(document);

const camera = new CameraController(ui.elements.video);
const engine = new AsciiEngine({
  videoEl: ui.elements.video,
  frameCanvasEl: ui.elements.frameCanvas,
  asciiEl: ui.elements.asciiOutput,
  viewfinderEl: ui.elements.viewfinder
});

const segmentation = new SegmentationController();
const recorder = new AsciiRecorder(engine.getRecordingCanvas());

const state = {
  mode: 'photo',
  themeKey: 'dark',
  activePalette: 'extended',
  facingMode: 'user',
  recordingStart: 0,
  loopRunning: false,
  rafId: 0,
  clockTimer: 0,
  battery: null,
  batteryCleanup: null,
  warnedSegmentationFailure: false
};

function formatDuration(durationMs) {
  const totalSeconds = Math.floor(durationMs / 1000);
  const hours = String(Math.floor(totalSeconds / 3600)).padStart(2, '0');
  const minutes = String(Math.floor((totalSeconds % 3600) / 60)).padStart(2, '0');
  const seconds = String(totalSeconds % 60).padStart(2, '0');
  return `${hours}:${minutes}:${seconds}`;
}

function downloadBlob(blob, filename) {
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  link.click();
  URL.revokeObjectURL(url);
}

function downloadDataUrl(dataUrl, filename) {
  const link = document.createElement('a');
  link.href = dataUrl;
  link.download = filename;
  link.click();
}

function updateClock() {
  if (recorder.isRecording) {
    const elapsed = Date.now() - state.recordingStart;
    ui.updateClock(formatDuration(elapsed), true);
    return;
  }

  const currentTime = new Date().toLocaleTimeString('en-US', { hour12: false });
  ui.updateClock(currentTime, false);
}

function startClock() {
  window.clearInterval(state.clockTimer);
  updateClock();
  state.clockTimer = window.setInterval(updateClock, 1000);
}

async function initBattery() {
  if (!('getBattery' in navigator)) {
    ui.updateBattery({ supported: false });
    return;
  }

  try {
    const battery = await navigator.getBattery();
    state.battery = battery;

    const refreshBattery = () => {
      ui.updateBattery({
        supported: true,
        level: Math.round(battery.level * 100),
        charging: battery.charging
      });
    };

    refreshBattery();

    battery.addEventListener('levelchange', refreshBattery);
    battery.addEventListener('chargingchange', refreshBattery);

    state.batteryCleanup = () => {
      battery.removeEventListener('levelchange', refreshBattery);
      battery.removeEventListener('chargingchange', refreshBattery);
    };
  } catch {
    ui.updateBattery({ supported: false });
  }
}

function applyTheme(themeKey) {
  const theme = applyThemeClass(document.body, themeKey);
  state.themeKey = theme.key;
  ui.setThemeButtonLabel(theme.buttonLabel);

  const styles = getComputedStyle(document.body);
  engine.setTheme({
    isDark: theme.isDark,
    captureBackground: styles.getPropertyValue('--ascii-bg').trim(),
    captureForeground: styles.getPropertyValue('--ascii-fg').trim()
  });
}

function setPalette(paletteKey) {
  const palette = getPalette(paletteKey);
  engine.setPalette(palette);
  state.activePalette = paletteKey;
  ui.setSelectedPalette(paletteKey);
}

async function startCamera(facingMode = state.facingMode) {
  await camera.start(facingMode);
  state.facingMode = facingMode;
  engine.setFacingMode(facingMode);
}

async function switchCamera() {
  const targetMode = state.facingMode === 'user' ? 'environment' : 'user';
  try {
    await startCamera(targetMode);
  } catch {
    ui.showStatus('Camera switch failed.', { isError: true });
  }
}

async function takePhoto() {
  const pngDataUrl = engine.capturePhotoDataUrl();
  if (!pngDataUrl) {
    ui.showStatus('Frame not ready yet.', { isError: true });
    return;
  }

  downloadDataUrl(pngDataUrl, `glyphr-photo-${Date.now()}.png`);
  ui.flash();
}

async function startRecording() {
  try {
    await recorder.start({ withMic: ui.getMicEnabled() });
  } catch (error) {
    ui.showStatus(error.message || 'Recording failed.', { isError: true });
  }
}

function stopRecording() {
  recorder.stop();
}

async function toggleRecording() {
  if (recorder.isRecording) {
    stopRecording();
    return;
  }

  await startRecording();
}

function startRenderLoop() {
  if (state.loopRunning) {
    return;
  }

  state.loopRunning = true;

  const tick = () => {
    if (!state.loopRunning) {
      return;
    }

    if (camera.isReady() && !segmentation.isBusy()) {
      segmentation.sendFrame(ui.elements.video).catch(() => {
        if (!state.warnedSegmentationFailure) {
          state.warnedSegmentationFailure = true;
          ui.showStatus('Segmentation frame failed. Rendering continues.', { isError: true });
        }
      });
    }

    state.rafId = window.requestAnimationFrame(tick);
  };

  state.rafId = window.requestAnimationFrame(tick);
}

function stopRenderLoop() {
  state.loopRunning = false;
  if (state.rafId) {
    window.cancelAnimationFrame(state.rafId);
    state.rafId = 0;
  }
}

function cleanup() {
  stopRenderLoop();
  window.clearInterval(state.clockTimer);
  recorder.destroy();
  camera.stop();
  segmentation.close();
  engine.destroy();
  if (typeof state.batteryCleanup === 'function') {
    state.batteryCleanup();
  }
}

segmentation.onResults((results) => {
  engine.render({
    segmentationMask: results.segmentationMask,
    recording: recorder.isRecording
  });
});

ui.addEventListener('resolution-change', (event) => {
  engine.setResolutionFromSlider(event.detail.value);
});

ui.addEventListener('bg-toggle', (event) => {
  engine.setRemoveBackground(event.detail.enabled);
});

ui.addEventListener('palette-change', (event) => {
  const { palette } = event.detail;

  if (palette !== 'custom') {
    setPalette(palette);
    return;
  }

  const proposed = ui.requestCustomPalette(engine.getCurrentChars());
  if (proposed === null) {
    ui.setSelectedPalette(state.activePalette);
    return;
  }

  const customChars = sanitizeCustomPalette(proposed, engine.getCurrentChars());
  engine.setPalette({ chars: customChars, font: getPalette('extended').font });
  state.activePalette = 'custom';
  ui.setSelectedPalette('custom');
});

ui.addEventListener('theme-cycle', () => {
  const next = nextTheme(state.themeKey);
  applyTheme(next.key);
});

ui.addEventListener('camera-switch', () => {
  switchCamera();
});

ui.addEventListener('mode-change', (event) => {
  const { mode } = event.detail;
  state.mode = mode;

  if (mode === 'photo' && recorder.isRecording) {
    stopRecording();
  }
});

ui.addEventListener('shutter', async () => {
  if (state.mode === 'photo') {
    await takePhoto();
    return;
  }

  await toggleRecording();
});

recorder.addEventListener('start', (event) => {
  state.recordingStart = event.detail.startedAt;
  ui.setRecording(true);
  updateClock();
});

recorder.addEventListener('stop', () => {
  state.recordingStart = 0;
  ui.setRecording(false);
  updateClock();
});

recorder.addEventListener('recorded', (event) => {
  downloadBlob(event.detail.blob, `glyphr-video-${Date.now()}.webm`);
});

recorder.addEventListener('mic-denied', () => {
  ui.showStatus('Microphone denied. Recording video only.', { isError: true });
});

recorder.addEventListener('error', (event) => {
  ui.setRecording(false);
  state.recordingStart = 0;
  updateClock();
  ui.showStatus(event.detail.error?.message || 'Recorder failure.', { isError: true });
});

async function init() {
  if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
    ui.showStatus('Camera API unavailable in this browser.', { isError: true, ttl: 3600 });
    return;
  }

  startClock();
  initBattery();

  setPalette('extended');
  engine.setResolutionFromSlider(ui.getResolutionValue());
  engine.setRemoveBackground(ui.getBackgroundRemovalEnabled());

  applyTheme(getTheme('dark').key);

  try {
    await startCamera('user');
  } catch {
    ui.showStatus('Camera access denied or unavailable.', { isError: true, ttl: 3600 });
    return;
  }

  startRenderLoop();
}

window.addEventListener('pagehide', cleanup, { once: true });
window.addEventListener('beforeunload', cleanup, { once: true });

init();
