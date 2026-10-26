import { FilesetResolver, FaceLandmarker } from '@mediapipe/tasks-vision';

/**
 * Option 1: Client-Side Google MediaPipe AI Face Landmark Mesh Filter.
 *
 * Runs real-time 468+ facial landmark detection in the browser using WebAssembly.
 * Generates a face-outline skin mask and restores stable eye, brow, and lip areas.
 *
 * Applies skin smoothing exclusively within the skin mask path, leaving
 * facial features and background 100% untouched and tack-sharp.
 */
export class MediaPipeBeautyFilter {
  private static instance: MediaPipeBeautyFilter | null = null;
  private landmarker: FaceLandmarker | null = null;
  private isInitializing: boolean = false;
  private isReady: boolean = false;
  private initError: string | null = null;
  private lastDetectTime: number = 0;
  private lastVideoTime: number = -1;
  private lastFaceSeenAt: number = 0;
  private cachedLandmarks: any[] | null = null;
  private cachedPath: Path2D | null = null;
  private cachedFeaturePaths: Path2D[] = [];
  private cachedCanvasSize = { width: 0, height: 0 };

  // Pre-computed ordered loop indices for facial features
  private ovalLoop: number[] = [];
  private rightEyeLoop: number[] = [];
  private leftEyeLoop: number[] = [];
  private lipsLoops: number[][] = [];
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
   * Applies anatomical skin smoothing strictly inside the AI face mask polygon.
   * Returns true if applied via MediaPipe mask, or false if not yet detected.
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

    // Throttle detection to ~30 FPS to conserve CPU/GPU
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
          // Dampen frame-to-frame mesh jitter so the mask does not visibly jump.
          this.cachedLandmarks = this.smoothLandmarks(this.cachedLandmarks, detected);
          this.lastFaceSeenAt = now;
          this.cachedPath = this.buildSkinMaskPath(this.cachedLandmarks, width, height);
          this.cachedFeaturePaths = this.buildFeaturePaths(this.cachedLandmarks, width, height);
          this.cachedCanvasSize = { width, height };
        } else if (now - this.lastFaceSeenAt > 250) {
          this.cachedLandmarks = null;
          this.cachedPath = null;
          this.cachedFeaturePaths = [];
        }
      } catch (e) {
        // Drop frame detection without interrupting canvas render
      }
    } else if (
      this.cachedPath &&
      (this.cachedCanvasSize.width !== width || this.cachedCanvasSize.height !== height)
    ) {
      if (this.cachedLandmarks) {
        this.cachedPath = this.buildSkinMaskPath(this.cachedLandmarks, width, height);
        this.cachedFeaturePaths = this.buildFeaturePaths(this.cachedLandmarks, width, height);
        this.cachedCanvasSize = { width, height };
      }
    }

    if (!this.cachedPath) {
      return false;
    }

    // Apply smoothing strictly within facial skin mask (eyes & lips excluded)
    const norm = Math.max(0, Math.min(100, smoothness)) / 100;
    // Keep this gentle: a strong Gaussian blur smears expression and eye detail
    // along with blemishes. The slider controls a subtle, face-only diffusion.
    const blurPx = 0.8 + norm * 4.2;
    const alpha = 0.08 + norm * 0.42;

    ctx.save();
    // Smooth inside the face outline, then restore feature areas from the sharp
    // source. Separate feature clips avoid relying on even-odd holes in one path.
    ctx.clip(this.cachedPath);

    // Layer 1: Skin texture smoothing & blemish diffusion
    ctx.filter = `blur(${blurPx.toFixed(1)}px)`;
    ctx.globalAlpha = alpha;
    ctx.globalCompositeOperation = 'source-over';
    ctx.drawImage(source, 0, 0, width, height);

    ctx.restore();

    for (const featurePath of this.cachedFeaturePaths) {
      ctx.save();
      ctx.clip(featurePath);
      ctx.filter = 'none';
      ctx.globalAlpha = 1;
      ctx.globalCompositeOperation = 'source-over';
      ctx.drawImage(source, 0, 0, width, height);
      ctx.restore();
    }

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
      this.lipsLoops = this.connectionsToAllLoops(FaceLandmarker.FACE_LANDMARKS_LIPS);
      this.rightBrowLoop = this.connectionsToLoop(FaceLandmarker.FACE_LANDMARKS_RIGHT_EYEBROW);
      this.leftBrowLoop = this.connectionsToLoop(FaceLandmarker.FACE_LANDMARKS_LEFT_EYEBROW);
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
   * Constructs a Path2D representing the facial skin mask, including forehead.
   */
  private buildSkinMaskPath(landmarks: any[], width: number, height: number): Path2D {
    const path = new Path2D();
    if (this.ovalLoop.length < 3) return path;

    // Extend the top contour slightly so the full forehead is included, even
    // when the detected oval sits close to the brow line.
    const ovalPoints = this.ovalLoop.map(index => landmarks[index]).filter(Boolean);
    if (ovalPoints.length < 3) return path;
    const minY = Math.min(...ovalPoints.map(point => point.y));
    const maxY = Math.max(...ovalPoints.map(point => point.y));
    const minX = Math.min(...ovalPoints.map(point => point.x));
    const maxX = Math.max(...ovalPoints.map(point => point.x));
    const centerX = (minX + maxX) / 2;
    const faceHeight = maxY - minY;
    const foreheadLift = faceHeight * 0.07;

    const lifted = landmarks.map(point => ({ ...point }));
    for (const index of this.ovalLoop) {
      const point = landmarks[index];
      if (!point || point.y > minY + faceHeight * 0.18) continue;
      const taper = Math.max(0, 1 - Math.abs(point.x - centerX) / ((maxX - minX) * 0.58));
      lifted[index].y = Math.max(0, point.y - foreheadLift * taper);
    }
    this.appendLoopToPath(path, this.ovalLoop, lifted, width, height);

    return path;
  }

  private smoothLandmarks(previous: any[] | null, detected: any[]): any[] {
    if (!previous || previous.length !== detected.length) {
      return detected.map(point => ({ ...point }));
    }
    const currentWeight = 0.68;
    return detected.map((point, index) => ({
      ...point,
      x: previous[index].x * (1 - currentWeight) + point.x * currentWeight,
      y: previous[index].y * (1 - currentWeight) + point.y * currentWeight
    }));
  }

  private buildFeaturePaths(landmarks: any[], width: number, height: number): Path2D[] {
    const paths: Path2D[] = [];
    const appendFeature = (loop: number[], scale: number) => {
      if (loop.length < 3) return;
      const path = new Path2D();
      this.appendLoopToPath(path, loop, landmarks, width, height, scale);
      paths.push(path);
    };
    const appendEye = (loop: number[]) => {
      if (loop.length < 3) return;
      const points = loop.map(index => landmarks[index]).filter(Boolean);
      if (points.length < 3) return;
      const xs = points.map(point => point.x * width);
      const ys = points.map(point => point.y * height);
      const minX = Math.min(...xs);
      const maxX = Math.max(...xs);
      const minY = Math.min(...ys);
      const maxY = Math.max(...ys);
      const centerX = (minX + maxX) / 2;
      const centerY = (minY + maxY) / 2;
      const radiusX = Math.max((maxX - minX) * 0.72, (maxY - minY) * 1.2);
      const radiusY = Math.max((maxY - minY) * 1.35, (maxX - minX) * 0.28);
      const path = new Path2D();
      path.ellipse(centerX, centerY, radiusX, radiusY, 0, 0, Math.PI * 2);
      paths.push(path);
    };

    appendEye(this.rightEyeLoop);
    appendEye(this.leftEyeLoop);
    for (const lipLoop of this.lipsLoops) {
      appendFeature(lipLoop, 1.15);
    }
    appendFeature(this.rightBrowLoop, 1.2);
    appendFeature(this.leftBrowLoop, 1.2);
    return paths;
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
      // Scale cutout slightly outwards from center of feature to ensure clean edges
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
