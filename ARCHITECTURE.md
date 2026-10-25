# Architecture Notes

## Principle

Keep the UI, frame-processing logic, and OS-specific virtual-camera backend separated. Do not design around a single OS's camera mechanism and assume it will transfer to the other.

## Logical components

1. **Desktop UI**
   - React + TypeScript.
   - Camera selection, preview, toggles, sliders, status, app guidance, diagnostics.
2. **Application service**
   - Configuration, lifecycle, capability detection, profile persistence.
3. **Capture adapter**
   - Enumerates and opens physical cameras.
   - Emits timestamped frames and device metadata.
4. **Frame pipeline**
   - Resize if required.
   - Optional outgoing horizontal flip.
   - Color/lighting adjustments.
   - Optional later effects.
   - Publishes the processed frame to the outgoing preview and virtual camera from the same pipeline.
5. **Preview renderer**
   - Local preview mirror must not mutate outgoing frames.
   - Outgoing preview shows the exact processed output.
6. **Virtual-camera adapter**
   - Linux and Windows implementations behind one interface.
7. **Meeting-app helper**
   - OS/process detection only where reliable.
   - Static, versioned instructions for selecting the virtual camera.
   - Do not imply detection proves the meeting app selected MirrorView.
8. **Diagnostics**
   - OS/version, camera backend, output state, frame rate, dropped frames, latency estimate, dependency status.
   - Redact usernames and device identifiers in shareable diagnostics where possible.

## Data flow

Physical camera -> capture adapter -> raw frame
- Local preview path: raw/processed preview choice -> optional preview-only mirror -> UI preview.
- Outgoing path: raw frame -> outgoing flip -> color controls -> optional effects -> outgoing preview + virtual-camera output.

Important: do not apply the same flip twice. Keep preview-only mirroring and outgoing-feed flipping as distinct settings.

## Cross-platform constraints

### Linux
Investigate V4L2 for capture and `v4l2loopback` for virtual output. Verify package installation, module loading, Secure Boot implications, permissions, device naming, and distribution differences. Prefer a documented setup flow and a capability check over silently running shell commands with elevated privileges.

### Windows
Investigate supported Windows camera capture APIs and supported virtual-camera approaches (including current Windows virtual-camera APIs where applicable). Validate OS version support, packaging, signing, installation privileges, and whether Teams/Zoom/browser apps can enumerate the resulting device. Do not assume a user-mode library alone can expose a compatible virtual camera.

### Tauri/native boundary
Use the desktop shell for UI and settings. Keep frame transport efficient; avoid copying every frame through JavaScript if that causes excess CPU or latency. The agent should compare Rust/native, GStreamer, and platform-specific implementations with a small proof of concept before choosing.

## Security and privacy
- Camera use requires explicit user action and clear status.
- No recording or network transmission by default.
- No hidden camera startup.
- Avoid administrator/root actions unless required and explain them.
- Do not run arbitrary scripts from downloaded instructions.
- Provide a visible stop-camera control.
- Logs should never contain frame data.

## Architectural decision records to create
- ADR-001: desktop shell choice.
- ADR-002: capture and frame-processing backend.
- ADR-003: Linux virtual-camera strategy.
- ADR-004: Windows virtual-camera strategy.
- ADR-005: frame transport and performance approach.
Each ADR should include options considered, evidence, tradeoffs, test results, and decision.
