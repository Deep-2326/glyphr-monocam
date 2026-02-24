function dispatch(target, name, detail = {}) {
  target.dispatchEvent(new CustomEvent(name, { detail }));
}

export class UIController extends EventTarget {
  constructor(root = document) {
    super();

    this.root = root;
    this.elements = {
      body: root.body,
      video: root.getElementById('video'),
      frameCanvas: root.getElementById('frameCanvas'),
      asciiOutput: root.getElementById('asciiOutput'),
      viewfinder: root.getElementById('viewfinder'),

      palette: root.getElementById('palette'),
      bgToggle: root.getElementById('bgToggle'),
      bgToggleWrap: root.getElementById('bgToggleWrap'),
      resSlider: root.getElementById('resSlider'),

      modePhoto: root.getElementById('modePhoto'),
      modeVideo: root.getElementById('modeVideo'),
      shutterBtn: root.getElementById('shutterBtn'),
      micToggle: root.getElementById('micToggle'),
      micToggleWrap: root.getElementById('micToggleWrap'),
      themeBtn: root.getElementById('themeBtn'),
      switchCamBtn: root.getElementById('switchCamBtn'),

      recIndicator: root.getElementById('recIndicator'),
      clockDisplay: root.getElementById('clockDisplay'),
      batteryDisplay: root.getElementById('batteryDisplay'),

      statusToast: root.getElementById('statusToast'),
      flashOverlay: root.getElementById('flashOverlay')
    };

    this.toastTimer = 0;
    this.mode = 'photo';

    this.ensureElements();
    this.bindEvents();
    this.setMode('photo');
  }

  ensureElements() {
    Object.entries(this.elements).forEach(([key, value]) => {
      if (!value) {
        throw new Error(`Missing required UI element: ${key}`);
      }
    });
  }

  bindEvents() {
    this.elements.palette.addEventListener('change', (event) => {
      dispatch(this, 'palette-change', { palette: event.target.value });
    });

    this.elements.bgToggle.addEventListener('change', (event) => {
      dispatch(this, 'bg-toggle', { enabled: event.target.checked });
    });

    this.elements.resSlider.addEventListener('input', (event) => {
      dispatch(this, 'resolution-change', { value: Number(event.target.value) });
    });

    this.elements.modePhoto.addEventListener('click', () => {
      this.setMode('photo');
      dispatch(this, 'mode-change', { mode: 'photo' });
    });

    this.elements.modeVideo.addEventListener('click', () => {
      this.setMode('video');
      dispatch(this, 'mode-change', { mode: 'video' });
    });

    this.elements.shutterBtn.addEventListener('click', () => {
      dispatch(this, 'shutter');
    });

    this.elements.themeBtn.addEventListener('click', () => {
      dispatch(this, 'theme-cycle');
    });

    this.elements.switchCamBtn.addEventListener('click', () => {
      dispatch(this, 'camera-switch');
    });
  }

  setMode(mode) {
    this.mode = mode;

    const isPhoto = mode === 'photo';
    this.elements.modePhoto.classList.toggle('is-active', isPhoto);
    this.elements.modeVideo.classList.toggle('is-active', !isPhoto);

    this.elements.modePhoto.setAttribute('aria-selected', String(isPhoto));
    this.elements.modeVideo.setAttribute('aria-selected', String(!isPhoto));

    this.elements.shutterBtn.title = isPhoto ? 'Capture photo' : 'Start or stop recording';
    this.elements.micToggleWrap.style.display = isPhoto ? 'none' : 'inline-flex';
  }

  setThemeButtonLabel(label) {
    this.elements.themeBtn.textContent = label;
  }

  setRecording(isRecording) {
    this.elements.shutterBtn.classList.toggle('is-recording', isRecording);
    this.elements.recIndicator.classList.toggle('is-active', isRecording);
  }

  getMode() {
    return this.mode;
  }

  getMicEnabled() {
    return this.elements.micToggle.checked;
  }

  getResolutionValue() {
    return Number(this.elements.resSlider.value);
  }

  getBackgroundRemovalEnabled() {
    return this.elements.bgToggle.checked;
  }

  getSelectedPalette() {
    return this.elements.palette.value;
  }

  setSelectedPalette(value) {
    this.elements.palette.value = value;
  }

  requestCustomPalette(defaultChars) {
    return window.prompt('Enter characters from light to dark:', defaultChars);
  }

  flash() {
    const overlay = this.elements.flashOverlay;
    overlay.classList.remove('is-active');
    void overlay.offsetWidth;
    overlay.classList.add('is-active');
  }

  updateClock(text, recording = false) {
    this.elements.clockDisplay.textContent = text;
    this.elements.clockDisplay.style.color = recording ? 'var(--record)' : 'var(--ui-text-dim)';
  }

  updateBattery({ supported, level, charging }) {
    if (!supported) {
      this.elements.batteryDisplay.textContent = 'BAT --%';
      return;
    }

    const bolt = charging ? '⚡' : '';
    this.elements.batteryDisplay.textContent = `BAT ${level}%${bolt}`;
  }

  showStatus(message, { isError = false, ttl = 2600 } = {}) {
    const toast = this.elements.statusToast;

    toast.textContent = message;
    toast.classList.toggle('is-error', isError);
    toast.classList.add('is-visible');

    window.clearTimeout(this.toastTimer);
    this.toastTimer = window.setTimeout(() => {
      toast.classList.remove('is-visible', 'is-error');
    }, ttl);
  }
}
