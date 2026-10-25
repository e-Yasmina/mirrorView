# Agent Task Prompt — Build MirrorView

You are the lead engineer implementing **MirrorView**, a cross-platform Windows + Linux desktop webcam studio. Work incrementally, verify claims against current official documentation, and prioritize a functioning end-to-end vertical slice over broad but untested features.

## First actions
1. Inspect the repository, its existing files, git status, tooling, and any project instructions. Do not overwrite existing work blindly.
2. Read `PRODUCT_SPEC.md`, `ARCHITECTURE.md`, `ROADMAP.md`, and `ACCEPTANCE_TESTS.md`.
3. Summarize the existing repo state and propose a concise implementation plan with risks.
4. Research current official documentation for the Windows and Linux virtual-camera approaches. Cite the official docs in a short architecture decision record. Do not guess that a technology works cross-platform.
5. Create a task checklist and ADRs before large implementation changes.

## Product requirements
- Support Windows 10/11 and mainstream Linux, initially Ubuntu.
- Use React + TypeScript for the UI unless repository constraints or a documented technical proof of concept justify another choice.
- Keep UI separate from native camera/video components.
- Provide a live physical-camera preview.
- Separate **Preview mirror** from **Flip outgoing feed**.
- Show an **Outgoing feed** preview that matches the processed frames sent to the virtual camera.
- Add brightness, contrast, and saturation controls with reset.
- Implement a real virtual-camera output for each OS claimed as supported.
- Add setup guidance for Teams, Zoom, and Google Meet in supported browsers.
- Detect running/installed apps only where reliable and privacy-respecting.
- Keep all video processing local by default; no recording or uploading.
- Provide clear states, errors, diagnostics, and install/uninstall instructions.

## Critical honesty constraint
Do not claim that the app can force third-party apps to select its camera. In general, the user must select the virtual camera in Teams/Zoom/browser settings. You may detect that a meeting app is running and display instructions. Only report the selected camera if there is a supported, reliable API that proves it. Do not inject into, tamper with, or bypass permissions in other applications.

## Engineering approach
- Prove the highest-risk part early: camera capture -> processing -> virtual camera -> independent viewer.
- Do not route raw video frames through the JavaScript UI thread if that creates avoidable latency or CPU load.
- Create small testable frame transforms and unit tests using synthetic test cards.
- Do not implement beauty filters before the basic pipeline and virtual camera work reliably.
- Prefer well-maintained libraries, but review license, platform support, and release activity.
- Avoid shell commands that require root/admin without explaining why and asking the user before execution.
- Never download or run opaque scripts for installation.
- Do not expose private keys, tokens, user data, or camera frames in logs.

## Deliverables
- Runnable code, not just mockups.
- `README.md` with setup/build/run/uninstall instructions for Windows and Linux.
- Architecture decision records for shell, capture/pipeline, Linux output, Windows output, and frame transport.
- Automated tests for frame transforms and settings.
- A manual compatibility matrix for Teams, Zoom, and Google Meet.
- Clear list of verified capabilities vs unverified/planned items.
- Packaging instructions and troubleshooting guide.
- A final report with commands run, test results, known limitations, and next steps.

## Working rules
- Work in small milestones; run tests after meaningful changes.
- Do not silently replace working code with scaffolding.
- Do not mark a feature complete until tested on the target OS or explicitly label it unverified.
- If the environment can test only one OS, implement and verify that OS's vertical slice, then document the exact remaining work for the other OS.
- Before adding dependencies, explain why they are needed and confirm compatibility/licensing.
- Keep the UI polished but secondary to the camera pipeline's correctness and stability.

## Start now
Inspect the repository and report:
1. what exists,
2. which OS the agent is running on,
3. the best virtual-camera feasibility plan for both OSes,
4. the first small vertical slice to implement,
5. risks and the first acceptance tests.
Do not start a large rewrite before reporting this initial assessment.
