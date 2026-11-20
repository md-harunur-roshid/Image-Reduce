import { WifiOff } from 'lucide-react';
import { useOnlineStatus } from '../hooks/useOnlineStatus';

interface OfflineIndicatorProps {
  lang: 'bn' | 'en';
}

export function OfflineIndicator({ lang }: OfflineIndicatorProps) {
  const isOnline = useOnlineStatus();

  if (isOnline) return null;

  return (
    <div
      role="status"
      className="fixed bottom-4 left-4 z-50 flex items-center gap-2 rounded-lg bg-amber-600 px-3.5 py-2 text-xs font-medium text-white shadow-lg"
    >
      <WifiOff className="w-3.5 h-3.5 shrink-0" />
      <span>
        {lang === 'bn'
          ? 'অফলাইন মোড — ইন্টারনেট সংযোগ বিচ্ছিন্ন রয়েছে'
          : 'Offline Mode — Waiting for internet connection'}
      </span>
    </div>
  );
}
