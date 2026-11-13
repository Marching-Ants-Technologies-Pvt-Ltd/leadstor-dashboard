'use client';

import {
  ResponsiveContainer,
  ComposedChart,
  Line,
  Bar,
  BarChart,
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
  formatPct,
  CHART_COLORS,
  toPieData,
} from '@/utility/analyticsUtils';

const tooltipStyle = {
  backgroundColor: 'white',
  border: '1px solid #E2E8F0',
  borderRadius: '8px',
  padding: '8px 12px',
  fontSize: '12px',
};

export default function LeadAnalyticsTab({ data, loading, onShowTable }) {
  if (loading && !data) {
    return <TabSkeleton />;
  }
  if (!data) {
    return <EmptyState />;
  }

  const s = data.summary || {};
  const p = data.previousSummary || {};
  const trend = data.trend || [];
  const sources = data.sources || [];
  const counsellors = data.counsellors || [];
  const statuses = data.statuses || [];
  const courses = data.courses || [];
  const funnel = data.funnel || [];

  const topCounsellor = counsellors[0];
  const topSource = sources[0];

  return (
    <div className="space-y-6">
      {/* KPI ROW */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4">
        <KpiCard
          title="Total Leads"
          value={formatNumber(s.totalLeads)}
          current={s.totalLeads}
          previous={p.totalLeads}
          subLabel="Overall"
          subValue={formatNumber(s.overallLeads)}
          icon="ri-user-add-line"
        />
        <KpiCard
          title="Converted"
          value={formatNumber(s.converted)}
          current={s.converted}
          previous={p.converted}
          subLabel="Joined"
          icon="ri-user-follow-line"
        />
        <KpiCard
          title="Conversion Rate"
          value={formatPct(s.conversionRate)}
          current={s.conversionRate}
          previous={p.conversionRate}
          subLabel="of leads"
          icon="ri-percent-line"
        />
        <KpiCard
          title="Open Leads"
          value={formatNumber(s.openLeads)}
          current={s.openLeads}
          previous={p.openLeads}
          subLabel="Invited"
          icon="ri-inbox-line"
        />
        <KpiCard
          title="Pending Follow-ups"
          value={formatNumber(s.pendingFollowUps)}
          current={s.pendingFollowUps}
          previous={p.pendingFollowUps}
          invert
          subLabel="overdue"
          icon="ri-time-line"
        />
        <KpiCard
          title="Avg Days to Convert"
          value={`${s.avgDaysToConvert ?? 0}d`}
          current={s.avgDaysToConvert}
          previous={p.avgDaysToConvert}
          invert
          subLabel="per lead"
          icon="ri-calendar-check-line"
        />
      </div>

      {/* HIGHLIGHT STRIP */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <HighlightCard
          icon="ri-trophy-line"
          label="Top Counsellor"
          name={topCounsellor ? topCounsellor.name : '—'}
          detail={
            topCounsellor
              ? `${topCounsellor.converted} converted · ${formatPct(topCounsellor.conversionRate)}`
              : 'No conversions in range'
          }
        />
        <HighlightCard
          icon="ri-megaphone-line"
          label="Best Source"
          name={topSource ? topSource.label : '—'}
          detail={
            topSource
              ? `${topSource.converted} converted · ${formatPct(topSource.conversionRate)}`
              : 'No source data in range'
          }
        />
      </div>

      {/* TREND */}
      <ChartCard
        title="Leads vs Conversions"
        subtitle="Monthly lead inflow against conversions"
        data={trend.map((t) => ({ label: t.period, value: t.leads }))}
        onShowTable={onShowTable}
        height={340}
      >
        <ResponsiveContainer width="100%" height="100%">
          <ComposedChart data={trend}>
            <CartesianGrid strokeDasharray="3 3" stroke="#E2E8F0" />
            <XAxis dataKey="period" tick={{ fontSize: 11 }} />
            <YAxis tick={{ fontSize: 11 }} />
            <Tooltip contentStyle={tooltipStyle} />
            <Legend wrapperStyle={{ fontSize: 12 }} />
            <Bar dataKey="leads" name="Leads" fill="#4283DE" radius={[4, 4, 0, 0]} barSize={22} />
            <Line
              type="monotone"
              dataKey="converted"
              name="Converted"
              stroke="#16A34A"
              strokeWidth={2.5}
              dot={{ r: 3 }}
            />
          </ComposedChart>
        </ResponsiveContainer>
      </ChartCard>

      {/* FUNNEL + STATUS */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <ChartCard
          title="Lead Funnel"
          subtitle="Stage-wise distribution of leads"
          data={funnel.map((f) => ({ label: f.stage, value: f.count }))}
          onShowTable={onShowTable}
          height={340}
        >
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={funnel} layout="vertical" margin={{ left: 20 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#E2E8F0" horizontal={false} />
              <XAxis type="number" tick={{ fontSize: 11 }} />
              <YAxis type="category" dataKey="stage" tick={{ fontSize: 11 }} width={80} />
              <Tooltip contentStyle={tooltipStyle} />
              <Bar dataKey="count" name="Leads" radius={[0, 4, 4, 0]} barSize={20}>
                {funnel.map((_, i) => (
                  <Cell key={i} fill={CHART_COLORS[i % CHART_COLORS.length]} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </ChartCard>

        <ChartCard
          title="Status Distribution"
          subtitle="Current status of leads in range"
          data={toPieData(statuses, 'count')}
          onShowTable={onShowTable}
          height={340}
        >
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie
                data={toPieData(statuses, 'count')}
                dataKey="value"
                nameKey="label"
                cx="50%"
                cy="50%"
                innerRadius={70}
                outerRadius={120}
                paddingAngle={2}
              >
                {statuses.map((_, i) => (
                  <Cell key={i} fill={CHART_COLORS[i % CHART_COLORS.length]} />
                ))}
              </Pie>
              <Tooltip contentStyle={tooltipStyle} />
              <Legend wrapperStyle={{ fontSize: 11 }} />
            </PieChart>
          </ResponsiveContainer>
        </ChartCard>
      </div>

      {/* SOURCE PERFORMANCE */}
      <ChartCard
        title="Source Performance"
        subtitle="Leads and conversions by acquisition source"
        data={sources.map((x) => ({ label: x.label, value: x.leads }))}
        onShowTable={onShowTable}
        height={Math.max(320, sources.length * 34)}
      >
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={sources} layout="vertical" margin={{ left: 30 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#E2E8F0" horizontal={false} />
            <XAxis type="number" tick={{ fontSize: 11 }} />
            <YAxis type="category" dataKey="label" tick={{ fontSize: 11 }} width={130} />
            <Tooltip contentStyle={tooltipStyle} />
            <Legend wrapperStyle={{ fontSize: 12 }} />
            <Bar dataKey="leads" name="Leads" fill="#4283DE" radius={[0, 4, 4, 0]} barSize={12} />
            <Bar dataKey="converted" name="Converted" fill="#16A34A" radius={[0, 4, 4, 0]} barSize={12} />
          </BarChart>
        </ResponsiveContainer>
      </ChartCard>

      {/* COUNSELLOR LEADERBOARD */}
      <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-sm">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h3 className="font-semibold text-slate-800">Counsellor Leaderboard</h3>
            <p className="text-xs text-slate-500 mt-0.5">
              Ranked by conversions in the selected period
            </p>
          </div>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="text-left text-slate-500 border-b border-slate-200">
                <th className="py-2 pr-3 font-medium w-12">#</th>
                <th className="py-2 pr-3 font-medium">Counsellor</th>
                <th className="py-2 pr-3 font-medium text-right">Leads</th>
                <th className="py-2 pr-3 font-medium text-right">Converted</th>
                <th className="py-2 pr-3 font-medium text-right">Conv. Rate</th>
              </tr>
            </thead>
            <tbody>
              {counsellors.length === 0 && (
                <tr>
                  <td colSpan={5} className="py-6 text-center text-slate-400">
                    No counsellor activity in this period
                  </td>
                </tr>
              )}
              {counsellors.map((c) => (
                <tr key={c.userId} className="border-b border-slate-100 last:border-0 hover:bg-slate-50">
                  <td className="py-2 pr-3">
                    <RankBadge rank={c.rank} />
                  </td>
                  <td className="py-2 pr-3 font-medium text-slate-700">{c.name}</td>
                  <td className="py-2 pr-3 text-right text-slate-600">{formatNumber(c.leads)}</td>
                  <td className="py-2 pr-3 text-right font-medium text-slate-800">
                    {formatNumber(c.converted)}
                  </td>
                  <td className="py-2 pr-3 text-right">
                    <span className="text-slate-600">{formatPct(c.conversionRate)}</span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* COURSE DISTRIBUTION */}
      <ChartCard
        title="Course Distribution"
        subtitle="Leads by course of interest"
        data={courses.map((x) => ({ label: x.label, value: x.leads }))}
        onShowTable={onShowTable}
        height={Math.max(320, courses.length * 34)}
      >
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={courses} layout="vertical" margin={{ left: 30 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#E2E8F0" horizontal={false} />
            <XAxis type="number" tick={{ fontSize: 11 }} />
            <YAxis type="category" dataKey="label" tick={{ fontSize: 11 }} width={130} />
            <Tooltip contentStyle={tooltipStyle} />
            <Legend wrapperStyle={{ fontSize: 12 }} />
            <Bar dataKey="leads" name="Leads" fill="#4283DE" radius={[0, 4, 4, 0]} barSize={12} />
            <Bar dataKey="converted" name="Converted" fill="#16A34A" radius={[0, 4, 4, 0]} barSize={12} />
          </BarChart>
        </ResponsiveContainer>
      </ChartCard>
    </div>
  );
}

function HighlightCard({ icon, label, name, detail }) {
  return (
    <div className="bg-gradient-to-br from-[#F4F8FF] to-white border border-[#EAF2FF] rounded-xl p-5 flex items-center gap-4">
      <span className="w-12 h-12 rounded-xl bg-[#4283DE] text-white flex items-center justify-center shrink-0">
        <i className={`${icon} text-[22px]`} />
      </span>
      <div className="min-w-0">
        <div className="text-xs text-slate-500">{label}</div>
        <div className="text-lg font-semibold text-slate-900 truncate">{name}</div>
        <div className="text-xs text-slate-500">{detail}</div>
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
      <i className="ri-bar-chart-box-line text-4xl text-slate-300" />
      <p className="mt-3 text-slate-500">No analytics data available for the selected filters.</p>
    </div>
  );
}
