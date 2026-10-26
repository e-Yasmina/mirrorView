# ADR-002: Capture and Frame-Processing Backend

## Status
Accepted

## Context
MirrorView must capture physical camera video frames, render a real-time preview, apply image transformations (preview mirroring, outgoing horizontal flip, brightness, contrast, saturation adjustments), and distribute identical processed frames to both the Outgoing Preview and the Virtual Camera output.

Key architectural requirements:
- Preview mirror must NOT alter outgoing virtual camera frames.
- Outgoing feed preview must display the exact transformed pixel data sent to the virtual camera.
- Processing latency must remain strictly under 100 ms (NFR-002).
- Zero frame data written to disk or sent to the cloud.

## Options Considered

### Option 1: Native C++ / OpenCV Capture Pipeline
- **Pros**: Direct control over hardware camera buffers.
- **Cons**: Requires compiling native C++ node addons (node-gyp / cmake-js), introducing toolchain friction and high serialization overhead copying 720p RGBA frames (110 MB/s at 30 FPS) into the JavaScript UI thread for rendering.

### Option 2: In-Engine WebGL 2.0 / OffscreenCanvas Pipeline
- **Pros**:
  - Direct hardware-accelerated access to webcam video streams via standard `navigator.mediaDevices.getUserMedia({ video: { width: 1280, height: 720, frameRate: 30 } })`.
  - Zero-copy GPU texture binding: Video frames are streamed directly to GPU memory as textures.
  - GLSL fragment shaders (or Canvas 2D image filter transforms) execute in < 2ms per frame, ensuring sustained 60 FPS with < 1% CPU utilization.
  - Strict mathematical separation between:
    1. **Outgoing Transformation Matrix**: horizontal flip ($u' = 1.0 - u$), brightness adjustment ($C' = C + b$), contrast adjustment ($C' = (C - 0.5) \cdot c + 0.5$), saturation adjustment ($C' = L + (C - L) \cdot s$).
    2. **Local Preview Viewport**: independent CSS mirror transform (`scaleX(-1)`) applied exclusively to the local preview viewport, leaving the outgoing pixel buffer untouched.
  - Pixel extraction via `getImageData` or `toBlob`/`OffscreenCanvas` transfer for consumption by the virtual camera adapter.
- **Cons**: Canvas readback (if synchronous) can induce minor pipeline delay, mitigated by asynchronous transfer or direct buffer updates.

## Decision
Adopt the **In-Engine WebGL 2.0 / OffscreenCanvas Pipeline**. This satisfies FR-003, FR-004, FR-005, and FR-006, guarantees deterministic frame transforms, and keeps pipeline latency well below 20 ms.
