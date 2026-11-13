'use client';

import { useEffect, useMemo, useState } from 'react';
import dayjs from 'dayjs';
import { xFetch } from '@/utility/xFetch';
import { UseFilterOptionsStore } from '@/utility/UseFilterOptionsStore';
import TabularModal from '@/utility/TabularModal';
import AnalyticsFilterBar, { resolvePreset } from '@/components/analytics/AnalyticsFilterBar';
import LeadAnalyticsTab from '@/components/analytics/LeadAnalyticsTab';
import SalesAnalyticsTab from '@/components/analytics/SalesAnalyticsTab';

const TABS = [
  { key: 'lead', label: 'Lead Analytics', icon: 'ri-user-search-line' },
  { key: 'sales', label: 'Sales Analytics', icon: 'ri-line-chart-line' },
];

export default function AnalyticsPage() {
  const [activeTab, setActiveTab] = useState('lead');

  const [filters, setFilters] = useState({
    datePreset: 'THIS_MONTH',
    course: [],
    source: [],
    owner: [],
    status: [],
  });

  const initialRange = resolvePreset('THIS_MONTH');
  const [range, setRange] = useState(initialRange);
  const [customRange, setCustomRange] = useState([
    initialRange.from.toDate(),
    initialRange.to.toDate(),
  ]);

  const [leadData, setLeadData] = useState(null);
  const [salesData, setSalesData] = useState(null);
  const [loadingLead, setLoadingLead] = useState(false);
  const [loadingSales, setLoadingSales] = useState(false);

  const [modalOpen, setModalOpen] = useState(false);
  const [modalTitle, setModalTitle] = useState('');
  const [modalData, setModalData] = useState([]);

  const { status, source, course, owner, fetchFilterOptions } = UseFilterOptionsStore();

  /* ---------------- FILTER OPTIONS ---------------- */
  useEffect(() => {
    fetchFilterOptions();
  }, [fetchFilterOptions]);

  /* ---------------- DATE PRESET -> RANGE ---------------- */
  useEffect(() => {
    if (filters.datePreset === 'CUSTOM') return;
    const r = resolvePreset(filters.datePreset);
    setRange(r);
    setCustomRange([r.from.toDate(), r.to.toDate()]);
  }, [filters.datePreset]);

  /* ---------------- QUERY STRING ---------------- */
  const query = useMemo(() => {
    const params = new URLSearchParams({
      from: range.from.format('YYYY-MM-DD'),
      to: range.to.format('YYYY-MM-DD'),
      courses: filters.course.join(','),
      sources: filters.source.join(','),
      owners: filters.owner.join(','),
      statuses: filters.status.join(','),
      userType: '-1',
    });
    return params.toString();
  }, [range, filters]);

  /* ---------------- DATA LOADING ---------------- */
  useEffect(() => {
    let cancelled = false;

    async function loadLead() {
      setLoadingLead(true);
      try {
        const res = await xFetch({ path: `/services/dashboard/getLeadAnalytics?${query}` });
        if (!cancelled && res) setLeadData(res);
      } catch (e) {
        console.error('Lead analytics fetch failed', e);
      } finally {
        if (!cancelled) setLoadingLead(false);
      }
    }

    async function loadSales() {
      setLoadingSales(true);
      try {
        const res = await xFetch({ path: `/services/dashboard/getSalesAnalytics?${query}` });
        if (!cancelled && res) setSalesData(res);
      } catch (e) {
        console.error('Sales analytics fetch failed', e);
      } finally {
        if (!cancelled) setLoadingSales(false);
      }
    }

    loadLead();
    loadSales();

    return () => {
      cancelled = true;
    };
  }, [query]);

  const showTable = (title, data) => {
    setModalTitle(title);
    setModalData(data);
    setModalOpen(true);
  };

  return (
    <div className="h-full bg-[#F8FAFC] overflow-y-auto">
      <div className="p-4 md:p-6 pb-20 space-y-6">
        {/* HEADER */}
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h1 className="text-xl font-semibold text-slate-900">Analytics</h1>
            <p className="text-sm text-slate-500">
              How your leads and revenue are performing, and where they are heading.
            </p>
          </div>

          {/* TABS */}
          <div className="inline-flex bg-white border border-slate-200 rounded-xl p-1 shadow-sm">
            {TABS.map((t) => (
              <button
                key={t.key}
                onClick={() => setActiveTab(t.key)}
                className={`flex items-center gap-2 px-4 py-2 text-sm rounded-lg transition ${
                  activeTab === t.key
                    ? 'bg-[#4283DE] text-white shadow-sm'
                    : 'text-slate-600 hover:bg-[#EAF2FF] hover:text-[#4283DE]'
                }`}
              >
                <i className={`${t.icon} text-[16px]`} />
                {t.label}
              </button>
            ))}
          </div>
        </div>

        {/* FILTERS */}
        <AnalyticsFilterBar
          filters={filters}
          setFilters={setFilters}
          range={range}
          setRange={setRange}
          customRange={customRange}
          setCustomRange={setCustomRange}
          options={{ course, source, owner, status }}
          showStatus={activeTab === 'lead'}
        />

        {/* TAB CONTENT */}
        {activeTab === 'lead' ? (
          <LeadAnalyticsTab data={leadData} loading={loadingLead} onShowTable={showTable} />
        ) : (
          <SalesAnalyticsTab data={salesData} loading={loadingSales} onShowTable={showTable} />
        )}

        <TabularModal
          isOpen={modalOpen}
          onClose={() => setModalOpen(false)}
          title={modalTitle}
          data={modalData}
        />
      </div>
    </div>
  );
}
