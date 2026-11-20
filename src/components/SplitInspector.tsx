import {
  Check,
  ChevronLeft,
  ChevronRight,
  Columns2,
  Copy,
  Download,
  Grid,
  Image as ImageIcon,
  MoveHorizontal,
  Pencil,
  RotateCw,
  Sliders,
} from 'lucide-react';
import React, { useEffect, useRef, useState } from 'react';
import { ImageItem, Language, OutputFormat } from '../types/image';
import { FORMAT_LABELS, getCopy } from '../utils/i18n';
import {
  calcSavingsPercent,
  copyBlobAsImageToClipboard,
  formatBytes,
} from '../utils/imageEngine';

interface SplitInspectorProps {
  lang: Language;
  item: ImageItem | null;
  itemIndex: number;
  totalItems: number;
  avifSupported: boolean;
  onPrev: () => void;
  onNext: () => void;
  onDownload: (item: ImageItem) => void;
  onRotateItem: (id: string) => void;
  onOverrideFormat: (id: string, format: OutputFormat | null) => void;
  onRenameItem: (id: string, newBaseName: string) => void;
  onNotify: (message: string) => void;
}

type ZoomMode = 'fit' | '100' | '200';
type ViewMode = 'split' | 'side';

const QUICK_FORMATS: OutputFormat[] = ['webp', 'jpeg', 'png', 'avif', 'ico', 'bmp'];

export function SplitInspector({
  lang,
  item,
  itemIndex,
  totalItems,
  avifSupported,
  onPrev,
  onNext,
  onDownload,
  onRotateItem,
  onOverrideFormat,
  onRenameItem,
  onNotify,
}: SplitInspectorProps) {
  const t = getCopy(lang);
  const [splitPct, setSplitPct] = useState(50);
  const [viewMode, setViewMode] = useState<ViewMode>('split');
  const [zoom, setZoom] = useState<ZoomMode>('fit');
  const [showChecker, setShowChecker] = useState(true);
  const [copiedType, setCopiedType] = useState<'image' | 'base64' | null>(null);
  const [editingName, setEditingName] = useState(false);
  const [draftName, setDraftName] = useState('');
  const stageRef = useRef<HTMLDivElement>(null);
  const draggingRef = useRef(false);

  useEffect(() => {
    setEditingName(false);
  }, [item?.id]);

  const updateSplitFromClientX = (clientX: number) => {
    const el = stageRef.current;
    if (!el) return;
    const rect = el.getBoundingClientRect();
    if (rect.width <= 0) return;
    const pct = ((clientX - rect.left) / rect.width) * 100;
    setSplitPct(Math.max(2, Math.min(98, pct)));
  };

  const handlePointerDown = (e: React.PointerEvent<HTMLDivElement>) => {
    draggingRef.current = true;
    e.currentTarget.setPointerCapture(e.pointerId);
    updateSplitFromClientX(e.clientX);
  };

  const handlePointerMove = (e: React.PointerEvent<HTMLDivElement>) => {
    if (!draggingRef.current) return;
    updateSplitFromClientX(e.clientX);
  };

  const handlePointerUp = (e: React.PointerEvent<HTMLDivElement>) => {
    draggingRef.current = false;
    if (e.currentTarget.hasPointerCapture(e.pointerId)) {
      e.currentTarget.releasePointerCapture(e.pointerId);
    }
  };

  const handleCopyImage = async () => {
    if (!item?.optimizedBlob) return;
    try {
      await copyBlobAsImageToClipboard(item.optimizedBlob);
      setCopiedType('image');
      onNotify(t.toasts.copiedImage);
      setTimeout(() => setCopiedType(null), 1800);
    } catch {
      // Clipboard blocked in restricted context
    }
  };

  const handleCopyBase64 = async () => {
    if (!item?.optimizedBlob) return;
    try {
      const reader = new FileReader();
      const dataUrl = await new Promise<string>((resolve, reject) => {
        reader.onload = () => resolve(String(reader.result));
        reader.onerror = () => reject(new Error('Failed to read blob'));
        reader.readAsDataURL(item.optimizedBlob!);
      });
      await navigator.clipboard.writeText(dataUrl);
      setCopiedType('base64');
      onNotify(t.toasts.copiedBase64);
      setTimeout(() => setCopiedType(null), 1800);
    } catch {
      // Clipboard blocked
    }
  };

  if (!item || !item.optimizedUrl || item.optimizedSize === null) {
    return null;
  }

  const displayName = item.customOutputName || item.name;
  const savings = calcSavingsPercent(item.originalSize, item.optimizedSize);
  const absSavings = Math.abs(savings).toFixed(1);
  const isSmaller = item.optimizedSize <= item.originalSize;

  const commitRename = () => {
    const cleaned = draftName.trim();
    if (cleaned) {
      onRenameItem(item.id, cleaned);
    }
    setEditingName(false);
  };

  return (
    <section
      id="inspector"
      className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl overflow-hidden"
    >
      {/* Inspector Header Toolbar */}
      <div className="px-4 sm:px-5 py-3.5 border-b border-slate-200 dark:border-slate-800 flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-2.5 min-w-0">
          {totalItems > 1 && (
            <div className="inline-flex items-center border border-slate-200 dark:border-slate-700 rounded-lg overflow-hidden shrink-0">
              <button
                type="button"
                onClick={onPrev}
                title={t.inspector.prevImage}
                aria-label={t.inspector.prevImage}
                className="p-1.5 hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-600 dark:text-slate-300 cursor-pointer"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>
              <span className="px-2 text-xs font-mono tabular-nums text-slate-600 dark:text-slate-300 border-x border-slate-200 dark:border-slate-700">
                {itemIndex + 1}/{totalItems}
              </span>
              <button
                type="button"
                onClick={onNext}
                title={t.inspector.nextImage}
                aria-label={t.inspector.nextImage}
                className="p-1.5 hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-600 dark:text-slate-300 cursor-pointer"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          )}

          <div className="min-w-0">
            {editingName ? (
              <div className="flex items-center gap-1.5">
                <input
                  type="text"
                  autoFocus
                  value={draftName}
                  placeholder={t.inspector.renamePlaceholder}
                  onChange={(e) => setDraftName(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') commitRename();
                    if (e.key === 'Escape') setEditingName(false);
                  }}
                  onBlur={commitRename}
                  className="px-2 py-1 text-sm font-semibold bg-slate-50 dark:bg-slate-800 border border-blue-600 rounded-md text-slate-900 dark:text-slate-100 focus:outline-none w-48 sm:w-64"
                />
              </div>
            ) : (
              <button
                type="button"
                title={t.inspector.renameTitle}
                onClick={() => {
                  const dot = displayName.lastIndexOf('.');
                  setDraftName(dot > 0 ? displayName.slice(0, dot) : displayName);
                  setEditingName(true);
                }}
                className="group inline-flex items-center gap-1.5 text-left max-w-full cursor-pointer"
              >
                <h2 className="text-sm sm:text-base font-semibold text-slate-900 dark:text-slate-100 truncate group-hover:text-blue-600 dark:group-hover:text-blue-400">
                  {displayName}
                </h2>
                <Pencil className="w-3.5 h-3.5 text-slate-400 group-hover:text-blue-600 shrink-0" />
              </button>
            )}

            <div className="flex flex-wrap items-center gap-2 text-xs text-slate-500 dark:text-slate-400 font-mono tabular-nums mt-0.5">
              <span>
                {item.outputWidth} × {item.outputHeight} px
              </span>
              <span aria-hidden="true">·</span>
              <span className="uppercase">
                {item.originalFormat} → {item.outputFormat}
              </span>
              <span aria-hidden="true">·</span>
              <span>
                {formatBytes(item.originalSize)} →{' '}
                {formatBytes(item.optimizedSize)}
              </span>
              <span aria-hidden="true">·</span>
              <span
                className={
                  isSmaller
                    ? 'text-emerald-700 dark:text-emerald-400 font-semibold'
                    : 'text-amber-700 dark:text-amber-400 font-semibold'
                }
              >
                {isSmaller ? `-${absSavings}%` : `+${absSavings}%`}
              </span>
            </div>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-1.5 sm:gap-2">
          {/* Split vs Side-by-Side Comparison Toggle */}
          <div className="inline-flex items-center p-0.5 bg-slate-100 dark:bg-slate-800 rounded-lg border border-slate-200 dark:border-slate-700">
            <button
              type="button"
              onClick={() => setViewMode('split')}
              className={`inline-flex items-center gap-1 px-2.5 py-1 text-xs font-medium rounded-md transition-colors cursor-pointer whitespace-nowrap ${
                viewMode === 'split'
                  ? 'bg-white dark:bg-slate-700 text-slate-900 dark:text-white shadow-xs'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              <Sliders className="w-3 h-3 shrink-0" />
              <span>{t.inspector.modeSplit}</span>
            </button>
            <button
              type="button"
              onClick={() => setViewMode('side')}
              className={`inline-flex items-center gap-1 px-2.5 py-1 text-xs font-medium rounded-md transition-colors cursor-pointer whitespace-nowrap ${
                viewMode === 'side'
                  ? 'bg-white dark:bg-slate-700 text-slate-900 dark:text-white shadow-xs'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              <Columns2 className="w-3 h-3 shrink-0" />
              <span>{t.inspector.modeSideBySide}</span>
            </button>
          </div>

          {/* Quick per-item format override */}
          <select
            aria-label={t.controls.outputFormat}
            value={item.formatOverride ?? ''}
            onChange={(e) =>
              onOverrideFormat(
                item.id,
                e.target.value ? (e.target.value as OutputFormat) : null
              )
            }
            className="px-2.5 py-1.5 min-h-[34px] text-xs font-semibold rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-700 dark:text-slate-200 cursor-pointer"
          >
            <option value="">{t.queue.globalFormat}</option>
            {QUICK_FORMATS.map((fmt) => (
              <option
                key={fmt}
                value={fmt}
                disabled={fmt === 'avif' && !avifSupported}
              >
                {FORMAT_LABELS[fmt]}
              </option>
            ))}
          </select>

          <button
            type="button"
            onClick={() => onRotateItem(item.id)}
            title={t.inspector.rotateBtn}
            className="inline-flex items-center gap-1 px-2.5 py-1.5 min-h-[34px] text-xs font-medium rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors cursor-pointer whitespace-nowrap"
          >
            <RotateCw className="w-3.5 h-3.5 shrink-0" />
            <span className="hidden sm:inline">{t.inspector.rotateBtn}</span>
          </button>

          {/* Zoom Segmented Control (Split mode) */}
          {viewMode === 'split' && (
            <div className="inline-flex items-center p-0.5 bg-slate-100 dark:bg-slate-800 rounded-lg border border-slate-200 dark:border-slate-700">
              {(['fit', '100', '200'] as ZoomMode[]).map((z) => (
                <button
                  key={z}
                  type="button"
                  onClick={() => setZoom(z)}
                  className={`px-2 py-1 text-xs font-mono font-medium rounded-md transition-colors cursor-pointer whitespace-nowrap ${
                    zoom === z
                      ? 'bg-white dark:bg-slate-700 text-slate-900 dark:text-white shadow-xs'
                      : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                  }`}
                >
                  {z === 'fit' ? t.inspector.zoomFit : `${z}%`}
                </button>
              ))}
            </div>
          )}

          <button
            type="button"
            onClick={() => setShowChecker((v) => !v)}
            aria-pressed={showChecker}
            className={`inline-flex items-center gap-1.5 px-2.5 py-1.5 min-h-[34px] text-xs font-medium rounded-lg border transition-colors cursor-pointer whitespace-nowrap ${
              showChecker
                ? 'bg-slate-900 dark:bg-slate-100 text-white dark:text-slate-900 border-slate-900 dark:border-slate-100'
                : 'bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300 border-slate-200 dark:border-slate-700'
            }`}
          >
            <Grid className="w-3.5 h-3.5 shrink-0" />
            <span className="hidden md:inline">{t.inspector.checkerboard}</span>
          </button>

          <button
            type="button"
            onClick={handleCopyImage}
            className="inline-flex items-center gap-1.5 px-2.5 py-1.5 min-h-[34px] text-xs font-medium rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors cursor-pointer whitespace-nowrap"
          >
            {copiedType === 'image' ? (
              <Check className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
            ) : (
              <ImageIcon className="w-3.5 h-3.5 shrink-0" />
            )}
            <span>
              {copiedType === 'image' ? t.inspector.copied : t.inspector.copyImage}
            </span>
          </button>

          <button
            type="button"
            onClick={handleCopyBase64}
            className="inline-flex items-center gap-1.5 px-2.5 py-1.5 min-h-[34px] text-xs font-medium rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors cursor-pointer whitespace-nowrap"
          >
            {copiedType === 'base64' ? (
              <Check className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
            ) : (
              <Copy className="w-3.5 h-3.5 shrink-0" />
            )}
            <span>
              {copiedType === 'base64' ? t.inspector.copied : t.inspector.copyBase64}
            </span>
          </button>

          <button
            type="button"
            onClick={() => onDownload(item)}
            className="inline-flex items-center gap-1.5 px-3.5 py-1.5 min-h-[34px] text-xs font-semibold rounded-lg bg-blue-600 hover:bg-blue-700 text-white transition-colors cursor-pointer whitespace-nowrap"
          >
            <Download className="w-3.5 h-3.5 shrink-0" />
            <span>{t.queue.download}</span>
          </button>
        </div>
      </div>

      {/* Comparison Stage */}
      {viewMode === 'split' ? (
        <div
          className={`relative w-full overflow-auto ${
            showChecker ? 'checkerboard-bg' : 'bg-slate-100 dark:bg-slate-950'
          }`}
        >
          <div
            ref={stageRef}
            onPointerDown={handlePointerDown}
            onPointerMove={handlePointerMove}
            onPointerUp={handlePointerUp}
            role="slider"
            aria-label="Before and after image comparison slider"
            aria-valuemin={2}
            aria-valuemax={98}
            aria-valuenow={Math.round(splitPct)}
            tabIndex={0}
            onKeyDown={(e) => {
              if (e.key === 'ArrowLeft') setSplitPct((p) => Math.max(2, p - 4));
              if (e.key === 'ArrowRight') setSplitPct((p) => Math.min(98, p + 4));
            }}
            className={`relative mx-auto select-none cursor-ew-resize touch-none flex items-center justify-center ${
              zoom === 'fit' ? 'w-full h-[360px] sm:h-[440px]' : 'min-h-[420px]'
            }`}
          >
            <img
              src={item.optimizedUrl}
              alt={`${displayName} optimized`}
              referrerPolicy="no-referrer"
              draggable={false}
              style={
                zoom === 'fit'
                  ? undefined
                  : {
                      width:
                        zoom === '100'
                          ? `${item.outputWidth}px`
                          : `${item.outputWidth * 2}px`,
                      height:
                        zoom === '100'
                          ? `${item.outputHeight}px`
                          : `${item.outputHeight * 2}px`,
                      maxWidth: 'none',
                    }
              }
              className={
                zoom === 'fit'
                  ? 'max-h-full max-w-full object-contain pointer-events-none'
                  : 'pointer-events-none'
              }
            />

            <div
              className="absolute inset-0 flex items-center justify-center pointer-events-none"
              style={{
                clipPath: `inset(0 ${100 - splitPct}% 0 0)`,
              }}
            >
              <img
                src={item.originalUrl}
                alt={`${displayName} original`}
                referrerPolicy="no-referrer"
                draggable={false}
                style={
                  zoom === 'fit'
                    ? undefined
                    : {
                        width:
                          zoom === '100'
                            ? `${item.outputWidth}px`
                            : `${item.outputWidth * 2}px`,
                        height:
                          zoom === '100'
                            ? `${item.outputHeight}px`
                            : `${item.outputHeight * 2}px`,
                        maxWidth: 'none',
                      }
                }
                className={
                  zoom === 'fit'
                    ? 'max-h-full max-w-full object-contain pointer-events-none'
                    : 'pointer-events-none'
                }
              />
            </div>

            <div
              className="absolute top-0 bottom-0 w-0.5 bg-blue-600 shadow-sm pointer-events-none"
              style={{ left: `${splitPct}%` }}
            >
              <div className="absolute top-1/2 -translate-x-1/2 -translate-y-1/2 w-9 h-9 rounded-full bg-blue-600 text-white border-2 border-white shadow-md flex items-center justify-center">
                <MoveHorizontal className="w-4 h-4" />
              </div>
            </div>

            <div className="absolute top-3 left-3 px-2.5 py-1 rounded bg-slate-950/75 text-white text-xs font-medium pointer-events-none tabular-nums">
              {t.inspector.original} · {formatBytes(item.originalSize)}
            </div>
            <div className="absolute top-3 right-3 px-2.5 py-1 rounded bg-slate-950/75 text-white text-xs font-medium pointer-events-none tabular-nums">
              {t.inspector.optimized} ({item.outputFormat?.toUpperCase()}) ·{' '}
              {formatBytes(item.optimizedSize)}
            </div>
          </div>
        </div>
      ) : (
        <div
          className={`grid grid-cols-1 md:grid-cols-2 divide-y md:divide-y-0 md:divide-x divide-slate-200 dark:divide-slate-800 ${
            showChecker ? 'checkerboard-bg' : 'bg-slate-100 dark:bg-slate-950'
          }`}
        >
          <div className="relative p-4 h-[320px] sm:h-[400px] flex items-center justify-center">
            <img
              src={item.originalUrl}
              alt={`${displayName} original`}
              referrerPolicy="no-referrer"
              className="max-h-full max-w-full object-contain"
            />
            <div className="absolute top-3 left-3 px-2.5 py-1 rounded bg-slate-950/75 text-white text-xs font-medium tabular-nums">
              {t.inspector.original} · {formatBytes(item.originalSize)}
            </div>
          </div>

          <div className="relative p-4 h-[320px] sm:h-[400px] flex items-center justify-center">
            <img
              src={item.optimizedUrl}
              alt={`${displayName} optimized`}
              referrerPolicy="no-referrer"
              className="max-h-full max-w-full object-contain"
            />
            <div className="absolute top-3 right-3 px-2.5 py-1 rounded bg-slate-950/75 text-white text-xs font-medium tabular-nums">
              {t.inspector.optimized} ({item.outputFormat?.toUpperCase()}) ·{' '}
              {formatBytes(item.optimizedSize)}
            </div>
          </div>
        </div>
      )}

      {/* Quantitative Detail Bar */}
      <div className="px-5 py-2.5 bg-slate-50 dark:bg-slate-900/60 border-t border-slate-200 dark:border-slate-800 flex flex-wrap items-center justify-between gap-4 text-xs text-slate-600 dark:text-slate-400">
        <span>
          {viewMode === 'split' ? t.inspector.sliderHelp : t.inspector.sideHelp}
        </span>
        <div className="flex flex-wrap items-center gap-4 font-mono tabular-nums">
          <span>
            {t.inspector.dimensions}:{' '}
            <strong className="text-slate-900 dark:text-slate-100">
              {item.originalWidth}×{item.originalHeight} → {item.outputWidth}×
              {item.outputHeight}
            </strong>
          </span>
          <span>
            {t.inspector.qualityUsed}:{' '}
            <strong className="text-slate-900 dark:text-slate-100">
              {item.appliedQuality}%
            </strong>
          </span>
          {item.processingMs !== null && (
            <span>
              {t.inspector.processingTime}:{' '}
              <strong className="text-slate-900 dark:text-slate-100">
                {item.processingMs} ms
              </strong>
            </span>
          )}
        </div>
      </div>
    </section>
  );
}
