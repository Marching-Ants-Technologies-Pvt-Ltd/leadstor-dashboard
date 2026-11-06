'use client';

import {
  ResponsiveContainer,
  AreaChart,
  Area,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  Cell,
  PieChart,
  Pie,
} from 'recharts';
import KpiCard from './KpiCard';
import ChartCard from './ChartCard';
import {
  formatNumber,
  formatCurrency,
  formatCurrencyFull,
  formatPct,
  CHART_COLORS,
  toPieData,
} from '@/utility/analyticsUtils';
import { spot } from './tourSpot';

const tooltipStyle = {
  backgroundColor: 'white',
  border: '1px solid #E2E8F0',
  borderRadius: '8px',
  padding: '8px 12px',
  fontSize: '12px',
};

const currencyTooltip = (v) => formatCurrencyFull(v);

export default function SalesAnalyticsTab({ data, loading, onShowTable }) {
  if (loading && !data) {
    return <TabSkeleton />;
  }
  if (!data) {
    return <EmptyState />;
  }

  const s = data.summary || {};
  const p = data.previousSummary || {};
  const revenueTrend = data.revenueTrend || [];
  const byCourse = data.byCourse || [];
  const bySource = data.bySource || [];
  const byCounsellor = data.byCounsellor || [];
  const health = data.installmentHealth || {};
  const admissionStatus = data.admissionStatus || [];

  const healthData = [
    { label: 'Paid', value: health.paid || 0, color: '#16A34A' },
    { label: 'Pending', value: health.pending || 0, color: '#4283DE' },
    { label: 'Overdue', value: health.overdue || 0, color: '#F59E0B' },
    { label: 'Defaulter', value: health.defaulter || 0, color: '#DC2626' },
  ];

  return (
    <div className="space-y-6">
      {/* KPI ROW */}
      <div
        {...spot('sales-kpis', 'Key Numbers', 'Admissions, total agreed deal value, amount collected, collection rate, and the outstanding and overdue amounts. Arrows compare with the previous period where shown.', 'bottom')}
        className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4"
      >        
        <KpiCard
          title="Admissions"
          value={formatNumber(s.admissions)}
          current={s.admissions}
          previous={p.admissions}
          subLabel="in range"
          icon="ri-user-star-line"
        />
        <KpiCard
          title="Total Agreed"
          value={formatCurrency(s.totalAgreed)}
          current={s.totalAgreed}
          previous={p.totalAgreed}
          subLabel="deal value"
          icon="ri-file-list-3-line"
        />
        <KpiCard
          title="Collected"
          value={formatCurrency(s.collected)}
          current={s.collected}
          previous={p.collected}
          subLabel="gross"
          icon="ri-money-rupee-circle-line"
        />
        <KpiCard
          title="Collection Rate"
          value={formatPct(s.collectionRate)}
          current={s.collectionRate}
          previous={p.collectionRate}
          subLabel="of agreed"
          icon="ri-percent-line"
        />
        <KpiCard
          title="Outstanding"
          value={formatCurrency(s.outstanding)}
          subLabel="unpaid"
          invert
          icon="ri-hourglass-line"
        />
        <KpiCard
          title="Overdue"
          value={formatCurrency(s.overdue)}
          subLabel="past due"
          invert
          icon="ri-alarm-warning-line"
        />
      </div>

      {/* SECONDARY STRIP */}
      <div
        {...spot('sales-mini', 'More Numbers', 'Average deal size, expected collections in the next 30 days, refunds and reversals, and net collected.', 'bottom')}
        className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4"
      >        
        <MiniStat label="Avg Deal Size" value={formatCurrency(s.avgDealSize)} icon="ri-scales-3-line" />
        <MiniStat
          label="Expected (Next 30 Days)"
          value={formatCurrency(s.expectedNext30Days)}
          icon="ri-calendar-todo-line"
        />
        <MiniStat label="Refunds / Reversals" value={formatCurrency(s.refunds)} icon="ri-refund-2-line" />
        <MiniStat label="Net Collected" value={formatCurrency(s.netCollected)} icon="ri-wallet-3-line" />
      </div>

      {/* REVENUE TREND */}
      <ChartCard
        title="Revenue Trend"
        spot={spot('sales-revenue', 'Revenue Trend', 'Monthly collections. Click Tabular at the top right of any chart to see its data as a table.')}
        subtitle="Monthly collections (gross)"
        data={revenueTrend.map((r) => ({ label: r.period, value: r.collected }))}
        onShowTable={onShowTable}
        height={340}
      >
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={revenueTrend}>
            <defs>
              <linearGradient id="revFill" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#4283DE" stopOpacity={0.35} />
                <stop offset="95%" stopColor="#4283DE" stopOpacity={0} />
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" stroke="#E2E8F0" />
            <XAxis dataKey="period" tick={{ fontSize: 11 }} />
            <YAxis tick={{ fontSize: 11 }} tickFormatter={(v) => formatCurrency(v)} />
            <Tooltip contentStyle={tooltipStyle} formatter={currencyTooltip} />
            <Area
              type="monotone"
              dataKey="collected"
              name="Collected"
              stroke="#4283DE"
              strokeWidth={2.5}
              fill="url(#revFill)"
            />
          </AreaChart>
        </ResponsiveContainer>
      </ChartCard>

      {/* INSTALLMENT HEALTH + ADMISSION STATUS */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <ChartCard
          title="Installment Health"
          spot={spot('sales-health', 'Installment Health', 'How many active installments are paid, pending, overdue or defaulted.')}
          subtitle="Status of all active installments"
          data={healthData.map((h) => ({ label: h.label, value: h.value }))}
          onShowTable={onShowTable}
          height={320}
        >
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie
                data={healthData}
                dataKey="value"
                nameKey="label"
                cx="50%"
                cy="50%"
                innerRadius={70}
                outerRadius={120}
                paddingAngle={2}
              >
                {healthData.map((h, i) => (
                  <Cell key={i} fill={h.color} />
                ))}
              </Pie>
              <Tooltip contentStyle={tooltipStyle} />
              <Legend wrapperStyle={{ fontSize: 12 }} />
            </PieChart>
          </ResponsiveContainer>
        </ChartCard>

        <ChartCard
          title="Admission Status"
          spot={spot('sales-admission', 'Admission Status', 'How your admissions are distributed by status.')}
          subtitle="Distribution of admissions by status"
          data={toPieData(admissionStatus, 'count')}
          onShowTable={onShowTable}
          height={320}
        >
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie
                data={toPieData(admissionStatus, 'count')}
                dataKey="value"
                nameKey="label"
                cx="50%"
                cy="50%"
                innerRadius={70}
                outerRadius={120}
                paddingAngle={2}
              >
                {admissionStatus.map((_, i) => (
                  <Cell key={i} fill={CHART_COLORS[i % CHART_COLORS.length]} />
                ))}
              </Pie>
              <Tooltip contentStyle={tooltipStyle} />
              <Legend wrapperStyle={{ fontSize: 11 }} />
            </PieChart>
          </ResponsiveContainer>
        </ChartCard>
      </div>

      {/* REVENUE BY COURSE */}
      <ChartCard
        title="Revenue by Course"
        spot={spot('sales-course', 'Revenue by Course', 'Agreed value against the collected amount for each course.')}
        subtitle="Agreed value vs collected, per course"
        data={byCourse.map((x) => ({ label: x.label, value: x.agreed }))}
        onShowTable={onShowTable}
        height={Math.max(320, byCourse.length * 34)}
      >
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={byCourse} layout="vertical" margin={{ left: 30 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#E2E8F0" horizontal={false} />
            <XAxis type="number" tick={{ fontSize: 11 }} tickFormatter={(v) => formatCurrency(v)} />
            <YAxis type="category" dataKey="label" tick={{ fontSize: 11 }} width={130} />
            <Tooltip contentStyle={tooltipStyle} formatter={currencyTooltip} />
            <Legend wrapperStyle={{ fontSize: 12 }} />
            <Bar dataKey="agreed" name="Agreed" fill="#4283DE" radius={[0, 4, 4, 0]} barSize={12} />
            <Bar dataKey="collected" name="Collected" fill="#16A34A" radius={[0, 4, 4, 0]} barSize={12} />
          </BarChart>
        </ResponsiveContainer>
      </ChartCard>

      {/* REVENUE BY SOURCE */}
      <ChartCard
        title="Revenue by Source"
        spot={spot('sales-source', 'Revenue by Source', 'Agreed value against the collected amount for each source.')}
        subtitle="Agreed value vs collected, per source"
        data={bySource.map((x) => ({ label: x.label, value: x.agreed }))}
        onShowTable={onShowTable}
        height={Math.max(320, bySource.length * 34)}
      >
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={bySource} layout="vertical" margin={{ left: 30 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#E2E8F0" horizontal={false} />
            <XAxis type="number" tick={{ fontSize: 11 }} tickFormatter={(v) => formatCurrency(v)} />
            <YAxis type="category" dataKey="label" tick={{ fontSize: 11 }} width={130} />
            <Tooltip contentStyle={tooltipStyle} formatter={currencyTooltip} />
            <Legend wrapperStyle={{ fontSize: 12 }} />
            <Bar dataKey="agreed" name="Agreed" fill="#4283DE" radius={[0, 4, 4, 0]} barSize={12} />
            <Bar dataKey="collected" name="Collected" fill="#16A34A" radius={[0, 4, 4, 0]} barSize={12} />
          </BarChart>
        </ResponsiveContainer>
      </ChartCard>

      {/* REVENUE BY COUNSELLOR */}
      <div
        {...spot('sales-counsellor', 'Revenue by Counsellor', 'Counsellors ranked by agreed deal value, with their admissions and collected amounts.')}
        className="bg-white rounded-xl border border-slate-200 p-5 shadow-sm"
      >        
        <div className="mb-4">
          <h3 className="font-semibold text-slate-800">Revenue by Counsellor</h3>
          <p className="text-xs text-slate-500 mt-0.5">Ranked by agreed deal value</p>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="text-left text-slate-500 border-b border-slate-200">
                <th className="py-2 pr-3 font-medium w-12">#</th>
                <th className="py-2 pr-3 font-medium">Counsellor</th>
                <th className="py-2 pr-3 font-medium text-right">Admissions</th>
                <th className="py-2 pr-3 font-medium text-right">Agreed</th>
                <th className="py-2 pr-3 font-medium text-right">Collected</th>
              </tr>
            </thead>
            <tbody>
              {byCounsellor.length === 0 && (
                <tr>
                  <td colSpan={5} className="py-6 text-center text-slate-400">
                    No admissions in this period
                  </td>
                </tr>
              )}
              {byCounsellor.map((c) => (
                <tr key={c.userId} className="border-b border-slate-100 last:border-0 hover:bg-slate-50">
                  <td className="py-2 pr-3">
                    <RankBadge rank={c.rank} />
                  </td>
                  <td className="py-2 pr-3 font-medium text-slate-700">{c.name}</td>
                  <td className="py-2 pr-3 text-right text-slate-600">{formatNumber(c.admissions)}</td>
                  <td className="py-2 pr-3 text-right text-slate-700">{formatCurrencyFull(c.agreed)}</td>
                  <td className="py-2 pr-3 text-right font-medium text-emerald-700">
                    {formatCurrencyFull(c.collected)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

function MiniStat({ label, value, icon }) {
  return (
    <div className="bg-white rounded-xl border border-slate-200 p-4 flex items-center gap-3 shadow-sm">
      <span className="w-10 h-10 rounded-lg bg-[#EAF2FF] text-[#4283DE] flex items-center justify-center shrink-0">
        <i className={`${icon} text-[18px]`} />
      </span>
      <div className="min-w-0">
        <div className="text-xs text-slate-500">{label}</div>
        <div className="text-base font-semibold text-slate-900 truncate">{value}</div>
      </div>
    </div>
  );
}

function RankBadge({ rank }) {
  const styles =
    rank === 1
      ? 'bg-amber-100 text-amber-700'
      : rank === 2
      ? 'bg-slate-200 text-slate-700'
      : rank === 3
      ? 'bg-orange-100 text-orange-700'
      : 'bg-slate-100 text-slate-500';
  return (
    <span className={`inline-flex items-center justify-center w-6 h-6 rounded-full text-xs font-semibold ${styles}`}>
      {rank}
    </span>
  );
}

function TabSkeleton() {
  return (
    <div className="space-y-6 animate-pulse">
      <div className="grid grid-cols-2 lg:grid-cols-6 gap-4">
        {Array.from({ length: 6 }).map((_, i) => (
          <div key={i} className="h-28 bg-white rounded-xl border border-slate-200" />
        ))}
      </div>
      <div className="h-80 bg-white rounded-xl border border-slate-200" />
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="h-80 bg-white rounded-xl border border-slate-200" />
        <div className="h-80 bg-white rounded-xl border border-slate-200" />
      </div>
    </div>
  );
}

function EmptyState() {
  return (
    <div className="bg-white rounded-xl border border-slate-200 p-12 text-center">
      <i className="ri-line-chart-line text-4xl text-slate-300" />
      <p className="mt-3 text-slate-500">No sales data available for the selected filters.</p>
    </div>
  );
}
