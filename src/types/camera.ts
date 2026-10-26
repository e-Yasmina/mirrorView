export type CameraStatus = 'idle' | 'initializing' | 'live' | 'stopped' | 'error' | 'unavailable';

export interface CameraDevice {
  deviceId: string;
  label: string;
  groupId?: string;
}

export interface StreamStats {
  fps: number;
  width: number;
  height: number;
  latencyMs: number;
  droppedFrames: number;
  frameCount: number;
}

export interface TransformSettings {
  previewMirror: boolean;      // Local presentation viewport ONLY
  outgoingFlip: boolean;       // Processed outgoing frame transform
  brightness: number;         // -100 to 100 (neutral: 0)
  contrast: number;           // -100 to 100 (neutral: 0)
  saturation: number;         // -100 to 100 (neutral: 0)
  testCardMode: boolean;      // Use synthetic test card for verification
  testCardType: 'asymmetric' | 'colorbars' | 'grid';
}

export const DEFAULT_TRANSFORMS: TransformSettings = {
  previewMirror: true,
  outgoingFlip: false,
  brightness: 0,
  contrast: 0,
  saturation: 0,
  testCardMode: false,
  testCardType: 'asymmetric'
};

export interface VirtualCameraState {
  backend: string;
  isAvailable: boolean;
  isActive: boolean;
  deviceName: string;
  framesSent: number;
  statusMessage: string;
}

export interface MeetingAppInfo {
  id: 'teams' | 'zoom' | 'meet';
  name: string;
  processName: string;
  isRunning: boolean;
  instructions: string[];
  docsUrl: string;
}
