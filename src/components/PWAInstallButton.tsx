import { Download, MonitorDown, Share, X } from 'lucide-react';
import React, { useState } from 'react';
import { usePWAInstall } from '../hooks/usePWAInstall';

interface PWAInstallButtonProps {
  lang: 'bn' | 'en';
  onOpenDesktopExport: () => void;
}

export const PWAInstallButton: React.FC<PWAInstallButtonProps> = ({
  lang,
  onOpenDesktopExport,
}) => {
  const { isInstallable, isInstalled, isIOS, install } = usePWAInstall();
  const [showGuide, setShowGuide] = useState(false);

  // Automatically suppress install prompt when already running in standalone mode
  if (isInstalled) {
    return null;
  }

  const handleClick = async () => {
    if (isInstallable) {
      await install();
      return;
    }
    setShowGuide(true);
  };

  return (
    <>
      <button
        type="button"
        onClick={handleClick}
        className="inline-flex items-center gap-1.5 px-3 py-1.5 min-h-[34px] rounded-lg bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold transition-colors cursor-pointer whitespace-nowrap shrink-0"
      >
        <Download className="w-3.5 h-3.5 shrink-0" />
        <span>{lang === 'bn' ? 'অ্যাপ ইনস্টল করুন' : 'Install App'}</span>
      </button>

      {showGuide && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/60 backdrop-blur-xs p-4"
          onClick={() => setShowGuide(false)}
        >
          <div
            className="w-full max-w-md rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-6 shadow-xl"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-start justify-between gap-4">
              <h3 className="text-base font-semibold text-slate-900 dark:text-slate-100">
                {isIOS
                  ? lang === 'bn'
                    ? 'iPhone / iPad-এ অ্যাপ হিসেবে ইনস্টল করুন'
                    : 'Install on iPhone / iPad'
                  : lang === 'bn'
                  ? 'সফটওয়্যার হিসেবে ইনস্টল করুন'
                  : 'Install as Desktop / Mobile App'}
              </h3>
              <button
                type="button"
                onClick={() => setShowGuide(false)}
                aria-label="Close"
                className="p-1 rounded-lg text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {isIOS ? (
              <ol className="mt-3 space-y-2 text-sm text-slate-600 dark:text-slate-300 list-decimal list-inside leading-relaxed">
                <li>
                  {lang === 'bn' ? (
                    <>
                      Safari টুলবারের{' '}
                      <strong className="inline-flex items-center gap-1 text-slate-900 dark:text-white">
                        Share <Share className="w-3.5 h-3.5" />
                      </strong>{' '}
                      বাটনে ট্যাপ করুন।
                    </>
                  ) : (
                    <>
                      Tap the <strong>Share</strong> button in Safari&apos;s
                      toolbar.
                    </>
                  )}
                </li>
                <li>
                  {lang === 'bn'
                    ? 'নিচে স্ক্রল করে "Add to Home Screen" নির্বাচন করুন।'
                    : 'Scroll down and tap "Add to Home Screen".'}
                </li>
                <li>
                  {lang === 'bn'
                    ? '"Add" চাপলে এটি হোম স্ক্রিনে সফটওয়্যার আইকন হিসেবে যুক্ত হবে।'
                    : 'Tap "Add" to launch it as a standalone app from your home screen.'}
                </li>
              </ol>
            ) : (
              <div className="mt-3 space-y-3 text-sm text-slate-600 dark:text-slate-300 leading-relaxed">
                <p>
                  {lang === 'bn'
                    ? 'ব্রাউজারের অ্যাড্রেস বারের ডান পাশে থাকা ইনস্টল (Install) আইকন অথবা ব্রাউজার মেনু → "Save and share / Install ChatDesk" থেকে এক ক্লিকে পিসি বা ফোনে ইনস্টল করতে পারেন।'
                    : 'Click the Install icon on the right side of your browser address bar (or Menu → Install ChatDesk) to add this app directly to your Desktop, Start Menu, or Home Screen.'}
                </p>
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  {lang === 'bn'
                    ? 'অথবা সরাসরি উইন্ডোজ/ম্যাক ডেস্কটপ লঞ্চার ফাইল ডাউনলোড করে সফটওয়্যারের মতো চালাতে পারেন:'
                    : 'Or download a standalone desktop launcher / Electron package directly:'}
                </p>
                <button
                  type="button"
                  onClick={() => {
                    setShowGuide(false);
                    onOpenDesktopExport();
                  }}
                  className="w-full inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg bg-slate-900 dark:bg-blue-600 hover:bg-slate-800 dark:hover:bg-blue-700 text-white text-xs font-semibold transition-colors cursor-pointer"
                >
                  <MonitorDown className="w-4 h-4 shrink-0" />
                  <span>
                    {lang === 'bn'
                      ? 'ডেস্কটপ সফটওয়্যার প্যাকেজ ডাউনলোড করুন'
                      : 'Get Desktop Software Package (.bat / Electron)'}
                  </span>
                </button>
              </div>
            )}

            <button
              type="button"
              onClick={() => setShowGuide(false)}
              className="mt-4 w-full rounded-lg bg-slate-100 dark:bg-slate-800 py-2 text-xs font-semibold text-slate-800 dark:text-slate-200 hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors cursor-pointer"
            >
              {lang === 'bn' ? 'বন্ধ করুন' : 'Close'}
            </button>
          </div>
        </div>
      )}
    </>
  );
};
