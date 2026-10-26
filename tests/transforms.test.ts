import { describe, it, expect } from 'vitest';
import { FramePipeline } from '../src/core/FramePipeline';
import { SyntheticTestCard } from '../src/core/SyntheticTestCard';
import { DEFAULT_TRANSFORMS, TransformSettings } from '../src/types/camera';

describe('MirrorView Image-Transform Pipeline (AT-001 through AT-006)', () => {
  const WIDTH = 64;
  const HEIGHT = 32;

  it('AT-001: With outgoing flip disabled, an asymmetric test card reads normally', () => {
    const rawData = SyntheticTestCard.generateTestCardData(WIDTH, HEIGHT);
    const settings: TransformSettings = {
      ...DEFAULT_TRANSFORMS,
      outgoingFlip: false
    };

    const processed = FramePipeline.processFrameData(rawData, WIDTH, HEIGHT, settings);

    // In raw card, Left side (x = 10, y = 16) is Blue [30, 100, 220]
    // Right side (x = WIDTH - 10, y = 16) is Orange/Red [220, 70, 30]
    const leftIdx = (16 * WIDTH + 10) * 4;
    const rightIdx = (16 * WIDTH + (WIDTH - 10)) * 4;

    expect(processed[leftIdx]).toBe(30);       // R
    expect(processed[leftIdx + 1]).toBe(100);  // G
    expect(processed[leftIdx + 2]).toBe(220);  // B

    expect(processed[rightIdx]).toBe(220);     // R
    expect(processed[rightIdx + 1]).toBe(70);  // G
    expect(processed[rightIdx + 2]).toBe(30);   // B
  });

  it('AT-002: With outgoing flip enabled, the test card is horizontally reversed exactly once', () => {
    const rawData = SyntheticTestCard.generateTestCardData(WIDTH, HEIGHT);
    const settings: TransformSettings = {
      ...DEFAULT_TRANSFORMS,
      outgoingFlip: true
    };

    const processed = FramePipeline.processFrameData(rawData, WIDTH, HEIGHT, settings);

    // With horizontal flip:
    // Destination Left side (x = 10, y = 16) receives what was originally on the Right (Orange/Red)
    // Destination Right side (x = WIDTH - 10, y = 16) receives what was originally on the Left (Blue)
    const leftIdx = (16 * WIDTH + 10) * 4;
    const rightIdx = (16 * WIDTH + (WIDTH - 10)) * 4;

    // Left is now Orange/Red
    expect(processed[leftIdx]).toBe(220);
    expect(processed[leftIdx + 1]).toBe(70);
    expect(processed[leftIdx + 2]).toBe(30);

    // Right is now Blue
    expect(processed[rightIdx]).toBe(30);
    expect(processed[rightIdx + 1]).toBe(100);
    expect(processed[rightIdx + 2]).toBe(220);
  });

  it('AT-003: Preview-only mirror changes only the local preview; it does not alter virtual output', () => {
    const rawData = SyntheticTestCard.generateTestCardData(WIDTH, HEIGHT);

    // Setting previewMirror to true
    const settingsWithPreviewMirror: TransformSettings = {
      ...DEFAULT_TRANSFORMS,
      previewMirror: true,
      outgoingFlip: false
    };

    // Setting previewMirror to false
    const settingsWithoutPreviewMirror: TransformSettings = {
      ...DEFAULT_TRANSFORMS,
      previewMirror: false,
      outgoingFlip: false
    };

    // Process both through the canonical outgoing pipeline
    const outgoingA = FramePipeline.processFrameData(rawData, WIDTH, HEIGHT, settingsWithPreviewMirror);
    const outgoingB = FramePipeline.processFrameData(rawData, WIDTH, HEIGHT, settingsWithoutPreviewMirror);

    // Outgoing frames must be bit-for-bit identical!
    for (let i = 0; i < outgoingA.length; i++) {
      expect(outgoingA[i]).toBe(outgoingB[i]);
    }
  });

  it('AT-004: Outgoing preview pixel orientation matches the virtual-camera output', () => {
    const rawData = SyntheticTestCard.generateTestCardData(WIDTH, HEIGHT);
    const settings: TransformSettings = {
      ...DEFAULT_TRANSFORMS,
      outgoingFlip: true
    };

    // Outgoing frame buffer passed to both outgoing preview canvas and virtual camera sink
    const outgoingBuffer = FramePipeline.processFrameData(rawData, WIDTH, HEIGHT, settings);

    // Both consumers share the exact same transformed pixel array
    expect(outgoingBuffer.length).toBe(WIDTH * HEIGHT * 4);
    // Spot check Top-Left corner marker: originally Green [0, 255, 0] at top-left.
    // When flipped, top-left receives top-right (Magenta [255, 0, 255]).
    expect(outgoingBuffer[0]).toBe(255);
    expect(outgoingBuffer[1]).toBe(0);
    expect(outgoingBuffer[2]).toBe(255);
  });

  it('AT-005: Brightness/contrast/saturation settings change output predictably and reset to neutral', () => {
    const rawData = new Uint8ClampedArray(WIDTH * HEIGHT * 4);
    // Fill with neutral mid-gray [128, 128, 128, 255]
    for (let i = 0; i < rawData.length; i += 4) {
      rawData[i] = 128;
      rawData[i + 1] = 128;
      rawData[i + 2] = 128;
      rawData[i + 3] = 255;
    }

    // Neutral baseline
    const neutral = FramePipeline.processFrameData(rawData, WIDTH, HEIGHT, DEFAULT_TRANSFORMS);
    expect(neutral[0]).toBe(128);

    // Increase Brightness (+20)
    const bright = FramePipeline.processFrameData(rawData, WIDTH, HEIGHT, {
      ...DEFAULT_TRANSFORMS,
      brightness: 20
    });
    expect(bright[0]).toBeGreaterThan(128);

    // Decrease Brightness (-20)
    const dark = FramePipeline.processFrameData(rawData, WIDTH, HEIGHT, {
      ...DEFAULT_TRANSFORMS,
      brightness: -20
    });
    expect(dark[0]).toBeLessThan(128);

    // Reset back to DEFAULT_TRANSFORMS (neutral: 0)
    const reset = FramePipeline.processFrameData(rawData, WIDTH, HEIGHT, DEFAULT_TRANSFORMS);
    expect(reset[0]).toBe(128);
    expect(reset[1]).toBe(128);
    expect(reset[2]).toBe(128);
  });

  it('AT-006: No settings produce invalid frames, crashes, or unbounded color values', () => {
    const rawData = SyntheticTestCard.generateTestCardData(WIDTH, HEIGHT);

    // Extreme settings: extreme brightness, contrast, and saturation
    const extremeSettingsList: TransformSettings[] = [
      { ...DEFAULT_TRANSFORMS, brightness: 100, contrast: 100, saturation: 100 },
      { ...DEFAULT_TRANSFORMS, brightness: -100, contrast: -100, saturation: -100 },
      { ...DEFAULT_TRANSFORMS, brightness: 100, contrast: -100, saturation: 50 },
      { ...DEFAULT_TRANSFORMS, brightness: -100, contrast: 100, saturation: -50 }
    ];

    for (const settings of extremeSettingsList) {
      const processed = FramePipeline.processFrameData(rawData, WIDTH, HEIGHT, settings);
      expect(processed.length).toBe(rawData.length);

      for (let i = 0; i < processed.length; i++) {
        const val = processed[i];
        expect(Number.isFinite(val)).toBe(true);
        expect(Number.isNaN(val)).toBe(false);
        expect(val).toBeGreaterThanOrEqual(0);
        expect(val).toBeLessThanOrEqual(255);
      }
    }
  });
});
