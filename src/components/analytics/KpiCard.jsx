'use client';

import { computeDelta } from '@/utility/analyticsUtils';

/**
 * KpiCard — a single headline metric with an optional period-over-period delta.
 *
 * @param {string}  title      Metric label
 * @param {string}  value      Formatted primary value
 * @param {number}  current    Raw current value (for delta)
 * @param {number}  previous   Raw previous value (for delta)
 * @param {string}  subLabel   Small caption under the value
 * @param {string}  subValue   Small caption value
 * @param {boolean} invert     When true, a rise is bad (e.g. overdue amount)
 * @param {string}  icon       Remix icon class
 */
export default function KpiCard({
  title,
  value,
  current,
  previous,
  subLabel,
  subValue,
  invert = false,
  icon,
}) {
  const hasDelta = current !== undefined && previous !== undefined;
  const delta = hasDelta ? computeDelta(current, previous) : null;

  const isGood =
    delta &&
    ((delta.direction === 'up' && !invert) ||
      (delta.direction === 'down' && invert));

  const deltaColor =
    !delta || delta.direction === 'flat'
      ? 'text-slate-400'
      : isGood
      ? 'text-emerald-600'
      : 'text-rose-600';

  const deltaIcon =
    delta?.direction === 'up'
      ? 'ri-arrow-up-line'
      : delta?.direction === 'down'
      ? 'ri-arrow-down-line'
      : 'ri-subtract-line';

  return (
    <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-sm hover:shadow-md transition-shadow">
      <div className="flex items-start justify-between">
        <span className="text-sm font-medium text-slate-500">{title}</span>
        {icon && (
          <span className="w-8 h-8 rounded-lg bg-[#EAF2FF] text-[#4283DE] flex items-center justify-center">
            <i className={`${icon} text-[16px]`} />
          </span>
        )}
      </div>

      <div className="mt-3 text-2xl font-semibold text-slate-900">{value}</div>

      <div className="mt-2 flex items-center gap-2 text-xs">
        {delta && (
          <span className={`inline-flex items-center gap-0.5 font-medium ${deltaColor}`}>
            <i className={deltaIcon} />
            {Math.abs(delta.pct)}%
          </span>
        )}
        {subLabel && (
          <span className="text-slate-400">
            {subLabel}
            {subValue !== undefined && (
              <span className="text-slate-600 font-medium"> {subValue}</span>
            )}
          </span>
        )}
      </div>
    </div>
  );
}
