import React from 'react';
import { Camera, Radio, Activity, HelpCircle, Settings, Monitor } from 'lucide-react';
import { CameraStatus, VirtualCameraState } from '../types/camera';

interface HeaderProps {
  cameraStatus: CameraStatus;
  fps: number;
  resolution: string;
  vcamState: VirtualCameraState;
  onToggleVcam: () => void;
  onOpenDiagnostics: () => void;
  onOpenTroubleshooting: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  cameraStatus,
  fps,
  resolution,
  vcamState,
  onToggleVcam,
  onOpenDiagnostics,
  onOpenTroubleshooting
}) => {
  const isLive = cameraStatus === 'live';

  return (
    <header className="app-header">
      <div className="logo-group">
        <div className="logo-icon">
          <Camera size={20} />
        </div>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <span className="logo-title">MirrorView</span>
            <span className="logo-badge">Studio</span>
          </div>
          <p style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>
            Predictable Desktop Webcam & Virtual Output
          </p>
        </div>
      </div>

      <div className="header-status-group">
        {/* OS & Backend indicator */}
        <div className="badge" title="Operating System & Virtual Camera Driver Architecture">
          <Monitor size={14} color="var(--accent-cyan)" />
          <span>Windows 11 (DirectShow)</span>
        </div>

        {/* Physical Camera Live Status */}
        <div className={`badge ${isLive ? 'badge-live' : 'badge-stopped'}`}>
          <span className="pulse-dot" />
          <span>
            {isLive ? `Live (${resolution} @ ${fps} FPS)` : `Camera: ${cameraStatus}`}
          </span>
        </div>

        {/* Virtual Camera Output Toggle */}
        <button
          className={`btn btn-sm ${vcamState.isActive ? 'btn-primary' : 'btn-secondary'}`}
          onClick={onToggleVcam}
          title="Publish processed video to system virtual camera device for Teams, Zoom, and Meet"
        >
          <Radio size={14} className={vcamState.isActive ? 'pulse-dot' : ''} />
          <span>{vcamState.isActive ? 'Virtual Camera: Publishing' : 'Virtual Camera: Idle'}</span>
        </button>

        {/* Diagnostics & Logs */}
        <button
          className="btn btn-secondary btn-sm"
          onClick={onOpenDiagnostics}
          title="Open Performance & Architecture Diagnostics"
        >
          <Activity size={14} />
          <span>Diagnostics</span>
        </button>

        {/* Help & Setup Guide */}
        <button
          className="btn btn-secondary btn-sm"
          onClick={onOpenTroubleshooting}
          title="Setup Instructions & Permissions"
        >
          <HelpCircle size={14} />
        </button>
      </div>
    </header>
  );
};
