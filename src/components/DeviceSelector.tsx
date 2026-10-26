import React from 'react';
import { Video, VideoOff, RefreshCw, Layers, ShieldCheck } from 'lucide-react';
import { CameraDevice, CameraStatus } from '../types/camera';

interface DeviceSelectorProps {
  devices: CameraDevice[];
  selectedDeviceId: string;
  cameraStatus: CameraStatus;
  testCardMode: boolean;
  targetResolution: { width: number; height: number };
  onSelectDevice: (deviceId: string) => void;
  onRefreshDevices: () => void;
  onToggleCamera: () => void;
  onToggleTestCard: () => void;
  onSelectResolution: (width: number, height: number) => void;
}

export const DeviceSelector: React.FC<DeviceSelectorProps> = ({
  devices,
  selectedDeviceId,
  cameraStatus,
  testCardMode,
  targetResolution,
  onSelectDevice,
  onRefreshDevices,
  onToggleCamera,
  onToggleTestCard,
  onSelectResolution
}) => {
  const isLive = cameraStatus === 'live';

  return (
    <div className="glass-panel control-panel">
      <div className="panel-header">
        <h2 className="panel-title">
          <Video size={18} color="var(--accent-cyan)" />
          <span>Physical Input Device</span>
        </h2>
        <button
          className="btn btn-secondary btn-sm"
          onClick={onRefreshDevices}
          title="Scan for connected camera hardware"
        >
          <RefreshCw size={13} />
          <span>Refresh</span>
        </button>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
        {/* Device Picker */}
        <div className="control-row">
          <label className="control-label">Capture Hardware</label>
          <select
            className="select-input"
            value={selectedDeviceId}
            disabled={testCardMode}
            onChange={e => onSelectDevice(e.target.value)}
          >
            {devices.length === 0 ? (
              <option value="">No cameras detected</option>
            ) : (
              devices.map(d => (
                <option key={d.deviceId} value={d.deviceId}>
                  {d.label}
                </option>
              ))
            )}
          </select>
        </div>

        {/* Resolution Target */}
        <div className="control-row">
          <label className="control-label">Stream Resolution</label>
          <select
            className="select-input"
            value={`${targetResolution.width}x${targetResolution.height}`}
            disabled={testCardMode}
            onChange={e => {
              const [w, h] = e.target.value.split('x').map(Number);
              onSelectResolution(w, h);
            }}
          >
            <option value="1280x720">720p HD (1280 × 720) — Recommended</option>
            <option value="1920x1080">1080p Full HD (1920 × 1080)</option>
            <option value="640x480">480p SD (640 × 480) — Low latency</option>
          </select>
        </div>

        {/* Start / Stop and Calibration Controls */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.6rem', marginTop: '0.5rem' }}>
          <button
            className={`btn ${isLive ? 'btn-danger' : 'btn-primary'}`}
            style={{ width: '100%', padding: '0.75rem' }}
            onClick={onToggleCamera}
            disabled={testCardMode}
          >
            {isLive ? (
              <>
                <VideoOff size={16} />
                <span>Stop Physical Camera</span>
              </>
            ) : (
              <>
                <Video size={16} />
                <span>Start Physical Camera</span>
              </>
            )}
          </button>

          {/* Test Card Mode Toggle */}
          <button
            className={`btn ${testCardMode ? 'btn-primary' : 'btn-secondary'}`}
            style={{ width: '100%', padding: '0.6rem' }}
            onClick={onToggleTestCard}
            title="Switch between live physical camera and synthetic calibration card for transform testing"
          >
            <Layers size={16} />
            <span>{testCardMode ? '✓ Using Calibration Card' : 'Use Asymmetric Calibration Card'}</span>
          </button>
        </div>

        {/* Privacy Note */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginTop: '0.5rem', color: 'var(--text-muted)', fontSize: '0.72rem' }}>
          <ShieldCheck size={14} color="var(--accent-emerald)" />
          <span>Local processing only. Video frames never leave your device.</span>
        </div>
      </div>
    </div>
  );
};
