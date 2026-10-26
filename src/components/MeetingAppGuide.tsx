import React from 'react';
import { ExternalLink, CheckCircle2, HelpCircle, Users } from 'lucide-react';
import { MeetingAppInfo } from '../types/camera';

interface MeetingAppGuideProps {
  apps: MeetingAppInfo[];
}

export const MeetingAppGuide: React.FC<MeetingAppGuideProps> = ({ apps }) => {
  return (
    <div className="glass-panel" style={{ padding: '1.5rem', display: 'flex', flexDirection: 'column', gap: '1rem' }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
          <Users size={20} color="var(--accent-cyan)" />
          <div>
            <h2 style={{ fontFamily: 'var(--font-display)', fontSize: '1.1rem', fontWeight: 600 }}>
              Meeting Application Setup Assistant
            </h2>
            <p style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>
              Select &quot;MirrorView Virtual Camera&quot; inside your meeting application settings
            </p>
          </div>
        </div>
        <div className="badge" style={{ fontSize: '0.75rem', borderColor: 'rgba(255, 255, 255, 0.15)' }}>
          <HelpCircle size={13} color="var(--accent-cyan)" />
          <span>Manual selection required in each app</span>
        </div>
      </div>

      <div className="meeting-apps-grid">
        {apps.map(app => (
          <div key={app.id} className="meeting-card">
            <div className="meeting-card-header">
              <div className="meeting-card-title">
                <span>{app.name}</span>
                {app.isRunning && (
                  <span className="badge badge-live" style={{ fontSize: '0.65rem', padding: '0.1rem 0.45rem' }}>
                    <span className="pulse-dot" style={{ width: '6px', height: '6px' }} />
                    Running
                  </span>
                )}
              </div>
              <a
                href={app.docsUrl}
                target="_blank"
                rel="noreferrer"
                style={{ color: 'var(--text-muted)', display: 'flex', alignItems: 'center' }}
                title="Open Official Documentation"
              >
                <ExternalLink size={14} />
              </a>
            </div>

            <ol className="meeting-steps-list">
              {app.instructions.map((step, idx) => (
                <li key={idx}>{step}</li>
              ))}
            </ol>

            <div style={{ marginTop: 'auto', paddingTop: '0.5rem', borderTop: '1px solid var(--border-subtle)', display: 'flex', alignItems: 'center', gap: '0.4rem', fontSize: '0.72rem', color: 'var(--accent-emerald)' }}>
              <CheckCircle2 size={13} />
              <span>Target: &quot;MirrorView Virtual Camera&quot;</span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
