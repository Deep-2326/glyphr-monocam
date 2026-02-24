# GLYPHR MONOCAM

A Cinematic Real-Time ASCII Live Monitor

GLYPHR MONOCAM is a browser-based real-time ASCII camera that transforms live webcam input into cinematic ASCII output. It integrates MediaPipe segmentation for background removal and includes photo and video recording capabilities, all built using vanilla JavaScript and native browser APIs.

Live Demo:
[https://Deep-2326.github.io/glyphr-monocam/](https://Deep-2326.github.io/glyphr-monocam/)



## Overview

This project converts each frame from the webcam into ASCII characters by calculating pixel brightness values and mapping them to a defined character set. It also supports optional background removal using MediaPipe Selfie Segmentation and allows exporting both images and videos directly from the browser.

The interface is designed to resemble a professional cinematic monitor rather than a traditional ASCII terminal tool.



## Features

* Real-time webcam to ASCII rendering
* Background removal using MediaPipe Selfie Segmentation
* Cinematic monitor-style user interface
* Photo capture (PNG export)
* Video recording (WebM export, optional microphone support)
* Multiple ASCII character palettes
* Adjustable resolution scaling
* Dark, light, and black theme modes
* Fully responsive layout for desktop and mobile



## Technical Implementation

### Rendering Pipeline

1. Webcam stream is accessed using `navigator.mediaDevices.getUserMedia()`.

2. Each frame is drawn to an off-screen canvas.

3. Pixel luminance is calculated using:

   brightness = 0.2126R + 0.7152G + 0.0722B

4. Brightness values are mapped to ASCII characters.

5. If background removal is enabled, the segmentation mask is applied before rendering.

6. The final ASCII frame is displayed inside a `<pre>` element.

7. For video recording, ASCII frames are rendered onto a hidden canvas and captured using the MediaRecorder API.



## Tech Stack

* HTML5
* CSS3
* JavaScript (Vanilla)
* Canvas API
* MediaPipe Selfie Segmentation
* MediaRecorder API

No frameworks or UI libraries were used.


```
## Project Structure

glyphr-monocam/
│
├── index.html
├── style.css
│
├── src/
│   ├── main.js
│   ├── camera.js
│   ├── asciiEngine.js
│   ├── segmentation.js
│   ├── recorder.js
│   ├── palettes.js
│   ├── themes.js
│   └── ui.js
│
├── assets/
│   └── signature-white.png
│
├── README.md
└── LICENSE
```


## Running Locally

Clone the repository:

git clone [https://github.com/Deep-2326/glyphr-monocam.git](https://github.com/Deep-2326/glyphr-monocam.git)
cd glyphr-monocam

Open index.html in a modern browser.

Camera permission is required for the application to function.



## Deployment

This project is deployed using GitHub Pages.

To deploy your own version:

1. Push the repository to GitHub.
2. Go to Settings → Pages.
3. Select “Deploy from branch.”
4. Choose branch: main and folder: /root.

The application will be available at:

[https://Deep-2326.github.io/glyphr-monocam/](https://Deep-2326.github.io/glyphr-monocam/)



## Learning Outcomes

* Real-time pixel-to-character mapping
* Canvas-based frame processing
* Browser-based media recording
* Integration of MediaPipe in a client-side application
* Responsive UI scaling across devices
* Performance-conscious visual effects



## Author

Deep Vashishta
GitHub: [https://github.com/Deep-2326](https://github.com/Deep-2326)


