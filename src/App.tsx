import JSZip from 'jszip';
import { CheckCircle2, Globe, ImagePlus, Moon, Sun } from 'lucide-react';
import { useCallback, useEffect, useRef, useState } from 'react';
import { DropZone } from './components/DropZone';
import { FaqSection } from './components/FaqSection';
import { FormatGuide } from './components/FormatGuide';
import { Header } from './components/Header';
import { PrivacySection } from './components/PrivacySection';
import { QueueList } from './components/QueueList';
import { SettingsRail } from './components/SettingsRail';
import { SplitInspector } from './components/SplitInspector';
import {
  ImageItem,
  Language,
  OptimizationSettings,
  OutputFormat,
  RotationAngle,
} from './types/image';
import { getCopy } from './utils/i18n';
import {
  buildOutputFilename,
  detectAvifSupport,
  inferOriginalFormat,
  optimizeImageFile,
} from './utils/imageEngine';
import { generateSampleFile, SamplePreset } from './utils/sampleGenerator';

const DEFAULT_SETTINGS: OptimizationSettings = {
  profile: 'web',
  outputFormat: 'webp',
  preset: 'balanced',
  quality: 82,
  targetSizeKb: null,
  resolutionMode: 'preserve',
  maxWidth: 1920,
  customWidth: 1200,
  customHeight: 1200,
  maintainAspect: true,
  scalePercent: 100,
  rotation: 0,
  stripMetadata: true,
  backgroundFill: '#ffffff',
};

const STORAGE_KEYS = {
  lang: 'pixslim_lang',
  dark: 'pixslim_dark',
  settings: 'pixslim_settings',
};

function readInitialLang(): Language {
  try {
    const saved = localStorage.getItem(STORAGE_KEYS.lang);
    if (saved === 'bn' || saved === 'en') return saved;
  } catch {
    // ignore storage restriction
  }
  return 'bn';
}

function readInitialDark(): boolean {
  try {
    return localStorage.getItem(STORAGE_KEYS.dark) === 'true';
  } catch {
    return false;
  }
}

function readInitialSettings(): OptimizationSettings {
  try {
    const raw = localStorage.getItem(STORAGE_KEYS.settings);
    if (raw) {
      return { ...DEFAULT_SETTINGS, ...JSON.parse(raw) };
    }
  } catch {
    // ignore malformed storage
  }
  return DEFAULT_SETTINGS;
}

function triggerBlobDownload(blob: Blob, filename: string) {
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}

export default function App() {
  const [lang, setLang] = useState<Language>(readInitialLang);
  const [isDark, setIsDark] = useState<boolean>(readInitialDark);
  const [settings, setSettings] =
    useState<OptimizationSettings>(readInitialSettings);
  const [avifSupported, setAvifSupported] = useState(false);
  const [items, setItems] = useState<ImageItem[]>([]);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [isZipping, setIsZipping] = useState(false);
  const [isGeneratingSample, setIsGeneratingSample] =
    useState<SamplePreset | null>(null);
  const [windowDragging, setWindowDragging] = useState(false);
  const [toastMsg, setToastMsg] = useState<string | null>(null);

  const fileInputRef = useRef<HTMLInputElement>(null);
  const settingsRef = useRef(settings);
  settingsRef.current = settings;
  const avifRef = useRef(avifSupported);
  avifRef.current = avifSupported;
  const itemsRef = useRef(items);
  itemsRef.current = items;
  const runCounterRef = useRef(0);
  const dragDepthRef = useRef(0);
  const toastTimerRef = useRef<number | null>(null);

  const t = getCopy(lang);

  const notify = useCallback((message: string) => {
    setToastMsg(message);
    if (toastTimerRef.current) window.clearTimeout(toastTimerRef.current);
    toastTimerRef.current = window.setTimeout(() => setToastMsg(null), 2600);
  }, []);

  useEffect(() => {
    detectAvifSupport().then(setAvifSupported);
  }, []);

  useEffect(() => {
    document.documentElement.classList.toggle('dark', isDark);
    try {
      localStorage.setItem(STORAGE_KEYS.dark, String(isDark));
    } catch {
      // ignore
    }
  }, [isDark]);

  useEffect(() => {
    document.documentElement.lang = lang;
    try {
      localStorage.setItem(STORAGE_KEYS.lang, lang);
    } catch {
      // ignore
    }
  }, [lang]);

  // Dynamic canonical URL and OpenGraph og:url resolution
  useEffect(() => {
    const canonicalUrl = window.location.origin + window.location.pathname;
    let canonicalLink = document.querySelector<HTMLLinkElement>('link[rel="canonical"]');
    if (!canonicalLink) {
      canonicalLink = document.createElement('link');
      canonicalLink.rel = 'canonical';
      document.head.appendChild(canonicalLink);
    }
    canonicalLink.href = canonicalUrl;

    let ogUrlMeta = document.querySelector<HTMLMetaElement>('meta[property="og:url"]');
    if (!ogUrlMeta) {
      ogUrlMeta = document.createElement('meta');
      ogUrlMeta.setAttribute('property', 'og:url');
      document.head.appendChild(ogUrlMeta);
    }
    ogUrlMeta.content = canonicalUrl;
  }, []);

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEYS.settings, JSON.stringify(settings));
    } catch {
      // ignore
    }
  }, [settings]);

  // Cleanup object URLs on unmount
  useEffect(() => {
    return () => {
      itemsRef.current.forEach((it) => {
        URL.revokeObjectURL(it.originalUrl);
        if (it.optimizedUrl) URL.revokeObjectURL(it.optimizedUrl);
      });
    };
  }, []);

  const processSingleItem = useCallback(
    async (
      id: string,
      file: File,
      activeSettings: OptimizationSettings,
      runId: number,
      overrides?: {
        formatOverride?: OutputFormat | null;
        rotationOverride?: RotationAngle | null;
      }
    ) => {
      setItems((prev) =>
        prev.map((it) =>
          it.id === id ? { ...it, status: 'processing', error: undefined } : it
        )
      );

      try {
        await new Promise((r) => setTimeout(r, 0));

        const result = await optimizeImageFile(
          file,
          activeSettings,
          avifRef.current,
          overrides
        );

        const stillExists = itemsRef.current.some((it) => it.id === id);
        if (!stillExists || runId !== runCounterRef.current) return;

        const optimizedUrl = URL.createObjectURL(result.blob);

        setItems((prev) =>
          prev.map((it) => {
            if (it.id !== id) return it;
            if (it.optimizedUrl) URL.revokeObjectURL(it.optimizedUrl);
            return {
              ...it,
              originalWidth: result.originalWidth,
              originalHeight: result.originalHeight,
              optimizedBlob: result.blob,
              optimizedUrl,
              optimizedSize: result.blob.size,
              outputFormat: result.outputFormat,
              outputWidth: result.outputWidth,
              outputHeight: result.outputHeight,
              appliedQuality: result.appliedQuality,
              processingMs: result.processingMs,
              alreadyOptimal: result.alreadyOptimal,
              status: 'done',
            };
          })
        );
      } catch (err) {
        setItems((prev) =>
          prev.map((it) =>
            it.id === id
              ? {
                  ...it,
                  status: 'error',
                  error:
                    err instanceof Error
                      ? err.message
                      : 'Failed to process image',
                }
              : it
          )
        );
      }
    },
    []
  );

  const enqueueFiles = useCallback(
    async (files: File[]) => {
      if (files.length === 0) return;
      const runId = runCounterRef.current;

      const newItems: ImageItem[] = files.map((file) => ({
        id: `${Date.now()}-${Math.random().toString(36).slice(2, 9)}`,
        file,
        name: file.name,
        originalFormat: inferOriginalFormat(file),
        originalSize: file.size,
        originalWidth: 0,
        originalHeight: 0,
        originalUrl: URL.createObjectURL(file),
        optimizedBlob: null,
        optimizedUrl: null,
        optimizedSize: null,
        outputFormat: null,
        outputWidth: 0,
        outputHeight: 0,
        appliedQuality: settingsRef.current.quality,
        processingMs: null,
        status: 'pending',
        formatOverride: null,
        rotationOverride: null,
      }));

      setItems((prev) => [...newItems, ...prev]);
      setSelectedId(newItems[0].id);

      for (const item of newItems) {
        await processSingleItem(item.id, item.file, settingsRef.current, runId);
      }
    },
    [processSingleItem]
  );

  const reprocessAll = useCallback(
    async (nextSettings: OptimizationSettings) => {
      const current = itemsRef.current;
      if (current.length === 0) return;
      const runId = ++runCounterRef.current;

      for (const item of current) {
        if (runId !== runCounterRef.current) break;
        await processSingleItem(item.id, item.file, nextSettings, runId, {
          formatOverride: item.formatOverride,
          rotationOverride: item.rotationOverride,
        });
      }
    },
    [processSingleItem]
  );

  // Debounced auto-reprocess when global settings change
  useEffect(() => {
    if (itemsRef.current.length === 0) return;
    const timer = window.setTimeout(() => {
      reprocessAll(settings);
    }, 220);
    return () => window.clearTimeout(timer);
  }, [settings, reprocessAll]);

  // Global Ctrl+V / Cmd+V image paste support
  useEffect(() => {
    const handlePaste = (e: ClipboardEvent) => {
      const clipboardItems = e.clipboardData?.items;
      if (!clipboardItems) return;
      const pastedFiles: File[] = [];
      for (const entry of Array.from(clipboardItems)) {
        if (entry.type.startsWith('image/')) {
          const blob = entry.getAsFile();
          if (blob) {
            const ext = blob.type.split('/')[1] || 'png';
            pastedFiles.push(
              new File([blob], `pasted-image-${Date.now()}.${ext}`, {
                type: blob.type,
              })
            );
          }
        }
      }
      if (pastedFiles.length > 0) {
        enqueueFiles(pastedFiles);
      }
    };

    window.addEventListener('paste', handlePaste);
    return () => window.removeEventListener('paste', handlePaste);
  }, [enqueueFiles]);

  // Full-window drag & drop overlay
  useEffect(() => {
    const onDragEnter = (e: DragEvent) => {
      if (!e.dataTransfer?.types.includes('Files')) return;
      e.preventDefault();
      dragDepthRef.current += 1;
      setWindowDragging(true);
    };
    const onDragOver = (e: DragEvent) => {
      if (!e.dataTransfer?.types.includes('Files')) return;
      e.preventDefault();
    };
    const onDragLeave = (e: DragEvent) => {
      if (!e.dataTransfer?.types.includes('Files')) return;
      e.preventDefault();
      dragDepthRef.current = Math.max(0, dragDepthRef.current - 1);
      if (dragDepthRef.current === 0) {
        setWindowDragging(false);
      }
    };
    const onDrop = (e: DragEvent) => {
      e.preventDefault();
      dragDepthRef.current = 0;
      setWindowDragging(false);
      const dropped = e.dataTransfer?.files
        ? Array.from(e.dataTransfer.files).filter(
            (f) =>
              f.type.startsWith('image/') ||
              /\.(png|jpe?g|webp|avif|bmp|gif|svg|ico)$/i.test(f.name)
          )
        : [];
      if (dropped.length > 0) {
        enqueueFiles(dropped);
      }
    };

    window.addEventListener('dragenter', onDragEnter);
    window.addEventListener('dragover', onDragOver);
    window.addEventListener('dragleave', onDragLeave);
    window.addEventListener('drop', onDrop);
    return () => {
      window.removeEventListener('dragenter', onDragEnter);
      window.removeEventListener('dragover', onDragOver);
      window.removeEventListener('dragleave', onDragLeave);
      window.removeEventListener('drop', onDrop);
    };
  }, [enqueueFiles]);

  // Keyboard navigation between queued images
  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      const activeTag = (document.activeElement?.tagName || '').toLowerCase();
      const role = document.activeElement?.getAttribute('role');
      if (
        activeTag === 'input' ||
        activeTag === 'select' ||
        activeTag === 'textarea' ||
        role === 'slider'
      ) {
        return;
      }
      const done = itemsRef.current.filter((it) => it.status === 'done');
      if (done.length < 2) return;
      const idx = done.findIndex((it) => it.id === selectedId);
      if (e.key === 'ArrowRight') {
        const next = done[(idx + 1) % done.length];
        if (next) setSelectedId(next.id);
      } else if (e.key === 'ArrowLeft') {
        const prev = done[(idx - 1 + done.length) % done.length];
        if (prev) setSelectedId(prev.id);
      }
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [selectedId]);

  const handleBrowseClick = () => {
    fileInputRef.current?.click();
  };

  const handleLoadSample = async (preset: SamplePreset) => {
    setIsGeneratingSample(preset);
    try {
      const file = await generateSampleFile(preset);
      await enqueueFiles([file]);
    } finally {
      setIsGeneratingSample(null);
    }
  };

  const handleOverrideFormat = async (
    id: string,
    format: OutputFormat | null
  ) => {
    const target = itemsRef.current.find((it) => it.id === id);
    if (!target) return;
    setItems((prev) =>
      prev.map((it) =>
        it.id === id ? { ...it, formatOverride: format } : it
      )
    );
    await processSingleItem(
      id,
      target.file,
      settingsRef.current,
      runCounterRef.current,
      {
        formatOverride: format,
        rotationOverride: target.rotationOverride,
      }
    );
  };

  const handleRotateItem = async (id: string) => {
    const target = itemsRef.current.find((it) => it.id === id);
    if (!target) return;
    const currentRot = target.rotationOverride ?? settingsRef.current.rotation;
    const nextRot = ((currentRot + 90) % 360) as RotationAngle;
    setItems((prev) =>
      prev.map((it) =>
        it.id === id ? { ...it, rotationOverride: nextRot } : it
      )
    );
    await processSingleItem(
      id,
      target.file,
      settingsRef.current,
      runCounterRef.current,
      {
        formatOverride: target.formatOverride,
        rotationOverride: nextRot,
      }
    );
  };

  const handleRenameItem = (id: string, newBaseName: string) => {
    setItems((prev) =>
      prev.map((it) =>
        it.id === id ? { ...it, customOutputName: newBaseName } : it
      )
    );
  };

  const handleRemoveItem = (id: string) => {
    setItems((prev) => {
      const target = prev.find((it) => it.id === id);
      if (target) {
        URL.revokeObjectURL(target.originalUrl);
        if (target.optimizedUrl) URL.revokeObjectURL(target.optimizedUrl);
      }
      const next = prev.filter((it) => it.id !== id);
      if (selectedId === id) {
        setSelectedId(next[0]?.id ?? null);
      }
      return next;
    });
  };

  const handleClearAll = () => {
    runCounterRef.current += 1;
    items.forEach((it) => {
      URL.revokeObjectURL(it.originalUrl);
      if (it.optimizedUrl) URL.revokeObjectURL(it.optimizedUrl);
    });
    setItems([]);
    setSelectedId(null);
  };

  const handleResetSettings = () => {
    setSettings(DEFAULT_SETTINGS);
    notify(t.toasts.resetDone);
  };

  const handleDownloadItem = (item: ImageItem) => {
    if (!item.optimizedBlob || !item.outputFormat) return;
    const baseName = item.customOutputName
      ? `${item.customOutputName}.png`
      : item.name;
    const filename = buildOutputFilename(baseName, item.outputFormat);
    triggerBlobDownload(item.optimizedBlob, filename);
  };

  const handleDownloadZip = async () => {
    const done = items.filter(
      (it) => it.status === 'done' && it.optimizedBlob && it.outputFormat
    );
    if (done.length === 0) return;

    setIsZipping(true);
    try {
      const zip = new JSZip();
      const usedNames = new Map<string, number>();

      for (const item of done) {
        const baseName = item.customOutputName
          ? `${item.customOutputName}.png`
          : item.name;
        let fname = buildOutputFilename(baseName, item.outputFormat!);
        const count = usedNames.get(fname) ?? 0;
        usedNames.set(fname, count + 1);
        if (count > 0) {
          const dot = fname.lastIndexOf('.');
          fname =
            dot > 0
              ? `${fname.slice(0, dot)}-${count + 1}${fname.slice(dot)}`
              : `${fname}-${count + 1}`;
        }
        zip.file(fname, item.optimizedBlob!);
      }

      const zipBlob = await zip.generateAsync({ type: 'blob' });
      triggerBlobDownload(zipBlob, 'image-reducer-optimized-images.zip');
      notify(t.toasts.zipReady);
    } finally {
      setIsZipping(false);
    }
  };

  const doneItems = items.filter((it) => it.status === 'done');
  const selectedItem =
    items.find((it) => it.id === selectedId) ?? doneItems[0] ?? null;
  const selectedDoneIndex = selectedItem
    ? Math.max(
        0,
        doneItems.findIndex((it) => it.id === selectedItem.id)
      )
    : 0;

  const isProcessing = items.some(
    (it) => it.status === 'processing' || it.status === 'pending'
  );

  return (
    <div className="min-h-screen flex flex-col bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100">
      <Header lang={lang} onAddImages={handleBrowseClick} />

      <input
        ref={fileInputRef}
        type="file"
        multiple
        accept="image/*"
        className="hidden"
        onChange={(e) => {
          const files = e.target.files ? Array.from(e.target.files) : [];
          if (files.length > 0) enqueueFiles(files);
          e.target.value = '';
        }}
      />

      {/* Full-Window Drag & Drop Overlay */}
      {windowDragging && (
        <div className="fixed inset-0 z-50 bg-slate-950/65 backdrop-blur-xs flex items-center justify-center p-6 pointer-events-none">
          <div className="max-w-md w-full bg-white dark:bg-slate-900 border-2 border-dashed border-blue-600 rounded-2xl p-8 text-center shadow-xl">
            <div className="w-14 h-14 mx-auto rounded-2xl bg-blue-50 dark:bg-blue-950 flex items-center justify-center text-blue-600 dark:text-blue-400 mb-3">
              <ImagePlus className="w-7 h-7" />
            </div>
            <h2 className="text-lg font-semibold text-slate-900 dark:text-slate-100">
              {t.dropOverlayTitle}
            </h2>
            <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
              {t.dropOverlaySub}
            </p>
          </div>
        </div>
      )}

      {/* Subtle Toast Confirmation */}
      {toastMsg && (
        <div
          role="status"
          aria-live="polite"
          className="fixed bottom-5 right-5 z-40 inline-flex items-center gap-2 px-4 py-2.5 rounded-lg bg-slate-900 dark:bg-slate-100 text-white dark:text-slate-900 text-xs sm:text-sm font-medium shadow-lg border border-slate-700/40 dark:border-slate-300"
        >
          <CheckCircle2 className="w-4 h-4 text-emerald-400 dark:text-emerald-600 shrink-0" />
          <span>{toastMsg}</span>
        </div>
      )}

      <main
        id="workbench"
        className="flex-1 w-full max-w-[1360px] mx-auto px-4 sm:px-6 py-7 sm:py-9 flex flex-col gap-8"
      >
        {/* Hero + Workspace Mode Toolbar */}
        <section className="flex flex-col gap-5 pb-6 border-b border-slate-200 dark:border-slate-800">
          <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-5">
            <div className="max-w-3xl">
              <h1
                className="text-2xl sm:text-4xl font-bold tracking-tight text-slate-900 dark:text-slate-50 leading-tight"
                style={{ textWrap: 'balance' }}
              >
                {t.heroTitle}
              </h1>
              <p className="mt-2.5 text-sm sm:text-base text-slate-600 dark:text-slate-400 leading-relaxed max-w-2xl">
                {t.heroSub}
              </p>
            </div>

            {/* Workspace Toolbar: Language & Theme Switchers */}
            <div className="flex items-center gap-2 shrink-0">
              <button
                type="button"
                onClick={() => setLang((l) => (l === 'bn' ? 'en' : 'bn'))}
                className="inline-flex items-center gap-2 px-3.5 py-2 min-h-[40px] text-xs sm:text-sm font-medium rounded-lg border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer whitespace-nowrap"
              >
                <Globe className="w-4 h-4 text-blue-600 dark:text-blue-400 shrink-0" />
                <span>{t.langToggle}</span>
              </button>

              <button
                type="button"
                onClick={() => setIsDark((d) => !d)}
                aria-label={isDark ? t.themeLight : t.themeDark}
                className="inline-flex items-center gap-2 px-3.5 py-2 min-h-[40px] text-xs sm:text-sm font-medium rounded-lg border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer whitespace-nowrap"
              >
                {isDark ? (
                  <Sun className="w-4 h-4 text-amber-400 shrink-0" />
                ) : (
                  <Moon className="w-4 h-4 text-slate-600 shrink-0" />
                )}
                <span>{isDark ? t.themeLight : t.themeDark}</span>
              </button>
            </div>
          </div>

          {/* Unboxed Capability Strip */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 sm:gap-0 sm:divide-x divide-slate-200 dark:divide-slate-800 pt-1">
            {t.heroHighlights.map((item, idx) => (
              <div
                key={item.label}
                className={idx === 0 ? 'sm:pr-6' : 'sm:px-6'}
              >
                <div className="text-xs text-slate-500 dark:text-slate-400">
                  {item.label}
                </div>
                <div className="text-sm font-semibold text-slate-900 dark:text-slate-100 mt-0.5">
                  {item.value}
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* Primary Workbench Grid */}
        <section className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
          <div className="lg:col-span-4 xl:col-span-3 lg:sticky lg:top-20">
            <SettingsRail
              lang={lang}
              settings={settings}
              avifSupported={avifSupported}
              hasItems={items.length > 0}
              isProcessing={isProcessing}
              onChange={setSettings}
              onReset={handleResetSettings}
              onReprocessAll={() => reprocessAll(settings)}
            />
          </div>

          <div className="lg:col-span-8 xl:col-span-9 flex flex-col gap-5 min-w-0">
            <DropZone
              lang={lang}
              compact={items.length > 0}
              onFilesSelected={enqueueFiles}
              onLoadSample={handleLoadSample}
              onBrowseClick={handleBrowseClick}
              isGeneratingSample={isGeneratingSample}
            />

            {items.length > 0 && (
              <>
                <SplitInspector
                  lang={lang}
                  item={selectedItem}
                  itemIndex={selectedDoneIndex}
                  totalItems={doneItems.length}
                  avifSupported={avifSupported}
                  onPrev={() => {
                    if (doneItems.length < 2) return;
                    const prev =
                      doneItems[
                        (selectedDoneIndex - 1 + doneItems.length) %
                          doneItems.length
                      ];
                    if (prev) setSelectedId(prev.id);
                  }}
                  onNext={() => {
                    if (doneItems.length < 2) return;
                    const next =
                      doneItems[(selectedDoneIndex + 1) % doneItems.length];
                    if (next) setSelectedId(next.id);
                  }}
                  onDownload={handleDownloadItem}
                  onRotateItem={handleRotateItem}
                  onOverrideFormat={handleOverrideFormat}
                  onRenameItem={handleRenameItem}
                  onNotify={notify}
                />

                <QueueList
                  lang={lang}
                  items={items}
                  selectedId={selectedItem?.id ?? null}
                  isZipping={isZipping}
                  avifSupported={avifSupported}
                  onSelect={setSelectedId}
                  onOverrideFormat={handleOverrideFormat}
                  onDownloadItem={handleDownloadItem}
                  onRemoveItem={handleRemoveItem}
                  onDownloadZip={handleDownloadZip}
                  onClearAll={handleClearAll}
                />
              </>
            )}
          </div>
        </section>

        {/* Format Selection Guide */}
        <FormatGuide lang={lang} />

        {/* Privacy Guarantee */}
        <PrivacySection lang={lang} />

        {/* SEO & User FAQ */}
        <FaqSection lang={lang} />
      </main>

      <footer className="border-t border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950 py-6">
        <div className="max-w-[1360px] mx-auto px-4 sm:px-6 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-slate-500 dark:text-slate-400">
          <span>{t.footer}</span>
          <span>
            © {new Date().getFullYear()}{' '}
            <a
              href="https://hptelecom.top"
              target="_blank"
              rel="noopener noreferrer"
              className="font-semibold text-slate-700 dark:text-slate-200 hover:text-blue-600 dark:hover:text-blue-400 underline underline-offset-4 transition-colors"
            >
              HP Telecom
            </a>
          </span>
        </div>
      </footer>
    </div>
  );
}
