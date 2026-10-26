/**
 * Generates synthetic asymmetric test card patterns for automated testing
 * (AT-001 through AT-006) and hardware-independent UI preview.
 */
export class SyntheticTestCard {
  /**
   * Generates a raw pixel buffer (RGBA) with known asymmetric features:
   * - Left side (x < width/2): Blue background [30, 100, 220, 255]
   * - Right side (x >= width/2): Orange/Red background [220, 70, 30, 255]
   * - Top-Left indicator square: Pure Green [0, 255, 0, 255]
   * - Top-Right indicator square: Pure Magenta [255, 0, 255, 255]
   * - Bottom-Right indicator square: Pure Yellow [255, 255, 0, 255]
   */
  public static generateTestCardData(width: number, height: number): Uint8ClampedArray {
    const data = new Uint8ClampedArray(width * height * 4);
    const halfW = Math.floor(width / 2);
    const markerSize = Math.max(4, Math.floor(width / 16));

    for (let y = 0; y < height; y++) {
      for (let x = 0; x < width; x++) {
        const idx = (y * width + x) * 4;

        // Check corner markers
        if (x < markerSize && y < markerSize) {
          // Top-Left: Pure Green
          data[idx] = 0;
          data[idx + 1] = 255;
          data[idx + 2] = 0;
          data[idx + 3] = 255;
        } else if (x >= width - markerSize && y < markerSize) {
          // Top-Right: Pure Magenta
          data[idx] = 255;
          data[idx + 1] = 0;
          data[idx + 2] = 255;
          data[idx + 3] = 255;
        } else if (x >= width - markerSize && y >= height - markerSize) {
          // Bottom-Right: Pure Yellow
          data[idx] = 255;
          data[idx + 1] = 255;
          data[idx + 2] = 0;
          data[idx + 3] = 255;
        } else if (x < halfW) {
          // Left Side: Blue
          data[idx] = 30;
          data[idx + 1] = 100;
          data[idx + 2] = 220;
          data[idx + 3] = 255;
        } else {
          // Right Side: Orange/Red
          data[idx] = 220;
          data[idx + 1] = 70;
          data[idx + 2] = 30;
          data[idx + 3] = 255;
        }
      }
    }

    return data;
  }

  /**
   * Renders a rich, high-resolution asymmetric calibration card onto a canvas.
   * Includes text ("LEFT", "RIGHT"), asymmetry indicators, color bars, and orientation arrows.
   */
  public static drawToCanvas(canvas: HTMLCanvasElement): void {
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const w = canvas.width;
    const h = canvas.height;

    // Background split
    ctx.fillStyle = '#0f172a'; // Deep slate
    ctx.fillRect(0, 0, w, h);

    // Left half (Cool Cyan/Blue tint)
    const leftGrad = ctx.createLinearGradient(0, 0, w / 2, h);
    leftGrad.addColorStop(0, '#1e3a8a');
    leftGrad.addColorStop(1, '#0284c7');
    ctx.fillStyle = leftGrad;
    ctx.fillRect(0, 0, w / 2, h);

    // Right half (Warm Amber/Rose tint)
    const rightGrad = ctx.createLinearGradient(w / 2, 0, w, h);
    rightGrad.addColorStop(0, '#9a3412');
    rightGrad.addColorStop(1, '#e11d48');
    ctx.fillStyle = rightGrad;
    ctx.fillRect(w / 2, 0, w / 2, h);

    // Center dividing line
    ctx.strokeStyle = '#ffffff';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(w / 2, 0);
    ctx.lineTo(w / 2, h);
    ctx.stroke();

    // Prominent Asymmetric Text
    ctx.fillStyle = '#ffffff';
    ctx.font = `bold ${Math.floor(h * 0.1)}px Outfit, Inter, sans-serif`;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';

    // Left label
    ctx.fillText('◀ LEFT (PORT)', w * 0.25, h * 0.35);

    // Right label
    ctx.fillText('RIGHT (STARBOARD) ▶', w * 0.75, h * 0.35);

    // Orientation directional arrow
    ctx.font = `600 ${Math.floor(h * 0.055)}px Inter, sans-serif`;
    ctx.fillText('CALIBRATION ARROW ──►', w * 0.5, h * 0.6);

    // Asymmetric Corner Badges
    const badgeSize = Math.floor(h * 0.12);
    // Top-Left: Bright Green "TL"
    ctx.fillStyle = '#10b981';
    ctx.fillRect(16, 16, badgeSize, badgeSize);
    ctx.fillStyle = '#000000';
    ctx.font = `bold ${Math.floor(badgeSize * 0.5)}px sans-serif`;
    ctx.fillText('TL', 16 + badgeSize / 2, 16 + badgeSize / 2);

    // Bottom-Right: Amber "BR"
    ctx.fillStyle = '#f59e0b';
    ctx.fillRect(w - badgeSize - 16, h - badgeSize - 16, badgeSize, badgeSize);
    ctx.fillStyle = '#000000';
    ctx.fillText('BR', w - badgeSize / 2 - 16, h - badgeSize / 2 - 16);

    // SMPTE-style Color Bar Strip at the bottom
    const barColors = ['#ffffff', '#eab308', '#06b6d4', '#22c55e', '#ec4899', '#ef4444', '#3b82f6'];
    const barHeight = Math.floor(h * 0.08);
    const barWidth = (w - 32) / barColors.length;
    const barY = h - barHeight - 16;

    for (let i = 0; i < barColors.length; i++) {
      ctx.fillStyle = barColors[i];
      ctx.fillRect(16 + i * barWidth, barY, barWidth, barHeight);
    }
  }
}
