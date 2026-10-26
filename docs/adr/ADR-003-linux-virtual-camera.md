# ADR-003: Linux Virtual-Camera Strategy

## Status
Accepted

## Context
On Linux distributions (primarily Ubuntu 20.04/22.04/24.04), applications like Google Meet (in Chrome/Firefox), Microsoft Teams, and Zoom consume video capture devices via Video4Linux2 (`/dev/video*`).

## Official Platform Architecture & Standards
- **Linux V4L2 Subsystem**: Standard kernel video capture API.
- **`v4l2loopback`**: Mainstream kernel module providing virtual video devices.
  - Source: `https://github.com/umlaeute/v4l2loopback`
  - Ubuntu package: `v4l2loopback-dkms`, `v4l2loopback-utils`.
- **Critical Chrome / WebRTC Constraint (`exclusive_caps=1`)**:
  - Chrome, WebRTC, and Chromium-based Electron applications reject V4L2 devices that advertise both capture (`V4L2_CAP_VIDEO_CAPTURE`) and output (`V4L2_CAP_VIDEO_OUTPUT`) capabilities simultaneously.
  - To be recognized by Chrome/Meet and Zoom, the module must be loaded with:
    ```bash
    sudo modprobe v4l2loopback devices=1 video_nr=10 card_label="MirrorView Virtual Camera" exclusive_caps=1
    ```
- **Device Node Permissions**:
  - Writing video frames to `/dev/video10` requires write permission on the character device. In Ubuntu, this is governed by membership in the `video` group: `sudo usermod -aG video $USER`.

## Integration Strategy
1. **Detection & Status**:
   - The app verifies whether `/dev/video*` loopback nodes exist and checks `/sys/devices/virtual/video4linux/`.
   - Never run silent `sudo` commands. If the driver is not loaded, the UI provides clear, copy-pasteable instructions for the user.
2. **Frame Writing**:
   - Stream raw YUYV or BGR24 frames directly to `/dev/videoX` via standard file descriptor write or GStreamer `v4l2sink`.
