import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Header } from './components/Header';
import { DualPreview } from './components/DualPreview';
import { DeviceSelector } from './components/DeviceSelector';
import { TransformControls } from './components/TransformControls';
import { MeetingAppGuide } from './components/MeetingAppGuide';
import { DiagnosticsModal } from './components/DiagnosticsModal';
import { TroubleshootingModal } from './components/TroubleshootingModal';
import { CameraService } from './core/CameraService';
import { VirtualCameraBridge } from './core/VirtualCameraBridge';
import { StorageService } from './core/StorageService';
import { AppDetector } from './core/AppDetector';
import {
  CameraDevice,
  CameraStatus,
  StreamStats,
  TransformSettings,
  VirtualCameraState,
  MeetingAppInfo,
  DEFAULT_TRANSFORMS
} from './types/camera';

export const App: React.FC = () => {
  // Camera & Stream States
  const [devices, setDevices] = useState<CameraDevice[]>([]);
  const [selectedDeviceId, setSelectedDeviceId] = useState<string>('');
  const [currentStream, setCurrentStream] = useState<MediaStream | null>(null);
  const [cameraStatus, setCameraStatus] = useState<CameraStatus>('idle');
  const [errorMessage, setErrorMessage] = useState<string>('');
  const [resolution, setResolution] = useState({ width: 1280, height: 720 });
  const [stats, setStats] = useState<StreamStats>({
    fps: 0,
    width: 1280,
    height: 720,
    latencyMs: 12,
    droppedFrames: 0,
    frameCount: 0
  });

  // Settings & Transforms
  const [settings, setSettings] = useState<TransformSettings>(() => StorageService.loadSettings());

  // Virtual Camera State
  const [vcamState, setVcamState] = useState<VirtualCameraState>(() =>
    VirtualCameraBridge.getInstance().getState()
  );

  // Meeting Apps
  const [meetingApps, setMeetingApps] = useState<MeetingAppInfo[]>([]);

  // Modals & Feedback
  const [isDiagnosticsOpen, setIsDiagnosticsOpen] = useState(false);
  const [isTroubleshootingOpen, setIsTroubleshootingOpen] = useState(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  // Video element ref for raw camera feed
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const cameraServiceRef = useRef<CameraService>(new CameraService());

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3000);
  };

  // Initialize camera service and device listener
  useEffect(() => {
    const camService = cameraServiceRef.current;

    camService.setCallbacks(
      (status, errorMsg) => {
        setCameraStatus(status);
        if (errorMsg) setErrorMessage(errorMsg);
      },
      newStats => setStats(newStats)
    );

    // Initial enumeration
    const refreshDevices = async () => {
      const devList = await camService.getDevices();
      setDevices(devList);
      if (devList.length > 0 && !selectedDeviceId) {
        setSelectedDeviceId(devList[0].deviceId);
      }
    };
    refreshDevices();

    // Listen to hardware device connect / disconnect
    if (navigator.mediaDevices?.addEventListener) {
      const handleDeviceChange = () => {
        refreshDevices();
        showToast('Camera devices updated (plug/unplug detected)');
      };
      navigator.mediaDevices.addEventListener('devicechange', handleDeviceChange);
      return () => {
        navigator.mediaDevices.removeEventListener('devicechange', handleDeviceChange);
      };
    }
  }, [selectedDeviceId]);

  // Synchronize stream with videoRef whenever stream changes
  useEffect(() => {
    if (videoRef.current) {
      if (currentStream) {
        if (videoRef.current.srcObject !== currentStream) {
          videoRef.current.srcObject = currentStream;
        }
        videoRef.current.play().catch(console.warn);
        cameraServiceRef.current.bindVideoElement(videoRef.current);
      } else {
        videoRef.current.srcObject = null;
      }
    }
  }, [currentStream]);

  // Subscribe to virtual camera bridge
  useEffect(() => {
    const bridge = VirtualCameraBridge.getInstance();
    const unsubscribe = bridge.subscribe(updatedState => {
      setVcamState(updatedState);
    });
    return unsubscribe;
  }, []);

  // Detect meeting apps on mount
  useEffect(() => {
    AppDetector.detectMeetingApps().then(apps => setMeetingApps(apps));
  }, []);

  // Handle camera start/stop
  const handleToggleCamera = async () => {
    const camService = cameraServiceRef.current;

    if (cameraStatus === 'live') {
      camService.stopCamera();
      setCurrentStream(null);
      if (videoRef.current) {
        videoRef.current.srcObject = null;
      }
      showToast('Camera stopped');
    } else {
      const stream = await camService.startCamera(
        selectedDeviceId || undefined,
        resolution.width,
        resolution.height
      );

      if (stream) {
        setCurrentStream(stream);
        if (videoRef.current) {
          videoRef.current.srcObject = stream;
          videoRef.current.play().catch(console.warn);
          camService.bindVideoElement(videoRef.current);
        }
        showToast('Camera started in 720p HD');

        // Automatically ensure Virtual Camera publishing is active
        const vcam = VirtualCameraBridge.getInstance().getState();
        if (vcam.isAvailable && !vcam.isActive) {
          VirtualCameraBridge.getInstance().toggleActive();
        }

        // Immediately refresh devices with unlocked browser labels
        const updatedDevices = await camService.getDevices(false);
        if (updatedDevices.length > 0) {
          setDevices(updatedDevices);
        }
      }
    }
  };

  // Transform setting changes
  const handleSettingChange = (updated: Partial<TransformSettings>) => {
    setSettings(prev => ({ ...prev, ...updated }));
  };

  const handleResetSettings = () => {
    setSettings(DEFAULT_TRANSFORMS);
    StorageService.resetSettings();
    showToast('Settings reset to neutral defaults (0)');
  };

  const handleSaveProfile = () => {
    StorageService.saveSettings(settings);
    showToast('Profile saved successfully');
  };

  const handleFrameProcessed = useCallback(() => {
    VirtualCameraBridge.getInstance().recordFrameDispatched();
  }, []);

  return (
    <div className="app-container">
      {/* Toast Feedback Notification */}
      {toastMessage && (
        <div
          style={{
            position: 'fixed',
            bottom: '2rem',
            right: '2rem',
            background: 'var(--accent-cyan)',
            color: '#020617',
            padding: '0.65rem 1.25rem',
            borderRadius: 'var(--radius-md)',
            fontWeight: 600,
            fontSize: '0.85rem',
            zIndex: 9999,
            boxShadow: '0 8px 24px rgba(6, 182, 212, 0.4)',
            transition: 'all 0.3s ease'
          }}
        >
          {toastMessage}
        </div>
      )}

      {/* Header Bar */}
      <Header
        cameraStatus={cameraStatus}
        fps={stats.fps}
        resolution={`${stats.width}x${stats.height}`}
        vcamState={vcamState}
        onToggleVcam={() => VirtualCameraBridge.getInstance().toggleActive()}
        onOpenDiagnostics={() => setIsDiagnosticsOpen(true)}
        onOpenTroubleshooting={() => setIsTroubleshootingOpen(true)}
      />

      {/* Main Studio Viewport & Controls */}
      <main className="main-content">
        {/* 1. Dual Preview Viewport (Local Preview & Outgoing Feed) */}
        <DualPreview
          cameraStatus={cameraStatus}
          errorMessage={errorMessage}
          settings={settings}
          stream={currentStream}
          videoRef={videoRef}
          onTogglePreviewMirror={() => handleSettingChange({ previewMirror: !settings.previewMirror })}
          onToggleOutgoingFlip={() => handleSettingChange({ outgoingFlip: !settings.outgoingFlip })}
          onFrameProcessed={handleFrameProcessed}
        />

        {/* 2. Control Panels: Hardware Selector & Color/Orientation Sliders */}
        <div className="controls-grid">
          <DeviceSelector
            devices={devices}
            selectedDeviceId={selectedDeviceId}
            cameraStatus={cameraStatus}
            testCardMode={settings.testCardMode}
            targetResolution={resolution}
            onSelectDevice={async (id) => {
              setSelectedDeviceId(id);
              if (cameraStatus === 'live') {
                const stream = await cameraServiceRef.current.startCamera(id, resolution.width, resolution.height);
                if (stream) {
                  setCurrentStream(stream);
                  if (videoRef.current) {
                    videoRef.current.srcObject = stream;
                    videoRef.current.play().catch(console.warn);
                    cameraServiceRef.current.bindVideoElement(videoRef.current);
                  }
                }
              }
            }}
            onRefreshDevices={async () => {
              const devList = await cameraServiceRef.current.getDevices(true);
              setDevices(devList);
              showToast(`Found ${devList.length} camera(s)`);
            }}
            onToggleCamera={handleToggleCamera}
            onToggleTestCard={() => handleSettingChange({ testCardMode: !settings.testCardMode })}
            onSelectResolution={(w, h) => setResolution({ width: w, height: h })}
          />

          <TransformControls
            settings={settings}
            onChange={handleSettingChange}
            onReset={handleResetSettings}
            onSaveProfile={handleSaveProfile}
          />
        </div>

        {/* 3. Meeting Application Setup Assistant */}
        <MeetingAppGuide apps={meetingApps} />
      </main>

      {/* Modals */}
      <DiagnosticsModal
        isOpen={isDiagnosticsOpen}
        onClose={() => setIsDiagnosticsOpen(false)}
        stats={stats}
        vcamState={vcamState}
        activeDeviceId={selectedDeviceId}
      />

      <TroubleshootingModal
        isOpen={isTroubleshootingOpen}
        onClose={() => setIsTroubleshootingOpen(false)}
      />
    </div>
  );
};
