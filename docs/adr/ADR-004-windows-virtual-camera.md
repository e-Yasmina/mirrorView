# ADR-004: Windows Virtual-Camera Strategy

## Status
Accepted

## Context
Windows conferencing applications (Microsoft Teams desktop, Zoom desktop, Google Meet in Chrome/Edge, Discord) acquire camera video either via Microsoft Media Foundation (MF) or legacy DirectShow.

## Official Platform Architecture & Standards

### 1. Windows 11 Media Foundation Virtual Camera (`IMFVirtualCamera`)
- **Official Documentation**: Microsoft Learn: `MFCreateVirtualCamera` function (`mfvirtualcamera.h`, `mfsensorgroup.lib`, introduced in Windows 11 Build 22000).
- **Architecture**:
  - `MFCreateVirtualCamera(MFVirtualCameraType_SoftwareCameraSource, MFVirtualCameraLifetime_Session, MFVirtualCameraAccess_CurrentUser, L"MirrorView", ...)`
  - Creates an `IMFVirtualCamera` instance registered with the Windows Camera Frame Server (`FrameServer.dll`).
  - Requires implementing a COM Media Source (`IMFMediaSource`) DLL implementing custom streams (`IMFMediaStream`).
- **Limitations**:
  - Requires Windows 11 (Build 22000+); completely unsupported on Windows 10.
  - Requires registering a packaged COM component and handling Windows Frame Server IPC.

### 2. DirectShow Virtual Camera Filter (DirectShow BaseClasses / Loopback Source)
- **Official Documentation**: Microsoft DirectShow SDK (`CLSID_VideoInputDeviceCategory` - `{860BB310-5D01-11d0-BD3B-00A0C911CE86}`).
- **Architecture**:
  - A DirectShow source filter registered under `CLSID_VideoInputDeviceCategory`.
  - Windows Media Foundation includes a native bridge (`MF_DEVSOURCE_ATTRIBUTE_SOURCE_TYPE_VIDCAP_CATEGORY`) that automatically wraps any DirectShow video capture filter into an MF Media Source.
  - Because of this native bridge, DirectShow virtual camera filters work seamlessly in BOTH legacy DirectShow apps and modern Windows Media Foundation applications (including Chrome, Edge, Teams desktop, Zoom desktop, and Windows Camera app).
  - Compatible with Windows 10 AND Windows 11.
  - Frame delivery: The filter reads raw uncompressed frames (RGB24/32 or NV12) from a named shared memory map (`CreateFileMapping` / `OpenFileMapping`) synchronized with a mutex/event.

## Decision
MirrorView supports the **DirectShow Virtual Camera architecture with Shared Memory Transport** as its primary Windows strategy for universal Windows 10 and Windows 11 compatibility across Teams, Zoom, Chrome, and Edge.
The app includes:
1. Virtual Camera backend detection and registration status checking.
2. Direct frame streaming into the virtual camera sink buffer.
3. Diagnostic wizard and setup guide for meeting applications.
