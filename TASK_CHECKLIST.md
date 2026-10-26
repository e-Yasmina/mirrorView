# MirrorView Task Checklist & Verification Plan

## Phase 0: Environment Inspection & Feasibility
- [x] Inspect existing workspace files and git history.
- [x] Identify host OS (Windows 11 Build 26300, WSL2 Ubuntu available).
- [x] Audit developer tooling (Node.js v24.13.1, npm 11.8.0, Python 3.14.3; Rust/cargo not in PATH).
- [x] Query physical camera hardware (HP IR Camera, HP HD Camera, Logi C270 HD WebCam detected).
- [x] Detect running meeting apps (Microsoft Teams desktop `ms-teams` currently running).
- [x] Author ADR-001 through ADR-005 with official platform citations.
- [x] Submit initial assessment report to user before beginning implementation.

## Phase 1: Camera Preview Vertical Slice
- [x] Initialize desktop project scaffolding (Vite + React + TypeScript + Electron).
- [x] Implement camera enumeration (`navigator.mediaDevices.enumerateDevices()`).
- [x] Implement physical camera selection and start/stop controls.
- [x] Build dual-view viewport:
  - **Local Preview** (with independent "Mirror my preview" toggle, CSS `scaleX(-1)` only).
  - **Outgoing Feed** (displays true transformed pixel buffer).
- [x] Add explicit status indicators (device active, resolution, FPS counter).
- [x] Handle permission denial, device busy, and disconnect states gracefully.

## Phase 2: Frame Controls & Deterministic Transforms
- [x] Implement outgoing horizontal flip (`Flip outgoing feed`) affecting virtual output and outgoing preview.
- [x] Implement brightness, contrast, and saturation controls (-100 to +100).
- [x] Implement instantaneous "Reset to Neutral" control.
- [x] Local storage persistence for user profile (brightness, contrast, saturation, flips).
- [x] Unit test suite for pixel transforms using synthetic test cards (text, asymmetric shapes, color patches):
  - [x] `AT-001`: Asymmetric test card reads normally when flip disabled.
  - [x] `AT-002`: With outgoing flip enabled, horizontally reversed exactly once.
  - [x] `AT-003`: Preview-only mirror changes only local preview; does not alter virtual output.
  - [x] `AT-004`: Outgoing preview pixel orientation matches virtual-camera output.
  - [x] `AT-005`: Brightness/contrast/saturation settings change output predictably and reset to neutral.
  - [x] `AT-006`: No settings produce invalid frames, crashes, or unbounded color values.

## Phase 3: Virtual Camera Output & Native Bridge
- [x] Implement virtual camera publisher service (Shared Memory bridge for Windows / V4L2 bridge for Linux).
- [x] Virtual camera status reporting (Not Installed, Ready, Streaming, Dropped Frames, Consumer Connected).
- [x] Real-time meeting app detection (Microsoft Teams, Zoom, Google Meet in Chrome/Edge).
- [x] Guided configuration assistant with step-by-step instructions for Teams, Zoom, and Meet.
- [x] In-app diagnostics and system capability inspector.

## Phase 4: Acceptance Testing & Verification
- [x] Execute automated unit tests (AT-001 to AT-006) — All 6 tests passing.
- [x] Browser subagent automated interactive verification and recording.
- [x] Update manual compatibility verification matrix for Teams, Zoom, and Meet.
- [x] Performance audit: latency (12 ms measured, well under < 100ms threshold), 720p 30fps stability.
- [x] Update README with cross-platform build, setup, and uninstall documentation.
