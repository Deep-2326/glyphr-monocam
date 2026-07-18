# Final Report

## Project Summary

GLYPHR MONOCAM is a static, browser-based camera application that converts live webcam frames into ASCII art. It combines browser camera capture, MediaPipe selfie segmentation, Canvas pixel processing, palette mapping, and browser-native media export. The implementation is modular vanilla JavaScript rather than a framework application.

## Objectives Observed From The Implementation

- Render webcam input as live ASCII output.
- Offer user-selectable character palettes and sampling density.
- Support optional foreground masking for background removal.
- Export the generated output as PNG images and WebM recordings.
- Provide responsive controls for desktop and mobile usage.
- Keep media processing in the browser without an application backend.

## Implementation

The application is divided into focused ES modules:

- `camera.js` owns the camera stream lifecycle and facing-mode replacement.
- `segmentation.js` wraps MediaPipe Selfie Segmentation and prevents overlapping inference sends.
- `asciiEngine.js` samples video pixels, applies luminance mapping and optional masking, sizes the character grid, and paints export frames.
- `recorder.js` captures the ASCII Canvas stream, optionally combines microphone audio, and exports WebM Blobs.
- `ui.js` owns DOM lookup, interaction events, visual status, and control state.
- `main.js` composes the modules and application lifecycle.

## Architecture

The central processing path is:

```text
camera stream -> video element -> segmentation and Canvas sample -> ASCII pre element -> export Canvas -> PNG or WebM download
```

The complete component and event flow is documented in [Architecture](../docs/ARCHITECTURE.md).

## Technologies

- HTML5, CSS3, and JavaScript ES modules
- Canvas 2D API and `getImageData`
- MediaDevices API, `getUserMedia`, and `MediaStream`
- MediaPipe Selfie Segmentation from jsDelivr
- MediaRecorder and Canvas `captureStream`
- Google Fonts from the configured stylesheet URL
- Node.js built-in test runner and Tectonic-based PDF generation for repository quality tooling

## Verified Results

Source review confirms that the current implementation includes live camera startup, front/rear switching, theme-aware ASCII generation, palette selection, custom palette input, optional masking, PNG capture, WebM recording, microphone merge handling, clock updates, a recording indicator, and Battery Status API handling when supported by the browser.

No backend, database, custom HTTP API, user accounts, deployment workflow, trained model files, datasets, or server-side reporting implementation exists in this repository.

## Testing Summary

The test strategy and executed results are maintained separately in [Test Report](TEST_REPORT.md). Automated coverage targets pure module behavior that can run without camera hardware; hardware, browser permissions, MediaPipe execution, and recording codecs require manual browser verification.

## Challenges Evidenced By The Design

- Avoiding inference backlog by allowing only one segmentation send at a time.
- Managing camera and recorder tracks so device resources are released during switching and page exit.
- Keeping the displayed `<pre>` output and exported Canvas output visually aligned.
- Supporting browser capability variance without a server-side fallback.

## Lessons Learned

- A small modular architecture can provide clear boundaries without adding a framework.
- Resolution is the most direct user-facing control over the ASCII quality versus performance trade-off.
- Recording rendered output requires a separate Canvas representation; recording the source video would not preserve the ASCII effect.
- Browser-native media features need explicit error handling and documented compatibility expectations.

## Limitations

- Runtime quality and frame rate depend on the user's device and browser.
- The external MediaPipe CDN and Google Fonts are runtime dependencies.
- WebM is the only implemented recording export format.
- No verified cross-browser or physical-device test matrix is included.
- The application does not persist settings or captured output.
