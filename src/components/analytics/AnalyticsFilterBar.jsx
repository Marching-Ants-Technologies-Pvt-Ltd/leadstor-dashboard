'use client';

import { useMemo } from 'react';
import dayjs from 'dayjs';
import DatePicker from 'react-datepicker';
import 'react-datepicker/dist/react-datepicker.css';
import MultiSelectDropdown from '@/utility/MultiSelectDropdown';

const PRESETS = [
  { label: 'Today', value: 'TODAY' },
  { label: 'Current Week', value: 'THIS_WEEK' },
  { label: 'Last Week', value: 'LAST_WEEK' },
  { label: 'Current Month', value: 'THIS_MONTH' },
  { label: 'Last Month', value: 'LAST_MONTH' },
  { label: 'Last 3 Months', value: 'LAST_3_MONTHS' },
  { label: 'Last 6 Months', value: 'LAST_6_MONTHS' },
  { label: 'This Year', value: 'THIS_YEAR' },
  { label: 'Custom', value: 'CUSTOM' },
];

/** Resolve a preset into a { from, to } dayjs range. */
export function resolvePreset(preset) {
  const now = dayjs();
  switch (preset) {
    case 'TODAY':
      return { from: now.startOf('day'), to: now.endOf('day') };
    case 'THIS_WEEK':
      return { from: now.startOf('week'), to: now.endOf('week') };
    case 'LAST_WEEK':
      return {
        from: now.subtract(1, 'week').startOf('week'),
        to: now.subtract(1, 'week').endOf('week'),
      };
    case 'THIS_MONTH':
      return { from: now.startOf('month'), to: now.endOf('month') };
    case 'LAST_MONTH':
      return {
        from: now.subtract(1, 'month').startOf('month'),
        to: now.subtract(1, 'month').endOf('month'),
      };
    case 'LAST_3_MONTHS':
      return { from: now.subtract(3, 'month').startOf('day'), to: now.endOf('day') };
    case 'LAST_6_MONTHS':
      return { from: now.subtract(6, 'month').startOf('day'), to: now.endOf('day') };
    case 'THIS_YEAR':
      return { from: now.startOf('year'), to: now.endOf('day') };
    default:
      return { from: now.startOf('month'), to: now.endOf('day') };
  }
}

/**
 * AnalyticsFilterBar — date range + course/source/counsellor/status filters.
 * Controlled by the parent page.
 */
export default function AnalyticsFilterBar({
  filters,
  setFilters,
  range,
  setRange,
  customRange,
  setCustomRange,
  options,
  showStatus = true,
}) {
  const { course = [], source = [], owner = [], status = [] } = options || {};

  const presetLabel = useMemo(
    () => PRESETS.find((p) => p.value === filters.datePreset)?.label || 'Range',
    [filters.datePreset]
  );

  return (
    <div className="bg-white border border-slate-200 rounded-2xl p-4 shadow-sm">
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
        <div>
          <label className="text-xs text-slate-500">Date Range</label>
          <select
            className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-[#4283DE]"
            value={filters.datePreset}
            onChange={(e) => setFilters((f) => ({ ...f, datePreset: e.target.value }))}
          >
            {PRESETS.map((p) => (
              <option key={p.value} value={p.value}>
                {p.label}
              </option>
            ))}
          </select>
        </div>

        <MultiSelectDropdown
          label="Course"
          options={course}
          value={filters.course}
          onChange={(v) => setFilters((f) => ({ ...f, course: v }))}
        />

        <MultiSelectDropdown
          label="Source"
          options={source}
          value={filters.source}
          onChange={(v) => setFilters((f) => ({ ...f, source: v }))}
        />

        <MultiSelectDropdown
          label="Counsellor"
          options={owner}
          value={filters.owner}
          onChange={(v) => setFilters((f) => ({ ...f, owner: v }))}
        />

        {showStatus && (
          <MultiSelectDropdown
            label="Status"
            options={status}
            value={filters.status}
            onChange={(v) => setFilters((f) => ({ ...f, status: v }))}
          />
        )}
      </div>

      {filters.datePreset === 'CUSTOM' && (
        <div className="mt-4 w-full md:w-[280px]">
          <label className="text-xs text-slate-500 mb-1 block">From – To</label>
          <DatePicker
            selectsRange
            startDate={customRange[0]}
            endDate={customRange[1]}
            onChange={(dates) => {
              const [start, end] = dates;
              setCustomRange(dates);
              if (start && end) {
                setRange({ from: dayjs(start), to: dayjs(end) });
              }
            }}
            dateFormat="dd/MM/yyyy"
            className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm"
            placeholderText="Select date range"
            showMonthDropdown
            showYearDropdown
            dropdownMode="select"
            yearDropdownItemNumber={100}
            scrollableYearDropdown
            minDate={new Date(1990, 0, 1)}
            calendarStartDay={1}
          />
        </div>
      )}

      <div className="mt-3 text-xs text-slate-500">
        Showing <span className="font-medium text-[#4283DE]">{presetLabel}</span>
        {range?.from && range?.to && (
          <>
            {' '}
            · {range.from.format('DD MMM YYYY')} → {range.to.format('DD MMM YYYY')}
          </>
        )}
      </div>
    </div>
  );
}
