# Future Improvements

This roadmap is based on the current implementation and intentionally excludes features that cannot be verified from the repository.

## Reliability

- Pin or locally bundle the MediaPipe runtime assets, and provide a visible fallback when the CDN cannot load.
- Add capability detection for MediaRecorder, `captureStream`, and codec availability before the user enters video mode.
- Add a camera-device picker in addition to the current front/rear facing-mode toggle.
- Provide a clearer first-run permission state before the camera request is made.

## Performance

- Add adaptive sampling that lowers resolution automatically when segmentation latency rises.
- Allow background removal to run at a lower cadence than ASCII rendering when visual quality remains acceptable.
- Investigate Worker or OffscreenCanvas support where browser compatibility permits it.
- Add controlled frame-rate metrics so performance changes can be measured rather than inferred.

## Product And Accessibility

- Replace the browser prompt used for custom palettes with an accessible in-app editor and preview.
- Add keyboard shortcuts and a documented focus order for all capture controls.
- Expose battery information visually when the browser supports the Battery Status API; it is currently available to the UI controller but hidden in the current markup.
- Offer export options only where the active browser supports them, with explanatory messages for unavailable features.

## Quality And Delivery

- Add browser-level integration tests with mocked camera and microphone streams.
- Add visual-regression coverage for themes and responsive breakpoints.
- Add a CI workflow that runs syntax checks, tests, and PDF generation on pull requests.
- Capture and commit a verified product screenshot or short demo GIF after testing against the deployed build.

## Privacy And Distribution

- Add a Content Security Policy aligned with the external CDN and font hosts.
- Publish a concise privacy statement describing that application code does not include a custom backend while external CDN resources are loaded at runtime.
- Document supported browser versions after testing them on physical desktop and mobile devices.
