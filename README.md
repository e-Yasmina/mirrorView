# MirrorView — Agent Build Starter Kit

MirrorView is a cross-platform desktop app concept for Windows and Linux that gives users a reliable, adjustable webcam feed for video meetings.

## Product goal

Create a privacy-first desktop camera studio with:
- A live camera preview with separate **Self-view mirror** and **Outgoing feed** indicators.
- Horizontal flip control, exposure/brightness/contrast/saturation/white balance controls where supported.
- Optional subtle enhancement effects, disabled by default.
- A virtual-camera output that conferencing apps can select.
- Detection of installed/running conferencing apps where feasible, with clear setup guidance.
- A simple compatibility checker and diagnostics page.

## Important platform reality

An app generally **cannot silently force Microsoft Teams, Zoom, Google Meet in a browser, or another process to use its camera**. It can provide a virtual camera, detect some apps/processes, and guide the user to select that camera in each app. Browser-based Meet is controlled by browser permissions and the site's camera selector. Do not promise universal automatic switching or bypass app/browser permission controls.

The app should clearly distinguish:
1. **Preview mirror** — affects only how the user sees their own preview.
2. **Outgoing flip** — changes the frames sent through the virtual camera.
3. **Meeting app camera selection** — must be configured in the target app/browser unless a supported, documented integration exists.

## Recommended first implementation

Start with a vertical-slice prototype:
1. Open a physical webcam.
2. Show a live preview and mirror toggle.
3. Add basic color/lighting controls.
4. Produce a virtual-camera feed on one OS.
5. Verify the outgoing feed from a second device or test meeting.
6. Port the same pipeline to the other OS.

Do not implement advanced AI effects before capture, latency, virtual-camera output, and recovery are reliable.

## Suggested technology options

The agent should validate these choices against current platform support before committing:
- UI: React + TypeScript.
- Desktop shell: Tauri (preferred to investigate first) or another well-justified cross-platform shell.
- Video pipeline: GStreamer or native platform camera APIs; OpenCV may help with frame transforms but is not a complete camera/virtual-camera solution by itself.
- Linux virtual camera: commonly `v4l2loopback` plus a pipeline that writes frames to it; installation and permissions vary by distribution.
- Windows virtual camera: investigate supported Windows virtual-camera APIs and packaging/signing requirements. Do not assume Linux's `v4l2loopback` approach works on Windows.
- Tests: unit tests for image transforms; integration tests for camera capture and virtual output on each OS.

## Definition of a safe, honest MVP

The MVP is complete when:
- It can display a camera preview without crashing.
- Preview mirroring and outgoing mirroring are separate, explicit settings.
- Users can tell which image is actually sent to the virtual camera.
- Basic color adjustments are real, measurable, and resettable.
- The virtual camera can be selected manually in at least one target meeting app on each supported OS, or limitations are explicitly documented.
- No face video is uploaded or stored by default.
- The app does not claim it can force camera selection inside third-party applications.
- Setup and uninstall instructions are documented.

See `PRODUCT_SPEC.md`, `ARCHITECTURE.md`, `ROADMAP.md`, `ACCEPTANCE_TESTS.md`, and `AGENT_PROMPT.md`.
