import { FilesetResolver, FaceLandmarker } from '@mediapipe/tasks-vision';

/**
 * Option 1: Client-Side Google MediaPipe AI Face Landmark Mesh Filter.
 *
 * Runs real-time 468+ facial landmark detection in the browser using WebAssembly.
 * Generates an anatomical skin polygon mask for forehead, cheeks, and chin,
 * with precise cutout holes for eyes, pupils, eyelashes, eyebrows, and lips.
 *
 * Utilizes velocity-adaptive tracking (zero lag on head movements) and
 * multi-pass porcelain skin diffusion (smooth, radiant complexion without foggy blur).
 */
export class MediaPipeBeautyFilter {
  private static instance: MediaPipeBeautyFilter | null = null;
  private landmarker: FaceLandmarker | null = null;
  private isInitializing: boolean = false;
  private isReady: boolean = false;
  private initError: string | null = null;

  // Frame timing & sync
  private lastDetectTime: number = 0;
  private lastVideoTime: number = -1;
  private lastFaceSeenAt: number = 0;

  // Cached geometry
  private cachedLandmarks: any[] | null = null;
  private cachedSkinPath: Path2D | null = null;
  private cachedCanvasSize = { width: 0, height: 0 };

  // Pre-computed ordered loop indices for facial features
  private ovalLoop: number[] = [];
  private rightEyeLoop: number[] = [];
  private leftEyeLoop: number[] = [];
  private outerLipsLoop: number[] = [];
  private rightBrowLoop: number[] = [];
  private leftBrowLoop: number[] = [];

  private constructor() {
    this.extractFeatureLoops();
  }

  public static getInstance(): MediaPipeBeautyFilter {
    if (!MediaPipeBeautyFilter.instance) {
      MediaPipeBeautyFilter.instance = new MediaPipeBeautyFilter();
    }
    return MediaPipeBeautyFilter.instance;
  }

  /**
   * Initializes the MediaPipe FaceLandmarker with local WASM assets and model.
   * Uses GPU acceleration by default, with automatic CPU fallback.
   */
  public async initialize(): Promise<boolean> {
    if (this.isReady) return true;
    if (this.isInitializing) return false;
    this.isInitializing = true;
    this.initError = null;

    try {
      console.log('[MediaPipeBeautyFilter] Initializing vision tasks from /wasm...');
      const vision = await FilesetResolver.forVisionTasks('/wasm');

      try {
        this.landmarker = await FaceLandmarker.createFromOptions(vision, {
          baseOptions: {
            modelAssetPath: '/models/face_landmarker.task',
            delegate: 'GPU'
          },
          runningMode: 'VIDEO',
          numFaces: 1,
          minFaceDetectionConfidence: 0.5,
          minFacePresenceConfidence: 0.5,
          minTrackingConfidence: 0.5,
          outputFaceBlendshapes: false,
          outputFacialTransformationMatrixes: false
        });
        this.isReady = true;
        this.isInitializing = false;
        console.log('[MediaPipeBeautyFilter] FaceLandmarker ready (GPU delegate)');
        return true;
      } catch (gpuErr) {
        console.warn('[MediaPipeBeautyFilter] GPU delegate failed, falling back to CPU:', gpuErr);
        this.landmarker = await FaceLandmarker.createFromOptions(vision, {
          baseOptions: {
            modelAssetPath: '/models/face_landmarker.task',
            delegate: 'CPU'
          },
          runningMode: 'VIDEO',
          numFaces: 1,
          minFaceDetectionConfidence: 0.5,
          minFacePresenceConfidence: 0.5,
          minTrackingConfidence: 0.5
        });
        this.isReady = true;
        this.isInitializing = false;
        console.log('[MediaPipeBeautyFilter] FaceLandmarker ready (CPU delegate)');
        return true;
      }
    } catch (err: any) {
      console.error('[MediaPipeBeautyFilter] Initialization failed:', err);
      this.initError = err?.message || 'MediaPipe initialization failed';
      this.isInitializing = false;
      return false;
    }
  }

  public isFilterReady(): boolean {
    return this.isReady && this.landmarker !== null;
  }

  public getStatus(): { isReady: boolean; isInitializing: boolean; hasFace: boolean; error: string | null } {
    return {
      isReady: this.isReady,
      isInitializing: this.isInitializing,
      hasFace: this.cachedLandmarks !== null && this.cachedLandmarks.length > 0,
      error: this.initError
    };
  }

  /**
   * Applies porcelain skin smoothing strictly inside the facial skin mask polygon.
   * Eyes, eyebrows, lips, and background are 100% untouched and tack-sharp.
   */
  public applySkinSmoothing(
    source: HTMLVideoElement | HTMLCanvasElement,
    targetCanvas: HTMLCanvasElement,
    smoothness: number
  ): boolean {
    if (!this.isReady || !this.landmarker || smoothness <= 0) {
      return false;
    }

    const width = targetCanvas.width;
    const height = targetCanvas.height;
    const ctx = targetCanvas.getContext('2d');
    if (!ctx) return false;

    const now = performance.now();

    // Throttle detection to ~30 FPS (33ms) to keep GPU free for smooth 60 FPS rendering
    if (now - this.lastDetectTime >= 30) {
      this.lastDetectTime = now;
      try {
        let videoTime = now;
        if (source instanceof HTMLVideoElement && source.currentTime > 0) {
          videoTime = Math.max(this.lastVideoTime + 1, Math.round(source.currentTime * 1000));
        } else {
          videoTime = Math.max(this.lastVideoTime + 1, Math.round(now));
        }
        this.lastVideoTime = videoTime;

        const results = this.landmarker.detectForVideo(source, videoTime);
        if (results && results.faceLandmarks && results.faceLandmarks.length > 0) {
          const detected = results.faceLandmarks[0];
          // Adaptive velocity smoothing: eliminates motion lag while suppressing micro-jitter
          this.cachedLandmarks = this.smoothLandmarks(this.cachedLandmarks, detected);
          this.lastFaceSeenAt = now;
          this.cachedSkinPath = this.buildUnifiedSkinMask(this.cachedLandmarks, width, height);
          this.cachedCanvasSize = { width, height };
        } else if (now - this.lastFaceSeenAt > 350) {
          this.cachedLandmarks = null;
          this.cachedSkinPath = null;
        }
      } catch (e) {
        // Drop frame gracefully without interrupting canvas loop
      }
    } else if (
      this.cachedSkinPath &&
      (this.cachedCanvasSize.width !== width || this.cachedCanvasSize.height !== height)
    ) {
      if (this.cachedLandmarks) {
        this.cachedSkinPath = this.buildUnifiedSkinMask(this.cachedLandmarks, width, height);
        this.cachedCanvasSize = { width, height };
      }
    }

    if (!this.cachedSkinPath) {
      return false;
    }

    // =========================================================================
    // Multi-Pass Porcelain Skin Smoothing (Not Just Muddy Blur)
    // =========================================================================
    const norm = Math.max(0, Math.min(100, smoothness)) / 100;

    // Radius tuned for natural texture leveling (never smudges into gray soup)
    const blurPx = 1.2 + norm * 3.6;
    const diffuseAlpha = 0.25 + norm * 0.48;

    ctx.save();
    // Clip strictly to skin polygon using evenodd (eyes, lips, and brows are excluded holes)
    ctx.clip(this.cachedSkinPath, 'evenodd');

    // Pass 1: Fine-grain surface texture leveling (softens pores, redness, and blemishes)
    ctx.filter = `blur(${blurPx.toFixed(1)}px)`;
    ctx.globalAlpha = diffuseAlpha;
    ctx.globalCompositeOperation = 'source-over';
    ctx.drawImage(source, 0, 0, width, height);

    // Pass 2: Porcelain Clarity & Radiance Lift
    // High-pass contrast recovery preserves natural skin sheen and prevents the "foggy blur" look
    ctx.filter = `contrast(115%) brightness(102%) saturate(103%)`;
    ctx.globalAlpha = norm * 0.35;
    ctx.globalCompositeOperation = 'soft-light';
    ctx.drawImage(source, 0, 0, width, height);

    // Pass 3: Subtle studio highlight vitality (radiance across cheekbones & forehead)
    if (norm > 0.3) {
      ctx.filter = `blur(${(blurPx * 1.5).toFixed(1)}px) brightness(104%)`;
      ctx.globalAlpha = (norm - 0.3) * 0.22;
      ctx.globalCompositeOperation = 'screen';
      ctx.drawImage(source, 0, 0, width, height);
    }

    ctx.restore();
    return true;
  }

  /**
   * Pre-extracts ordered loops from MediaPipe FaceLandmarker connection graphs.
   */
  private extractFeatureLoops(): void {
    try {
      this.ovalLoop = this.connectionsToLoop(FaceLandmarker.FACE_LANDMARKS_FACE_OVAL);
      this.rightEyeLoop = this.connectionsToLoop(FaceLandmarker.FACE_LANDMARKS_RIGHT_EYE);
      this.leftEyeLoop = this.connectionsToLoop(FaceLandmarker.FACE_LANDMARKS_LEFT_EYE);
      this.rightBrowLoop = this.connectionsToLoop(FaceLandmarker.FACE_LANDMARKS_RIGHT_EYEBROW);
      this.leftBrowLoop = this.connectionsToLoop(FaceLandmarker.FACE_LANDMARKS_LEFT_EYEBROW);

      const allLipLoops = this.connectionsToAllLoops(FaceLandmarker.FACE_LANDMARKS_LIPS);
      // Select the outer lip contour (loop with corner landmark 61)
      this.outerLipsLoop = allLipLoops.find(l => l.includes(61)) || (allLipLoops[0] || []);
    } catch (e) {
      console.warn('[MediaPipeBeautyFilter] Error extracting feature loops:', e);
    }
  }

  private connectionsToLoop(connections: Array<{ start: number; end: number }>): number[] {
    if (!connections || connections.length === 0) return [];
    const adj = new Map<number, number[]>();
    for (const { start, end } of connections) {
      if (!adj.has(start)) adj.set(start, []);
      if (!adj.has(end)) adj.set(end, []);
      adj.get(start)!.push(end);
      adj.get(end)!.push(start);
    }

    const startNode = connections[0].start;
    const loop = [startNode];
    const visited = new Set<number>([startNode]);
    let curr = startNode;

    while (true) {
      const neighbors = adj.get(curr) || [];
      const next = neighbors.find(n => !visited.has(n));
      if (next !== undefined) {
        visited.add(next);
        loop.push(next);
        curr = next;
      } else {
        break;
      }
    }
    return loop;
  }

  private connectionsToAllLoops(connections: Array<{ start: number; end: number }>): number[][] {
    if (!connections || connections.length === 0) return [];
    const adj = new Map<number, number[]>();
    for (const { start, end } of connections) {
      if (!adj.has(start)) adj.set(start, []);
      if (!adj.has(end)) adj.set(end, []);
      adj.get(start)!.push(end);
      adj.get(end)!.push(start);
    }

    const visited = new Set<number>();
    const loops: number[][] = [];

    for (const startNode of adj.keys()) {
      if (visited.has(startNode)) continue;
      const loop = [startNode];
      visited.add(startNode);
      let curr = startNode;

      while (true) {
        const neighbors = adj.get(curr) || [];
        const next = neighbors.find(n => !visited.has(n));
        if (next !== undefined) {
          visited.add(next);
          loop.push(next);
          curr = next;
        } else {
          break;
        }
      }
      if (loop.length > 2) loops.push(loop);
    }
    return loops;
  }

  /**
   * Velocity-Adaptive Landmark Smoothing (1-Euro Filter principle).
   * When moving: weight = 0.96 for instantaneous, zero-lag tracking (no dragging/glitching).
   * When still: weight = 0.78 for rock-solid stability against sensor micro-jitter.
   */
  private smoothLandmarks(previous: any[] | null, detected: any[]): any[] {
    if (!previous || previous.length !== detected.length) {
      return detected.map(point => ({ ...point }));
    }

    // Measure movement of nose tip (landmark index 1)
    const noseIdx = 1;
    const prevNose = previous[noseIdx] || previous[0];
    const currNose = detected[noseIdx] || detected[0];
    const dx = currNose.x - prevNose.x;
    const dy = currNose.y - prevNose.y;
    const motion = Math.hypot(dx, dy);

    // Fast movement threshold (~4px in 1280x720)
    const currentWeight = motion > 0.003 ? 0.96 : 0.78;

    return detected.map((point, index) => ({
      ...point,
      x: previous[index].x * (1 - currentWeight) + point.x * currentWeight,
      y: previous[index].y * (1 - currentWeight) + point.y * currentWeight
    }));
  }

  /**
   * Builds a single unified Path2D mask with evenodd fill rule.
   * Outer boundary: Forehead and face oval.
   * Inner holes: Left eye, right eye, lips, and eyebrows.
   * Any painting operation clipped to this path strictly covers skin ONLY.
   */
  private buildUnifiedSkinMask(landmarks: any[], width: number, height: number): Path2D {
    const path = new Path2D();
    if (this.ovalLoop.length < 3) return path;

    // 1. Forehead-extended Face Oval (Outer skin container)
    const ovalPoints = this.ovalLoop.map(index => landmarks[index]).filter(Boolean);
    if (ovalPoints.length < 3) return path;

    const minY = Math.min(...ovalPoints.map(p => p.y));
    const maxY = Math.max(...ovalPoints.map(p => p.y));
    const minX = Math.min(...ovalPoints.map(p => p.x));
    const maxX = Math.max(...ovalPoints.map(p => p.x));
    const centerX = (minX + maxX) / 2;
    const faceHeight = maxY - minY;
    const foreheadLift = faceHeight * 0.08;

    const lifted = landmarks.map(p => ({ ...p }));
    for (const index of this.ovalLoop) {
      const p = landmarks[index];
      if (!p || p.y > minY + faceHeight * 0.20) continue;
      const taper = Math.max(0, 1 - Math.abs(p.x - centerX) / ((maxX - minX) * 0.58));
      lifted[index].y = Math.max(0, p.y - foreheadLift * taper);
    }
    this.appendLoopToPath(path, this.ovalLoop, lifted, width, height, 1.0);

    // 2. Cutout Holes (Eyes, Eyebrows, Lips)
    // Eyes: 1.15 scale ensures eyelashes and eyelids remain 100% crisp
    this.appendLoopToPath(path, this.rightEyeLoop, landmarks, width, height, 1.16);
    this.appendLoopToPath(path, this.leftEyeLoop, landmarks, width, height, 1.16);

    // Lips: 1.12 scale ensures vermilion border and teeth are untouched
    if (this.outerLipsLoop.length > 2) {
      this.appendLoopToPath(path, this.outerLipsLoop, landmarks, width, height, 1.12);
    }

    // Eyebrows: 1.14 scale ensures hair texture remains razor sharp
    if (this.rightBrowLoop.length > 2) {
      this.appendLoopToPath(path, this.rightBrowLoop, landmarks, width, height, 1.14);
    }
    if (this.leftBrowLoop.length > 2) {
      this.appendLoopToPath(path, this.leftBrowLoop, landmarks, width, height, 1.14);
    }

    return path;
  }

  private appendLoopToPath(
    path: Path2D,
    loop: number[],
    landmarks: any[],
    width: number,
    height: number,
    scale: number = 1.0
  ): void {
    if (loop.length === 0) return;

    if (scale === 1.0) {
      const p0 = landmarks[loop[0]];
      if (!p0) return;
      path.moveTo(p0.x * width, p0.y * height);
      for (let i = 1; i < loop.length; i++) {
        const p = landmarks[loop[i]];
        if (p) path.lineTo(p.x * width, p.y * height);
      }
      path.closePath();
    } else {
      // Scale cutout gently outwards from center of feature for clean transitions
      let cx = 0;
      let cy = 0;
      let count = 0;
      for (const idx of loop) {
        const p = landmarks[idx];
        if (p) {
          cx += p.x * width;
          cy += p.y * height;
          count++;
        }
      }
      if (count === 0) return;
      cx /= count;
      cy /= count;

      const p0 = landmarks[loop[0]];
      if (!p0) return;
      const x0 = cx + (p0.x * width - cx) * scale;
      const y0 = cy + (p0.y * height - cy) * scale;
      path.moveTo(x0, y0);

      for (let i = 1; i < loop.length; i++) {
        const p = landmarks[loop[i]];
        if (p) {
          const px = cx + (p.x * width - cx) * scale;
          const py = cy + (p.y * height - cy) * scale;
          path.lineTo(px, py);
        }
      }
      path.closePath();
    }
  }
}
