import { TransformSettings } from '../types/camera';

/**
 * Pure mathematical pixel transformations for MirrorView.
 * Designed for zero-dependency testability (AT-001 through AT-006)
 * and seamless integration with Canvas2D and WebGL contexts.
 */
export class FramePipeline {
  /**
   * Applies outgoing flip and color transforms directly to an ImageData buffer.
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
    const { outgoingFlip, brightness, contrast, saturation } = settings;

    // Calculate contrast factor: standard formula for [-100, 100] scale
    // At contrast = 0, factor = 1.0 (neutral)
    const cVal = Math.max(-100, Math.min(100, contrast));
    const contrastFactor = (259 * (cVal + 255)) / (255 * (259 - cVal));

    // Brightness offset: [-100, 100] maps to [-255, 255]
    const bOffset = (Math.max(-100, Math.min(100, brightness)) / 100) * 255;

    // Saturation multiplier: [-100, 100] maps to [0, 2.0]
    const sVal = Math.max(-100, Math.min(100, saturation));
    const satMult = 1.0 + (sVal / 100.0);

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
   * Renders the video element to a destination canvas with exact pipeline transforms.
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

    // Apply color filter string for hardware-accelerated Canvas rendering
    // brightness: 0 is 100%, -100 is 0%, +100 is 200%
    const bPercent = 100 + settings.brightness;
    // contrast: 0 is 100%, -100 is 0%, +100 is 200%
    const cPercent = 100 + settings.contrast;
    // saturation: 0 is 100%, -100 is 0%, +100 is 200%
    const sPercent = 100 + settings.saturation;

    ctx.filter = `brightness(${Math.max(0, bPercent)}%) contrast(${Math.max(0, cPercent)}%) saturate(${Math.max(0, sPercent)}%)`;
    ctx.drawImage(source, 0, 0, width, height);
    ctx.restore();
  }
}
