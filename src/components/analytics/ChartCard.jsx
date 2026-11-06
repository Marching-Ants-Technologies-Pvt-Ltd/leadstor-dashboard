'use client';

/**
 * ChartCard — consistent container for a chart with a title, subtitle and an
 * optional "Tabular" action that opens the raw data in a modal.
 */
export default function ChartCard({
  title,
  subtitle,
  children,
  onShowTable,
  data,
  height = 320,
  action,
  spot
}) {
  const canShowTable = typeof onShowTable === 'function' && Array.isArray(data) && data.length > 0;

  return (
    <div {...spot} className="bg-white rounded-xl border border-slate-200 p-5 shadow-sm">
      <div className="flex items-start justify-between gap-3 mb-4">
        <div>
          <h3 className="font-semibold text-slate-800">{title}</h3>
          {subtitle && <p className="text-xs text-slate-500 mt-0.5">{subtitle}</p>}
        </div>
        <div className="flex items-center gap-2 shrink-0">
          {action}
          {canShowTable && (
            <button
              onClick={() => onShowTable(title, data)}
              className="text-xs font-medium text-[#4283DE] hover:text-[#24559D] px-2.5 py-1 rounded-md hover:bg-[#EAF2FF] transition"
            >
              Tabular
            </button>
          )}
        </div>
      </div>
      <div style={{ height }}>
        {children}
      </div>
    </div>
  );
}
