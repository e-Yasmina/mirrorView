import React from 'react';
import {
  Sliders,
  Sun,
  Contrast,
  Droplets,
  RotateCcw,
  Sparkles,
  Thermometer,
  Palette,
  BookmarkCheck,
  Check
} from 'lucide-react';
import { TransformSettings, PROFESSIONAL_PRESETS, FilterPresetDefinition } from '../types/camera';

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
  const handleSelectPreset = (preset: FilterPresetDefinition) => {
    onChange({
      ...preset.settings,
      filterPreset: preset.id
    });
  };

  const handleSliderChange = (field: keyof TransformSettings, value: number) => {
    onChange({
      [field]: value,
      filterPreset: 'custom'
    });
  };

  return (
    <div className="glass-panel control-panel">
      {/* Panel Header */}
      <div className="panel-header">
        <h2 className="panel-title">
          <Sparkles size={18} color="var(--accent-cyan)" />
          <span>Professional Meeting Filters & Pipeline</span>
        </h2>
        <div style={{ display: 'flex', gap: '0.5rem' }}>
          <button
            className="btn btn-secondary btn-sm"
            onClick={onReset}
            title="Reset all enhancements, filters, and orientations to neutral baseline (0)"
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

      {/* 1. Curated 1-Click Meeting Looks */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '0.65rem' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <p className="section-label">
            1-Click Professional Looks
          </p>
          <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>
            Preset: <strong style={{ color: 'var(--accent-cyan)' }}>{settings.filterPreset || 'custom'}</strong>
          </span>
        </div>

        <div className="presets-grid">
          {PROFESSIONAL_PRESETS.map((preset) => {
            const isSelected = settings.filterPreset === preset.id;
            return (
              <button
                key={preset.id}
                type="button"
                className={`preset-card ${isSelected ? 'preset-card-active' : ''}`}
                onClick={() => handleSelectPreset(preset)}
                title={preset.tagline}
              >
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', width: '100%' }}>
                  <span className="preset-name">{preset.name}</span>
                  {isSelected && (
                    <span className="preset-check">
                      <Check size={12} strokeWidth={3} />
                    </span>
                  )}
                  {preset.badge && !isSelected && (
                    <span className="preset-badge">{preset.badge}</span>
                  )}
                </div>
                <p className="preset-tagline">{preset.tagline}</p>
              </button>
            );
          })}
        </div>
      </div>

      {/* 2. Imperfection Touch-Up & Beauty Filter */}
      <div className="touchup-card">
        <div className="control-label-group">
          <label className="control-label" style={{ display: 'flex', alignItems: 'center', gap: '0.45rem' }}>
            <Sparkles size={16} color="var(--accent-purple)" />
            <span style={{ fontWeight: 600, color: '#e2e8f0' }}>Imperfection Touch-Up (Skin Smoothing)</span>
          </label>
          <span className="control-value" style={{ color: 'var(--accent-purple)' }}>
            {settings.smoothness ? `${settings.smoothness}%` : 'Off (0%)'}
          </span>
        </div>
        <p style={{ fontSize: '0.72rem', color: 'var(--text-muted)', marginBottom: '0.4rem' }}>
          Diffuses blemishes, fine lines, and webcam grain while preserving tack-sharp eyes and facial contours.
        </p>
        <input
          type="range"
          min="0"
          max="100"
          value={settings.smoothness || 0}
          onChange={(e) => handleSliderChange('smoothness', parseInt(e.target.value, 10))}
          className="slider-input slider-purple"
        />
      </div>

      {/* 3. Color Temperature & Lighting Calibration */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '0.9rem', marginTop: '0.35rem' }}>
        <p className="section-label">
          Color Temperature & Lighting Calibration
        </p>

        {/* Color Warmth Slider */}
        <div className="control-row">
          <div className="control-label-group">
            <label className="control-label" style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
              <Thermometer size={15} color="var(--accent-amber)" />
              <span>Color Temperature (Warmth)</span>
            </label>
            <span className="control-value">
              {settings.warmth > 0 ? `Warm +${settings.warmth}` : settings.warmth < 0 ? `Cool ${settings.warmth}` : 'Neutral (0)'}
            </span>
          </div>
          <input
            type="range"
            min="-50"
            max="50"
            value={settings.warmth || 0}
            onChange={(e) => handleSliderChange('warmth', parseInt(e.target.value, 10))}
            className="slider-input"
          />
        </div>

        {/* Tint Balance Slider */}
        <div className="control-row">
          <div className="control-label-group">
            <label className="control-label" style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
              <Palette size={15} color="var(--accent-rose)" />
              <span>Tint (Fluorescent Green / Rose Fix)</span>
            </label>
            <span className="control-value">
              {settings.tint > 0 ? `Rose +${settings.tint}` : settings.tint < 0 ? `Green ${settings.tint}` : 'Neutral (0)'}
            </span>
          </div>
          <input
            type="range"
            min="-50"
            max="50"
            value={settings.tint || 0}
            onChange={(e) => handleSliderChange('tint', parseInt(e.target.value, 10))}
            className="slider-input"
          />
        </div>

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
            onChange={(e) => handleSliderChange('brightness', parseInt(e.target.value, 10))}
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
            onChange={(e) => handleSliderChange('contrast', parseInt(e.target.value, 10))}
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
            onChange={(e) => handleSliderChange('saturation', parseInt(e.target.value, 10))}
            className="slider-input"
          />
        </div>
      </div>

      {/* 4. Orientation Section (Independent) */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem', marginTop: '0.5rem' }}>
        <p className="section-label">
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
              onChange={(e) => onChange({ previewMirror: e.target.checked })}
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
              onChange={(e) => onChange({ outgoingFlip: e.target.checked })}
            />
            <span className="toggle-slider" />
          </label>
        </div>
      </div>
    </div>
  );
};
