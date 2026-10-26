import React from 'react';
import { Sliders, Sun, Contrast, Droplets, RotateCcw, FlipHorizontal, BookmarkCheck } from 'lucide-react';
import { TransformSettings } from '../types/camera';

interface TransformControlsProps {
  settings: TransformSettings;
  onChange: (updated: Partial<TransformSettings>) => void;
  onReset: () => void;
  onSaveProfile: () => void;
}

export const TransformControls: React.FC<TransformControlsProps> = ({
  settings,
  onChange,
  onReset,
  onSaveProfile
}) => {
  return (
    <div className="glass-panel control-panel">
      <div className="panel-header">
        <h2 className="panel-title">
          <Sliders size={18} color="var(--accent-cyan)" />
          <span>Image & Orientation Pipeline</span>
        </h2>
        <div style={{ display: 'flex', gap: '0.5rem' }}>
          <button
            className="btn btn-secondary btn-sm"
            onClick={onReset}
            title="Reset Brightness, Contrast, Saturation, and Flips to Neutral (0)"
          >
            <RotateCcw size={14} />
            <span>Reset to Neutral</span>
          </button>
          <button
            className="btn btn-primary btn-sm"
            onClick={onSaveProfile}
            title="Save current configuration to local profile"
          >
            <BookmarkCheck size={14} />
            <span>Save Profile</span>
          </button>
        </div>
      </div>

      {/* Orientation Section */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
        <p style={{ fontSize: '0.75rem', fontWeight: 600, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
          Orientation Controls (Independent)
        </p>

        {/* Local Preview Mirror */}
        <div className="toggle-row">
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <span style={{ fontSize: '0.88rem', fontWeight: 600 }}>Mirror My Preview</span>
              <span className="badge" style={{ fontSize: '0.68rem', padding: '0.1rem 0.4rem' }}>Local Only</span>
            </div>
            <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '0.2rem' }}>
              Flip your self-view like a physical mirror. Does NOT modify outgoing feed.
            </p>
          </div>
          <label className="toggle-switch">
            <input
              type="checkbox"
              checked={settings.previewMirror}
              onChange={e => onChange({ previewMirror: e.target.checked })}
            />
            <span className="toggle-slider" />
          </label>
        </div>

        {/* Outgoing Feed Flip */}
        <div className="toggle-row">
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <span style={{ fontSize: '0.88rem', fontWeight: 600 }}>Flip Outgoing Feed</span>
              <span className="badge" style={{ fontSize: '0.68rem', padding: '0.1rem 0.4rem', borderColor: 'rgba(245, 158, 11, 0.4)', color: 'var(--accent-amber)' }}>
                Affects Meetings
              </span>
            </div>
            <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '0.2rem' }}>
              Horizontally reverses the actual video frames sent to Teams, Zoom, and Meet.
            </p>
          </div>
          <label className="toggle-switch">
            <input
              type="checkbox"
              checked={settings.outgoingFlip}
              onChange={e => onChange({ outgoingFlip: e.target.checked })}
            />
            <span className="toggle-slider" />
          </label>
        </div>
      </div>

      {/* Lighting & Color Adjustments */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem', marginTop: '0.5rem' }}>
        <p style={{ fontSize: '0.75rem', fontWeight: 600, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
          Lighting & Color Calibration
        </p>

        {/* Brightness Slider */}
        <div className="control-row">
          <div className="control-label-group">
            <label className="control-label" style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
              <Sun size={15} color="var(--accent-amber)" />
              <span>Brightness</span>
            </label>
            <span className="control-value">{settings.brightness > 0 ? `+${settings.brightness}` : settings.brightness}</span>
          </div>
          <input
            type="range"
            min="-100"
            max="100"
            value={settings.brightness}
            onChange={e => onChange({ brightness: parseInt(e.target.value, 10) })}
            className="slider-input"
          />
        </div>

        {/* Contrast Slider */}
        <div className="control-row">
          <div className="control-label-group">
            <label className="control-label" style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
              <Contrast size={15} color="var(--accent-sky)" />
              <span>Contrast</span>
            </label>
            <span className="control-value">{settings.contrast > 0 ? `+${settings.contrast}` : settings.contrast}</span>
          </div>
          <input
            type="range"
            min="-100"
            max="100"
            value={settings.contrast}
            onChange={e => onChange({ contrast: parseInt(e.target.value, 10) })}
            className="slider-input"
          />
        </div>

        {/* Saturation Slider */}
        <div className="control-row">
          <div className="control-label-group">
            <label className="control-label" style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
              <Droplets size={15} color="var(--accent-rose)" />
              <span>Saturation</span>
            </label>
            <span className="control-value">{settings.saturation > 0 ? `+${settings.saturation}` : settings.saturation}</span>
          </div>
          <input
            type="range"
            min="-100"
            max="100"
            value={settings.saturation}
            onChange={e => onChange({ saturation: parseInt(e.target.value, 10) })}
            className="slider-input"
          />
        </div>
      </div>
    </div>
  );
};
