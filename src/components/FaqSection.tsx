import { ChevronDown } from 'lucide-react';
import { Language } from '../types/image';
import { getCopy } from '../utils/i18n';

interface FaqSectionProps {
  lang: Language;
}

export function FaqSection({ lang }: FaqSectionProps) {
  const t = getCopy(lang);

  return (
    <section
      aria-labelledby="faq-heading"
      className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl overflow-hidden"
    >
      <div className="px-6 py-5 border-b border-slate-200 dark:border-slate-800">
        <h2
          id="faq-heading"
          className="text-xl font-semibold text-slate-900 dark:text-slate-100"
        >
          {t.faq.heading}
        </h2>
        <p className="mt-1 text-sm text-slate-600 dark:text-slate-400">
          {t.faq.subheading}
        </p>
      </div>

      <div className="divide-y divide-slate-100 dark:divide-slate-800">
        {t.faq.items.map((entry) => (
          <details key={entry.q} className="group px-6 py-4">
            <summary className="list-none flex items-center justify-between gap-4 cursor-pointer text-sm sm:text-base font-semibold text-slate-900 dark:text-slate-100 select-none">
              <span>{entry.q}</span>
              <ChevronDown className="w-4 h-4 text-slate-500 shrink-0 transition-transform duration-150 group-open:rotate-180" />
            </summary>
            <p className="mt-2.5 text-sm text-slate-600 dark:text-slate-400 leading-relaxed max-w-3xl">
              {entry.a}
            </p>
          </details>
        ))}
      </div>
    </section>
  );
}
