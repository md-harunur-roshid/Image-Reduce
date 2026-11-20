export type OutputFormat =
  | 'auto'
  | 'webp'
  | 'jpeg'
  | 'png'
  | 'avif'
  | 'bmp'
  | 'ico';

export type PresetId = 'balanced' | 'compact' | 'high' | 'lossless';

export type UseCaseProfileId =
  | 'custom'
  | 'web'
  | 'form100'
  | 'ecommerce'
  | 'social'
  | 'archive';

export type ResolutionMode = 'preserve' | 'max-width' | 'exact' | 'scale';

export type RotationAngle = 0 | 90 | 180 | 270;

export interface OptimizationSettings {
  profile: UseCaseProfileId;
  outputFormat: OutputFormat;
  preset: PresetId;
  quality: number; // 10 - 100
  targetSizeKb: number | null; // null = disabled
  resolutionMode: ResolutionMode;
  maxWidth: number;
  customWidth: number;
  customHeight: number;
  maintainAspect: boolean;
  scalePercent: number;
  rotation: RotationAngle;
  stripMetadata: boolean;
  backgroundFill: string; // Hex color for transparent -> opaque formats
}

export type ProcessingStatus = 'pending' | 'processing' | 'done' | 'error';

export interface ImageItem {
  id: string;
  file: File;
  name: string;
  originalFormat: string;
  originalSize: number;
  originalWidth: number;
  originalHeight: number;
  originalUrl: string;
  optimizedBlob: Blob | null;
  optimizedUrl: string | null;
  optimizedSize: number | null;
  outputFormat: Exclude<OutputFormat, 'auto'> | null;
  outputWidth: number;
  outputHeight: number;
  appliedQuality: number;
  processingMs: number | null;
  status: ProcessingStatus;
  alreadyOptimal?: boolean;
  customOutputName?: string;
  formatOverride?: OutputFormat | null;
  rotationOverride?: RotationAngle | null;
  error?: string;
}

export type Language = 'bn' | 'en';
