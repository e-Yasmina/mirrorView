import React from 'react';
import { HelpCircle, X, CheckCircle2, Terminal, ShieldAlert } from 'lucide-react';

interface TroubleshootingModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const TroubleshootingModal: React.FC<TroubleshootingModalProps> = ({ isOpen, onClose }) => {
  if (!isOpen) return null;

  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div className="modal-content" onClick={e => e.stopPropagation()}>
        <div className="modal-header">
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
            <HelpCircle size={20} color="var(--accent-cyan)" />
            <h3 style={{ fontFamily: 'var(--font-display)', fontSize: '1.15rem', fontWeight: 600 }}>
              Setup & Troubleshooting Guide
            </h3>
          </div>
          <button className="btn btn-secondary btn-sm" onClick={onClose}>
            <X size={16} />
          </button>
        </div>

        <div className="modal-body">
          {/* Windows Virtual Camera */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
            <h4 style={{ color: 'var(--accent-cyan)', fontSize: '0.95rem', fontWeight: 600 }}>
              Windows Setup (DirectShow & Media Foundation)
            </h4>
            <p style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>
              MirrorView uses a DirectShow virtual camera source filter. Windows Media Foundation bridges this filter directly into modern UWP/Desktop apps including Teams, Zoom, Chrome, and Edge.
            </p>
            <div style={{ background: 'var(--bg-elevated)', padding: '0.75rem', borderRadius: 'var(--radius-md)', fontSize: '0.78rem' }}>
              <strong>Grant Camera Permission in Windows:</strong>
              <ol style={{ paddingLeft: '1.2rem', marginTop: '0.3rem', display: 'flex', flexDirection: 'column', gap: '0.2rem' }}>
                <li>Open Windows Settings &gt; Privacy &amp; security &gt; Camera.</li>
                <li>Ensure &quot;Camera access&quot; is turned ON.</li>
                <li>Ensure &quot;Let desktop apps access your camera&quot; is turned ON.</li>
              </ol>
            </div>
          </div>

          {/* Linux v4l2loopback Setup */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', marginTop: '0.5rem' }}>
            <h4 style={{ color: 'var(--accent-emerald)', fontSize: '0.95rem', fontWeight: 600 }}>
              Linux Setup (Ubuntu / Debian v4l2loopback)
            </h4>
            <p style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>
              To enable the virtual camera on Linux, install and load the kernel module with <code>exclusive_caps=1</code>:
            </p>
            <pre style={{ background: '#020617', padding: '0.75rem', borderRadius: 'var(--radius-md)', fontSize: '0.75rem', color: 'var(--accent-emerald)' }}>
              sudo apt install v4l2loopback-dkms{'\n'}
              sudo modprobe v4l2loopback devices=1 exclusive_caps=1 card_label=&quot;MirrorView Virtual Camera&quot;{'\n'}
              sudo usermod -aG video $USER
            </pre>
            <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
              Note: <code>exclusive_caps=1</code> is required by Chrome and Zoom so they do not reject the device.
            </p>
          </div>

          {/* Uninstall Instructions */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', marginTop: '0.5rem' }}>
            <h4 style={{ color: 'var(--accent-rose)', fontSize: '0.95rem', fontWeight: 600 }}>
              Clean Uninstall
            </h4>
            <p style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>
              MirrorView respects user privacy and leaves no background daemons or registry clutter.
            </p>
            <ul style={{ paddingLeft: '1.2rem', fontSize: '0.78rem', color: 'var(--text-muted)', display: 'flex', flexDirection: 'column', gap: '0.2rem' }}>
              <li><strong>Windows</strong>: Simply unregister the DirectShow filter DLL via <code>regsvr32 /u</code>.</li>
              <li><strong>Linux</strong>: Run <code>sudo modprobe -r v4l2loopback</code> to unload the virtual device.</li>
            </ul>
          </div>
        </div>

        <div className="modal-footer">
          <button className="btn btn-primary" onClick={onClose}>
            <span>Got it</span>
          </button>
        </div>
      </div>
    </div>
  );
};
