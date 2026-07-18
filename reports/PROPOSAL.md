# Reconstructed Project Proposal

## Status Of This Document

This is a reconstruction from the implemented repository, not an original planning artifact. It records a plausible scope that is supported by the current code and does not claim access to the project's original requirements document.

## Problem

Create an interactive browser experience that turns a live camera feed into stylized ASCII output while keeping processing and media export inside the browser.

## Proposed Solution

Build a static vanilla JavaScript application that:

- Requests a webcam stream through the MediaDevices API.
- Samples frames with Canvas and converts luminance to characters.
- Uses MediaPipe Selfie Segmentation for optional foreground masking.
- Renders output in a `<pre>` element with dynamic character sizing.
- Exports still frames as PNG and rendered video as WebM.
- Offers palette, resolution, theme, camera, mode, and microphone controls.

## Non-Goals Confirmed By The Repository

- No user authentication or accounts.
- No backend service or database.
- No uploaded media library or cloud persistence.
- No custom model training, datasets, or model distribution pipeline.
- No framework, bundler, or compiled application build step.

## Acceptance Criteria Supported By The Code

- A user can grant camera access and view ASCII output.
- A user can change sampling resolution and palette at runtime.
- A user can enable optional background masking.
- A user can capture PNG output.
- A user can record a WebM stream with optional microphone audio.
- A user can switch themes and camera facing modes.
- The app cleans up owned media tracks on exit.

## Delivery Model

The application is suitable for static hosting. The existing README and Git history identify GitHub Pages as the deployment target. HTTPS is required in production for reliable camera access.

## Risks

- Browser media and codec support varies.
- Segmentation speed depends on client hardware.
- CDN availability affects MediaPipe and font loading.
- Camera and microphone access require explicit user consent.
