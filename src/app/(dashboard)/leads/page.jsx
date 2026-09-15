'use client';

import { useEffect, useState } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';

import { toast } from "react-toastify";
import { xFetch } from '@/utility/xFetch';
import { User } from '@/utility/TinyDB';

import LeadsTable from '@/components/dashboard/Lead/LeadTable';
import LeadsMenu from '@/components/dashboard/Lead/LeadMenu';
import LeadsTablePagination from '@/components/dashboard/Lead/Pagination';
import FilterDrawer from '@/components/dashboard/Lead/AdvanceFilter';
import AppliedFilters from '@/components/dashboard/Lead/AppliedFilters';
import AddLead from '@/components/dashboard/Lead/AddLead';

export default function Leads() {
    const searchParams = useSearchParams();
    const router = useRouter();
    const userRoles = Array.isArray(User.role) 
    ? User.role.map(r => String(r).trim())
    : [String(User.role).trim()];
    const branchCorporateId = searchParams.get('corporateId');
    const branchTestId = searchParams.get('testId');
    const branchTestType = searchParams.get('testType');

    const [columns, setColumns] = useState([]);
    const [columnOrder, setColumnOrder] = useState([]);
    const [showPerPageDropdown, setShowPerPageDropdown] = useState(false);
    const [isDrawerOpen, setDrawerOpen] = useState(false);
    const [leads, setLeads] = useState([]);
    const [owners, setOwners] = useState([]);
    const [selectedLeadIds, setSelectedLeadIds] = useState([]);
    const [branchId, setBranchId] = useState(null);
    const [testInfo, setTestInfo] = useState({ testId: null, testType: null });
    const [statusCounts, setStatusCounts] = useState({
        overdue: 0,
        todaysFollowUps: 0,
        newLeads: 0,
        hotLeads: 0,
        conversions: 0,
    });

    // Download notification state
    const [downloadNotification, setDownloadNotification] = useState({
        hasActiveDownload: false,
        progress: 0,
        message: '',
        showCard: false
    });

    // Store reference to the cancel function from ExportEnquiriesModal
    const [cancelExportFunction, setCancelExportFunction] = useState(null);

    // ⭐ NEW STATE: WILL CONTROL ADD LEAD PANEL
    const [openAddLead, setOpenAddLead] = useState(false);

    // Set branch ID and test info from query params
    useEffect(() => {
        if (branchCorporateId) {
            setBranchId(branchCorporateId);
        } else {
            setBranchId(null);
        }

        if (branchTestId && branchTestType) {
            setTestInfo({ testId: branchTestId, testType: branchTestType });
        } else {
            setTestInfo({ testId: null, testType: null });
        }
    }, [branchCorporateId, branchTestId, branchTestType]);

    // Fetch and apply custom column names and order
    const fetchAndSetColumns = async () => {
        try {
            const data = await xFetch({ path: '/services/profile/columns' });
            const filteredColumns = data.filter(
                c => c.dataField !== 'altMobile'
            );

            setColumns(filteredColumns);
            setColumnOrder(filteredColumns.map(c => c.dataField));

        } catch (error) {
            setColumns([]);
        }
    };

    // Initial Load
    useEffect(() => {
        xFetch({
            path: '/services/profile/getUsers',
            payload: { basic: 1 }
        })
        .then(data => {
            if (typeof window !== "undefined") {
                localStorage.setItem("LeadOwnersById", JSON.stringify(data));
            }
            setOwners(data);
            fetchAndSetColumns();
        })
        .catch(error => {
            console.error(`An error occurred while fetching leads`, error);
        });

        const filters = JSON.parse(localStorage.getItem('LeadFilters') || '[]');
        const needsCleanup = filters.some(f => typeof f.value === 'object');
        if (needsCleanup) {
            localStorage.removeItem('LeadFilters');
        }
    }, []);

    // Handler for updating status counts from child components (AddLead, UpdateLead)
    useEffect(() => {
        window.updateStatusCounts = (counts) => {
            setStatusCounts(counts);
        };

        return () => {
            delete window.updateStatusCounts;
        };
    }, []);

    // Handler for reordering columns
    const handleReorder = (newOrder) => {
        setColumnOrder(newOrder);
        fetchAndSetColumns();
    };

    // APPLY FILTER FROM DRAWER
    const handleApplyFilters = (filters) => {
        setDrawerOpen(false);
    };

    // DOWNLOAD EVENTS
    const handleDownloadStart = (message) => {
        setDownloadNotification({
            hasActiveDownload: true,
            progress: 0,
            message: message || 'Starting download...',
            showCard: false
        });
    };

    const handleDownloadProgress = (progress, processed, total) => {
        setDownloadNotification(prev => ({
            ...prev,
            progress,
            message: `Processing ${processed?.toLocaleString()} of ${total?.toLocaleString()} records...`
        }));
    };

    const handleDownloadEnd = () => {
        setDownloadNotification({
            hasActiveDownload: false,
            progress: 0,
            message: '',
            showCard: false
        });
    };

    const handleDownloadCancel = () => {
        if (cancelExportFunction) {
            cancelExportFunction();
        } else {
            setDownloadNotification({
                hasActiveDownload: false,
                progress: 0,
                message: '',
                showCard: false
            });
        }
    };

    const toggleDownloadCard = () => {
        setDownloadNotification(prev => ({
            ...prev,
            showCard: !prev.showCard
        }));
    };

    const handleDeleteSelected = async () => {
        if (selectedLeadIds.length === 0) return;

        if (!confirm(`Are you sure you want to delete ${selectedLeadIds.length} invite(s)? This cannot be undone.`)) {
            return;
        }
        try {
            const response = await xFetch({
                path: "/services/invite/deleteInvite",
                method: "POST",
                payload: { invitationIds: selectedLeadIds },
            });

            if (response) {
                toast.success(`Deleted ${selectedLeadIds.length} invite(s) successfully`);
                setSelectedLeadIds([]);
                window.tableRefresh?.();
            } else {
                toast.error("Failed to delete invites");
            }
        } catch (err) {
            console.error("Delete error:", err);
            toast.error("Error deleting invites");
        }
    };

    const handleBackToBranches = () => {
        router.push('/branches');
    };

    const handleViewPayments = () => {
        const testParams = testInfo.testId && testInfo.testType 
            ? `&testId=${testInfo.testId}&testType=${testInfo.testType}` 
            : '';
        router.push(`/payments?corporateId=${branchId}${testParams}`);
    };

    return (
        <div className="flex-1 overflow-hidden flex flex-col">

            {openAddLead ? (
                <AddLead onClose={() => setOpenAddLead(false)} />
            ) : (
                <>
                    {/* TOP MENU */}
                    <LeadsMenu
                        onOpenAdvanceFilter={() => setDrawerOpen(true)}
                        leads={leads}
                        selectedLeadIds={selectedLeadIds}
                        setSelectedLeadIds={setSelectedLeadIds}
                        onDownloadStart={handleDownloadStart}
                        onDownloadProgress={handleDownloadProgress}
                        onDownloadEnd={handleDownloadEnd}
                        onDownloadCancel={handleDownloadCancel}
                        setCancelExportFunction={setCancelExportFunction}
                        setOpenAddLead={setOpenAddLead}
                        onDeleteSelected={handleDeleteSelected}
                        branchId={branchId}
                        onBackToBranches={handleBackToBranches}
                        onViewPayments={handleViewPayments}
                        statusCounts={statusCounts}
                        setStatusCounts={setStatusCounts}
                    />
                    
                    {/* APPLIED FILTERS BAR */}
                    <AppliedFilters onOpenAdvanceFilter={() => setDrawerOpen(true)} />
                    
                    {/* NORMAL LEADS TABLE */}
                    <div className="flex-1 flex flex-col px-4 gap-3 overflow-hidden">
                        <LeadsTable
                            columns={columns}
                            setColumns={setColumns}
                            columnOrder={columnOrder}
                            setColumnOrder={setColumnOrder}
                            leads={leads}
                            owners={owners}
                            setLeads={setLeads}
                            selectedLeadIds={selectedLeadIds}
                            setSelectedLeadIds={setSelectedLeadIds}
                            onOpenAdvanceFilter={() => setDrawerOpen(true)}
                            branchId={branchId}
                            testInfo={testInfo}
                        />

                        {/* PAGINATION */}
                        <LeadsTablePagination
                            columns={columns}
                            setColumns={setColumns}
                            columnOrder={columnOrder}
                            setColumnOrder={handleReorder}
                            fetchAndSetColumns={fetchAndSetColumns}
                            showPerPageDropdown={showPerPageDropdown}
                            setShowPerPageDropdown={setShowPerPageDropdown}
                            downloadNotification={downloadNotification}
                            toggleDownloadCard={toggleDownloadCard}
                            onDownloadCancel={handleDownloadCancel}
                            branchId={branchId}
                        />
                    </div>

                    {/* ADVANCE FILTER */}
                    <FilterDrawer
                        isOpen={isDrawerOpen}
                        onClose={() => setDrawerOpen(false)}
                        onApplyFilters={handleApplyFilters}
                        onOpenAdvanceFilter={() => setDrawerOpen(true)}
                    />
                </>
            )}
        </div>
    );
}
