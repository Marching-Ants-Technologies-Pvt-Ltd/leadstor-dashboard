'use client';

import React, { useEffect, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import { toast } from 'react-toastify';
import {
  LeadFilters,
  LeadsCurrentPage,
  User,
  Corporate,
  TotalLeads, LeadSearch
} from '@/utility/TinyDB';
import ManualCandidate from '@/components/dashboard/Lead/ManualCandidate.jsx';
import SendEmailModal from '@/components/dashboard/Lead/SendEmailModal.jsx';
import SendWhatsAppModal from '@/components/dashboard/Lead/SendWhatsAppModal.jsx';
import BulkUpdateDrawer from '@/components/dashboard/Lead/BulkUpdateDrawer';
import DailyReportModal from '@/components/dashboard/Lead/DailyReportModal.jsx';
import ExportEnquiriesModal from '@/components/dashboard/Lead/ExportEnquiriesModal.jsx';
import PerformanceAuditModal from '@/components/dashboard/Lead/PerformanceAuditModal.jsx';
import { xFetch } from '@/utility/xFetch';
import { showAppliedFilter } from '@/components/dashboard/Lead/AppliedFilters';

export default function LeadsMenu({
  onOpenAdvanceFilter,
  leads = [],
  selectedLeadIds = [],
  onDownloadStart,
  onDownloadProgress,
  onDownloadEnd,
  onDownloadCancel,
  setCancelExportFunction,
  setOpenAddLead,
  onDeleteSelected,
  branchId,
  onBackToBranches,
  onViewPayments,
  statusCounts: parentStatusCounts,
  setStatusCounts: setParentStatusCounts
}) {
  const router = useRouter();

  /* ---------- UI STATE ---------- */
  const [openMenu, setOpenMenu] = useState(null); // export | filter | actions
  const menuRef = useRef(null);

  const [showManual, setShowManual] = useState(false);
  const [showSendEmail, setShowSendEmail] = useState(false);
  const [showSendWhatsApp, setShowSendWhatsApp] = useState(false);
  const [showBulkUpdateDrawer, setShowBulkUpdateDrawer] = useState(false);
  const [showExportModal, setShowExportModal] = useState(false);
  const [dailyReport, setDailyReport] = useState(false);
  const [showPerformanceAudit, setShowPerformanceAudit] = useState(false);
  const [performanceAuditDays, setPerformanceAuditDays] = useState(7);

  const [statusCounts, setStatusCounts] = useState(
    parentStatusCounts || {
      overdue: 0,
      todaysFollowUps: 0,
      newLeads: 0,
      hotLeads: 0,
      conversions: 0,
    }
  );

  const userRoles = Array.isArray(User.role) 
    ? User.role.map(r => String(r).trim())
    : [String(User.role).trim()];
  const canViewLeadSettings = userRoles.some(
    (role) => ['admin', 'administrator'].includes(String(role).trim().toLowerCase())
  );
    
  // Sync with parent status counts when they change
  useEffect(() => {
    if (parentStatusCounts && setParentStatusCounts) {
      setStatusCounts(parentStatusCounts);
    }
  }, [parentStatusCounts]);

  const [search, setSearch] = useState('');
  const [isSearching, setIsSearching] = useState(false);

  /* ---------- CLICK OUTSIDE ---------- */
  useEffect(() => {
    const handler = (e) => {
      if (menuRef.current && !menuRef.current.contains(e.target)) {
        setOpenMenu(null);
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  /* ---------- HANDLERS ---------- */
  const handleAddLead = () => {
    if (setOpenAddLead) setOpenAddLead(true);
    else setShowManual(true);
  };
  const [refreshing, setRefreshing] = useState(false);

  const resetAndRefreshLeads = () => {
    if (refreshing) return;
    setRefreshing(true);

    LeadFilters.reset();
    LeadSearch?.reset?.();
    LeadsCurrentPage.setValue(1);

    window.refreshLeadMenu?.();
    window.tableRefresh?.();
    window.onTableRefresh?.();

    setTimeout(() => setRefreshing(false), 800);
  };

  const handelFollowUpFilters = () => {
    let today = new Date().toString().split(' ');
    today = `${today[2]}-${today[1]}-${today[3]}`;
    LeadFilters.reset();
    LeadFilters.setValue([{ title: 'FollowUps', value: today, query: 'followupDate' }]);
    LeadsCurrentPage.setValue(1);
    window.tableRefresh();
    setOpenMenu(null);
  };

  const handelBookmarks = () => {
    LeadFilters.reset();
    LeadFilters.setValue([{ title: 'Bookmarks', value: 1, query: 'bookmarkLeads' }]);
    LeadsCurrentPage.setValue(1);
    window.tableRefresh();
    setOpenMenu(null);
  };

  // Handle card click to filter leads
  const handleCardClick = (cardType) => {
    const filters = [];
    const today = new Date();
    const todayStart = new Date(today.getFullYear(), today.getMonth(), today.getDate());
    const todayEnd = new Date(todayStart);
    todayEnd.setDate(todayEnd.getDate() + 1);
    const tomorrowStart = new Date(todayEnd);
    const monthStart = new Date(today.getFullYear(), today.getMonth(), 1);
    const nextMonthStart = new Date(today.getFullYear(), today.getMonth() + 1, 1);

    // Format date for API (dd-MMM-yyyy)
    const formatDate = (date) => {
      const day = String(date.getDate()).padStart(2, '0');
      const month = date.toLocaleString('en-US', { month: 'short' });
      const year = date.getFullYear();
      return `${day}-${month}-${year}`;
    };

    switch (cardType) {
      case 'overdue':
        // Overdue: followup_date = today (followupDate = 27-Feb-2026)
        filters.push({
          title: 'Follow-up Date',
          value: formatDate(todayStart),
          query: 'followupDate',
          displayValue: formatDate(todayStart)
        });
        break;

      case 'todaysFollowUps':
        // Today's Follow-ups: followup_date >= today start AND followup_date < tomorrow start
        filters.push({
          title: 'Button',
          value: 'FilterLeads',
          query: 'button'
        });
        filters.push({
          title: "Today's Follow-ups",
          value: formatDate(todayStart),
          query: 'followupDate',
          displayValue: formatDate(todayStart)
        });
        break;

      case 'newLeads':
        // New Leads: status = 'Invited'
        filters.push({
          title: 'Button',
          value: 'FilterLeads',
          query: 'button'
        });
        filters.push({
          title: 'Status',
          value: 'Invited',
          query: 'status',
          displayValue: 'Invited'
        });
        break;

      case 'hotLeads':
        // Hot Leads: status = 'Hot Lead'
        filters.push({
          title: 'Button',
          value: 'FilterLeads',
          query: 'button'
        });
        filters.push({
          title: 'Status',
          value: 'Hot Lead',
          query: 'status',
          displayValue: 'Hot Lead'
        });
        break;

      case 'conversions':
        // Conversions: status = 'Joined' AND created_date >= month start
        filters.push({
          title: 'Button',
          value: 'FilterLeads',
          query: 'button'
        });
        filters.push({
          title: 'Status',
          value: 'Joined',
          query: 'status',
          displayValue: 'Joined'
        });
        filters.push({
          title: 'Updated From',
          value: formatDate(monthStart),
          query: 'updatedFrmDate',
          displayValue: formatDate(monthStart)
        });
        break;

      default:
        return;
    }

    // Apply filters
    LeadFilters.setValue(filters);
    LeadsCurrentPage.setValue(1);

    // Show applied filter bar
    showAppliedFilter(filters);

    // Refresh table
    if (window.tableRefresh) {
      window.tableRefresh();
    }
  };

  const getLeadStatusSummary = async() => {
    const effectiveUserId = userRoles.includes("Read Only Super User") ? -1 : User?._id;
    const res = await xFetch({
      path: `/services/dashboard/getLeadStatusSummary?userId=${effectiveUserId}`,
    });
      if (!res) return;
      setStatusCounts({
        overdue: res.data.overdue || 0,
        todaysFollowUps: res.data.todaysFollowUps || 0,
        newLeads: res.data.newLeads || 0,
        hotLeads: res.data.hotLeads || 0,
        conversions: res.data.conversions || 0,
      });
    }

  /* ---------- SELECTED EMAILS ---------- */
  const selectedLeadEmails = leads
    .filter(l => selectedLeadIds.includes(l.invitationId))
    .map(l => l.emailId)
    .filter(Boolean);

  const selectedLeadCandidates = leads.filter((lead) =>
    selectedLeadIds.includes(lead.invitationId)
  );

  const selectedLeadMobiles = selectedLeadCandidates
    .flatMap((lead) => [lead.mobile, lead.altMobile])
    .map((value) => String(value || '').trim())
    .filter(Boolean);

  /* ---------- STATUS COUNTS ---------- */

  useEffect(() => {
    window.refreshLeadMenu = () => {
      getLeadStatusSummary();
    };

    return () => {
      delete window.refreshLeadMenu;
    };
  }, []);

  useEffect(() => {
    getLeadStatusSummary();
  }, []);

  useEffect(() => {
    // Optional: skip if search is same as last saved value
    if (search === LeadSearch.value()) {
      return;
    }

    const timeoutId = setTimeout(() => {
      // Update store
      LeadSearch.setValue(search);
      LeadsCurrentPage.setValue(1);

      // Show spinner
      setIsSearching(true);

      let callbackCalled = false;

      const stopSearching = () => {
        if (!callbackCalled) {
          callbackCalled = true;
          setIsSearching(false);
        }
      };

      // Try to use real refresh with callback
      if (window.tableRefresh) {
        window.tableRefresh(() => {
          stopSearching();
          console.log("[Search] tableRefresh callback executed");
        });

        // Safety net: force stop after 8 seconds if something hangs
        const safetyTimeout = setTimeout(() => {
          if (!callbackCalled) {
            console.warn("[Search] tableRefresh callback never fired — forcing stop");
            stopSearching();
          }
        }, 8000);

        // Cleanup safety timeout
        return () => clearTimeout(safetyTimeout);
      } else {
        // Fallback when tableRefresh is missing
        console.warn("[Search] window.tableRefresh not found — using fallback timer");
        setTimeout(stopSearching, 1800);
      }
    }, 650); // slightly faster debounce — feels more responsive

    return () => {
      clearTimeout(timeoutId);
    };
  }, [search]); // only depends on search — clean

  return (
    <>
      {/* TOP BAR */}
      <div className="bg-white border-b px-4 py-3 flex justify-between items-center">
        {/* SEARCH */}

        <div className="relative w-80">
          <input
            type="text"
            placeholder="Search by name, email, mobile..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-10 pr-10 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-300 focus:border-blue-500 outline-none"
          />
          <svg className="absolute left-3 top-2.5 w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
          </svg>
          {isSearching && (
            <div className="absolute right-3 top-2.5">
              <svg className="animate-spin h-4 w-4 text-blue-500" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
              </svg>
            </div>
          )}
        </div>

        {/* ACTIONS */}
        <div className="flex items-center gap-2" ref={menuRef}>
          {branchId && (
            <>
              <button
                onClick={onViewPayments}
                className="px-3 py-1.5 text-xs border border-blue-300 rounded-full bg-blue-50 text-blue-600 hover:bg-blue-100 flex items-center gap-1.5 transition-all"
              >
                <i className="ri-bank-card-line text-[14px]" />
                View Payments
              </button>
              <button
                onClick={onBackToBranches}
                className="px-3 py-1.5 text-xs border border-gray-300 rounded-full bg-gray-50 hover:bg-gray-100 flex items-center gap-1.5 transition-all"
              >
                <i className="ri-arrow-left-line text-[14px]" />
                Back to Branches
              </button>
            </>
          )}

          {/* Show only Filter menu for Counsellor role */}

              {!userRoles.includes("Read Only Super User") && (
                <button onClick={handleAddLead} className="btn-primary-crm action-chip">
                  <i className="ri-user-add-line" />
                  Add
                </button>
              )}

              {(Corporate?.is_ai_nextstep_enabled == "1" && userRoles.includes("Admin")|| userRoles.includes("Administrator")) && (
                <div className="relative">
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      setOpenMenu(openMenu === 'ai' ? null : 'ai');
                    }}
                    className="action-chip"
                    title="AI performance audit"
                  >
                    <span className="sparkle">✨</span>
                    AI Sales Insight
                    <i className="ri-arrow-down-s-line text-xs opacity-60" />
                  </button>

                  {openMenu === 'ai' && (
                    <div className="dropdown-panel" onClick={e => e.stopPropagation()}>
                      {[7].map((days) => (
                        <button
                          key={days}
                          className="drop-item"
                          onClick={() => {
                            setPerformanceAuditDays(days);
                            setShowPerformanceAudit(true);
                            setOpenMenu(null);
                          }}
                        >
                          <i className="ri-calendar-line text-blue-500" />
                          Last {days} days
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              )}

              {/* EXPORT */}
                <div className="relative">
                  <button
                    className="action-chip"
                    onClick={(e) => {
                      e.stopPropagation();
                      setOpenMenu(openMenu === 'export' ? null : 'export');
                    }}
                  >
                    <i className="ri-file-excel-2-line text-emerald-600" />
                    Export
                    <i className="ri-arrow-down-s-line text-xs opacity-60" />
                  </button>

                  {openMenu === 'export' && (
                    <div className="dropdown-panel" onClick={e => e.stopPropagation()}>
                      <button className="drop-item" onClick={() => setDailyReport(true)}>
                        <i className="ri-calendar-line text-blue-500" />
                        Daily report
                      </button>
                      { !userRoles.includes("Counsellor") && (
                        <>
                          <button className="drop-item" onClick={() => setShowExportModal(true)}>
                            <i className="ri-download-2-line text-green-600" />
                            Export enquiries
                          </button>
                        </>
                      )}
                      
                    </div>
                  )}
                </div>

              {/* FILTER */}
              <div className="relative">
                <button
                  className="action-chip"
                  onClick={(e) => {
                    e.stopPropagation();
                    setOpenMenu(openMenu === 'filter' ? null : 'filter');
                  }}
                >
                  <i className="ri-filter-3-line text-indigo-600" />
                  Filter
                  <i className="ri-arrow-down-s-line text-xs opacity-60" />
                </button>

                {openMenu === 'filter' && (
                  <div className="dropdown-panel" onClick={e => e.stopPropagation()}>
                    <button className="drop-item" onClick={handelFollowUpFilters}>
                      <i className="ri-time-line text-orange-500" />
                      Pending Follow-ups
                    </button>
                    <button className="drop-item" onClick={handelBookmarks}>
                      <i className="ri-bookmark-line text-yellow-500" />
                      Bookmarks
                    </button>
                    <div className="dropdown-divider" />
                    <button className="drop-item" onClick={onOpenAdvanceFilter}>
                      <i className="ri-equalizer-line text-purple-500" />
                      Advanced
                    </button>
                  </div>
                )}
              </div>

              {/* ACTIONS */}
              {!userRoles.includes("Read Only Super User") && (
                <div className="relative">
                  <button
                    className="action-chip"
                    onClick={(e) => {
                      e.stopPropagation();
                      setOpenMenu(openMenu === 'actions' ? null : 'actions');
                    }}
                  >
                    <i className="ri-apps-2-line text-sky-600" />
                    Actions
                    <i className="ri-arrow-down-s-line text-xs opacity-60" />
                  </button>

                  {openMenu === 'actions' && (
                    <div className="dropdown-panel" onClick={e => e.stopPropagation()}>
                      {selectedLeadIds.length > 0 && 
                        userRoles.some(role => ['Admin', 'Administrator'].includes(role)) && (
                          <button
                            className="drop-item flex items-center gap-2 text-red-600 hover:bg-red-50"
                            onClick={() => {
                              onDeleteSelected();
                              setOpenMenu(null);
                            }}
                          >
                            <i className="ri-delete-bin-line" />
                            Delete Invite ({selectedLeadIds.length})
                          </button>
                      )}
                      <button className="drop-item" onClick={() => setShowSendEmail(true)}>
                        <i className="ri-mail-line text-indigo-500" />
                        Send Email
                      </button>
                      <button className="drop-item" onClick={() => {
                        if (!selectedLeadIds.length) toast.error('Select at least one record');
                        else setShowSendWhatsApp(true);
                      }}>
                        <i className="ri-whatsapp-line text-green-600" />
                        Send WATI Message
                      </button>
                      <button
                        className="drop-item"
                        onClick={() => {
                          if (!selectedLeadIds.length) toast.error('Select at least one record');
                          else setShowBulkUpdateDrawer(true);
                        }}
                      >
                        <i className="ri-database-2-line text-purple-500" />
                        Bulk Update
                      </button>
                    </div>
                  )}
                </div>
              )}

              {canViewLeadSettings && (
                <button className="icon-btn" onClick={() => router.push('/leads/settings')}>
                  <i className="ri-settings-3-line" title="Settings" />
                </button>
              )}
          
          <button
            className={`icon-btn refresh-btn ${refreshing ? 'spinning' : ''}`}
            onClick={() => resetAndRefreshLeads()}
          >
            <i className="ri-refresh-line" title="Refresh" />
          </button>
        </div>
      </div>

      {/* KPI BAR - CLICKABLE CARDS - Hidden for Counsellor role */}
      
        <div className="flex gap-2 px-4 py-2 bg-[#f5f6f8] border-b">
          {[
            [statusCounts.overdue, 'Overdue', 'text-red-600', 'overdue', 'Click to view overdue leads'],
            [statusCounts.todaysFollowUps, "Today's Follow-ups", 'text-amber-500', 'todaysFollowUps', 'Click to view today\'s follow-ups'],
            [statusCounts.newLeads, 'New Leads', 'text-blue-600', 'newLeads', 'Click to view new leads'],
            [statusCounts.hotLeads, 'Hot Leads', 'text-fuchsia-600', 'hotLeads', 'Click to view hot leads'],
            [statusCounts.conversions, 'Conversions this month', 'text-green-600', 'conversions', 'Click to view conversions'],
          ].map(([count, label, color, cardType, tooltip], i) => (
            <div 
              key={i} 
              className="flex-1 bg-white rounded-lg px-3 py-2 flex items-center gap-3 shadow-sm cursor-pointer hover:shadow-md hover:bg-gray-50 transition-all group"
              onClick={() => handleCardClick(cardType)}
              title={tooltip}
            >
              <div className={`text-xl font-bold ${color} group-hover:scale-110 transition-transform`}>{count}</div>
              <div className="text-xs text-slate-500">{label}</div>
            </div>
          ))}
        </div>
     

      {/* MODALS */}
      {showManual && <ManualCandidate onCancel={() => setShowManual(false)} />}
      {showSendEmail && (
        <SendEmailModal
          isOpen
          onClose={() => setShowSendEmail(false)}
          ids={selectedLeadIds}
          emails={selectedLeadEmails}
          corporateId={User?.corporateId}
        />
      )}
      {showSendWhatsApp && (
        <SendWhatsAppModal
          isOpen
          onClose={() => setShowSendWhatsApp(false)}
          ids={selectedLeadIds}
          candidates={selectedLeadCandidates}
          mobileNumbers={selectedLeadMobiles}
          corporateId={branchId || User?.corporateId}
        />
      )}
      {showBulkUpdateDrawer && (
        <BulkUpdateDrawer open onClose={() => setShowBulkUpdateDrawer(false)} selectedIds={selectedLeadIds}/>
      )}
      {dailyReport && <DailyReportModal isOpen onClose={() => setDailyReport(false)} />}
      {showPerformanceAudit && (
        <PerformanceAuditModal
          isOpen
          onClose={() => setShowPerformanceAudit(false)}
          days={performanceAuditDays}
        />
      )}
      {showExportModal && (
        <ExportEnquiriesModal
          isOpen
          onClose={() => setShowExportModal(false)}
          totalLeads={TotalLeads.value()}
          onDownloadStart={onDownloadStart}
          onDownloadProgress={onDownloadProgress}
          onDownloadEnd={onDownloadEnd}
          onDownloadCancel={onDownloadCancel}
          setCancelExportFunction={setCancelExportFunction}
        />
      )}

      <style jsx>{`
        .action-chip {
          display: inline-flex;
          align-items: center;
          gap: 8px;
          padding: 6px 12px;
          border-radius: 10px;
          border: 1px solid rgba(15,23,42,0.08);
          font-size: 13px;
          cursor: pointer;
        }
        .action-chip.primary {
          background: linear-gradient(180deg, #0b5ed7, #084298);
          color: #fff;
          border: none;
        }
        .dropdown-panel {
          position: absolute;
          top: 100%;
          right: 0;
          margin-top: 6px;
          min-width: 190px;
          background: white;
          border-radius: 12px;
          border: 1px solid rgba(15,23,42,0.08);
          box-shadow: 0 10px 30px rgba(2,6,23,0.12);
          padding: 6px;
          z-index: 50;
        }
        .drop-item {
          display: flex;
          align-items: center;
          gap: 10px;
          padding: 8px 10px;
          border-radius: 8px;
          font-size: 13px;
          line-height: 1.2;
          white-space: normal;
          text-align: left;
          cursor: pointer;
          width: 100%;
        }
        .drop-item:hover {
          background: #f8fafc;
        }
        .dropdown-divider {
          height: 1px;
          background: #e5e7eb;
          margin: 6px 0;
        }
        .icon-btn {
          width: 36px;
          height: 36px;
          border-radius: 10px;
          border: 1px solid rgba(15,23,42,0.06);
          background: white;
          display: flex;
          align-items: center;
          justify-content: center;
        }
        .refresh-btn i {
          transition: transform 0.2s ease;
        }

        .refresh-btn.spinning i {
          animation: spin 0.8s linear infinite;
        }

        @keyframes spin {
          from {
            transform: rotate(0deg);
          }
          to {
            transform: rotate(360deg);
          }
        }
        .refresh-btn.spinning {
          opacity: 0.6;
          pointer-events: none;
        }
      `}</style>
    </>
  );
}

