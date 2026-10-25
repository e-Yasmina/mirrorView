# Acceptance and Verification Tests

## Image-transform tests
- AT-001: With outgoing flip disabled, an asymmetric test card reads normally.
- AT-002: With outgoing flip enabled, the test card is horizontally reversed exactly once.
- AT-003: Preview-only mirror changes only the local preview; it does not alter virtual output.
- AT-004: Outgoing preview pixel orientation matches the virtual-camera output.
- AT-005: Brightness/contrast/saturation settings change output predictably and reset to neutral.
- AT-006: No settings produce invalid frames, crashes, or unbounded color values.

## Camera lifecycle tests
- AT-010: No camera attached -> useful message and no crash.
- AT-011: Camera permission denied -> explain how to grant permission.
- AT-012: Camera disconnected during use -> status updates and recovery option appears.
- AT-013: Camera busy in another app -> explain the issue and suggest closing the conflicting app where relevant.
- AT-014: Suspend/resume or app restart -> recover or show a clear error.
- AT-015: Stop button stops capture/output and visibly indicates stopped state.

## Virtual-camera tests
- AT-020: OS-specific virtual-camera dependency is detected before attempting output.
- AT-021: Virtual camera can be selected in a standalone camera viewer.
- AT-022: Virtual output works in at least one supported conferencing app on each claimed OS.
- AT-023: If virtual-camera setup fails, the app offers actionable diagnostics without silently changing system configuration.
- AT-024: Clean install and uninstall tested on a clean Windows environment and a clean supported Linux environment.

## Meeting-app tests
Test exact versions/builds and record results:
- Microsoft Teams desktop on Windows.
- Microsoft Teams on Linux only if a supported native/browser configuration is actually available to test.
- Zoom desktop on Windows.
- Zoom on Linux if supported by the selected distribution/version.
- Google Meet in supported Chrome/Edge browser on Windows and Linux.
- A generic WebRTC camera test page or local test harness.

For each, record:
- OS and app/browser version.
- Whether MirrorView virtual camera appears in camera picker.
- Whether video appears.
- Whether outgoing flip and color controls are reflected.
- Whether the app's own local preview is mirrored.
- Whether a second device sees the expected output.
- Known limitations.

## Performance targets
- Target 720p/30 FPS on the agreed reference machine.
- Measure rather than assume latency, CPU, memory, dropped frames, and GPU use.
- Test 1080p only after baseline is stable.
- Test sustained use for 30 minutes and camera stop/restart.
- The app should degrade resolution or show a clear warning rather than freeze the desktop.

## Privacy tests
- No camera starts without clear user action.
- No frame data is written to disk or sent over the network by default.
- Logs do not include images or frame contents.
- User can stop the camera immediately.
- No background autostart unless explicitly enabled.
