// utility/analyticsUtils.js
// Shared formatting + delta helpers for the Analytics module.

/** Compact number formatter (Indian units: K / L / Cr). */
export function formatNumber(value = 0) {
  const n = Number(value) || 0;
  const abs = Math.abs(n);
  const sign = n < 0 ? '-' : '';
  if (abs >= 10000000) return sign + (abs / 10000000).toFixed(2) + ' Cr';
  if (abs >= 100000) return sign + (abs / 100000).toFixed(2) + ' L';
  if (abs >= 1000) return sign + (abs / 1000).toFixed(1) + ' K';
  return sign + abs.toLocaleString('en-IN');
}

/** Compact currency formatter (₹, Indian units). */
export function formatCurrency(value = 0) {
  const n = Number(value) || 0;
  const abs = Math.abs(n);
  const sign = n < 0 ? '-' : '';
  if (abs >= 10000000) return sign + '₹' + (abs / 10000000).toFixed(2) + ' Cr';
  if (abs >= 100000) return sign + '₹' + (abs / 100000).toFixed(2) + ' L';
  if (abs >= 1000) return sign + '₹' + (abs / 1000).toFixed(1) + ' K';
  return sign + '₹' + abs.toLocaleString('en-IN');
}

/** Full currency (no compaction) — used in tables. */
export function formatCurrencyFull(value = 0) {
  const n = Number(value) || 0;
  return '₹' + n.toLocaleString('en-IN');
}

/** Percentage formatter. */
export function formatPct(value = 0) {
  return `${(Number(value) || 0).toFixed(1)}%`;
}

/**
 * Period-over-period delta.
 * @returns {{ pct:number, direction:'up'|'down'|'flat' }}
 */
export function computeDelta(current, previous) {
  const c = Number(current) || 0;
  const p = Number(previous) || 0;
  if (p === 0) {
    if (c === 0) return { pct: 0, direction: 'flat' };
    return { pct: 100, direction: 'up' };
  }
  const change = ((c - p) / Math.abs(p)) * 100;
  return {
    pct: Math.round(change * 10) / 10,
    direction: change > 0 ? 'up' : change < 0 ? 'down' : 'flat',
  };
}

/** Brand chart palette (primary first). */
export const CHART_COLORS = [
  '#4283DE', '#16A34A', '#F59E0B', '#DC2626',
  '#24559D', '#0EA5E9', '#8B5CF6', '#EC4899',
  '#14B8A6', '#F97316', '#64748B', '#A78BFA',
];

/** Convert [{label, count|value}] into recharts pie data. */
export function toPieData(items = [], valueKey = 'count') {
  return items.map((i) => ({
    label: i.label ?? 'Unknown',
    value: Number(i[valueKey] ?? i.value ?? 0),
  }));
}
