import {
  ChevronDown,
  Lock,
  RefreshCw,
  RotateCcw,
  RotateCw,
  SlidersHorizontal,
} from 'lucide-react';
import { useState } from 'react';
import {
  Language,
  OptimizationSettings,
  OutputFormat,
  PresetId,
  ResolutionMode,
  RotationAngle,
  UseCaseProfileId,
} from '../types/image';
import { FORMAT_LABELS, getCopy } from '../utils/i18n';

interface SettingsRailProps {
  lang: Language;
  settings: OptimizationSettings;
  avifSupported: boolean;
  hasItems: boolean;
  isProcessing: boolean;
  onChange: (next: OptimizationSettings) => void;
  onReset: () => void;
  onReprocessAll: () => void;
}

const FORMAT_OPTIONS: OutputFormat[] = [
  'webp',
  'jpeg',
  'png',
  'auto',
  'avif',
  'ico',
  'bmp',
];

const PRESET_VALUES: Record<PresetId, number> = {
  balanced: 82,
  compact: 65,
  high: 92,
  lossless: 100,
};

const TARGET_KB_PRESETS = [50, 100, 250, 500, 1024];

const PROFILE_ORDER: UseCaseProfileId[] = [
  'web',
  'form100',
  'ecommerce',
  'social',
  'archive',
];

export function SettingsRail({
  lang,
  settings,
  avifSupported,
  hasItems,
  isProcessing,
  onChange,
  onReset,
  onReprocessAll,
}: SettingsRailProps) {
  const t = getCopy(lang);
  const [showAdvanced, setShowAdvanced] = useState(
    settings.resolutionMode !== 'preserve' || settings.rotation !== 0
  );

  const applyProfile = (profile: UseCaseProfileId) => {
    if (profile === 'web') {
      onChange({
        ...settings,
        profile,
        outputFormat: 'webp',
        preset: 'balanced',
        quality: 82,
        targetSizeKb: null,
        resolutionMode: 'preserve',
        rotation: 0,
      });
    } else if (profile === 'form100') {
      onChange({
        ...settings,
        profile,
        outputFormat: 'jpeg',
        preset: 'balanced',
        quality: 85,
        targetSizeKb: 100,
        resolutionMode: 'preserve',
        rotation: 0,
      });
    } else if (profile === 'ecommerce') {
      onChange({
        ...settings,
        profile,
        outputFormat: 'webp',
        preset: 'high',
        quality: 88,
        targetSizeKb: 250,
        resolutionMode: 'preserve',
        rotation: 0,
      });
    } else if (profile === 'social') {
      onChange({
        ...settings,
        profile,
        outputFormat: 'jpeg',
        preset: 'high',
        quality: 88,
        targetSizeKb: null,
        resolutionMode: 'preserve',
        rotation: 0,
      });
    } else if (profile === 'archive') {
      onChange({
        ...settings,
        profile,
        outputFormat: 'auto',
        preset: 'lossless',
        quality: 100,
        targetSizeKb: null,
        resolutionMode: 'preserve',
        rotation: 0,
      });
    }
  };

  const handlePresetSelect = (preset: PresetId) => {
    onChange({
      ...settings,
      profile: 'custom',
      preset,
      quality: PRESET_VALUES[preset],
    });
  };

  const handleQualityChange = (val: number) => {
    const matchedPreset: PresetId =
      val === 100
        ? 'lossless'
        : val >= 90
        ? 'high'
        : val <= 70
        ? 'compact'
        : 'balanced';
    onChange({
      ...settings,
      profile: 'custom',
      quality: val,
      preset: matchedPreset,
    });
  };

  const showBgFill =
    settings.outputFormat === 'jpeg' || settings.outputFormat === 'bmp';

  return (
    <aside className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-5 flex flex-col gap-5">
      {/* Header + Reset */}
      <div className="flex items-center justify-between gap-2 pb-3 border-b border-slate-100 dark:border-slate-800">
        <div className="flex items-center gap-2 text-slate-900 dark:text-slate-100">
          <SlidersHorizontal className="w-4 h-4 text-blue-600 dark:text-blue-400 shrink-0" />
          <h2 className="text-base font-semibold tracking-tight">
            {t.controls.heading}
          </h2>
        </div>

        <button
          type="button"
          onClick={onReset}
          className="inline-flex items-center gap-1 px-2 py-1 text-xs font-medium text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-100 rounded-md hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer whitespace-nowrap"
        >
          <RotateCcw className="w-3 h-3 shrink-0" />
          <span>{t.controls.resetBtn}</span>
        </button>
      </div>

      {/* Use-Case Quick Goals (2-col compact grid) */}
      <div className="flex flex-col gap-2">
        <span className="text-xs font-semibold text-slate-600 dark:text-slate-400">
          {t.controls.profileLabel}
        </span>
        <div className="grid grid-cols-2 gap-1.5">
          {PROFILE_ORDER.map((pid, idx) => {
            const active = settings.profile === pid;
            const info = t.controls.profiles[pid];
            return (
              <button
                key={pid}
                type="button"
                onClick={() => applyProfile(pid)}
                className={`px-2.5 py-2 text-left rounded-lg border transition-colors cursor-pointer ${
                  idx === PROFILE_ORDER.length - 1 ? 'col-span-2' : ''
                } ${
                  active
                    ? 'bg-blue-50 dark:bg-blue-950/50 border-blue-600 text-blue-800 dark:text-blue-200'
                    : 'bg-slate-50/70 dark:bg-slate-800/40 border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800'
                }`}
              >
                <div className="text-xs font-semibold truncate">
                  {info.label}
                </div>
                <div className="text-[11px] text-slate-500 dark:text-slate-400 truncate mt-0.5">
                  {info.desc}
                </div>
              </button>
            );
          })}
        </div>
      </div>

      {/* Output Format + Friendly Hint */}
      <div className="flex flex-col gap-2 pt-3 border-t border-slate-100 dark:border-slate-800">
        <label className="text-xs font-semibold text-slate-600 dark:text-slate-400">
          {t.controls.outputFormat}
        </label>
        <div className="grid grid-cols-3 sm:grid-cols-4 lg:grid-cols-3 gap-1.5">
          {FORMAT_OPTIONS.map((fmt) => {
            const isDisabled = fmt === 'avif' && !avifSupported;
            const isActive = settings.outputFormat === fmt;
            const label =
              fmt === 'auto' ? t.controls.formatAuto : FORMAT_LABELS[fmt];

            return (
              <button
                key={fmt}
                type="button"
                disabled={isDisabled}
                title={isDisabled ? t.controls.avifUnsupported : undefined}
                onClick={() =>
                  onChange({ ...settings, profile: 'custom', outputFormat: fmt })
                }
                className={`px-2 py-2 min-h-[36px] text-xs font-semibold rounded-lg border transition-colors whitespace-nowrap truncate cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed ${
                  isActive
                    ? 'bg-blue-600 text-white border-blue-600'
                    : 'bg-slate-50 dark:bg-slate-800/70 text-slate-700 dark:text-slate-200 border-slate-200 dark:border-slate-700 hover:border-slate-300 dark:hover:border-slate-600'
                }`}
              >
                {label}
              </button>
            );
          })}
        </div>

        <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed">
          {t.controls.formatHints[settings.outputFormat]}
        </p>

        {settings.outputFormat === 'ico' && (
          <p className="text-xs text-amber-700 dark:text-amber-400 leading-relaxed">
            {t.controls.icoNote}
          </p>
        )}

        {settings.outputFormat === 'jpeg' && (
          <p className="text-[11px] text-slate-500 dark:text-slate-400 leading-relaxed">
            {t.controls.jpegTransparencyTip}
          </p>
        )}
      </div>

      {/* Quality Presets & Slider */}
      <div className="flex flex-col gap-2.5 pt-3 border-t border-slate-100 dark:border-slate-800">
        <div className="flex items-center justify-between text-xs">
          <label
            htmlFor="quality-slider"
            className="font-semibold text-slate-600 dark:text-slate-400"
          >
            {t.controls.qualityLabel}
          </label>
          <span className="font-mono text-sm font-semibold text-blue-600 dark:text-blue-400 tabular-nums">
            {settings.quality}%
          </span>
        </div>

        <input
          id="quality-slider"
          type="range"
          min={10}
          max={100}
          step={1}
          value={settings.quality}
          onChange={(e) => handleQualityChange(Number(e.target.value))}
          className="studio-range w-full bg-slate-200 dark:bg-slate-700"
        />

        <div className="grid grid-cols-2 gap-1.5">
          {(['balanced', 'compact', 'high', 'lossless'] as PresetId[]).map(
            (presetId) => {
              const active = settings.preset === presetId;
              return (
                <button
                  key={presetId}
                  type="button"
                  onClick={() => handlePresetSelect(presetId)}
                  className={`px-2.5 py-1.5 text-left rounded-lg border transition-colors cursor-pointer ${
                    active
                      ? 'bg-blue-50 dark:bg-blue-950/50 border-blue-600 text-blue-700 dark:text-blue-300'
                      : 'bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800/60'
                  }`}
                >
                  <div className="text-[11px] font-semibold whitespace-nowrap truncate">
                    {t.controls.presets[presetId].label}
                  </div>
                </button>
              );
            }
          )}
        </div>
      </div>

      {/* Target Max File Size */}
      <div className="flex flex-col gap-2 pt-3 border-t border-slate-100 dark:border-slate-800">
        <label className="text-xs font-semibold text-slate-600 dark:text-slate-400">
          {t.controls.targetSizeLabel}
        </label>
        <div className="flex flex-wrap gap-1.5">
          <button
            type="button"
            onClick={() =>
              onChange({ ...settings, profile: 'custom', targetSizeKb: null })
            }
            className={`px-2.5 py-1.5 text-xs font-medium rounded-md border transition-colors cursor-pointer whitespace-nowrap ${
              settings.targetSizeKb === null
                ? 'bg-slate-900 dark:bg-slate-100 text-white dark:text-slate-900 border-slate-900 dark:border-slate-100'
                : 'bg-white dark:bg-slate-900 text-slate-600 dark:text-slate-300 border-slate-200 dark:border-slate-700 hover:border-slate-300'
            }`}
          >
            {t.controls.targetAuto}
          </button>
          {TARGET_KB_PRESETS.map((kb) => {
            const active = settings.targetSizeKb === kb;
            return (
              <button
                key={kb}
                type="button"
                onClick={() =>
                  onChange({ ...settings, profile: 'custom', targetSizeKb: kb })
                }
                className={`px-2 py-1.5 text-xs font-mono font-medium rounded-md border transition-colors cursor-pointer tabular-nums whitespace-nowrap ${
                  active
                    ? 'bg-blue-600 text-white border-blue-600'
                    : 'bg-white dark:bg-slate-900 text-slate-600 dark:text-slate-300 border-slate-200 dark:border-slate-700 hover:border-slate-300'
                }`}
              >
                {kb >= 1024 ? '1 MB' : `${kb} KB`}
              </button>
            );
          })}
        </div>
        <div className="flex items-center gap-2">
          <input
            type="number"
            min={10}
            max={25000}
            placeholder={t.controls.targetCustomPlaceholder}
            value={settings.targetSizeKb ?? ''}
            onChange={(e) => {
              const raw = e.target.value;
              onChange({
                ...settings,
                profile: 'custom',
                targetSizeKb: raw ? Math.max(10, Number(raw)) : null,
              });
            }}
            className="w-full px-3 py-1.5 text-xs font-mono tabular-nums bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-blue-600"
          />
          <span className="text-xs font-mono text-slate-500 shrink-0">KB</span>
        </div>
        <p className="text-[11px] text-slate-500 dark:text-slate-400 leading-relaxed">
          {t.controls.targetHint}
        </p>
      </div>

      {/* Resolution Lock Banner + Collapsible Advanced Options */}
      <div className="flex flex-col gap-2.5 pt-3 border-t border-slate-100 dark:border-slate-800">
        {settings.resolutionMode === 'preserve' && settings.rotation === 0 && (
          <div className="flex items-center gap-2 px-3 py-2 rounded-lg bg-emerald-50/80 dark:bg-emerald-950/30 border border-emerald-200/80 dark:border-emerald-900/60 text-xs font-medium text-emerald-800 dark:text-emerald-300">
            <Lock className="w-3.5 h-3.5 shrink-0" />
            <span>{t.controls.resolutionBanner}</span>
          </div>
        )}

        <button
          type="button"
          onClick={() => setShowAdvanced((v) => !v)}
          aria-expanded={showAdvanced}
          className="w-full flex items-center justify-between gap-2 px-3 py-2 text-xs font-semibold rounded-lg border border-slate-200 dark:border-slate-800 bg-slate-50/70 dark:bg-slate-800/50 text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
        >
          <span className="truncate">{t.controls.advancedToggle}</span>
          <ChevronDown
            className={`w-4 h-4 shrink-0 transition-transform duration-150 ${
              showAdvanced ? 'rotate-180' : ''
            }`}
          />
        </button>

        {showAdvanced && (
          <div className="flex flex-col gap-3 pt-1">
            <div className="flex flex-col gap-1.5">
              {(
                [
                  { id: 'preserve', label: t.controls.resPreserve },
                  { id: 'max-width', label: t.controls.resMaxWidth },
                  { id: 'exact', label: t.controls.resExact },
                  { id: 'scale', label: t.controls.resScale },
                ] as { id: ResolutionMode; label: string }[]
              ).map((opt) => {
                const active = settings.resolutionMode === opt.id;
                return (
                  <button
                    key={opt.id}
                    type="button"
                    onClick={() =>
                      onChange({
                        ...settings,
                        profile: 'custom',
                        resolutionMode: opt.id,
                      })
                    }
                    className={`w-full px-3 py-2 text-left text-xs font-medium rounded-lg border transition-colors cursor-pointer flex items-center justify-between gap-2 ${
                      active
                        ? 'bg-emerald-50/70 dark:bg-emerald-950/40 border-emerald-600/70 text-emerald-800 dark:text-emerald-300'
                        : 'bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800/60'
                    }`}
                  >
                    <span className="truncate">{opt.label}</span>
                  </button>
                );
              })}
            </div>

            {settings.resolutionMode === 'max-width' && (
              <div className="flex items-center justify-between gap-3">
                <label className="text-xs text-slate-600 dark:text-slate-400">
                  {t.controls.maxWidthInput}
                </label>
                <input
                  type="number"
                  min={64}
                  max={12000}
                  value={settings.maxWidth}
                  onChange={(e) =>
                    onChange({
                      ...settings,
                      maxWidth: Math.max(64, Number(e.target.value) || 1920),
                    })
                  }
                  className="w-28 px-2.5 py-1.5 text-xs font-mono tabular-nums bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-md text-slate-900 dark:text-slate-100"
                />
              </div>
            )}

            {settings.resolutionMode === 'exact' && (
              <div className="flex flex-col gap-2 bg-slate-50 dark:bg-slate-800/40 p-2.5 rounded-lg border border-slate-200/70 dark:border-slate-800">
                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="block text-[11px] text-slate-500 dark:text-slate-400 mb-1">
                      {t.controls.widthInput}
                    </label>
                    <input
                      type="number"
                      min={16}
                      max={12000}
                      value={settings.customWidth}
                      onChange={(e) =>
                        onChange({
                          ...settings,
                          customWidth: Math.max(
                            16,
                            Number(e.target.value) || 1200
                          ),
                        })
                      }
                      className="w-full px-2 py-1.5 text-xs font-mono tabular-nums bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-md"
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] text-slate-500 dark:text-slate-400 mb-1">
                      {t.controls.heightInput}
                    </label>
                    <input
                      type="number"
                      min={16}
                      max={12000}
                      value={settings.customHeight}
                      onChange={(e) =>
                        onChange({
                          ...settings,
                          customHeight: Math.max(
                            16,
                            Number(e.target.value) || 1200
                          ),
                        })
                      }
                      className="w-full px-2 py-1.5 text-xs font-mono tabular-nums bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-md"
                    />
                  </div>
                </div>
                <label className="inline-flex items-center gap-2 text-xs text-slate-600 dark:text-slate-300 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={settings.maintainAspect}
                    onChange={(e) =>
                      onChange({
                        ...settings,
                        maintainAspect: e.target.checked,
                      })
                    }
                    className="rounded border-slate-300 text-blue-600 focus:ring-blue-600"
                  />
                  <span>{t.controls.keepAspect}</span>
                </label>
              </div>
            )}

            {settings.resolutionMode === 'scale' && (
              <div className="flex items-center justify-between gap-3">
                <label className="text-xs text-slate-600 dark:text-slate-400">
                  {t.controls.scaleInput}
                </label>
                <input
                  type="number"
                  min={10}
                  max={100}
                  value={settings.scalePercent}
                  onChange={(e) =>
                    onChange({
                      ...settings,
                      scalePercent: Math.min(
                        100,
                        Math.max(10, Number(e.target.value) || 100)
                      ),
                    })
                  }
                  className="w-24 px-2.5 py-1.5 text-xs font-mono tabular-nums bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-md text-slate-900 dark:text-slate-100"
                />
              </div>
            )}

            {/* Rotation Selector */}
            <div className="flex items-center justify-between gap-2">
              <span className="inline-flex items-center gap-1.5 text-xs text-slate-600 dark:text-slate-400">
                <RotateCw className="w-3.5 h-3.5 shrink-0" />
                <span>{t.controls.rotationLabel}</span>
              </span>
              <div className="inline-flex items-center p-0.5 bg-slate-100 dark:bg-slate-800 rounded-lg border border-slate-200 dark:border-slate-700">
                {([0, 90, 180, 270] as RotationAngle[]).map((deg) => (
                  <button
                    key={deg}
                    type="button"
                    onClick={() => onChange({ ...settings, rotation: deg })}
                    className={`px-2 py-1 text-[11px] font-mono font-medium rounded-md transition-colors cursor-pointer ${
                      settings.rotation === deg
                        ? 'bg-white dark:bg-slate-700 text-slate-900 dark:text-white shadow-xs'
                        : 'text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                    }`}
                  >
                    {deg}°
                  </button>
                ))}
              </div>
            </div>

            {/* Transparency Fill for JPEG / BMP */}
            {showBgFill && (
              <div className="flex items-center justify-between gap-3 pt-1">
                <label
                  htmlFor="bg-fill-picker"
                  className="text-xs font-medium text-slate-700 dark:text-slate-300"
                >
                  {t.controls.bgFillLabel}
                </label>
                <div className="flex items-center gap-1.5">
                  {['#ffffff', '#000000', '#f1f5f9'].map((hex) => (
                    <button
                      key={hex}
                      type="button"
                      aria-label={`Fill ${hex}`}
                      onClick={() =>
                        onChange({ ...settings, backgroundFill: hex })
                      }
                      style={{ backgroundColor: hex }}
                      className={`w-6 h-6 rounded border cursor-pointer ${
                        settings.backgroundFill.toLowerCase() === hex
                          ? 'ring-2 ring-blue-600 border-white'
                          : 'border-slate-300 dark:border-slate-600'
                      }`}
                    />
                  ))}
                  <input
                    id="bg-fill-picker"
                    type="color"
                    value={settings.backgroundFill}
                    onChange={(e) =>
                      onChange({ ...settings, backgroundFill: e.target.value })
                    }
                    className="w-6 h-6 rounded border border-slate-200 dark:border-slate-700 bg-transparent cursor-pointer"
                  />
                </div>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Re-process Action */}
      {hasItems && (
        <button
          type="button"
          disabled={isProcessing}
          onClick={onReprocessAll}
          className="w-full inline-flex items-center justify-center gap-2 px-4 py-2.5 min-h-[42px] text-sm font-semibold text-white bg-slate-900 dark:bg-blue-600 hover:bg-slate-800 dark:hover:bg-blue-700 disabled:opacity-50 rounded-lg transition-colors cursor-pointer whitespace-nowrap"
        >
          <RefreshCw
            className={`w-4 h-4 shrink-0 ${isProcessing ? 'animate-spin' : ''}`}
          />
          <span>{t.controls.applyAll}</span>
        </button>
      )}
    </aside>
  );
}
