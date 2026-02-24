const CAMERA_RELEASE_DELAY_MS = 220;

const wait = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

const waitForVideoMetadata = (videoEl) => new Promise((resolve, reject) => {
  if (videoEl.readyState >= 1) {
    resolve();
    return;
  }

  const onLoaded = () => {
    cleanup();
    resolve();
  };

  const onError = () => {
    cleanup();
    reject(new Error('Unable to read camera metadata.'));
  };

  const cleanup = () => {
    videoEl.removeEventListener('loadedmetadata', onLoaded);
    videoEl.removeEventListener('error', onError);
  };

  videoEl.addEventListener('loadedmetadata', onLoaded, { once: true });
  videoEl.addEventListener('error', onError, { once: true });
});

export class CameraController {
  constructor(videoEl) {
    this.videoEl = videoEl;
    this.stream = null;
    this.facingMode = 'user';
    this.startToken = 0;
  }

  async start(facingMode = 'user') {
    this.startToken += 1;
    const token = this.startToken;

    this.stop();
    await wait(CAMERA_RELEASE_DELAY_MS);

    const constraints = {
      video: {
        facingMode,
        width: { ideal: 1280 },
        height: { ideal: 720 },
        frameRate: { ideal: 60, max: 60 }
      }
    };

    const stream = await navigator.mediaDevices.getUserMedia(constraints);

    // If a newer start() call happened while this one was in-flight, dispose this stream.
    if (token !== this.startToken) {
      stream.getTracks().forEach((track) => track.stop());
      throw new Error('Camera start superseded by a newer request.');
    }

    this.videoEl.srcObject = stream;
    await waitForVideoMetadata(this.videoEl);
    await this.videoEl.play();

    this.stream = stream;
    this.facingMode = facingMode;
    return stream;
  }

  async switchFacingMode() {
    const nextFacingMode = this.facingMode === 'user' ? 'environment' : 'user';
    await this.start(nextFacingMode);
    return nextFacingMode;
  }

  stop() {
    if (this.stream) {
      this.stream.getTracks().forEach((track) => track.stop());
      this.stream = null;
    }

    if (this.videoEl.srcObject) {
      const oldStream = this.videoEl.srcObject;
      if (oldStream instanceof MediaStream) {
        oldStream.getTracks().forEach((track) => track.stop());
      }
      this.videoEl.srcObject = null;
    }
  }

  isReady() {
    return Boolean(this.videoEl.srcObject) && this.videoEl.readyState >= 2;
  }
}
