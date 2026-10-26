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

export interface FilterPresetDefinition {
  id: string;
  name: string;
  tagline: string;
  badge?: string;
  settings: Partial<TransformSettings>;
}

export interface TransformSettings {
  previewMirror: boolean;      // Local presentation viewport ONLY
  outgoingFlip: boolean;       // Processed outgoing frame transform
  brightness: number;         // -100 to 100 (neutral: 0)
  contrast: number;           // -100 to 100 (neutral: 0)
  saturation: number;         // -100 to 100 (neutral: 0)
  smoothness: number;         // 0 to 100 (Skin smoothing / imperfection touch-up, neutral: 0)
  warmth: number;             // -50 to 50 (Color temp: negative=cool daylight, positive=warm gold, neutral: 0)
  tint: number;               // -50 to 50 (Tint: negative=green balance, positive=magenta glow, neutral: 0)
  filterPreset: string;       // Active preset ID ('none' | 'natural_glow' | 'executive' | etc.)
  testCardMode: boolean;      // Use synthetic test card for verification
  testCardType: 'asymmetric' | 'colorbars' | 'grid';
}

export const PROFESSIONAL_PRESETS: FilterPresetDefinition[] = [
  {
    id: 'none',
    name: 'Natural / Raw',
    tagline: 'Clean camera pass-through without enhancements',
    settings: {
      smoothness: 0,
      warmth: 0,
      tint: 0,
      brightness: 0,
      contrast: 0,
      saturation: 0
    }
  },
  {
    id: 'natural_glow',
    name: 'Natural Glow',
    tagline: 'Subtle skin softening with warm, awake presence',
    badge: 'Popular',
    settings: {
      smoothness: 35,
      warmth: 14,
      tint: 4,
      brightness: 6,
      contrast: 8,
      saturation: 10
    }
  },
  {
    id: 'executive',
    name: 'Executive Studio',
    tagline: 'High-definition contrast, neutral lighting, and polished skin',
    badge: 'Pro Look',
    settings: {
      smoothness: 25,
      warmth: 0,
      tint: 0,
      brightness: 8,
      contrast: 14,
      saturation: 4
    }
  },
  {
    id: 'warm_sunlight',
    name: 'Warm Sunlight',
    tagline: 'Cancels cold, pale webcam tones with morning golden hour vitality',
    settings: {
      smoothness: 30,
      warmth: 26,
      tint: 6,
      brightness: 6,
      contrast: 6,
      saturation: 16
    }
  },
  {
    id: 'cool_office',
    name: 'Office Light Fix',
    tagline: 'Neutralizes harsh greenish/yellow fluorescent overhead lighting',
    settings: {
      smoothness: 20,
      warmth: -8,
      tint: 18,
      brightness: 8,
      contrast: 10,
      saturation: 6
    }
  },
  {
    id: 'soft_touchup',
    name: 'Touch-Up Flawless',
    tagline: 'Diffuses blemishes, wrinkles, and sensor grain while keeping eyes sharp',
    badge: 'Smoothing',
    settings: {
      smoothness: 65,
      warmth: 8,
      tint: 4,
      brightness: 4,
      contrast: 4,
      saturation: 6
    }
  }
];

export const DEFAULT_TRANSFORMS: TransformSettings = {
  previewMirror: true,
  outgoingFlip: false,
  brightness: 0,
  contrast: 0,
  saturation: 0,
  smoothness: 0,
  warmth: 0,
  tint: 0,
  filterPreset: 'none',
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
