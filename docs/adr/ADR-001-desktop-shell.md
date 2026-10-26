# ADR-001: Desktop Shell Choice

## Status
Accepted

## Context
MirrorView requires a desktop application shell to host the user interface, access physical cameras, manage frame processing, interface with OS-specific virtual camera drivers, detect running meeting applications (Teams, Zoom, Google Meet), and persist configuration.

`PRODUCT_SPEC.md` and `AGENT_PROMPT.md` require:
- React + TypeScript for the UI.
- Low-latency camera preview.
- Cross-platform support (Windows 10/11 and Linux/Ubuntu).
- Separation of UI from native camera/video components.

## Options Considered

### Option 1: Tauri (v2)
- **Pros**: Small binary footprint, Rust security model, fast native IPC.
- **Cons**: Requires `cargo` and `rustc` alongside platform C++ build tools (MSVC on Windows). An audit of the host environment revealed that Rust is not installed in `PATH`, and installing full MSVC + Rust toolchains on Windows requires multi-gigabyte administrative installations.
- **Evidence**: `cargo -v` and `rustc -vV` failed with CommandNotFoundException on the host environment.

### Option 2: Electron (Node.js + Chromium)
- **Pros**:
  - Node.js v24.13.1 and npm 11.8.0 are pre-installed and verified.
  - Native support for React 18/19 and TypeScript with Vite.
  - Chromium engine provides zero-latency hardware-accelerated WebGL 2.0 and Canvas 2D frame pipelines via `navigator.mediaDevices.getUserMedia()`.
  - Rich desktop integration: Window management, OS process enumeration (`tasklist` / PowerShell CIM on Windows, `/proc` / `ps` on Linux) to detect Teams, Zoom, Chrome, and Edge without third-party invasive hooks.
  - Cross-platform parity between Windows and Linux.
- **Cons**: Higher memory baseline than Rust/Tauri (~80-120MB baseline), but easily meets performance targets (< 100ms latency, 720p/30fps).

### Option 3: Python (PyQt / PySide)
- **Pros**: Python 3.14 is installed.
- **Cons**: Violates the requirement to use React + TypeScript for the UI unless strictly justified. Integrating React with a Python webview adds unnecessary overhead.

## Decision
Adopt **Electron + Vite + React + TypeScript**. This allows rapid, robust implementation fulfilling all functional requirements (FR-001 to FR-012) and non-functional requirements (NFR-001 to NFR-008) while leveraging existing Node.js v24 tooling.
