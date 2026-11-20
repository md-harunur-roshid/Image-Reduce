import {
  Archive,
  CheckCircle2,
  Download,
  Eye,
  Loader2,
  Trash2,
  X,
} from 'lucide-react';
import { ImageItem, Language, OutputFormat } from '../types/image';
import { FORMAT_LABELS, getCopy } from '../utils/i18n';
import { calcSavingsPercent, formatBytes } from '../utils/imageEngine';

interface QueueListProps {
  lang: Language;
  items: ImageItem[];
  selectedId: string | null;
  isZipping: boolean;
  avifSupported: boolean;
  onSelect: (id: string) => void;
  onOverrideFormat: (id: string, format: OutputFormat | null) => void;
  onDownloadItem: (item: ImageItem) => void;
  onRemoveItem: (id: string) => void;
  onDownloadZip: () => void;
  onClearAll: () => void;
}

const OVERRIDE_FORMATS: OutputFormat[] = [
  'webp',
  'jpeg',
  'png',
  'avif',
  'ico',
  'bmp',
];

export function QueueList({
  lang,
  items,
  selectedId,
  isZipping,
  avifSupported,
  onSelect,
  onOverrideFormat,
  onDownloadItem,
  onRemoveItem,
  onDownloadZip,
  onClearAll,
}: QueueListProps) {
  const t = getCopy(lang);

  if (items.length === 0) {
    return null;
  }

  const doneItems = items.filter(
    (it) => it.status === 'done' && it.optimizedSize !== null
  );
  const completedCount = items.filter(
    (it) => it.status === 'done' || it.status === 'error'
  ).length;
  const isBatchProcessing = completedCount < items.length;
  const progressPct = Math.round((completedCount / items.length) * 100);

  const totalOriginal = doneItems.reduce((acc, it) => acc + it.originalSize, 0);
  const totalOptimized = doneItems.reduce(
    (acc, it) => acc + (it.optimizedSize ?? 0),
    0
  );
  const netSavedBytes = Math.max(0, totalOriginal - totalOptimized);
  const netSavedPct =
    totalOriginal > 0 ? calcSavingsPercent(totalOriginal, totalOptimized) : 0;

  return (
    <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl overflow-hidden">
      {/* Batch Progress Indicator */}
      {isBatchProcessing && (
        <div className="px-5 py-2.5 bg-blue-50/70 dark:bg-blue-950/30 border-b border-blue-200/70 dark:border-blue-900/60 flex items-center justify-between gap-4">
          <div className="flex items-center gap-2 text-xs font-medium text-blue-700 dark:text-blue-300">
            <Loader2 className="w-3.5 h-3.5 animate-spin shrink-0" />
            <span className="tabular-nums">
              {t.queue.progressLabel} {completedCount}/{items.length}
            </span>
          </div>
          <div className="flex-1 max-w-xs h-1.5 bg-blue-200/70 dark:bg-blue-900 rounded-full overflow-hidden">
            <div
              className="h-full bg-blue-600 transition-all duration-150"
              style={{ width: `${progressPct}%` }}
            />
          </div>
        </div>
      )}

      {/* Batch Summary Header */}
      <div className="px-5 py-4 border-b border-slate-200 dark:border-slate-800 flex flex-wrap items-center justify-between gap-4">
        <div className="flex flex-wrap items-center gap-x-6 gap-y-2">
          <div>
            <div className="text-xs text-slate-500 dark:text-slate-400">
              {t.queue.totalOriginal}
            </div>
            <div className="text-base font-semibold font-mono tabular-nums text-slate-900 dark:text-slate-100">
              {formatBytes(totalOriginal)}
            </div>
          </div>

          <div>
            <div className="text-xs text-slate-500 dark:text-slate-400">
              {t.queue.totalOptimized}
            </div>
            <div className="text-base font-semibold font-mono tabular-nums text-slate-900 dark:text-slate-100">
              {formatBytes(totalOptimized)}
            </div>
          </div>

          <div>
            <div className="text-xs text-slate-500 dark:text-slate-400">
              {t.queue.totalSaved}
            </div>
            <div className="text-base font-semibold font-mono tabular-nums text-emerald-700 dark:text-emerald-400">
              {formatBytes(netSavedBytes)} ({netSavedPct.toFixed(1)}%)
            </div>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {doneItems.length >= 2 && (
            <button
              type="button"
              disabled={isZipping}
              onClick={onDownloadZip}
              className="inline-flex items-center gap-2 px-4 py-2 min-h-[40px] text-xs sm:text-sm font-semibold text-white bg-blue-600 hover:bg-blue-700 disabled:opacity-50 rounded-lg transition-colors cursor-pointer whitespace-nowrap"
            >
              <Archive className="w-4 h-4 shrink-0" />
              <span>{t.queue.downloadZip}</span>
            </button>
          )}
          <button
            type="button"
            onClick={onClearAll}
            className="inline-flex items-center gap-1.5 px-3 py-2 min-h-[40px] text-xs sm:text-sm font-medium text-slate-700 dark:text-slate-300 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 rounded-lg transition-colors cursor-pointer whitespace-nowrap"
          >
            <Trash2 className="w-4 h-4 shrink-0" />
            <span>{t.queue.clearAll}</span>
          </button>
        </div>
      </div>

      {/* Queue Items */}
      <ul className="divide-y divide-slate-100 dark:divide-slate-800">
        {items.map((item) => {
          const isSelected = item.id === selectedId;
          const isDone = item.status === 'done' && item.optimizedSize !== null;
          const savings =
            isDone && item.optimizedSize !== null
              ? calcSavingsPercent(item.originalSize, item.optimizedSize)
              : 0;
          const isSmaller =
            isDone &&
            item.optimizedSize !== null &&
            item.optimizedSize <= item.originalSize;
          const resolutionPreserved =
            item.originalWidth === item.outputWidth &&
            item.originalHeight === item.outputHeight;

          return (
            <li
              key={item.id}
              onClick={() => isDone && onSelect(item.id)}
              className={`px-4 sm:px-5 py-3 flex flex-col sm:flex-row sm:items-center justify-between gap-3 transition-colors ${
                isDone ? 'cursor-pointer' : ''
              } ${
                isSelected
                  ? 'bg-blue-50/70 dark:bg-blue-950/30'
                  : 'hover:bg-slate-50 dark:hover:bg-slate-800/40'
              }`}
            >
              {/* Left: Thumbnail + File Info */}
              <div className="flex items-center gap-3.5 min-w-0">
                <div className="w-12 h-12 rounded-lg overflow-hidden border border-slate-200 dark:border-slate-700 checkerboard-bg shrink-0 flex items-center justify-center">
                  <img
                    src={item.optimizedUrl || item.originalUrl}
                    alt={item.name}
                    referrerPolicy="no-referrer"
                    className="w-full h-full object-cover"
                  />
                </div>

                <div className="min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-semibold text-slate-900 dark:text-slate-100 truncate">
                      {item.name}
                    </span>
                  </div>
                  <div className="flex flex-wrap items-center gap-x-2 gap-y-0.5 text-xs text-slate-500 dark:text-slate-400 mt-0.5 font-mono tabular-nums">
                    <span>
                      {item.outputWidth || item.originalWidth}×
                      {item.outputHeight || item.originalHeight} px
                    </span>
                    <span aria-hidden="true">·</span>
                    <span className="font-sans">
                      {resolutionPreserved
                        ? t.queue.resolutionKept
                        : t.queue.resized}
                    </span>
                    <span aria-hidden="true">·</span>
                    <span className="uppercase">
                      {item.originalFormat}
                      {item.outputFormat ? ` → ${item.outputFormat}` : ''}
                    </span>
                  </div>
                </div>
              </div>

              {/* Right: Format Override, Metrics & Actions */}
              <div
                className="flex flex-wrap items-center justify-between sm:justify-end gap-3 shrink-0"
                onClick={(e) => e.stopPropagation()}
              >
                <select
                  aria-label={`${item.name} output format`}
                  value={item.formatOverride ?? ''}
                  onChange={(e) =>
                    onOverrideFormat(
                      item.id,
                      e.target.value ? (e.target.value as OutputFormat) : null
                    )
                  }
                  className="px-2 py-1.5 min-h-[34px] text-xs font-medium rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-700 dark:text-slate-200 cursor-pointer"
                >
                  <option value="">{t.queue.globalFormat}</option>
                  {OVERRIDE_FORMATS.map((fmt) => (
                    <option
                      key={fmt}
                      value={fmt}
                      disabled={fmt === 'avif' && !avifSupported}
                    >
                      {FORMAT_LABELS[fmt]}
                    </option>
                  ))}
                </select>

                {item.status === 'processing' || item.status === 'pending' ? (
                  <div className="flex items-center gap-2 text-xs text-slate-500 dark:text-slate-400">
                    <Loader2 className="w-4 h-4 animate-spin text-blue-600" />
                    <span>{t.queue.processing}</span>
                  </div>
                ) : item.status === 'error' ? (
                  <span className="text-xs font-medium text-red-600 dark:text-red-400">
                    {item.error}
                  </span>
                ) : (
                  <div className="text-right font-mono tabular-nums min-w-[115px]">
                    <div className="text-xs text-slate-500 dark:text-slate-400">
                      <span>{formatBytes(item.originalSize)}</span>
                      <span className="mx-1">→</span>
                      <strong className="text-sm text-slate-900 dark:text-slate-100">
                        {formatBytes(item.optimizedSize ?? 0)}
                      </strong>
                    </div>
                    <div
                      className={`text-xs font-semibold flex items-center sm:justify-end gap-1 mt-0.5 ${
                        isSmaller
                          ? 'text-emerald-700 dark:text-emerald-400'
                          : 'text-amber-700 dark:text-amber-400'
                      }`}
                    >
                      {item.alreadyOptimal ? (
                        <span>{t.queue.alreadyOptimal}</span>
                      ) : (
                        <>
                          <CheckCircle2 className="w-3.5 h-3.5 shrink-0" />
                          <span>
                            {Math.abs(savings).toFixed(1)}%{' '}
                            {isSmaller
                              ? t.queue.savedWord
                              : t.queue.largerWord}
                          </span>
                        </>
                      )}
                    </div>
                  </div>
                )}

                <div className="flex items-center gap-1.5">
                  {isDone && (
                    <>
                      <button
                        type="button"
                        onClick={() => onSelect(item.id)}
                        title={t.queue.inspect}
                        aria-label={t.queue.inspect}
                        className={`p-2 min-w-[36px] min-h-[36px] rounded-lg border transition-colors cursor-pointer flex items-center justify-center ${
                          isSelected
                            ? 'bg-blue-600 text-white border-blue-600'
                            : 'bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300 border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-700'
                        }`}
                      >
                        <Eye className="w-4 h-4" />
                      </button>

                      <button
                        type="button"
                        onClick={() => onDownloadItem(item)}
                        className="inline-flex items-center gap-1.5 px-3 py-2 min-h-[36px] text-xs font-semibold rounded-lg bg-slate-900 dark:bg-slate-100 text-white dark:text-slate-900 hover:bg-slate-800 dark:hover:bg-white transition-colors cursor-pointer whitespace-nowrap"
                      >
                        <Download className="w-3.5 h-3.5 shrink-0" />
                        <span>{t.queue.download}</span>
                      </button>
                    </>
                  )}

                  <button
                    type="button"
                    onClick={() => onRemoveItem(item.id)}
                    title={t.queue.remove}
                    aria-label={t.queue.remove}
                    className="p-2 min-w-[36px] min-h-[36px] rounded-lg text-slate-400 hover:text-red-600 dark:hover:text-red-400 hover:bg-red-50 dark:hover:bg-red-950/30 transition-colors cursor-pointer flex items-center justify-center"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </li>
          );
        })}
      </ul>
    </div>
  );
}
