const MIME_TYPE_CANDIDATES = [
  'video/webm;codecs=vp9,opus',
  'video/webm;codecs=vp8,opus',
  'video/webm'
];

function chooseMimeType() {
  if (typeof MediaRecorder === 'undefined' || typeof MediaRecorder.isTypeSupported !== 'function') {
    return '';
  }

  return MIME_TYPE_CANDIDATES.find((candidate) => MediaRecorder.isTypeSupported(candidate)) ?? '';
}

function dispatchEvent(target, eventName, detail = {}) {
  target.dispatchEvent(new CustomEvent(eventName, { detail }));
}

export class AsciiRecorder extends EventTarget {
  constructor(recordingCanvas) {
    super();
    this.recordingCanvas = recordingCanvas;
    this.mediaRecorder = null;
    this.recordedChunks = [];

    this.videoStream = null;
    this.audioStream = null;
    this.combinedStream = null;

    this.isRecording = false;
    this.startedAt = 0;
  }

  async start({ withMic = false } = {}) {
    if (this.isRecording) {
      return;
    }

    if (!this.recordingCanvas.width || !this.recordingCanvas.height) {
      throw new Error('Frame not ready. Wait for ASCII preview before recording.');
    }

    this.recordedChunks = [];
    this.videoStream = this.recordingCanvas.captureStream(30);

    let micEnabled = false;
    this.combinedStream = this.videoStream;

    if (withMic) {
      try {
        this.audioStream = await navigator.mediaDevices.getUserMedia({ audio: true });
        micEnabled = true;
        this.combinedStream = new MediaStream([
          ...this.videoStream.getVideoTracks(),
          ...this.audioStream.getAudioTracks()
        ]);
      } catch (error) {
        dispatchEvent(this, 'mic-denied', { error });
      }
    }

    const mimeType = chooseMimeType();
    const options = mimeType ? { mimeType } : undefined;

    try {
      this.mediaRecorder = new MediaRecorder(this.combinedStream, options);
    } catch (error) {
      this.cleanupStreams();
      dispatchEvent(this, 'error', { error });
      throw new Error('Failed to initialize MediaRecorder on this browser.');
    }

    this.mediaRecorder.ondataavailable = (event) => {
      if (event.data && event.data.size > 0) {
        this.recordedChunks.push(event.data);
      }
    };

    this.mediaRecorder.onerror = (event) => {
      const error = event.error ?? new Error('MediaRecorder encountered an error.');
      dispatchEvent(this, 'error', { error });
    };

    this.mediaRecorder.onstop = () => {
      const blob = new Blob(this.recordedChunks, {
        type: this.mediaRecorder?.mimeType || 'video/webm'
      });

      this.cleanupStreams();
      this.mediaRecorder = null;
      this.recordedChunks = [];
      this.isRecording = false;

      dispatchEvent(this, 'recorded', { blob });
      dispatchEvent(this, 'stop', {});
    };

    this.mediaRecorder.start(250);

    this.isRecording = true;
    this.startedAt = Date.now();
    dispatchEvent(this, 'start', {
      startedAt: this.startedAt,
      micEnabled
    });
  }

  stop() {
    if (!this.mediaRecorder || this.mediaRecorder.state === 'inactive') {
      return;
    }

    this.mediaRecorder.stop();
  }

  destroy() {
    if (this.mediaRecorder && this.mediaRecorder.state !== 'inactive') {
      this.mediaRecorder.stop();
    }
    this.cleanupStreams();
    this.isRecording = false;
  }

  cleanupStreams() {
    const trackSet = new Set();

    const addTracks = (stream) => {
      if (!stream) {
        return;
      }
      stream.getTracks().forEach((track) => trackSet.add(track));
    };

    addTracks(this.videoStream);
    addTracks(this.audioStream);
    addTracks(this.combinedStream);

    trackSet.forEach((track) => {
      try {
        track.stop();
      } catch {
        // Ignore per-track stop errors.
      }
    });

    this.videoStream = null;
    this.audioStream = null;
    this.combinedStream = null;
  }
}
