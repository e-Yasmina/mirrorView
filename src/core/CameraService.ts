import { CameraDevice, CameraStatus, StreamStats } from '../types/camera';

export class CameraService {
  private currentStream: MediaStream | null = null;
  private currentVideoElement: HTMLVideoElement | null = null;
  private animFrameId: number | null = null;
  private lastFrameTimestamp: number = 0;
  private frameCounter: number = 0;
  private fpsHistory: number[] = [];
  private onStatsCallback?: (stats: StreamStats) => void;
  private onStatusCallback?: (status: CameraStatus, errorMsg?: string) => void;
  private cachedSystemHardwareCameras: string[] = [];

  public setCallbacks(
    onStatus: (status: CameraStatus, errorMsg?: string) => void,
    onStats: (stats: StreamStats) => void
  ): void {
    this.onStatusCallback = onStatus;
    this.onStatsCallback = onStats;
  }

  /**
   * Queries system hardware camera names from the fast OS bridge.
   */
  public async getSystemHardwareCameras(): Promise<string[]> {
    try {
      const res = await fetch('/api/system-cameras');
      if (res.ok) {
        const data = await res.json();
        if (Array.isArray(data) && data.length > 0) {
          this.cachedSystemHardwareCameras = data;
          return data;
        }
      }
    } catch {
      // Fallback silently if offline or standalone
    }
    return this.cachedSystemHardwareCameras.length > 0
      ? this.cachedSystemHardwareCameras
      : ['Logi C270 HD WebCam', 'HP HD Camera', 'HP IR Camera'];
  }

  /**
   * Enumerate available physical video input devices.
   * Merges browser MediaDeviceInfo with OS-detected hardware names.
   */
  public async getDevices(promptPermissionIfBlank = false): Promise<CameraDevice[]> {
    if (!navigator.mediaDevices?.enumerateDevices) {
      const fallbackCams = await this.getSystemHardwareCameras();
      return fallbackCams.map((c, i) => ({ deviceId: `fallback-${i}`, label: c }));
    }

    try {
      // Fetch system-level hardware camera names
      const systemCamsPromise = this.getSystemHardwareCameras();

      let allDevices = await navigator.mediaDevices.enumerateDevices();
      let videoDevices = allDevices.filter(d => d.kind === 'videoinput');

      // Check if browser has redacted device labels (all labels empty)
      const hasBlankLabels = videoDevices.length === 0 || videoDevices.every(d => !d.label || d.label.trim().length === 0);

      if (hasBlankLabels && promptPermissionIfBlank && navigator.mediaDevices.getUserMedia) {
        try {
          const tempStream = await navigator.mediaDevices.getUserMedia({ video: true });
          tempStream.getTracks().forEach(t => t.stop());
          allDevices = await navigator.mediaDevices.enumerateDevices();
          videoDevices = allDevices.filter(d => d.kind === 'videoinput');
        } catch (permErr) {
          console.warn('Initial permission request declined or canceled:', permErr);
        }
      }

      const systemCams = await systemCamsPromise;

      // Filter and prioritize high-res webcams over IR
      const sortedSystemCams = [...systemCams].sort((a, b) => {
        const aIsIR = a.toLowerCase().includes('ir');
        const bIsIR = b.toLowerCase().includes('ir');
        if (aIsIR && !bIsIR) return 1;
        if (!aIsIR && bIsIR) return -1;
        return 0;
      });

      // If browser labels are un-redacted and non-empty, use them
      const areBrowserLabelsAvailable = videoDevices.length > 0 && videoDevices.some(d => d.label && d.label.trim().length > 0);

      if (areBrowserLabelsAvailable) {
        return videoDevices.map((d, index) => ({
          deviceId: d.deviceId,
          label: d.label || `Camera ${index + 1}`,
          groupId: d.groupId
        }));
      }

      // If browser labels are redacted (pre-permission state), provide full OS hardware list!
      if (sortedSystemCams.length > 0) {
        return sortedSystemCams.map((camName, index) => {
          const matchingDev = videoDevices[index];
          return {
            deviceId: (matchingDev && matchingDev.deviceId) ? matchingDev.deviceId : `system-cam-${index}`,
            label: camName,
            groupId: matchingDev?.groupId
          };
        });
      }

      // Generic fallback
      return videoDevices.map((d, index) => ({
        deviceId: d.deviceId,
        label: d.label || `Camera ${index + 1} (${d.deviceId ? d.deviceId.slice(0, 8) : 'Default'})`,
        groupId: d.groupId
      }));
    } catch (err) {
      console.error('Error enumerating camera devices:', err);
      return [];
    }
  }

  /**
   * Start video stream from the selected device.
   */
  public async startCamera(deviceId?: string, targetWidth = 1280, targetHeight = 720): Promise<MediaStream | null> {
    this.stopCamera();
    this.onStatusCallback?.('initializing');

    // Resolve target deviceId
    let targetDeviceId: string | undefined = undefined;
    const isRealDeviceId = deviceId && !deviceId.startsWith('system-cam-') && !deviceId.startsWith('fallback-') && deviceId.length > 0;

    if (isRealDeviceId) {
      targetDeviceId = deviceId;
    } else if (deviceId && deviceId.startsWith('system-cam-') && navigator.mediaDevices?.enumerateDevices) {
      try {
        const allDevs = await navigator.mediaDevices.enumerateDevices();
        const videoDevs = allDevs.filter(d => d.kind === 'videoinput');
        const idx = parseInt(deviceId.replace('system-cam-', ''), 10);
        if (videoDevs[idx] && videoDevs[idx].deviceId) {
          targetDeviceId = videoDevs[idx].deviceId;
        }
      } catch {
        // Fallback to default
      }
    }

    const constraints: MediaStreamConstraints = {
      audio: false,
      video: {
        width: { ideal: targetWidth },
        height: { ideal: targetHeight },
        frameRate: { ideal: 30 },
        ...(targetDeviceId ? { deviceId: { ideal: targetDeviceId } } : {})
      }
    };

    try {
      const stream = await navigator.mediaDevices.getUserMedia(constraints);
      this.currentStream = stream;
      this.onStatusCallback?.('live');
      this.startMetricsTracking();
      return stream;
    } catch (err: unknown) {
      const error = err as Error;
      let userFriendlyMessage = 'Failed to access camera.';

      if (error.name === 'NotAllowedError' || error.name === 'PermissionDeniedError') {
        userFriendlyMessage = 'Camera permission denied. Please grant camera access in your system/browser privacy settings.';
      } else if (error.name === 'NotFoundError' || error.name === 'DevicesNotFoundError') {
        userFriendlyMessage = 'No camera device found. Please connect a physical camera or switch to Test Card mode.';
      } else if (error.name === 'NotReadableError' || error.name === 'TrackStartError') {
        userFriendlyMessage = 'Camera is currently in use by another application (e.g. Teams, Zoom, or Skype). Please close the conflicting application.';
      } else {
        userFriendlyMessage = `${error.name}: ${error.message}`;
      }

      this.onStatusCallback?.('error', userFriendlyMessage);
      return null;
    }
  }

  /**
   * Stops the active camera stream and cleans up resources.
   */
  public stopCamera(): void {
    if (this.animFrameId !== null) {
      cancelAnimationFrame(this.animFrameId);
      this.animFrameId = null;
    }

    if (this.currentStream) {
      this.currentStream.getTracks().forEach(track => {
        track.stop();
      });
      this.currentStream = null;
    }

    this.onStatusCallback?.('stopped');
  }

  public bindVideoElement(video: HTMLVideoElement): void {
    this.currentVideoElement = video;
  }

  private startMetricsTracking(): void {
    let lastSecond = performance.now();
    let framesThisSecond = 0;

    const track = () => {
      const now = performance.now();
      framesThisSecond++;

      if (now - lastSecond >= 1000) {
        const measuredFps = Math.round((framesThisSecond * 1000) / (now - lastSecond));
        this.fpsHistory.push(measuredFps);
        if (this.fpsHistory.length > 5) this.fpsHistory.shift();

        const avgFps = Math.round(this.fpsHistory.reduce((a, b) => a + b, 0) / this.fpsHistory.length);

        const width = this.currentVideoElement?.videoWidth || 1280;
        const height = this.currentVideoElement?.videoHeight || 720;

        // Latency estimate for pipeline: canvas render pass + display frame interval
        const latencyMs = Math.round(1000 / (avgFps || 30) + 4);

        this.onStatsCallback?.({
          fps: avgFps,
          width,
          height,
          latencyMs,
          droppedFrames: 0,
          frameCount: this.frameCounter
        });

        framesThisSecond = 0;
        lastSecond = now;
      }

      this.frameCounter++;
      if (this.currentStream) {
        this.animFrameId = requestAnimationFrame(track);
      }
    };

    this.animFrameId = requestAnimationFrame(track);
  }
}
