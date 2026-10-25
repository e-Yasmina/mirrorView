# Build Roadmap

## Stage 0 — repository and feasibility (first)
- Inspect existing repository before modifying it.
- Identify target OS versions, languages, build tools, and packaging.
- Research current official platform docs for virtual-camera support on Windows and Linux.
- Create ADRs and a risk register.
- Build the smallest camera-to-preview proof of concept.
**Exit:** documented architecture decision with evidence, and a runnable preview on the first development OS.

## Stage 1 — camera preview
- Camera enumeration and selection.
- Start/stop camera lifecycle.
- Preview mirror toggle.
- Explicit "local preview" and "outgoing feed" labels.
- Device disconnect/error handling.
**Exit:** stable preview and no confusing coupling between preview mirror and outgoing orientation.

## Stage 2 — frame controls
- Outgoing horizontal flip.
- Brightness, contrast, saturation.
- Reset controls and save/load settings.
- Unit tests with generated test images (including text, asymmetric shapes, and color patches).
**Exit:** automated transform tests and live manual test checklist.

## Stage 3 — virtual camera on first OS
- Implement native virtual-camera output for the chosen OS.
- Ensure outgoing preview and virtual output share the same processed frame pipeline.
- Test with an independent camera viewer and one conferencing app.
- Measure FPS, frame drops, CPU/GPU use, and end-to-end latency.
**Exit:** a second application can select the virtual camera and receive expected frames.

## Stage 4 — second OS
- Port capture/output adapters.
- Keep UI and processing behavior consistent.
- Add OS-specific dependency checks and install/uninstall docs.
**Exit:** equivalent core workflow passes on Windows and Linux, with limitations clearly listed.

## Stage 5 — meeting-app setup assistant
- Provide verified instructions for Teams, Zoom, and Google Meet in supported browsers.
- Detect installed/running apps only when reliable and privacy-respecting.
- Use status text such as "Virtual camera is active; select it in your meeting app."
- Do not claim camera selection is forced or verified without an actual supported signal.
**Exit:** a tester can configure each supported app using the in-app guide.

## Stage 6 — polish
- Profiles, accessibility, diagnostics export, installer packaging.
- Optional effects only after baseline performance is acceptable.
- Security/privacy review and clean-machine installation tests.
**Exit:** release checklist complete.

## Suggested prioritization
The most technically risky part is virtual-camera output across both operating systems, not the React UI. Prove it early. Do not spend weeks polishing sliders before proving a conferencing app can consume the virtual camera.
