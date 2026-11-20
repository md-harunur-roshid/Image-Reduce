import {
  ChevronUp,
  Globe,
  Maximize2,
  Minimize2,
  MonitorDown,
  PanelTopOpen,
  RefreshCw,
} from 'lucide-react';
import { useEffect, useRef, useState } from 'react';
import { DesktopExportModal } from './components/DesktopExportModal';
import { OfflineIndicator } from './components/OfflineIndicator';
import { PWAInstallButton } from './components/PWAInstallButton';
import { useOnlineStatus } from './hooks/useOnlineStatus';

const TARGET_URL = 'https://chat-ten-ashen-53.vercel.app';

export default function App() {
  const [lang, setLang] = useState<'bn' | 'en'>('bn');
  const [reloadNonce, setReloadNonce] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [barHidden, setBarHidden] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [exportOpen, setExportOpen] = useState(false);
  const iframeRef = useRef<HTMLIFrameElement>(null);
  const isOnline = useOnlineStatus();

  useEffect(() => {
    document.documentElement.lang = lang;
  }, [lang]);

  useEffect(() => {
    const onFsChange = () => {
      setIsFullscreen(Boolean(document.fullscreenElement));
    };
    document.addEventListener('fullscreenchange', onFsChange);
    return () => document.removeEventListener('fullscreenchange', onFsChange);
  }, []);

  const handleReload = () => {
    setIsLoading(true);
    setReloadNonce((n) => n + 1);
  };

  const handleToggleFullscreen = async () => {
    try {
      if (!document.fullscreenElement) {
        await document.documentElement.requestFullscreen();
      } else {
        await document.exitFullscreen();
      }
    } catch {
      // Fullscreen restricted in embedded sandbox
    }
  };

  return (
    <div className="h-screen w-screen overflow-hidden flex flex-col bg-slate-950 text-slate-100">
      {/* Slim Native-Style Software Titlebar */}
      {!barHidden ? (
        <header className="h-12 px-3 sm:px-4 bg-slate-900 border-b border-slate-800 flex items-center justify-between gap-4 shrink-0">
          {/* Left: App Brand & Live Connection State */}
          <div className="flex items-center gap-3 min-w-0">
            <img
              src="/icon.svg"
              alt="ChatDesk icon"
              referrerPolicy="no-referrer"
              className="w-7 h-7 rounded-lg shrink-0"
            />
            <span className="text-sm font-semibold tracking-tight text-white whitespace-nowrap shrink-0">
              ChatDesk
            </span>
            <span
              className={`hidden sm:inline-flex items-center gap-1.5 text-xs font-medium whitespace-nowrap ${
                isOnline ? 'text-emerald-400' : 'text-amber-400'
              }`}
            >
              <span
                className={`w-1.5 h-1.5 rounded-full ${
                  isOnline ? 'bg-emerald-400' : 'bg-amber-400'
                }`}
              />
              {isOnline
                ? lang === 'bn'
                  ? 'সংযুক্ত'
                  : 'Online'
                : lang === 'bn'
                ? 'অফলাইন'
                : 'Offline'}
            </span>
          </div>

          {/* Right: Software Controls & Install Actions */}
          <div className="flex items-center gap-1.5 sm:gap-2 shrink-0">
            <button
              type="button"
              onClick={handleReload}
              title={lang === 'bn' ? 'রিলোড করুন' : 'Reload App'}
              aria-label={lang === 'bn' ? 'রিলোড করুন' : 'Reload App'}
              className="p-2 min-w-[34px] min-h-[34px] rounded-lg text-slate-300 hover:text-white hover:bg-slate-800 transition-colors cursor-pointer flex items-center justify-center"
            >
              <RefreshCw
                className={`w-4 h-4 ${isLoading ? 'animate-spin text-blue-400' : ''}`}
              />
            </button>

            <button
              type="button"
              onClick={handleToggleFullscreen}
              title={lang === 'bn' ? 'ফুলস্ক্রিন' : 'Toggle Fullscreen'}
              aria-label={lang === 'bn' ? 'ফুলস্ক্রিন' : 'Toggle Fullscreen'}
              className="hidden sm:flex p-2 min-w-[34px] min-h-[34px] rounded-lg text-slate-300 hover:text-white hover:bg-slate-800 transition-colors cursor-pointer items-center justify-center"
            >
              {isFullscreen ? (
                <Minimize2 className="w-4 h-4" />
              ) : (
                <Maximize2 className="w-4 h-4" />
              )}
            </button>

            <button
              type="button"
              onClick={() => setLang((l) => (l === 'bn' ? 'en' : 'bn'))}
              title={lang === 'bn' ? 'Switch to English' : 'বাংলায় দেখুন'}
              className="inline-flex items-center gap-1 px-2.5 py-1.5 min-h-[34px] rounded-lg text-xs font-medium text-slate-300 hover:text-white hover:bg-slate-800 transition-colors cursor-pointer whitespace-nowrap"
            >
              <Globe className="w-3.5 h-3.5 shrink-0" />
              <span>{lang === 'bn' ? 'EN' : 'বাং'}</span>
            </button>

            <button
              type="button"
              onClick={() => setExportOpen(true)}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 min-h-[34px] rounded-lg border border-slate-700 bg-slate-800 hover:bg-slate-700 text-slate-100 text-xs font-medium transition-colors cursor-pointer whitespace-nowrap shrink-0"
            >
              <MonitorDown className="w-3.5 h-3.5 text-blue-400 shrink-0" />
              <span className="hidden md:inline">
                {lang === 'bn' ? 'APK / ডেস্কটপ' : 'APK / Desktop'}
              </span>
            </button>

            <PWAInstallButton
              lang={lang}
              onOpenDesktopExport={() => setExportOpen(true)}
            />

            <button
              type="button"
              onClick={() => setBarHidden(true)}
              title={
                lang === 'bn'
                  ? 'ফ্রেমহীন অ্যাপ মোড (বার লুকান)'
                  : 'Hide titlebar for frameless view'
              }
              aria-label="Hide top bar"
              className="p-2 min-w-[34px] min-h-[34px] rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors cursor-pointer flex items-center justify-center"
            >
              <ChevronUp className="w-4 h-4" />
            </button>
          </div>
        </header>
      ) : (
        <button
          type="button"
          onClick={() => setBarHidden(false)}
          title={lang === 'bn' ? 'অ্যাপ টুলবার দেখান' : 'Show app bar'}
          aria-label="Show app bar"
          className="fixed top-2 right-2 z-40 p-2 rounded-lg bg-slate-900/85 hover:bg-slate-900 text-slate-200 border border-slate-700 shadow-lg backdrop-blur-xs transition-colors cursor-pointer"
        >
          <PanelTopOpen className="w-4 h-4" />
        </button>
      )}

      {/* Main Embedded Web App Viewport */}
      <main className="relative flex-1 w-full h-full bg-white dark:bg-slate-950">
        {isLoading && (
          <div className="absolute inset-0 z-10 flex flex-col items-center justify-center bg-slate-950 text-slate-200 gap-3 pointer-events-none">
            <img
              src="/icon.svg"
              alt="Loading ChatDesk"
              referrerPolicy="no-referrer"
              className="w-12 h-12 rounded-xl animate-pulse"
            />
            <p className="text-sm font-medium text-slate-300">
              {lang === 'bn'
                ? 'অ্যাপ লোড হচ্ছে...'
                : 'Loading ChatDesk application...'}
            </p>
          </div>
        )}

        <iframe
          ref={iframeRef}
          key={reloadNonce}
          src={TARGET_URL}
          title="ChatDesk Application"
          onLoad={() => setIsLoading(false)}
          allow="clipboard-read; clipboard-write; microphone; camera; display-capture; fullscreen"
          className="w-full h-full border-0 block"
        />
      </main>

      <OfflineIndicator lang={lang} />

      <DesktopExportModal
        lang={lang}
        targetUrl={TARGET_URL}
        open={exportOpen}
        onClose={() => setExportOpen(false)}
      />
    </div>
  );
}
