# Installation And Local Development

## Prerequisites

- A modern browser with ES module, Canvas, `getUserMedia`, and MediaRecorder support.
- A camera for live preview and photo capture.
- A microphone only when recording audio is required.
- Internet access for the configured MediaPipe jsDelivr assets and Google Fonts.
- Node.js 20 or newer for the repository test and documentation scripts. Node.js is not required to run the deployed application itself.

## Clone

```bash
git clone https://github.com/Deep-2326/glyphr-monocam.git
cd glyphr-monocam
```

## Serve The Static App

Use a local HTTP server. Browser module loading and camera permissions are more reliable on `localhost` or HTTPS than `file://`.

```bash
npx serve .
```

Open the local URL printed by the server, then grant camera permission.

The repository has no runtime `npm` dependencies and no build step. The `package.json` file exists to standardize quality checks and documentation generation.

## Configuration

No environment variables or configuration files are required.

Runtime constants are defined in source:

- Camera ideals are set in `src/camera.js`.
- The MediaPipe CDN location and `modelSelection: 1` are set in `src/segmentation.js`.
- Palette character ramps are set in `src/palettes.js`.
- Theme definitions are set in `src/themes.js`.

## Quality Commands

```bash
npm run check
npm test
npm run docs:pdf
```

`npm run check` performs JavaScript syntax checks. `npm test` runs Node's built-in test runner. `npm run docs:pdf` regenerates PDFs for every tracked Markdown document listed by `tools/render-pdf.mjs`.

## Deployment

The repository history and README identify GitHub Pages as the deployment target. A static host is sufficient because the app has no backend. Configure the host to serve the repository root over HTTPS, then verify camera permission and CDN access on the deployed domain.

## Troubleshooting

### Camera Does Not Start

- Confirm that the page is served from `https://` or `http://localhost`.
- Check browser site permissions for camera access.
- Close other applications or browser tabs that may hold the camera.
- Try the camera-switch control if the default front-facing device is unavailable.

### Background Removal Does Not Work

- Confirm that the MediaPipe script and its CDN assets can load.
- Enable `RM BG` after preview has started.
- Use a well-lit frame with the subject clearly visible. The implementation applies the mask threshold fixed in `src/asciiEngine.js`.

### Video Recording Fails

- Verify that the browser supports MediaRecorder and WebM recording.
- Start recording only after an ASCII preview frame exists.
- If microphone access is denied, the app reports the issue and continues with video-only recording.

### The App Is Slow

- Lower `RES` to reduce the sampled character grid.
- Disable `RM BG` if segmentation overhead is too high for the device.
- Close other camera-intensive applications.
