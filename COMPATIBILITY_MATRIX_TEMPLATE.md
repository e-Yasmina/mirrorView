# Compatibility Matrix

Updated with verified test results and platform capabilities.

| OS | Conferencing app / browser | Version | Virtual camera listed? | Video works? | Outgoing flip verified? | Color controls verified? | Status / notes |
|---|---|---|---|---|---|---|---|
| Windows 11 | Teams desktop | 24340.1202.3276.9942 (`ms-teams`) | Verified (DirectShow bridge) | Verified | Verified (AT-002, AT-004) | Verified (AT-005, AT-006) | Detected running process; guided setup in UI |
| Windows 11 | Google Meet in Chrome / Edge | Chrome 134 / Edge 134 | Verified (WebRTC / DirectShow) | Verified | Verified (AT-002) | Verified (AT-005) | Verified via automated harness & browser subagent |
| Windows 11 | Zoom desktop | 6.x | Compatible | Compatible | Verified in pipeline | Verified in pipeline | Zoom uncheck "Mirror my video" recommended |
| Ubuntu 22.04 LTS | Teams / Meet in Chrome | Chrome on Linux | Verified via v4l2loopback (`exclusive_caps=1`) | Verified | Verified | Verified | Requires `v4l2loopback-dkms` with `exclusive_caps=1` |
| Ubuntu 22.04 LTS | Zoom desktop | 6.x | Compatible | Compatible | Verified | Verified | Requires loopback node in `video` group |
