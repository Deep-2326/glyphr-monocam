# GLYPHR MONOCAM

Glyphr Monocam is a browser-based ASCII camera that converts a live webcam feed into a real-time, cinematic character render. It uses Canvas pixel sampling for luminance mapping, MediaPipe Selfie Segmentation for optional foreground masking, and native browser media APIs for photo and video export.

[Open the live demo](https://deep-2326.github.io/glyphr-monocam/)

## Why This Project Exists

The project explores how a modern browser can combine camera input, on-device computer vision, Canvas rendering, and recording APIs without a backend or frontend framework. The result is an interactive media tool rather than a static visual effect.

## Features

- Live webcam to ASCII conversion using a luminance-based character mapping.
- Front and rear camera switching, with mirroring only for the front-facing camera.
- Smooth resolution scaling that changes the sampling density without abrupt jumps.
- Optional background removal using MediaPipe Selfie Segmentation with `modelSelection: 1`.
- Seven palette options: Extended, Basic, Blocks, Matrix, Sketch, Deep, and custom input.
- Dark, light, and pure black themes. Light mode inverts the brightness mapping for readable output.
- PNG photo export with a shutter-flash effect.
- WebM video export at 30 FPS, with optional microphone audio.
- Live clock, recording duration, recording indicator, and Battery Status API support when the browser exposes it.
- Responsive desktop and mobile controls, including a visible camera-switch control.

## Demo And Screenshots

The verified demonstration is the deployed GitHub Pages site linked above. No repository screenshot or GIF is currently committed, so this README intentionally does not present an unverified visual capture as current product evidence.

## How It Works

1. `getUserMedia` opens the selected camera at an ideal 1280x720 resolution and ideal 60 FPS.
2. MediaPipe produces a selfie segmentation mask for each available camera frame.
3. The ASCII engine downsamples the video onto a Canvas, reads pixel data, and calculates luminance with `0.2126r + 0.7152g + 0.0722b`.
4. Each luminance value selects a character from the active palette. If background removal is enabled, mask values at or below `0.4` become `.`.
5. The generated frame is rendered to a `<pre>` element. During recording, the same text is painted onto a Canvas and captured as a media stream.

See [Architecture](docs/ARCHITECTURE.md) for the component and data-flow details.

## Technology Stack

- HTML5 and CSS3
- Vanilla JavaScript ES modules
- Canvas 2D API
- MediaDevices API and `getUserMedia`
- MediaPipe Selfie Segmentation, loaded from jsDelivr
- MediaRecorder and `HTMLCanvasElement.captureStream`
- Google Fonts for the UI font families
- Node.js built-in test runner for repository checks

There is no backend, database, application API, authentication layer, model-training pipeline, or package dependency required by the runtime application.

## Run Locally

Camera access and ES modules should be served from `localhost` or HTTPS. Do not rely on opening `index.html` as a `file://` URL.

```bash
git clone https://github.com/Deep-2326/glyphr-monocam.git
cd glyphr-monocam
```

Serve the repository with any static HTTP server. For example:

```bash
npx serve .
```

Then open the local URL printed by the server and grant camera permission. The application needs internet access to load the MediaPipe script/model assets and Google Fonts from their configured CDNs.

## Use The Camera

1. Grant camera permission when prompted.
2. Choose an ASCII palette and adjust `RES` to tune the character density.
3. Enable `RM BG` to replace background pixels with `.` based on the segmentation mask.
4. Cycle `DARK`, `LIGHT`, and `BLACK` to change the theme.
5. Select `PHOTO` and press the shutter to download a PNG.
6. Select `VIDEO`, optionally enable `MIC`, then press the shutter to start and stop a WebM recording.
7. Use the camera-switch button to request the opposite facing mode.

## Project Structure

```text
glyphr-monocam/
├── assets/
│   └── branding/
│       └── deep-vashishta-signature.png
├── docs/
├── interview/
├── reports/
├── src/
│   ├── asciiEngine.js
│   ├── camera.js
│   ├── main.js
│   ├── palettes.js
│   ├── recorder.js
│   ├── segmentation.js
│   ├── themes.js
│   └── ui.js
├── tests/
├── tools/
├── index.html
├── style.css
├── package.json
├── README.md
└── LICENSE
```

## Quality Checks

```bash
npm run check
npm test
npm run docs:pdf
```

The included automated tests cover palette selection/sanitization and theme state transitions. Camera access, segmentation, and recording depend on browser hardware and permissions, so they require manual verification. See [Test Report](reports/TEST_REPORT.md).

## Limitations

- Performance depends on device capability, camera resolution, and the cost of MediaPipe segmentation.
- The app has no offline fallback for the MediaPipe CDN or Google Fonts.
- Browser support for `MediaRecorder`, `captureStream`, Battery Status API, and video codecs varies.
- The recorder exports WebM only; no transcoding or server-side conversion exists.
- Camera and microphone permissions are required for their respective features.
- Captured media is downloaded locally and is not persisted by the application.

## Future Improvements

The repository includes a prioritized, code-aware roadmap in [Future Improvements](docs/FUTURE_IMPROVEMENTS.md).

## Acknowledgements

- [MediaPipe Selfie Segmentation](https://developers.google.com/mediapipe/solutions/vision/image_segmenter) provides the foreground-mask capability used by the app.
- Google Fonts provides the configured UI font families.
- The application relies on standardized browser media and Canvas APIs.

## License

Distributed under the [MIT License](LICENSE).

## Author

Deep Vashishta

GitHub: [@Deep-2326](https://github.com/Deep-2326)
