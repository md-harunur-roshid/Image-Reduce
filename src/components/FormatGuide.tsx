import { Language } from '../types/image';
import { getCopy } from '../utils/i18n';

interface FormatGuideProps {
  lang: Language;
}

export function FormatGuide({ lang }: FormatGuideProps) {
  const t = getCopy(lang);

  return (
    <section
      id="formats"
      className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl overflow-hidden"
    >
      <div className="px-6 py-5 border-b border-slate-200 dark:border-slate-800">
        <h2 className="text-xl font-semibold text-slate-900 dark:text-slate-100">
          {t.formatGuide.heading}
        </h2>
        <p className="mt-1 text-sm text-slate-600 dark:text-slate-400">
          {t.formatGuide.subheading}
        </p>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="border-b border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900/60 text-xs font-semibold text-slate-600 dark:text-slate-400">
              <th className="py-3 px-6 whitespace-nowrap">
                {t.formatGuide.columns.format}
              </th>
              <th className="py-3 px-6 whitespace-nowrap">
                {t.formatGuide.columns.compression}
              </th>
              <th className="py-3 px-6 whitespace-nowrap">
                {t.formatGuide.columns.transparency}
              </th>
              <th className="py-3 px-6">{t.formatGuide.columns.bestFor}</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 dark:divide-slate-800 text-sm">
            {t.formatGuide.rows.map((row) => (
              <tr
                key={row.format}
                className="hover:bg-slate-50/80 dark:hover:bg-slate-800/40 transition-colors"
              >
                <td className="py-3.5 px-6 font-mono font-semibold text-slate-900 dark:text-slate-100 whitespace-nowrap">
                  {row.format}
                </td>
                <td className="py-3.5 px-6 text-slate-700 dark:text-slate-300 whitespace-nowrap">
                  {row.compression}
                </td>
                <td className="py-3.5 px-6 text-slate-700 dark:text-slate-300 whitespace-nowrap">
                  {row.transparency}
                </td>
                <td className="py-3.5 px-6 text-slate-600 dark:text-slate-400">
                  {row.bestFor}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </section>
  );
}
