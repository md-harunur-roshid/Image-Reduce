import { Plus } from 'lucide-react';
import { Language } from '../types/image';
import { getCopy } from '../utils/i18n';

interface HeaderProps {
  lang: Language;
  onAddImages: () => void;
}

export function Header({ lang, onAddImages }: HeaderProps) {
  const t = getCopy(lang);

  return (
    <header className="sticky top-0 z-30 bg-white/95 dark:bg-slate-950/95 backdrop-blur-sm border-b border-slate-200 dark:border-slate-800">
      <div className="max-w-[1360px] mx-auto px-4 sm:px-6 h-16 flex items-center justify-between gap-8">
        <a
          href="#workbench"
          className="text-xl font-bold tracking-tight text-slate-900 dark:text-slate-50 whitespace-nowrap shrink-0 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-600 rounded"
        >
          {t.brand}
        </a>

        <nav
          aria-label="Primary"
          className="hidden md:flex items-center gap-7 text-sm font-medium text-slate-600 dark:text-slate-300"
        >
          <a
            href="#workbench"
            className="hover:text-slate-900 dark:hover:text-white transition-colors whitespace-nowrap shrink-0 py-1 hover:underline underline-offset-4"
          >
            {t.nav.workbench}
          </a>
          <a
            href="#inspector"
            className="hover:text-slate-900 dark:hover:text-white transition-colors whitespace-nowrap shrink-0 py-1 hover:underline underline-offset-4"
          >
            {t.nav.inspector}
          </a>
          <a
            href="#formats"
            className="hover:text-slate-900 dark:hover:text-white transition-colors whitespace-nowrap shrink-0 py-1 hover:underline underline-offset-4"
          >
            {t.nav.formats}
          </a>
          <a
            href="#privacy"
            className="hover:text-slate-900 dark:hover:text-white transition-colors whitespace-nowrap shrink-0 py-1 hover:underline underline-offset-4"
          >
            {t.nav.privacy}
          </a>
        </nav>

        <div className="flex items-center shrink-0">
          <button
            type="button"
            onClick={onAddImages}
            className="inline-flex items-center gap-2 px-4 py-2 min-h-[40px] text-sm font-semibold text-white bg-blue-600 hover:bg-blue-700 active:scale-[0.99] rounded-lg transition-colors whitespace-nowrap shrink-0 cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-600 focus-visible:ring-offset-2 dark:focus-visible:ring-offset-slate-950"
          >
            <Plus className="w-4 h-4 shrink-0" />
            <span>{t.addImages}</span>
          </button>
        </div>
      </div>
    </header>
  );
}
