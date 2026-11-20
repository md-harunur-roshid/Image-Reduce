import UPNG from 'upng-js';
import {
  OptimizationSettings,
  OutputFormat,
  RotationAngle,
} from '../types/image';

export function formatBytes(bytes: number): string {
  if (!Number.isFinite(bytes) || bytes <= 0) return '0 B';
  if (bytes < 1024) return `${bytes} B`;
  const kb = bytes / 1024;
  if (kb < 1024) return `${kb < 10 ? kb.toFixed(1) : Math.round(kb)} KB`;
  const mb = kb / 1024;
  return `${mb.toFixed(2)} MB`;
}

export function calcSavingsPercent(original: number, optimized: number): number {
  if (original <= 0) return 0;
  return ((original - optimized) / original) * 100;
}

let cachedAvifSupport: boolean | null = null;

export async function detectAvifSupport(): Promise<boolean> {
  if (cachedAvifSupport !== null) return cachedAvifSupport;
  if (typeof document === 'undefined') return false;
  try {
    const canvas = document.createElement('canvas');
    canvas.width = 2;
    canvas.height = 2;
    const blob = await new Promise<Blob | null>((resolve) =>
      canvas.toBlob((b) => resolve(b), 'image/avif', 0.8)
    );
    cachedAvifSupport = Boolean(blob && blob.type === 'image/avif' && blob.size > 0);
  } catch {
    cachedAvifSupport = false;
  }
  return cachedAvifSupport;
}

export function inferOriginalFormat(file: File): string {
  const mime = file.type.toLowerCase();
  if (mime.includes('jpeg') || mime.includes('jpg')) return 'JPEG';
  if (mime.includes('png')) return 'PNG';
  if (mime.includes('webp')) return 'WebP';
  if (mime.includes('avif')) return 'AVIF';
  if (mime.includes('bmp')) return 'BMP';
  if (mime.includes('icon') || mime.includes('ico')) return 'ICO';
  if (mime.includes('gif')) return 'GIF';
  if (mime.includes('svg')) return 'SVG';

  const ext = file.name.split('.').pop()?.toUpperCase();
  return ext || 'IMAGE';
}

export function resolveOutputFormat(
  requested: OutputFormat,
  originalFormat: string,
  avifSupported: boolean
): Exclude<OutputFormat, 'auto'> {
  if (requested !== 'auto') {
    if (requested === 'avif' && !avifSupported) return 'webp';
    return requested;
  }
  const upper = originalFormat.toUpperCase();
  if (upper === 'JPEG' || upper === 'JPG') return 'jpeg';
  if (upper === 'PNG') return 'png';
  if (upper === 'WEBP') return 'webp';
  if (upper === 'AVIF' && avifSupported) return 'avif';
  if (upper === 'BMP') return 'bmp';
  if (upper === 'ICO') return 'ico';
  return 'webp';
}

export function getExtensionForFormat(fmt: Exclude<OutputFormat, 'auto'>): string {
  if (fmt === 'jpeg') return 'jpg';
  return fmt;
}

export function buildOutputFilename(
  originalName: string,
  fmt: Exclude<OutputFormat, 'auto'>
): string {
  const dotIdx = originalName.lastIndexOf('.');
  const base = dotIdx > 0 ? originalName.slice(0, dotIdx) : originalName;
  return `${base}-optimized.${getExtensionForFormat(fmt)}`;
}

async function loadImageSource(file: File): Promise<{
  width: number;
  height: number;
  element: HTMLImageElement;
  cleanup: () => void;
}> {
  const url = URL.createObjectURL(file);
  try {
    const img = new Image();
    img.decoding = 'async';
    await new Promise<void>((resolve, reject) => {
      img.onload = () => resolve();
      img.onerror = () => reject(new Error('Failed to decode image file.'));
      img.src = url;
    });
    const width = img.naturalWidth || img.width || 1;
    const height = img.naturalHeight || img.height || 1;
    return {
      width,
      height,
      element: img,
      cleanup: () => URL.revokeObjectURL(url),
    };
  } catch (err) {
    URL.revokeObjectURL(url);
    throw err;
  }
}

function encodeBmp24(imageData: ImageData): Blob {
  const { width, height, data } = imageData;
  const rowStride = Math.floor((width * 3 + 3) / 4) * 4;
  const pixelArraySize = rowStride * height;
  const fileSize = 54 + pixelArraySize;
  const buffer = new ArrayBuffer(fileSize);
  const view = new DataView(buffer);
  const bytes = new Uint8Array(buffer);

  view.setUint8(0, 0x42);
  view.setUint8(1, 0x4d);
  view.setUint32(2, fileSize, true);
  view.setUint32(6, 0, true);
  view.setUint32(10, 54, true);

  view.setUint32(14, 40, true);
  view.setInt32(18, width, true);
  view.setInt32(22, height, true);
  view.setUint16(26, 1, true);
  view.setUint16(28, 24, true);
  view.setUint32(30, 0, true);
  view.setUint32(34, pixelArraySize, true);
  view.setInt32(38, 2835, true);
  view.setInt32(42, 2835, true);
  view.setUint32(46, 0, true);
  view.setUint32(50, 0, true);

  for (let y = 0; y < height; y++) {
    const srcRow = (height - 1 - y) * width * 4;
    const dstRow = 54 + y * rowStride;
    for (let x = 0; x < width; x++) {
      const s = srcRow + x * 4;
      const d = dstRow + x * 3;
      bytes[d] = data[s + 2];
      bytes[d + 1] = data[s + 1];
      bytes[d + 2] = data[s];
    }
  }

  return new Blob([buffer], { type: 'image/bmp' });
}

async function encodeIcoFromCanvas(
  sourceCanvas: HTMLCanvasElement
): Promise<{ blob: Blob; width: number; height: number }> {
  let w = sourceCanvas.width;
  let h = sourceCanvas.height;
  if (w > 256 || h > 256) {
    const scale = Math.min(256 / w, 256 / h);
    w = Math.max(1, Math.round(w * scale));
    h = Math.max(1, Math.round(h * scale));
  }

  const icoCanvas = document.createElement('canvas');
  icoCanvas.width = w;
  icoCanvas.height = h;
  const ctx = icoCanvas.getContext('2d');
  if (!ctx) throw new Error('Canvas context unavailable');
  ctx.imageSmoothingEnabled = true;
  ctx.imageSmoothingQuality = 'high';
  ctx.drawImage(sourceCanvas, 0, 0, w, h);

  const pngBlob = await new Promise<Blob | null>((resolve) =>
    icoCanvas.toBlob((b) => resolve(b), 'image/png')
  );
  if (!pngBlob) throw new Error('Failed to encode ICO frame');

  const pngBytes = new Uint8Array(await pngBlob.arrayBuffer());
  const headerSize = 6 + 16;
  const buffer = new ArrayBuffer(headerSize + pngBytes.length);
  const view = new DataView(buffer);

  view.setUint16(0, 0, true);
  view.setUint16(2, 1, true);
  view.setUint16(4, 1, true);

  view.setUint8(6, w >= 256 ? 0 : w);
  view.setUint8(7, h >= 256 ? 0 : h);
  view.setUint8(8, 0);
  view.setUint8(9, 0);
  view.setUint16(10, 1, true);
  view.setUint16(12, 32, true);
  view.setUint32(14, pngBytes.length, true);
  view.setUint32(18, headerSize, true);

  new Uint8Array(buffer, headerSize).set(pngBytes);
  return {
    blob: new Blob([buffer], { type: 'image/x-icon' }),
    width: w,
    height: h,
  };
}

function encodePngQuantized(
  ctx: CanvasRenderingContext2D,
  width: number,
  height: number,
  quality: number,
  lossless: boolean
): Blob {
  const imageData = ctx.getImageData(0, 0, width, height);
  const rgbaBuffer = imageData.data.buffer.slice(
    imageData.data.byteOffset,
    imageData.data.byteOffset + imageData.data.byteLength
  );

  let cnum = 0;
  if (!lossless && quality < 99) {
    const t = Math.max(0, Math.min(1, (quality - 5) / 93));
    cnum = Math.round(16 + t * (256 - 16));
  }

  const encoded = UPNG.encode([rgbaBuffer], width, height, cnum);
  return new Blob([encoded], { type: 'image/png' });
}

async function encodeCanvasBlob(
  canvas: HTMLCanvasElement,
  mime: string,
  quality01: number
): Promise<Blob> {
  const blob = await new Promise<Blob | null>((resolve) =>
    canvas.toBlob((b) => resolve(b), mime, quality01)
  );
  if (!blob) {
    throw new Error(`Browser failed to encode format: ${mime}`);
  }
  return blob;
}

async function encodeSinglePass(
  canvas: HTMLCanvasElement,
  ctx: CanvasRenderingContext2D,
  format: Exclude<OutputFormat, 'auto'>,
  quality: number,
  lossless: boolean
): Promise<{ blob: Blob; width: number; height: number }> {
  const { width, height } = canvas;
  if (format === 'bmp') {
    const imgData = ctx.getImageData(0, 0, width, height);
    return { blob: encodeBmp24(imgData), width, height };
  }
  if (format === 'ico') {
    return encodeIcoFromCanvas(canvas);
  }
  if (format === 'png') {
    return {
      blob: encodePngQuantized(ctx, width, height, quality, lossless),
      width,
      height,
    };
  }
  const mimeMap: Record<'webp' | 'jpeg' | 'avif', string> = {
    webp: 'image/webp',
    jpeg: 'image/jpeg',
    avif: 'image/avif',
  };
  const q01 = lossless ? 1 : Math.max(0.05, Math.min(1, quality / 100));
  const blob = await encodeCanvasBlob(canvas, mimeMap[format], q01);
  return { blob, width, height };
}

export async function copyBlobAsImageToClipboard(blob: Blob): Promise<void> {
  if (!navigator.clipboard || typeof ClipboardItem === 'undefined') {
    throw new Error('Clipboard image write not supported');
  }
  let pngBlob = blob;
  if (blob.type !== 'image/png') {
    const url = URL.createObjectURL(blob);
    try {
      const img = new Image();
      await new Promise<void>((resolve, reject) => {
        img.onload = () => resolve();
        img.onerror = () => reject(new Error('Image decode failed'));
        img.src = url;
      });
      const c = document.createElement('canvas');
      c.width = img.naturalWidth;
      c.height = img.naturalHeight;
      const ctx = c.getContext('2d');
      if (!ctx) throw new Error('Canvas unavailable');
      ctx.drawImage(img, 0, 0);
      pngBlob = await encodeCanvasBlob(c, 'image/png', 1);
    } finally {
      URL.revokeObjectURL(url);
    }
  }
  await navigator.clipboard.write([
    new ClipboardItem({ 'image/png': pngBlob }),
  ]);
}

export interface OptimizedResult {
  blob: Blob;
  outputFormat: Exclude<OutputFormat, 'auto'>;
  originalWidth: number;
  originalHeight: number;
  outputWidth: number;
  outputHeight: number;
  appliedQuality: number;
  processingMs: number;
  alreadyOptimal: boolean;
}

export interface ItemOverrides {
  formatOverride?: OutputFormat | null;
  rotationOverride?: RotationAngle | null;
}

export async function optimizeImageFile(
  file: File,
  settings: OptimizationSettings,
  avifSupported: boolean,
  overrides?: ItemOverrides
): Promise<OptimizedResult> {
  const start = performance.now();
  const originalFormat = inferOriginalFormat(file);
  const requestedFormat = overrides?.formatOverride ?? settings.outputFormat;
  const targetFormat = resolveOutputFormat(
    requestedFormat,
    originalFormat,
    avifSupported
  );
  const activeRotation = overrides?.rotationOverride ?? settings.rotation;

  const source = await loadImageSource(file);

  try {
    // Dimensions before rotation
    let baseW = source.width;
    let baseH = source.height;

    if (settings.resolutionMode === 'max-width' && settings.maxWidth > 0) {
      if (source.width > settings.maxWidth) {
        const ratio = settings.maxWidth / source.width;
        baseW = Math.max(1, Math.round(source.width * ratio));
        baseH = Math.max(1, Math.round(source.height * ratio));
      }
    } else if (settings.resolutionMode === 'exact') {
      const reqW = Math.max(16, settings.customWidth || source.width);
      const reqH = Math.max(16, settings.customHeight || source.height);
      if (settings.maintainAspect) {
        const ratio = Math.min(reqW / source.width, reqH / source.height);
        baseW = Math.max(1, Math.round(source.width * ratio));
        baseH = Math.max(1, Math.round(source.height * ratio));
      } else {
        baseW = reqW;
        baseH = reqH;
      }
    } else if (settings.resolutionMode === 'scale' && settings.scalePercent > 0) {
      const factor = Math.max(5, Math.min(100, settings.scalePercent)) / 100;
      baseW = Math.max(1, Math.round(source.width * factor));
      baseH = Math.max(1, Math.round(source.height * factor));
    }

    const swapped = activeRotation === 90 || activeRotation === 270;
    const canvasW = swapped ? baseH : baseW;
    const canvasH = swapped ? baseW : baseH;

    const canvas = document.createElement('canvas');
    canvas.width = canvasW;
    canvas.height = canvasH;
    const ctx = canvas.getContext('2d', { willReadFrequently: true });
    if (!ctx) throw new Error('Could not initialize 2D canvas context.');

    ctx.imageSmoothingEnabled = true;
    ctx.imageSmoothingQuality = 'high';

    if (targetFormat === 'jpeg' || targetFormat === 'bmp') {
      ctx.fillStyle = settings.backgroundFill || '#ffffff';
      ctx.fillRect(0, 0, canvasW, canvasH);
    }

    ctx.save();
    ctx.translate(canvasW / 2, canvasH / 2);
    ctx.rotate((activeRotation * Math.PI) / 180);
    ctx.drawImage(source.element, -baseW / 2, -baseH / 2, baseW, baseH);
    ctx.restore();

    const isLosslessPreset = settings.preset === 'lossless';
    let appliedQuality = isLosslessPreset ? 100 : settings.quality;
    let passResult = await encodeSinglePass(
      canvas,
      ctx,
      targetFormat,
      appliedQuality,
      isLosslessPreset
    );

    const supportsQualitySearch =
      targetFormat === 'webp' ||
      targetFormat === 'jpeg' ||
      targetFormat === 'avif' ||
      targetFormat === 'png';

    if (
      settings.targetSizeKb &&
      settings.targetSizeKb > 0 &&
      supportsQualitySearch
    ) {
      const limitBytes = settings.targetSizeKb * 1024;
      if (passResult.blob.size > limitBytes) {
        let low = 5;
        let high = Math.min(98, appliedQuality);
        let bestBlob = passResult.blob;
        let bestQ = appliedQuality;
        let smallestBlob = passResult.blob;
        let smallestQ = appliedQuality;

        for (let iter = 0; iter < 7; iter++) {
          const mid = Math.round((low + high) / 2);
          const attempt = await encodeSinglePass(
            canvas,
            ctx,
            targetFormat,
            mid,
            false
          );
          if (attempt.blob.size < smallestBlob.size) {
            smallestBlob = attempt.blob;
            smallestQ = mid;
          }
          if (attempt.blob.size <= limitBytes) {
            bestBlob = attempt.blob;
            bestQ = mid;
            low = mid + 1;
          } else {
            high = mid - 1;
          }
          if (low > high) break;
        }

        if (bestBlob.size <= limitBytes) {
          passResult = { ...passResult, blob: bestBlob };
          appliedQuality = bestQ;
        } else {
          passResult = { ...passResult, blob: smallestBlob };
          appliedQuality = smallestQ;
        }
      }
    }

    let alreadyOptimal = false;
    if (
      requestedFormat === 'auto' &&
      settings.resolutionMode === 'preserve' &&
      activeRotation === 0 &&
      passResult.blob.size >= file.size
    ) {
      passResult = {
        blob: file.slice(0, file.size, file.type || `image/${targetFormat}`),
        width: source.width,
        height: source.height,
      };
      alreadyOptimal = true;
    }

    return {
      blob: passResult.blob,
      outputFormat: targetFormat,
      originalWidth: source.width,
      originalHeight: source.height,
      outputWidth: passResult.width,
      outputHeight: passResult.height,
      appliedQuality,
      processingMs: Math.round(performance.now() - start),
      alreadyOptimal,
    };
  } finally {
    source.cleanup();
  }
}
