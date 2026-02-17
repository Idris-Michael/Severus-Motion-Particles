# 📑 Technical Report: SEVERUS – Kinetic Particle Engine

**Project Type:** Real-Time Computer Vision & Generative Art  
**Stack:** React 18, Three.js (R3F), MediaPipe (Google ML), Web Audio API  
**Design Philosophy:** "Symbiotic Input" (Optical & Sonic Reactivity)

## 1. Executive Summary
SEVERUS is a high-fidelity interactive installation running entirely in the browser. It transforms the user's physical reality into digital art by merging computer vision with procedural particle physics.

Unlike standard data visualizations, SEVERUS is designed as a "Vibe Engine." It allows users to manipulate 3D mathematical topologies (such as anime-inspired "Rasengan" spheres or "Chidori" lightning fields) using bare-hand gestures and ambient audio, creating a feedback loop between the user's movements and the digital canvas.

## 2. Technical Architecture
The application uses a **Decoupled State Architecture** to maintain 60FPS even while running heavy ML models.

### Core Systems:
#### The "Manager" Pattern:
To prevent React re-render cycles from killing WebGL performance, input logic is separated into headless managers (`HandManager` and `AudioManager`).
These managers update Mutable Refs (`useRef`) directly. The 3D scene reads these refs inside the animation loop (`useFrame`). This bypasses React's diffing engine for the high-frequency 60Hz updates required for smooth particle physics.

#### Rendering Engine:
**InstancedMesh:** Instead of rendering 2,000 individual `<mesh>` objects, the system uses GPU Instancing. A single draw call renders thousands of particles, with position/color data updated via a `Float32Array` buffer directly on the GPU.

## 3. The "Vibe Coding" Algorithms (Topology)
The core of the "Vibe" comes from the mathematical translation of anime aesthetics into code:

*   **Fireball (Rasengan):** Implemented using spherical coordinates with a high-frequency Perlin noise offset. A rotation matrix spins the cluster on the Y-axis to simulate turbulent torque.
*   **Lightning (Chidori):** A branching algorithm where particles are constrained to jagged vectors. We use a "jitter" variable that increases based on audio volume, making the electricity "snap" when the beat drops.
*   **Wind (Tornado):** A logarithmic spiral equation where particle velocity is determined by height (y), creating a vortex effect that tightens at the base.

## 4. Input Systems & Computer Vision

### A. Optical Input (MediaPipe Hands)
**Pipeline:** The app captures the webcam feed and processes it through Google's MediaPipe WASM binary.

**Interaction Logic:**
*   **Position:** The XYZ coordinates of the Index Finger Tip map directly to 3D space.
*   **Gesture Physics:** We calculate the Euclidean distance between the Thumb Tip and Index Tip.
    *   Distance < Threshold: Triggers "Pinch" (Attraction Force).
    *   Distance > Threshold: Triggers "Open Palm" (Repulsion/Turbulence).
*   **HUD Overlay:** A custom SVG overlay draws bounding boxes and skeletal connectors on top of the video feed to provide "Iron Man" style visual feedback.

### B. Sonic Input (FFT Analysis)
*   **Audio Analyzer:** A `createAnalyser()` node processes the microphone input.
*   **Reactivity:** We extract the Fast Fourier Transform (FFT) data byte array. The average frequency intensity drives the `emissiveIntensity` (Bloom) and the scale of the particles, causing the swarm to "pulse" to music.

## 5. Challenges & Solutions

### A. The "React 19" Dependency Hell
**Issue:** The project initially crashed with Minified React error #31.
**Root Cause:** The browser's Import Map was inadvertently loading React 19 alpha builds alongside React 18 libraries required by `react-three-fiber`, causing a Dual-React Instance violation.
**Solution:** Rewrote the importmap in `index.html` to strictly enforce React 18.2.0 and pinned all dependencies (Three.js, Drei, Fiber) to compatible versions.

### B. The "Race Condition" on Startup
**Issue:** The hand tracking loop would crash if the webcam initialized before the heavy ML model finished downloading.
**Solution:** Implemented a `loadedRef` gate. The animation loop now checks the loaded state of the HandLandmarker on every frame, silently skipping processing until the model is fully hydrated, ensuring a crash-free startup.

## 6. Conclusion
SEVERUS demonstrates that modern web browsers are capable of console-level interactive experiences. By combining Machine Learning (MediaPipe) with High-Performance Graphics (Three.js Instancing), we created a tool that feels less like a website and more like a magical extension of the user's body.
