import assert from 'node:assert/strict';
import test from 'node:test';

import { AsciiRecorder } from '../src/recorder.js';

class FakeTrack {
  constructor(kind) {
    this.kind = kind;
    this.stopCalls = 0;
  }

  stop() {
    this.stopCalls += 1;
  }
}

class FakeMediaStream {
  constructor(tracks = []) {
    this.tracks = tracks;
  }

  getTracks() {
    return this.tracks;
  }

  getVideoTracks() {
    return this.tracks.filter((track) => track.kind === 'video');
  }

  getAudioTracks() {
    return this.tracks.filter((track) => track.kind === 'audio');
  }
}

class FakeMediaRecorder {
  static instances = [];

  static isTypeSupported(mimeType) {
    return mimeType === 'video/webm;codecs=vp9,opus';
  }

  constructor(stream, options = {}) {
    this.stream = stream;
    this.mimeType = options.mimeType || 'video/webm';
    this.state = 'inactive';
    this.timeslice = null;
    FakeMediaRecorder.instances.push(this);
  }

  start(timeslice) {
    this.timeslice = timeslice;
    this.state = 'recording';
  }

  stop() {
    this.state = 'inactive';
    this.ondataavailable?.({ data: new Blob(['frame']) });
    this.onstop?.();
  }
}

function installBrowserMocks(t, { microphoneResult } = {}) {
  const originalMediaStream = globalThis.MediaStream;
  const originalMediaRecorder = globalThis.MediaRecorder;
  const originalNavigator = Object.getOwnPropertyDescriptor(globalThis, 'navigator');

  FakeMediaRecorder.instances = [];
  globalThis.MediaStream = FakeMediaStream;
  globalThis.MediaRecorder = FakeMediaRecorder;
  Object.defineProperty(globalThis, 'navigator', {
    configurable: true,
    value: {
      mediaDevices: {
        getUserMedia: async () => microphoneResult
      }
    }
  });

  t.after(() => {
    globalThis.MediaStream = originalMediaStream;
    globalThis.MediaRecorder = originalMediaRecorder;

    if (originalNavigator) {
      Object.defineProperty(globalThis, 'navigator', originalNavigator);
    } else {
      delete globalThis.navigator;
    }
  });
}

test('records the ASCII canvas stream at 30 FPS and releases tracks on stop', async (t) => {
  installBrowserMocks(t);

  const videoTrack = new FakeTrack('video');
  const canvas = {
    width: 320,
    height: 180,
    requestedFrameRate: null,
    captureStream(frameRate) {
      this.requestedFrameRate = frameRate;
      return new FakeMediaStream([videoTrack]);
    }
  };

  const recorder = new AsciiRecorder(canvas);
  const receivedEvents = [];
  recorder.addEventListener('start', () => receivedEvents.push('start'));
  recorder.addEventListener('recorded', (event) => {
    receivedEvents.push(`recorded:${event.detail.blob.type}`);
  });
  recorder.addEventListener('stop', () => receivedEvents.push('stop'));

  await recorder.start();

  assert.equal(canvas.requestedFrameRate, 30);
  assert.equal(recorder.isRecording, true);
  assert.equal(FakeMediaRecorder.instances[0].timeslice, 250);

  recorder.stop();

  assert.equal(recorder.isRecording, false);
  assert.equal(videoTrack.stopCalls, 1);
  assert.deepEqual(receivedEvents, ['start', 'recorded:video/webm;codecs=vp9,opus', 'stop']);
});

test('merges granted microphone audio into the recording stream', async (t) => {
  const audioTrack = new FakeTrack('audio');
  installBrowserMocks(t, {
    microphoneResult: new FakeMediaStream([audioTrack])
  });

  const videoTrack = new FakeTrack('video');
  const canvas = {
    width: 200,
    height: 100,
    captureStream() {
      return new FakeMediaStream([videoTrack]);
    }
  };

  const recorder = new AsciiRecorder(canvas);
  let microphoneEnabled = false;
  recorder.addEventListener('start', (event) => {
    microphoneEnabled = event.detail.micEnabled;
  });

  await recorder.start({ withMic: true });

  assert.equal(microphoneEnabled, true);
  assert.equal(FakeMediaRecorder.instances[0].stream.getVideoTracks().length, 1);
  assert.equal(FakeMediaRecorder.instances[0].stream.getAudioTracks().length, 1);

  recorder.stop();

  assert.equal(videoTrack.stopCalls, 1);
  assert.equal(audioTrack.stopCalls, 1);
});
