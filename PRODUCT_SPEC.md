# Product Specification

## 1. Product summary

**Working name:** MirrorView  
**Purpose:** Give people a predictable view of their outgoing webcam image and a consistent, adjustable virtual-camera feed for online meetings.  
**Platforms:** Windows 10/11 and mainstream Linux distributions, starting with Ubuntu.  
**Primary users:** People who want a reliable camera preview, correct orientation, improved lighting, and one place to manage webcam settings.

## 2. User problem

Users may be accustomed to a mirrored self-view in mirrors, selfies, or meeting previews. Some applications mirror only the local preview while transmitting an unmirrored feed. The difference can feel unfamiliar. Lighting, camera placement, auto-exposure, lens perspective, and app-specific processing also affect how a camera image looks.

The product must not imply that an unmirrored image is objectively worse or that mirroring changes facial geometry. Its purpose is user control and accurate preview of the outgoing signal.

## 3. Core user journeys

### Journey A — first launch
1. App detects OS and lists available cameras.
2. User chooses a camera.
3. App displays a live preview and a clear status for physical camera, processing, and virtual-camera output.
4. App explains preview mirroring vs outgoing-feed flipping.
5. User grants any required OS permissions.

### Journey B — configure output
1. User selects **Mirror my preview** (local preview only).
2. User independently selects **Flip outgoing feed** (frames sent to virtual camera).
3. User can choose **Show outgoing feed** to inspect the exact processed frames intended for meetings.
4. User adjusts brightness, contrast, saturation, gamma/exposure where supported, and white balance where supported.
5. User can reset to neutral defaults and save a profile.

### Journey C — join a meeting
1. App detects supported conferencing apps/processes where feasible.
2. App shows concise setup instructions for Teams, Zoom, and browser-based Google Meet.
3. User selects **MirrorView Virtual Camera** in the meeting app or browser.
4. App verifies whether the virtual camera is publishing frames, but does not claim to know which camera the meeting app has selected unless that can be reliably verified.
5. User can run a test checklist before joining.

## 4. Functional requirements

### P0 — required for MVP
- FR-001: Detect OS and runtime environment.
- FR-002: Enumerate available physical cameras and handle permission/device errors.
- FR-003: Display live preview with low latency.
- FR-004: Provide independent controls for local-preview mirroring and outgoing-feed flipping.
- FR-005: Show a labeled outgoing-feed preview that reflects the exact transform and color pipeline used for virtual output.
- FR-006: Provide basic brightness, contrast, saturation, and reset controls.
- FR-007: Expose a virtual camera using a platform-appropriate implementation.
- FR-008: Show camera/output states: unavailable, initializing, live, stopped, error.
- FR-009: Provide guided camera-selection instructions for Teams, Zoom, and Google Meet in supported browsers.
- FR-010: Persist user settings locally, with a reset option.
- FR-011: No video upload, recording, or analytics involving video by default.
- FR-012: Provide clear installation, permissions, troubleshooting, and uninstall instructions.

### P1 — after the MVP is stable
- FR-101: Per-device profiles and auto-restore last used profile.
- FR-102: Exposure and white-balance controls when hardware/OS supports them.
- FR-103: Optional subtle background blur using local processing.
- FR-104: Optional skin smoothing, off by default, with strength slider and clear labeling.
- FR-105: App-specific setup pages and compatibility checks.
- FR-106: Detect running Teams/Zoom/browser processes where OS APIs permit, without inspecting private content.
- FR-107: Optional "launch at login" setting with explicit opt-in.

### P2 — only if justified
- FR-201: Background replacement.
- FR-202: GPU-accelerated effects.
- FR-203: Signed installer/update workflow and broader Linux packaging.
- FR-204: Additional meeting-app guidance based on verified compatibility.

## 5. Non-functional requirements
- NFR-001: Aim for 720p at 30 FPS on a typical supported machine; allow lower-resolution fallback.
- NFR-002: Keep added processing latency low and measure it; target under 100 ms for the basic pipeline when practical.
- NFR-003: Recover gracefully from camera disconnects, app restarts, suspend/resume, and virtual-camera failures.
- NFR-004: Never silently switch camera devices or change outgoing orientation.
- NFR-005: Never claim universal compatibility before testing.
- NFR-006: Settings and logs must not contain video frames or unnecessary personal data.
- NFR-007: Accessibility: keyboard navigation, visible focus, labels, and adequate contrast.
- NFR-008: Explain platform-specific dependencies and permissions in plain language.

## 6. Out of scope for MVP
- Forcing or injecting camera selection into another application.
- Bypassing operating-system or browser camera permissions.
- Replacing the user's camera without clear consent.
- Cloud video processing or upload.
- Promising face geometry correction or "fixing" a user's face.
- Building a custom codec or a complete camera driver from scratch.

## 7. Product language
Prefer: "Preview your outgoing camera feed", "Mirror preview", "Flip outgoing video", "Lighting controls", "Virtual camera status".  
Avoid: "Fix your face", "force every app", or claims that one orientation is the objectively correct appearance.
