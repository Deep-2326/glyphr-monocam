# Test Report

## Execution Summary

Date: 2026-07-17

Node.js: v24.13.1

Test runner: Node.js built-in test runner

Total tests: 8

Passed: 8

Failed: 0

Skipped: 0

Cancelled: 0

Automated test duration: 56.261334 ms

## Commands Executed

```bash
npm run check
npm test
```

`npm run check` completed successfully for all eight source modules.

`npm test` completed successfully with eight passing tests.

## Automated Coverage

### Palette Behavior

- Verifies valid palette selection and fallback to the extended palette.
- Verifies every bundled palette provides at least two character states and a font definition.
- Verifies custom palette sanitization preserves leading spaces, which are meaningful for brightness ramps.

### Theme Behavior

- Verifies explicit theme lookup and fallback to dark theme.
- Verifies theme cycling order: dark to light to black to dark.
- Verifies stale theme classes are removed before the target class is applied.

### Recorder Lifecycle

- Verifies the ASCII Canvas is requested as a 30 FPS stream.
- Verifies recording startup state, chunk lifecycle, stop event, and video-track cleanup.
- Verifies microphone audio is merged into the recording stream when access is granted.

## Manual Verification Required

The following behaviors require an interactive browser, permission prompts, camera or microphone hardware, and the external MediaPipe runtime. They were not executed in this workspace session.

- Camera permission denial and successful camera preview.
- Front and rear facing-mode switching on a device with both cameras.
- MediaPipe asset loading, foreground mask quality, and mask threshold behavior.
- Resolution slider smoothness and visual character fitting at desktop and mobile breakpoints.
- PNG download behavior in a browser.
- WebM playback and codec compatibility in supported browsers.
- Microphone permission denial behavior in a browser.
- Battery Status API display on browsers that expose the API.
- Theme rendering and responsive layout on physical mobile devices.

## Coverage

No line or branch coverage tool is configured, so percentage coverage was not collected. The test suite targets modules that can be verified without browser-only globals. Browser integration coverage is identified as a future improvement.

## Conclusion

The repository passes its current automated quality checks. The remaining risk is concentrated in browser-specific media, device-permission, codec, and external-CDN behavior, which requires manual validation in supported desktop and mobile browsers.
