import { VirtualCameraState } from '../types/camera';

export class VirtualCameraBridge {
  private static instance: VirtualCameraBridge;
  private socket: WebSocket | null = null;
  private isConnecting: boolean = false;
  private state: VirtualCameraState = {
    backend: 'DirectShow (Windows Kernel Bridge)',
    isAvailable: false,
    isActive: false,
    deviceName: 'MirrorView Virtual Camera',
    framesSent: 0,
    statusMessage: 'Virtual camera driver check in progress...'
  };

  private listeners: ((state: VirtualCameraState) => void)[] = [];

  constructor() {
    this.checkStatus();
  }

  public static getInstance(): VirtualCameraBridge {
    if (!VirtualCameraBridge.instance) {
      VirtualCameraBridge.instance = new VirtualCameraBridge();
    }
    return VirtualCameraBridge.instance;
  }

  public async checkStatus(): Promise<boolean> {
    try {
      const res = await fetch('/api/virtual-camera-status');
      if (res.ok) {
        const data = await res.json();
        if (data.ready) {
          this.state.isAvailable = true;
          this.state.deviceName = data.device || 'MirrorView Virtual Camera';
          this.state.statusMessage = 'Virtual camera driver active and ready';
          if (!this.state.isActive) {
            this.toggleActive();
          }
        } else {
          this.state.isAvailable = false;
          this.state.statusMessage = 'Virtual camera driver not registered yet. Run InstallMirrorViewCam.bat as Admin.';
        }
        this.notify();
        return this.state.isAvailable;
      }
    } catch {
      // Offline fallback
    }
    this.notify();
    return false;
  }

  public getState(): VirtualCameraState {
    return { ...this.state };
  }

  public subscribe(listener: (state: VirtualCameraState) => void): () => void {
    this.listeners.push(listener);
    listener(this.getState());
    return () => {
      this.listeners = this.listeners.filter(l => l !== listener);
    };
  }

  public toggleActive(): boolean {
    this.state.isActive = !this.state.isActive;

    if (this.state.isActive) {
      this.connectWebSocket();
      this.state.statusMessage = 'Publishing processed frames to virtual camera sink';
    } else {
      this.disconnectWebSocket();
      this.state.statusMessage = 'Virtual camera output paused';
    }

    this.notify();
    return this.state.isActive;
  }

  private connectWebSocket(): void {
    if (this.socket || this.isConnecting) return;
    this.isConnecting = true;

    try {
      this.socket = new WebSocket('ws://127.0.0.1:5176');
      this.socket.binaryType = 'arraybuffer';

      this.socket.onopen = () => {
        this.isConnecting = false;
        this.state.statusMessage = 'Connected to virtual camera streaming bridge';
        this.notify();
      };

      this.socket.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data);
          if (data.status === 'connected') {
            this.state.deviceName = data.device || this.state.deviceName;
            this.state.isAvailable = true;
            this.notify();
          }
        } catch {
          // ignore binary echo
        }
      };

      this.socket.onclose = () => {
        this.socket = null;
        this.isConnecting = false;
      };

      this.socket.onerror = () => {
        this.socket = null;
        this.isConnecting = false;
      };
    } catch {
      this.socket = null;
      this.isConnecting = false;
    }
  }

  private disconnectWebSocket(): void {
    if (this.socket) {
      this.socket.close();
      this.socket = null;
    }
  }

  public sendFrameBlob(blob: Blob): void {
    if (this.state.isActive && this.socket && this.socket.readyState === WebSocket.OPEN) {
      this.socket.send(blob);
      this.state.framesSent++;
      if (this.state.framesSent % 60 === 0) {
        this.notify();
      }
    }
  }

  public recordFrameDispatched(): void {
    if (this.state.isActive) {
      this.state.framesSent++;
      if (this.state.framesSent % 60 === 0) {
        this.notify();
      }
    }
  }

  private notify(): void {
    const s = this.getState();
    this.listeners.forEach(l => l(s));
  }
}
