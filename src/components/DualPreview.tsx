import React, { useEffect, useRef } from 'react';
import { Eye, Send, FlipHorizontal, AlertCircle } from 'lucide-react';
import { CameraStatus, TransformSettings } from '../types/camera';
import { FramePipeline } from '../core/FramePipeline';
import { SyntheticTestCard } from '../core/SyntheticTestCard';
import { VirtualCameraBridge } from '../core/VirtualCameraBridge';

interface DualPreviewProps {
  cameraStatus: CameraStatus;
  errorMessage?: string;
  settings: TransformSettings;
  stream: MediaStream | null;
  videoRef: React.RefObject<HTMLVideoElement | null>;
  onTogglePreviewMirror: () => void;
  onToggleOutgoingFlip: () => void;
  onFrameProcessed?: () => void;
}

export const DualPreview: React.FC<DualPreviewProps> = ({
  cameraStatus,
  errorMessage,
  settings,
  stream,
  videoRef,
  onTogglePreviewMirror,
  onToggleOutgoingFlip,
  onFrameProcessed
}) => {
  const outgoingCanvasRef = useRef<HTMLCanvasElement | null>(null);
  const localCanvasRef = useRef<HTMLCanvasElement | null>(null);
  const testCardCanvasRef = useRef<HTMLCanvasElement | null>(null);
  const animationFrameRef = useRef<number | null>(null);
  const isEncodingRef = useRef<boolean>(false);
  const lastSendTimeRef = useRef<number>(0);

  // Synchronize stream directly with the video element
  useEffect(() => {
    const video = videoRef.current;
    if (video) {
      if (stream) {
        if (video.srcObject !== stream) {
          video.srcObject = stream;
        }
        video.play().catch(e => {
          console.warn('Video element play() was blocked or interrupted:', e);
        });
      } else {
        video.srcObject = null;
      }
    }
  }, [stream, videoRef]);

  // Render loop for Outgoing Feed canvas
  useEffect(() => {
    let active = true;

    // Draw static calibration test card if needed
    if (!testCardCanvasRef.current) {
      const tc = document.createElement('canvas');
      tc.width = 1280;
      tc.height = 720;
      SyntheticTestCard.drawToCanvas(tc);
      testCardCanvasRef.current = tc;
    }

    const renderLoop = () => {
      if (!active) return;

      const outgoingCanvas = outgoingCanvasRef.current;
      const localCanvas = localCanvasRef.current;
      const video = videoRef.current;
      const testCard = testCardCanvasRef.current;

      const isLiveVideoReady = cameraStatus === 'live' && video && (video.readyState >= 2 || video.videoWidth > 0);
      const isTestCard = settings.testCardMode;

      if (outgoingCanvas && (isLiveVideoReady || isTestCard)) {
        const sourceElement = isTestCard ? testCard! : video!;

        // 1. Render canonical Outgoing Feed (Outgoing Flip + Color Transforms)
        FramePipeline.renderToCanvas(sourceElement, outgoingCanvas, settings, false);
        onFrameProcessed?.();

        const vcam = VirtualCameraBridge.getInstance().getState();
        const now = performance.now();
        if (vcam.isActive && !isEncodingRef.current && (now - lastSendTimeRef.current >= 30)) {
          isEncodingRef.current = true;
          lastSendTimeRef.current = now;
          outgoingCanvas.toBlob(blob => {
            isEncodingRef.current = false;
            if (blob) VirtualCameraBridge.getInstance().sendFrameBlob(blob);
          }, 'image/jpeg', 0.85);
        }

        // 2. Render processed Local Self-View Preview (Local Mirror + Skin Smoothing + Color Calibration)
        if (localCanvas) {
          FramePipeline.renderToCanvas(sourceElement, localCanvas, settings, true);
        }
      }

      animationFrameRef.current = requestAnimationFrame(renderLoop);
    };

    animationFrameRef.current = requestAnimationFrame(renderLoop);

    return () => {
      active = false;
      if (animationFrameRef.current !== null) {
        cancelAnimationFrame(animationFrameRef.current);
      }
    };
  }, [cameraStatus, settings, videoRef, onFrameProcessed]);

  const isLive = cameraStatus === 'live';
  const isTestMode = settings.testCardMode;

  return (
    <div className="previews-grid">
      {/* ----------------- 1. LOCAL SELF-VIEW PREVIEW ----------------- */}
      <div className="preview-card preview-card-local">
        <div className="preview-card-header">
          <div className="preview-title-group">
            <Eye size={18} color="var(--accent-cyan)" />
            <div>
              <h2 className="preview-title">Local Self-View Preview</h2>
              <p className="preview-subtitle">What you see in your own monitor</p>
            </div>
          </div>
          <button
            className={`btn btn-sm ${settings.previewMirror ? 'btn-primary' : 'btn-secondary'}`}
            onClick={onTogglePreviewMirror}
            title="Mirror only this local preview window. Remote participants are NOT affected."
          >
            <FlipHorizontal size={14} />
            <span>Self-View Mirror: {settings.previewMirror ? 'ON' : 'OFF'}</span>
          </button>
        </div>

        <div className="viewport-container">
          <div className="viewport-overlay-badge">
            <span>Local Mirror: {settings.previewMirror ? 'Active' : 'Unmirrored'}</span>
          </div>

          {/* Local Canvas: Renders full enhancement pipeline (Smoothing, Warmth, Tint) with Local Mirror */}
          <canvas
            ref={localCanvasRef}
            width={1280}
            height={720}
            className="viewport-canvas"
            style={{ display: (isLive || isTestMode) ? 'block' : 'none' }}
          />

          {/* Backing Video Element: Active frame provider for canvas pipeline */}
          <video
            ref={videoRef}
            autoPlay
            playsInline
            muted
            style={{
              position: 'absolute',
              width: '1px',
              height: '1px',
              opacity: 0,
              pointerEvents: 'none'
            }}
            onLoadedMetadata={e => {
              e.currentTarget.play().catch(console.warn);
            }}
          />

          {/* Empty / Error state placeholder */}
          {!isLive && !isTestMode && (
            <div className="viewport-empty-state">
              {cameraStatus === 'error' ? (
                <>
                  <AlertCircle size={40} color="var(--accent-rose)" />
                  <p style={{ color: 'var(--accent-rose)', fontWeight: 600 }}>{errorMessage || 'Camera Unavailable'}</p>
                </>
              ) : (
                <>
                  <Eye className="viewport-empty-icon" />
                  <p style={{ fontWeight: 500 }}>Camera Stopped</p>
                  <p style={{ fontSize: '0.8rem' }}>Click &quot;Start Physical Camera&quot; below or switch to Calibration Card mode.</p>
                </>
              )}
            </div>
          )}
        </div>
      </div>

      {/* ----------------- 2. CANONICAL OUTGOING FEED ----------------- */}
      <div className="preview-card preview-card-outgoing">
        <div className="preview-card-header">
          <div className="preview-title-group">
            <Send size={18} color="var(--accent-emerald)" />
            <div>
              <h2 className="preview-title">Outgoing Meeting Feed</h2>
              <p className="preview-subtitle">Exact pixel stream sent to Virtual Camera</p>
            </div>
          </div>
          <button
            className={`btn btn-sm ${settings.outgoingFlip ? 'btn-primary' : 'btn-secondary'}`}
            onClick={onToggleOutgoingFlip}
            title="Horizontally flip the outgoing feed sent to Teams, Zoom, and Google Meet."
          >
            <FlipHorizontal size={14} />
            <span>Outgoing Flip: {settings.outgoingFlip ? 'REVERSED' : 'NORMAL'}</span>
          </button>
        </div>

        <div className="viewport-container">
          <div className="viewport-overlay-badge" style={{ borderColor: 'rgba(16, 185, 129, 0.4)' }}>
            <span style={{ color: 'var(--accent-emerald)' }}>
              Virtual Output: {settings.outgoingFlip ? 'Flipped' : 'Normal'}
            </span>
          </div>

          {/* Outgoing Canvas is ALWAYS present and driven by render loop */}
          <canvas
            ref={outgoingCanvasRef}
            width={1280}
            height={720}
            className="viewport-canvas"
            style={{ display: (isLive || isTestMode) ? 'block' : 'none' }}
          />

          {!isLive && !isTestMode && (
            <div className="viewport-empty-state">
              <Send className="viewport-empty-icon" />
              <p style={{ fontWeight: 500 }}>Virtual Feed Idle</p>
              <p style={{ fontSize: '0.8rem' }}>Start the camera to publish processed video frames.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
