const MEDIAPIPE_CDN = 'https://cdn.jsdelivr.net/npm/@mediapipe/selfie_segmentation';

export class SegmentationController {
  constructor() {
    if (typeof SelfieSegmentation === 'undefined') {
      throw new Error('MediaPipe SelfieSegmentation failed to load.');
    }

    this.worker = new SelfieSegmentation({
      locateFile: (file) => `${MEDIAPIPE_CDN}/${file}`
    });

    this.worker.setOptions({ modelSelection: 1 });

    this.busy = false;
    this.resultsHandler = null;

    this.worker.onResults((results) => {
      this.busy = false;
      if (typeof this.resultsHandler === 'function') {
        this.resultsHandler(results);
      }
    });
  }

  onResults(handler) {
    this.resultsHandler = handler;
  }

  async sendFrame(image) {
    if (this.busy) {
      return false;
    }

    this.busy = true;
    try {
      await this.worker.send({ image });
    } catch (error) {
      this.busy = false;
      throw error;
    }

    return true;
  }

  isBusy() {
    return this.busy;
  }

  close() {
    this.busy = false;
    if (typeof this.worker.close === 'function') {
      this.worker.close();
    }
  }
}
