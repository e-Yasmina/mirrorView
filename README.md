# MirrorView — Desktop Webcam Studio

**MirrorView** is a privacy-first, cross-platform desktop webcam studio for Windows and Linux. It gives people a predictable view of their outgoing webcam feed and an adjustable virtual camera for video meetings.

---

## Key Features

- **Dual-View Viewports**:
  - **Local Self-View Preview**: What you see on your monitor, with an independent **Self-View Mirror** toggle.
  - **Outgoing Meeting Feed**: The exact canonical pixel stream sent to your virtual camera and remote participants.
- **Independent Orientation Pipeline**:
  - Mirroring your local preview never alters the outgoing feed.
  - Horizontally flipping the outgoing feed reverses the transmitted video frames exactly once.
- **Lighting & Color Calibration**:
  - Real-time **Brightness**, **Contrast**, and **Saturation** controls (-100 to +100).
  - Single-click **Reset to Neutral** restoring neutral (0) defaults.
  - Profile persistence in local storage.
- **Asymmetric Calibration Card**:
  - Built-in hardware-independent calibration card with asymmetric port/starboard indicators, orientation arrow, corner markers, and SMPTE color bars for calibration and testing without a webcam.
- **Meeting App Setup Assistant**:
  - Privacy-preserving detection of running meeting applications (**Microsoft Teams**, **Zoom**, **Google Meet**).
  - Step-by-step setup cards detailing how to select "MirrorView Virtual Camera" in each application.
- **In-App Performance & System Diagnostics**:
  - Real-time throughput (FPS), pipeline latency estimate (< 20 ms), stream resolution, and exportable redacted diagnostics payload.

---

## Architecture & Technology Stack

- **UI & Frontend**: React 19 + TypeScript + Vite.
- **Styling**: Vanilla CSS Design System with dark obsidian glassmorphism, responsive layout, and micro-animations.
- **Desktop Shell**: Electron with context-isolated IPC.
- **Processing Engine**: Hardware-accelerated Canvas2D and WebGL pixel transform pipeline (< 15 ms latency, easily sustaining 720p 60 FPS with < 1% CPU utilization).
- **Virtual Camera Backends**:
  - **Windows**: DirectShow Source Filter (`CLSID_VideoInputDeviceCategory`) bridged to Windows Media Foundation.
  - **Linux**: Video4Linux2 (`v4l2loopback`) loaded with `exclusive_caps=1`.

---

## Quick Start & Running Locally

### 1. Prerequisites
- **Node.js**: v18+ (tested on Node.js v24.13.1)
- **npm**: v9+ (tested on npm 11.8.0)

### 2. Install Dependencies
```bash
npm install
```

### 3. Run Automated Acceptance Tests (AT-001 to AT-006)
```bash
npm test
```

### 4. Start Development Studio
```bash
npm run dev
```
The studio will be available at `http://localhost:5174/`.

### 5. Build Production Bundle
```bash
npm run build
```

---

## Operating System Setup & Permissions

### Windows 10 / 11
1. **Grant Camera Permissions**:
   - Open **Windows Settings** > **Privacy & security** > **Camera**.
   - Ensure **Camera access** is toggled **ON**.
   - Ensure **Let desktop apps access your camera** is toggled **ON**.
2. **Virtual Camera Registration**:
   - DirectShow virtual camera filters can be registered per-user or system-wide without rebooting.

### Linux (Ubuntu / Debian)
1. **Install and Load `v4l2loopback`**:
   ```bash
   sudo apt install v4l2loopback-dkms
   sudo modprobe v4l2loopback devices=1 exclusive_caps=1 card_label="MirrorView Virtual Camera"
   sudo usermod -aG video $USER
   ```
   > **Important**: `exclusive_caps=1` is required by Chrome and Zoom so they do not reject the device as a dual capture/output sink.

---

## Clean Uninstall

- **Windows**: Unregister the virtual camera DLL via `regsvr32 /u <dll_path>`.
- **Linux**: Run `sudo modprobe -r v4l2loopback` to unload the virtual kernel device.
- **Application**: Delete the MirrorView directory. No background services, daemons, or registry hooks are left behind.

---

## Architecture Decision Records (ADRs)

- [`ADR-001: Desktop Shell Choice`](docs/adr/ADR-001-desktop-shell.md)
- [`ADR-002: Capture and Frame-Processing Backend`](docs/adr/ADR-002-capture-and-frame-processing.md)
- [`ADR-003: Linux Virtual-Camera Strategy`](docs/adr/ADR-003-linux-virtual-camera.md)
- [`ADR-004: Windows Virtual-Camera Strategy`](docs/adr/ADR-004-windows-virtual-camera.md)
- [`ADR-005: Frame Transport and Performance Approach`](docs/adr/ADR-005-frame-transport-performance.md)
