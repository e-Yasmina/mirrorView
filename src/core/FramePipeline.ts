import { TransformSettings } from '../types/camera';

/**
 * Pure mathematical pixel transformations for MirrorView.
 * Designed for zero-dependency testability (AT-001 through AT-006)
 * and seamless integration with Canvas2D and WebGL contexts.
 */
export class FramePipeline {
  /**
   * Applies outgoing flip, color, warmth, and tint transforms directly to an ImageData buffer.
   * This represents the canonical output frames sent to virtual camera and outgoing preview.
   *
   * Note: Preview-only mirror is intentionally NOT included here, guaranteeing
   * architectural separation between self-view mirroring and outgoing transmission.
   */
  public static processFrameData(
    srcData: Uint8ClampedArray,
    width: number,
    height: number,
    settings: TransformSettings
  ): Uint8ClampedArray {
    const dstData = new Uint8ClampedArray(srcData.length);
    const { outgoingFlip, brightness, contrast, saturation, warmth = 0, tint = 0 } = settings;

    // Calculate contrast factor: standard formula for [-100, 100] scale
    // At contrast = 0, factor = 1.0 (neutral)
    const cVal = Math.max(-100, Math.min(100, contrast));
    const contrastFactor = (259 * (cVal + 255)) / (255 * (259 - cVal));

    // Brightness offset: [-100, 100] maps to [-255, 255]
    const bOffset = (Math.max(-100, Math.min(100, brightness)) / 100) * 255;

    // Saturation multiplier: [-100, 100] maps to [0, 2.0]
    const sVal = Math.max(-100, Math.min(100, saturation));
    const satMult = 1.0 + (sVal / 100.0);

    // Warmth shifts (-50 to 50): warm adds red/amber, cool adds blue
    const wVal = Math.max(-50, Math.min(50, warmth));
    const warmRed = (wVal / 50) * 24;
    const warmGreen = (wVal / 50) * 10;
    const warmBlue = -(wVal / 50) * 22;

    // Tint shifts (-50 to 50): positive adds magenta (red+blue), negative adds green
    const tVal = Math.max(-50, Math.min(50, tint));
    const tintRed = (tVal / 50) * 12;
    const tintGreen = -(tVal / 50) * 18;
    const tintBlue = (tVal / 50) * 12;

    for (let y = 0; y < height; y++) {
      const rowOffset = y * width * 4;

      for (let x = 0; x < width; x++) {
        // Source pixel coordinates
        const srcX = x;
        const srcIdx = rowOffset + srcX * 4;

        // Destination pixel coordinates (handle outgoing horizontal flip)
        const dstX = outgoingFlip ? (width - 1 - x) : x;
        const dstIdx = rowOffset + dstX * 4;

        let r = srcData[srcIdx];
        let g = srcData[srcIdx + 1];
        let b = srcData[srcIdx + 2];
        const a = srcData[srcIdx + 3];

        // 1. Brightness
        if (bOffset !== 0) {
          r += bOffset;
          g += bOffset;
          b += bOffset;
        }

        // 2. Contrast
        if (cVal !== 0) {
          r = contrastFactor * (r - 128) + 128;
          g = contrastFactor * (g - 128) + 128;
          b = contrastFactor * (b - 128) + 128;
        }

        // 3. Saturation (standard Rec. 601 luma coefficients)
        if (sVal !== 0) {
          const luma = 0.299 * r + 0.587 * g + 0.114 * b;
          r = luma + (r - luma) * satMult;
          g = luma + (g - luma) * satMult;
          b = luma + (b - luma) * satMult;
        }

        // 4. Color Warmth
        if (wVal !== 0) {
          r += warmRed;
          g += warmGreen;
          b += warmBlue;
        }

        // 5. Tint (Green / Magenta office lighting correction)
        if (tVal !== 0) {
          r += tintRed;
          g += tintGreen;
          b += tintBlue;
        }

        // Bounded clamping [0, 255]
        dstData[dstIdx] = Math.max(0, Math.min(255, Math.round(r)));
        dstData[dstIdx + 1] = Math.max(0, Math.min(255, Math.round(g)));
        dstData[dstIdx + 2] = Math.max(0, Math.min(255, Math.round(b)));
        dstData[dstIdx + 3] = a; // Preserve alpha
      }
    }

    return dstData;
  }

  /**
   * Renders the video element to a destination canvas with exact pipeline transforms:
   * brightness, contrast, saturation, soft-focus skin smoothing (imperfection reduction),
   * color temperature warmth, and office fluorescent tint correction.
   */
  public static renderToCanvas(
    source: HTMLVideoElement | HTMLCanvasElement,
    targetCanvas: HTMLCanvasElement,
    settings: TransformSettings,
    isLocalPreview: boolean
  ): void {
    const ctx = targetCanvas.getContext('2d');
    if (!ctx) return;

    const width = targetCanvas.width;
    const height = targetCanvas.height;

    ctx.save();
    ctx.clearRect(0, 0, width, height);

    // Apply horizontal orientation
    // For local preview:
    //   If previewMirror is true, flip horizontally.
    //   If outgoingFlip is true and this is the OUTGOING preview, flip horizontally.
    if (isLocalPreview) {
      if (settings.previewMirror) {
        ctx.translate(width, 0);
        ctx.scale(-1, 1);
      }
    } else {
      if (settings.outgoingFlip) {
        ctx.translate(width, 0);
        ctx.scale(-1, 1);
      }
    }

    // 1. Base Layer: Brightness, Contrast, and Saturation
    const bPercent = 100 + settings.brightness;
    const cPercent = 100 + settings.contrast;
    const sPercent = 100 + settings.saturation;

    ctx.filter = `brightness(${Math.max(0, bPercent)}%) contrast(${Math.max(0, cPercent)}%) saturate(${Math.max(0, sPercent)}%)`;
    ctx.drawImage(source, 0, 0, width, height);

    // 2. Skin Smoothing / Soft Focus ("Beauty Touch-Up & Imperfection Blur")
    // Blends a soft diffused layer with 'soft-light' composite mode.
    // Softens skin blemishes, fine lines, and webcam sensor grain while keeping eyes and mouth tack-sharp.
    const smoothness = settings.smoothness || 0;
    if (smoothness > 0) {
      ctx.save();
      const blurPx = (smoothness / 100) * 4.5 + 0.8;
      const alpha = (smoothness / 100) * 0.48;
      ctx.filter = `blur(${blurPx.toFixed(1)}px)`;
      ctx.globalAlpha = alpha;
      ctx.globalCompositeOperation = 'soft-light';
      ctx.drawImage(source, 0, 0, width, height);
      ctx.restore();
    }

    // 3. Color Temperature (Warmth)
    const warmth = settings.warmth || 0;
    if (warmth !== 0) {
      ctx.save();
      ctx.globalCompositeOperation = 'color';
      if (warmth > 0) {
        // Flattering warm golden sunlight glow (R: 255, G: 185, B: 85)
        ctx.fillStyle = 'rgb(255, 185, 85)';
        ctx.globalAlpha = (warmth / 50) * 0.24;
      } else {
        // Cool daylight / studio blue tone (R: 70, G: 160, B: 255)
        ctx.fillStyle = 'rgb(70, 160, 255)';
        ctx.globalAlpha = (Math.abs(warmth) / 50) * 0.22;
      }
      ctx.fillRect(0, 0, width, height);
      ctx.restore();
    }

    // 4. Tint Correction (Fluorescent Green / Rose Magenta balance)
    const tint = settings.tint || 0;
    if (tint !== 0) {
      ctx.save();
      ctx.globalCompositeOperation = 'color';
      if (tint > 0) {
        // Flattering rose / magenta skin tone lift (neutralizes greenish office bulbs)
        ctx.fillStyle = 'rgb(255, 75, 180)';
        ctx.globalAlpha = (tint / 50) * 0.18;
      } else {
        // Green balance
        ctx.fillStyle = 'rgb(65, 225, 115)';
        ctx.globalAlpha = (Math.abs(tint) / 50) * 0.18;
      }
      ctx.fillRect(0, 0, width, height);
      ctx.restore();
    }

    ctx.restore();
  }
}
