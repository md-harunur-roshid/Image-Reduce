import { ImagePlus, Plus } from 'lucide-react';
import React, { useState } from 'react';
import { Language } from '../types/image';
import { getCopy } from '../utils/i18n';
import { SamplePreset } from '../utils/sampleGenerator';

interface DropZoneProps {
  lang: Language;
  compact?: boolean;
  onFilesSelected: (files: File[]) => void;
  onLoadSample: (preset: SamplePreset) => void;
  onBrowseClick: () => void;
  isGeneratingSample: SamplePreset | null;
}

export function DropZone({
  lang,
  compact = false,
  onFilesSelected,
  onLoadSample,
  onBrowseClick,
  isGeneratingSample,
}: DropZoneProps) {
  const t = getCopy(lang);
  const [isDragging, setIsDragging] = useState(false);

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
    const dropped = Array.from(e.dataTransfer.files).filter(
      (f) =>
        f.type.startsWith('image/') ||
        /\.(png|jpe?g|webp|avif|bmp|gif|svg|ico)$/i.test(f.name)
    );
    if (dropped.length > 0) {
      onFilesSelected(dropped);
    }
  };

  if (compact) {
    return (
      <div
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        className={`rounded-xl border border-dashed transition-colors px-4 py-3 flex flex-wrap items-center justify-between gap-3 ${
          isDragging
            ? 'border-blue-600 bg-blue-50/70 dark:bg-blue-950/30'
            : 'border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900'
        }`}
      >
        <div className="flex items-center gap-3 min-w-0">
          <div className="w-9 h-9 rounded-lg bg-blue-50 dark:bg-blue-950/60 border border-blue-200/70 dark:border-blue-800 flex items-center justify-center text-blue-600 dark:text-blue-400 shrink-0">
            <ImagePlus className="w-4 h-4" />
          </div>
          <span className="text-sm font-medium text-slate-700 dark:text-slate-200 truncate">
            {t.dropzone.compactTitle}
          </span>
        </div>

        <button
          type="button"
          onClick={onBrowseClick}
          className="inline-flex items-center gap-1.5 px-3.5 py-2 min-h-[38px] text-xs font-semibold text-white bg-blue-600 hover:bg-blue-700 rounded-lg transition-colors cursor-pointer whitespace-nowrap shrink-0"
        >
          <Plus className="w-3.5 h-3.5 shrink-0" />
          <span>{t.dropzone.button}</span>
        </button>
      </div>
    );
  }

  return (
    <div
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
      className={`rounded-xl border-2 border-dashed transition-colors p-6 sm:p-10 text-center ${
        isDragging
          ? 'border-blue-600 bg-blue-50/70 dark:bg-blue-950/30'
          : 'border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 hover:border-slate-400 dark:hover:border-slate-600'
      }`}
    >
      <div className="max-w-2xl mx-auto flex flex-col items-center gap-4">
        <div className="w-14 h-14 rounded-2xl bg-blue-50 dark:bg-blue-950/60 border border-blue-200/70 dark:border-blue-800 flex items-center justify-center text-blue-600 dark:text-blue-400">
          <ImagePlus className="w-7 h-7" />
        </div>

        <div className="space-y-1.5">
          <h3 className="text-lg sm:text-xl font-semibold text-slate-900 dark:text-slate-100">
            {t.dropzone.title}
          </h3>
          <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400">
            {t.dropzone.subtitle}
          </p>
        </div>

        <button
          type="button"
          onClick={onBrowseClick}
          className="inline-flex items-center justify-center gap-2 px-6 py-2.5 min-h-[44px] text-sm font-semibold text-white bg-blue-600 hover:bg-blue-700 rounded-lg transition-colors cursor-pointer whitespace-nowrap"
        >
          <Plus className="w-4 h-4 shrink-0" />
          <span>{t.dropzone.button}</span>
        </button>

        {/* Visual Sample Cards */}
        <div className="w-full pt-6 mt-2 border-t border-slate-100 dark:border-slate-800">
          <p className="text-xs text-slate-500 dark:text-slate-400 mb-3">
            {t.dropzone.samplesLabel}
          </p>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-left">
            <button
              type="button"
              disabled={isGeneratingSample !== null}
              onClick={() => onLoadSample('architecture')}
              className="group p-2.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50/70 dark:bg-slate-800/40 hover:border-blue-500/60 hover:bg-blue-50/30 dark:hover:bg-blue-950/20 transition-colors cursor-pointer flex items-center gap-3 disabled:opacity-50"
            >
              <div className="w-12 h-12 rounded-lg shrink-0 bg-gradient-to-br from-slate-900 via-slate-700 to-amber-500/70 border border-slate-300/40 dark:border-slate-700 flex items-end justify-end p-1">
                <div className="w-3 h-7 bg-white/25 rounded-xs" />
              </div>
              <div className="min-w-0">
                <div className="text-xs font-semibold text-slate-900 dark:text-slate-100 truncate group-hover:text-blue-600 dark:group-hover:text-blue-400">
                  {isGeneratingSample === 'architecture'
                    ? lang === 'bn'
                      ? 'তৈরি হচ্ছে...'
                      : 'Loading...'
                    : t.dropzone.sample1}
                </div>
                <div className="text-[11px] font-mono text-slate-500 dark:text-slate-400 mt-0.5 tabular-nums">
                  {t.dropzone.sample1Meta}
                </div>
              </div>
            </button>

            <button
              type="button"
              disabled={isGeneratingSample !== null}
              onClick={() => onLoadSample('botanical')}
              className="group p-2.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50/70 dark:bg-slate-800/40 hover:border-blue-500/60 hover:bg-blue-50/30 dark:hover:bg-blue-950/20 transition-colors cursor-pointer flex items-center gap-3 disabled:opacity-50"
            >
              <div className="w-12 h-12 rounded-lg shrink-0 bg-gradient-to-br from-emerald-950 via-emerald-700 to-teal-400 border border-emerald-700/30 flex items-center justify-center">
                <div className="w-5 h-5 rounded-full bg-white/30 border border-white/60" />
              </div>
              <div className="min-w-0">
                <div className="text-xs font-semibold text-slate-900 dark:text-slate-100 truncate group-hover:text-blue-600 dark:group-hover:text-blue-400">
                  {isGeneratingSample === 'botanical'
                    ? lang === 'bn'
                      ? 'তৈরি হচ্ছে...'
                      : 'Loading...'
                    : t.dropzone.sample2}
                </div>
                <div className="text-[11px] font-mono text-slate-500 dark:text-slate-400 mt-0.5 tabular-nums">
                  {t.dropzone.sample2Meta}
                </div>
              </div>
            </button>

            <button
              type="button"
              disabled={isGeneratingSample !== null}
              onClick={() => onLoadSample('emblem')}
              className="group p-2.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50/70 dark:bg-slate-800/40 hover:border-blue-500/60 hover:bg-blue-50/30 dark:hover:bg-blue-950/20 transition-colors cursor-pointer flex items-center gap-3 disabled:opacity-50"
            >
              <div className="w-12 h-12 rounded-lg shrink-0 checkerboard-bg border border-slate-200 dark:border-slate-700 flex items-center justify-center">
                <div className="w-7 h-7 rounded-full border-4 border-blue-600 bg-slate-900" />
              </div>
              <div className="min-w-0">
                <div className="text-xs font-semibold text-slate-900 dark:text-slate-100 truncate group-hover:text-blue-600 dark:group-hover:text-blue-400">
                  {isGeneratingSample === 'emblem'
                    ? lang === 'bn'
                      ? 'তৈরি হচ্ছে...'
                      : 'Loading...'
                    : t.dropzone.sample3}
                </div>
                <div className="text-[11px] font-mono text-slate-500 dark:text-slate-400 mt-0.5 tabular-nums">
                  {t.dropzone.sample3Meta}
                </div>
              </div>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
