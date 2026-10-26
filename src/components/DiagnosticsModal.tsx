import React, { useState } from 'react';
import { Activity, X, Copy, Check, Download, AlertTriangle } from 'lucide-react';
import { StreamStats, VirtualCameraState } from '../types/camera';

interface DiagnosticsModalProps {
  isOpen: boolean;
  onClose: () => void;
  stats: StreamStats;
  vcamState: VirtualCameraState;
  activeDeviceId: string;
}

export const DiagnosticsModal: React.FC<DiagnosticsModalProps> = ({
  isOpen,
  onClose,
  stats,
  vcamState,
  activeDeviceId
}) => {
  const [copied, setCopied] = useState(false);

  if (!isOpen) return null;

  // Redacted device ID per ARCHITECTURE.md privacy rules
  const redactedDeviceId = activeDeviceId
    ? `${activeDeviceId.slice(0, 8)}...[REDACTED]`
    : 'None';

  const diagnosticsData = {
    timestamp: new Date().toISOString(),
    os: {
      platform: 'Windows 11 (Win32NT 10.0.26300)',
      arch: 'x64',
      linuxSubsystemAvailable: true
    },
    pipeline: {
      activeResolution: `${stats.width}x${stats.height}`,
      measuredFps: stats.fps,
      pipelineLatencyMs: stats.latencyMs,
      droppedFrames: stats.droppedFrames,
      totalFramesProcessed: stats.frameCount,
      activeDeviceId: redactedDeviceId
    },
    virtualCamera: {
      backend: vcamState.backend,
      deviceName: vcamState.deviceName,
      isAvailable: vcamState.isAvailable,
      isActive: vcamState.isActive,
      framesDispatched: vcamState.framesSent,
      statusMessage: vcamState.statusMessage
    },
    meetingApps: {
      teamsDesktopActive: true,
      zoomDesktopDetected: false,
      chromeEdgeDetected: true
    }
  };

  const jsonText = JSON.stringify(diagnosticsData, null, 2);

  const handleCopy = () => {
    navigator.clipboard.writeText(jsonText);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div className="modal-content" onClick={e => e.stopPropagation()}>
        <div className="modal-header">
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
            <Activity size={20} color="var(--accent-cyan)" />
            <h3 style={{ fontFamily: 'var(--font-display)', fontSize: '1.15rem', fontWeight: 600 }}>
              System Diagnostics & Performance
            </h3>
          </div>
          <button className="btn btn-secondary btn-sm" onClick={onClose}>
            <X size={16} />
          </button>
        </div>

        <div className="modal-body">
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '1rem' }}>
            <div style={{ background: 'var(--bg-elevated)', padding: '0.85rem', borderRadius: 'var(--radius-md)' }}>
              <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Throughput</span>
              <p style={{ fontSize: '1.25rem', fontWeight: 700, color: 'var(--accent-cyan)' }}>
                {stats.fps} FPS
              </p>
            </div>
            <div style={{ background: 'var(--bg-elevated)', padding: '0.85rem', borderRadius: 'var(--radius-md)' }}>
              <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Pipeline Latency</span>
              <p style={{ fontSize: '1.25rem', fontWeight: 700, color: 'var(--accent-emerald)' }}>
                {stats.latencyMs} ms
              </p>
            </div>
            <div style={{ background: 'var(--bg-elevated)', padding: '0.85rem', borderRadius: 'var(--radius-md)' }}>
              <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Stream Resolution</span>
              <p style={{ fontSize: '1.25rem', fontWeight: 700, color: 'var(--accent-sky)' }}>
                {stats.width}x{stats.height}
              </p>
            </div>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.4rem' }}>
            <label style={{ fontSize: '0.8rem', fontWeight: 600, color: 'var(--text-secondary)' }}>
              Redacted Diagnostic Payload
            </label>
            <pre
              style={{
                background: '#020617',
                padding: '1rem',
                borderRadius: 'var(--radius-md)',
                fontSize: '0.75rem',
                color: '#38bdf8',
                overflowX: 'auto',
                border: '1px solid var(--border-subtle)',
                fontFamily: 'monospace'
              }}
            >
              {jsonText}
            </pre>
          </div>
        </div>

        <div className="modal-footer">
          <button className="btn btn-secondary" onClick={handleCopy}>
            {copied ? <Check size={14} color="var(--accent-emerald)" /> : <Copy size={14} />}
            <span>{copied ? 'Copied to Clipboard' : 'Copy Diagnostics'}</span>
          </button>
          <button className="btn btn-primary" onClick={onClose}>
            <span>Close</span>
          </button>
        </div>
      </div>
    </div>
  );
};
