import { Check, ShieldCheck } from 'lucide-react';
import { Language } from '../types/image';
import { getCopy } from '../utils/i18n';

interface PrivacySectionProps {
  lang: Language;
}

export function PrivacySection({ lang }: PrivacySectionProps) {
  const t = getCopy(lang);

  return (
    <section
      id="privacy"
      className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-6 sm:p-8"
    >
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        <div className="lg:col-span-5">
          <div className="inline-flex items-center gap-2 text-blue-600 dark:text-blue-400 mb-2">
            <ShieldCheck className="w-5 h-5 shrink-0" />
            <span className="text-sm font-semibold">{t.nav.privacy}</span>
          </div>
          <h2 className="text-xl font-semibold text-slate-900 dark:text-slate-100">
            {t.privacy.heading}
          </h2>
          <p className="mt-2 text-sm text-slate-600 dark:text-slate-400 leading-relaxed">
            {t.privacy.body}
          </p>
        </div>

        <ul className="lg:col-span-7 grid grid-cols-1 gap-3">
          {t.privacy.points.map((point) => (
            <li
              key={point}
              className="flex items-start gap-3 p-3.5 rounded-lg bg-slate-50 dark:bg-slate-800/50 border border-slate-200/70 dark:border-slate-800 text-sm text-slate-700 dark:text-slate-200"
            >
              <Check className="w-4 h-4 text-emerald-600 dark:text-emerald-400 mt-0.5 shrink-0" />
              <span>{point}</span>
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}
