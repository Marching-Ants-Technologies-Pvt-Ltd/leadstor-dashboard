'use client';
import { showFullRemarks, HorizontalScroll } from '@/utility/TableControllers';
import { useEffect, useState, useRef, useMemo  } from 'react';
import AppliedFilters, { showAppliedFilter } from '@/components/dashboard/Lead/AppliedFilters';
import { xFetch } from '@/utility/xFetch';
import {
    Corporate,
    getLeadOwnerById,
    getCurrentUserNameIfAdmin,
    Test,
    User,
    LeadsPerPage,
    TotalLeads,
    LeadsCurrentPage,
    LeadFilters,
    LeadSavedView,
    LeadSearch 
} from '@/utility/TinyDB';
import UpdateLead from '@/components/dashboard/Lead/UpdateLead';
import CallerDeskIVR from '@/components/dashboard/Lead/CallerDeskIVR';
import Timeline from '@/components/dashboard/Lead/ViewTimeline';
import { tableHeader } from "@/components/common/customStyle";
import {
  useReactTable,
  getCoreRowModel,
  flexRender,
  ColumnDef,
} from '@tanstack/react-table';
import RelatedEnquiries from '@/components/dashboard/Lead/RelatedEnquiries';
import RouteData from '@/components/dashboard/Lead/RouteData';
import ExtendedFormModal from '@/components/dashboard/Lead/ExtendedFormModal';
import UniversityListModal from '@/components/dashboard/Lead/UniversityListModal';
import DocumentsModal from '@/components/dashboard/Lead/DocumentsModal';

const parseUpdateTime = (value) => {
    if (!value || typeof value !== 'string') return 0;

    const [datePart = '', timePart = '00:00'] = value.trim().split(/\s+/);
    const [dayStr = '0', monthStr = 'Jan', yearStr = '1970'] = datePart.split('-');
    const [hourStr = '0', minuteStr = '0'] = timePart.split(':');

    const monthMap = {
        Jan: 0,
        Feb: 1,
        Mar: 2,
        Apr: 3,
        May: 4,
        Jun: 5,
        Jul: 6,
        Aug: 7,
        Sep: 8,
        Oct: 9,
        Nov: 10,
        Dec: 11
    };

    const parsed = new Date(
        Number(yearStr),
        monthMap[monthStr.slice(0, 3)] ?? 0,
        Number(dayStr),
        Number(hourStr),
        Number(minuteStr)
    );

    return Number.isNaN(parsed.getTime()) ? 0 : parsed.getTime();
};

export default function LeadsTable({
    columns,
    setColumns,
    columnOrder,
    setColumnOrder,
    leads,
    owners,
    setLeads,
    selectedLeadIds,
    setSelectedLeadIds,
    onOpenAdvanceFilter,
    branchId,
    testInfo
}) {
    let setLeadsFn;
    setLeadsFn = setLeads;

    const selectAllRef = useRef();
    const setSelectedLeadIdsRef = useRef(setSelectedLeadIds);
    const selectedLeadIdsRef = useRef(selectedLeadIds);

    // Keep refs updated with latest values
    useEffect(() => {
        setSelectedLeadIdsRef.current = setSelectedLeadIds;
        selectedLeadIdsRef.current = selectedLeadIds;
    }, [setSelectedLeadIds, selectedLeadIds]);

    const [showUpdatePopup, setShowUpdatePopup] = useState(false);
    const [selectedCandidate, setSelectedCandidate] = useState(null);

    const [showTimeline, setShowTimeline] = useState(false);
    const [selectedLeadForTimeline, setSelectedLeadForTimeline] = useState(null);
    const [selectedLead, setSelectedLead] = useState({});
    const [expandedRows, setExpandedRows] = useState({});
    const [showCallerDeskIVR, setShowCallerDeskIVR] = useState(false);
    const [callerCandidate, setCallerCandidate] = useState(null);
    const [hasIvrService, setHasIvrService] = useState(false);
    const [showRouteData, setShowRouteData] = useState(false);
    const [selectedLeadForRouteData, setSelectedLeadForRouteData] = useState(null);
    const isIndeterminate =
        leads.some(l => selectedLeadIds.includes(l.invitationId)) &&
        !leads.every(l => selectedLeadIds.includes(l.invitationId));

    const [showExtendedFormModal, setShowExtendedFormModal] = useState(false);
    const [extendedFormInvitationId, setExtendedFormInvitationId] = useState(null);

    const [showUniversityModal, setShowUniversityModal] = useState(false);
    const [universityModalInvitationId, setUniversityModalInvitationId] = useState(null);
    const [showDocsModal, setShowDocsModal] = useState(false);
    const [docsModalInvitationId, setDocsModalInvitationId] = useState(null);
    const [googleDriveConnected, setGoogleDriveConnected] = useState(null);
    const [googleDriveToken, setGoogleDriveToken] = useState("");
    const [showGoogleConnectDialog, setShowGoogleConnectDialog] = useState(false);
    const [subOrdinates, setSubOrdinates] = useState([User._id]);
    const [isSubordinatesLoaded, setIsSubordinatesLoaded] = useState(false);
    const [updateTimeSortDirection, setUpdateTimeSortDirection] = useState(null);
    const [isUpdateTimeSorting, setIsUpdateTimeSorting] = useState(false);
    const userRoles = Array.isArray(User.role) 
    ? User.role.map(r => String(r).trim())
    : [String(User.role).trim()];
    const ADMIN_ROLES = ['administrator', 'admin'];
    const isAdmin = userRoles.some(r => ADMIN_ROLES.includes(r.toLowerCase().trim()));

    const syncSavedLeadView = () => {
        const savedView = LeadSavedView.value();

        if (Array.isArray(savedView) && savedView.length > 0) {
            LeadFilters.setValue(savedView);
            LeadSearch.reset();
            showAppliedFilter(savedView);
            return savedView;
        }

        if (LeadFilters.value().length > 0) {
            LeadFilters.reset();
        }

        LeadSearch.reset();

        if (typeof window !== 'undefined') {
            window.__setAppliedFilters?.(null);
        }

        return [];
    };
    const isReadOnlySuperUser = userRoles.includes("Read Only Super User");

    const dataFormatters = {
        assignedUserId: (row) => {
            const id = Number(row?.assignedUserId);

            // -1 = current admin
            if (id === -1) return '-';

            // lookup from owners map
            return owners?.[id] || '-';
        }
    };

    const sortedLeads = useMemo(() => {
        if (!updateTimeSortDirection) return leads;

        return [...leads].sort((a, b) => {
            const aTime = parseUpdateTime(a?.updateTime);
            const bTime = parseUpdateTime(b?.updateTime);

            return updateTimeSortDirection === 'asc'
                ? aTime - bTime
                : bTime - aTime;
        });
    }, [leads, updateTimeSortDirection]);

    useEffect(() => {
        if (selectAllRef.current) {
            selectAllRef.current.indeterminate = isIndeterminate;
        }
    }, [isIndeterminate]);

    // Load IVR availability once on table load so click action is immediate.
    useEffect(() => {
        const fetchIvrServiceAvailability = async () => {
            try {
                const res = await xFetch({ path: '/services/invite/getIVRDetails', method: 'GET' });
                const ivrData = res?.data || {};
                const isAvailable = Boolean(
                    ivrData.hasKnowlarityIntegration ||
                    ivrData.hasVoxbayIntegration ||
                    ivrData.hasSmartTGIntegration ||
                    ivrData.hasSmartfloIntegration ||
                    ivrData.hasCallerDeskIntegration ||
                    ivrData.hasBonvoiceIntegration
                );
                setHasIvrService(isAvailable);
            } catch (error) {
                console.error('Failed to fetch IVR service availability:', error);
                setHasIvrService(false);
            }
        };

        fetchIvrServiceAvailability();
    }, []);

    // Clear selected leads when leads data changes (on refresh)
    useEffect(() => {
        if (selectedLeadIds.length > 0 && leads.length > 0) {
            // Check if any selected IDs are still in the current data
            const currentIds = new Set(leads.map(l => l.invitationId));
            const stillSelected = selectedLeadIds.filter(id => currentIds.has(id));
            
            // If none of the selected IDs are in current data, clear selection
            if (stillSelected.length === 0) {
                setSelectedLeadIds([]);
            } else if (stillSelected.length !== selectedLeadIds.length) {
                // Some selections are gone, update to only keep valid ones
                setSelectedLeadIds(stillSelected);
            }
        }
    }, [leads]);

    // Expose refresh function with callback support
    useEffect(() => {
        window.tableRefresh = (callback) => xLeads(callback);
        return () => {
            delete window.tableRefresh;
        };
    }, []);

    // ==================== SUBORDINATES LOGIC FOR COUNSELLOR ====================

    useEffect(() => {
        const fetchSubordinates = async () => {
            if ( User._id == -1 || userRoles.includes("Read Only Super User")) {
                setSubOrdinates(userRoles.includes("Read Only Super User") ? ['-1'] : [String(User._id)]);
                setIsSubordinatesLoaded(true);
                return;
            }
            try {
                const data = await xFetch({ 
                    path: `/services/profile/getSubordinates?userId=${User._id}&time=${new Date().getTime()}` 
                })
            
                let subs = [];

                if (Array.isArray(data)) {
                    subs = data;
                }
                else if (data && typeof data === 'object' && Array.isArray(data.subordinates || data.data)) {
                    subs = data.subordinates || data.data || [];
                } 
                else if (typeof data === 'string') {
                    try {
                        subs = JSON.parse(data);
                        if (!Array.isArray(subs)) subs = [];
                    } catch (e) {
                        console.error("Failed to parse subordinates string:", e);
                        subs = [];
                    }
                }
                
                const formattedSubs = Array.isArray(subs) 
                    ? subs.map(id => String(id).trim()).filter(id => id !== '')
                    : [];

                console.log("Final subordinates array:", formattedSubs);

                setSubOrdinates(formattedSubs.length > 0 ? formattedSubs : [String(User._id)]);

            } catch (err) {
                setSubOrdinates([String(User._id)]);
            } finally {
                setIsSubordinatesLoaded(true);
            }
        }

        fetchSubordinates();
    }, []);

    async function xLeads(callback, sortOverride = null) {
        // Clear selected leads when table refreshes (use ref to avoid stale closure)
        if (selectedLeadIdsRef.current.length > 0) {
            setSelectedLeadIdsRef.current([]);
        }

        const isSortRequest = Boolean(sortOverride?.sortField || sortOverride?.sortDirection);
        if (isSortRequest) {
            setIsUpdateTimeSorting(true);
        }

        let limit = LeadsPerPage.value();
        let total = TotalLeads.value() || 0;

        let maxPage = Math.max(1, Math.ceil(total / limit));
        let currentPage = LeadsCurrentPage.value();

        if (currentPage < 1) currentPage = 1;
        if (currentPage > maxPage) currentPage = maxPage;

        LeadsCurrentPage.setValue(currentPage);

        let offset = (currentPage - 1) * limit;
        
        let filters = LeadFilters.value();
        offset = Math.max(0, offset);
        let payload = {
            testId: testInfo?.testId || Test._id,
            testType: testInfo?.testType || Test.type,
            owner: subOrdinates.join(','),
            isTelecaller: User.telecaller ? 1 : 0,
            order: "asc",
            offset,
            limit,
            search: LeadSearch.value()
        };

        const activeSortDirection = sortOverride?.sortDirection || updateTimeSortDirection;
        const activeSortField = sortOverride?.sortField || (activeSortDirection ? 'updateTime' : null);

        if (activeSortField && activeSortDirection) {
            payload.sortField = activeSortField;
            payload.sortDirection = activeSortDirection;
        }

        // Add branchId (corporateId) to payload if provided
        if (branchId) {
            payload.corporateId = branchId;
        }

        if (filters.length > 0) {
            // Show the applied filters bar with proper clear handler
            showAppliedFilter(filters, () => {
                // This is called when user clicks × in AppliedFilters
                LeadFilters.reset();
                LeadsCurrentPage.setValue(1);
                xLeads(callback); // refresh immediately - pass callback
            });

            // Apply filters to payload
            filters.forEach(item => {
                payload[item.query] = item.value;
            });
        } else {
            // Optional: hide filters bar if no filters
            if (typeof window !== 'undefined') {
                window.__setAppliedFilters?.(null);
            }
        }

        xFetch({ path: '/services/invite/enquiries', payload })
            .then(data => {
                const rows = data?.rows || [];
                const total = parseInt(data?.total || 0);

                if (rows.length === 0 &&
                    total > 0 &&
                    LeadsCurrentPage.value() > 1 &&
                    !LeadSearch.value()
                    ) {
                    LeadsCurrentPage.setValue(1);
                    xLeads(callback); // recursive call - pass callback
                    return;
                }
                // Update state
                setLeadsFn(rows);
                TotalLeads.setValue(total);
                
                // Call onTableRefresh FIRST to update pagination and stop its spinner
                if (typeof window.onTableRefresh === 'function') window.onTableRefresh();
                
                // Then call callback to stop any other spinners (e.g., LeadMenu search spinner)
                if (callback) callback();
                if (isSortRequest) setIsUpdateTimeSorting(false);
            })
            .catch(err => {
                console.error('Error loading leads:', err);
                // Call onTableRefresh FIRST to stop pagination spinner
                if (typeof window.onTableRefresh === 'function') window.onTableRefresh();
                // Then call callback to stop other spinners
                if (callback) callback();
                if (isSortRequest) setIsUpdateTimeSorting(false);
            });
    }

    const handleShowExtendedForm = (invitationId) => {
        // Optional: check google drive linked here (you can move isGoogleDriveLinked logic)
        setExtendedFormInvitationId(invitationId);
        setShowExtendedFormModal(true);
    };

    /* =======================
       NAME + BOOKMARK
    ======================= */
    const renderNameCell = (row) => {
        const canEditLead = !isReadOnlySuperUser && (isAdmin || row.status !== 'Joined');
        return (
            <div className="flex items-center gap-2">
                <span className="font-medium text-slate-800">{`${row.firstName} ${row.lastName}`}
                    {/* Edit */}
                    {canEditLead && (
                        <i
                            className="ri-pencil-fill ml-1.5 text-amber-500 cursor-pointer text-[14px]"
                            title="Edit Lead"
                            onClick={(e) => {
                            e.stopPropagation();
                            setSelectedCandidate(row);
                            setShowUpdatePopup(true);
                            }}
                        />
                    )}
                </span>
            </div>
        );
    };

    /* =======================
       MOBILE + WHATSAPP + IVR
    ======================= */
    const renderMobileCell = (row) => {
        const primaryMobile = (row.mobile || "").toString().trim();
        const alternateMobile = (row.altMobile || "").toString().trim();

        // Display text
        let phone = "-";

        if (primaryMobile && primaryMobile !== "null") {
            phone = primaryMobile;
            if (alternateMobile && alternateMobile !== "null") {
                phone += `, ${alternateMobile}`;
            }
        } else if (alternateMobile && alternateMobile !== "null") {
            phone = alternateMobile;
        }

        // Number used for call/whatsapp
        let dialNumber = primaryMobile || alternateMobile || "";

        // Normalize like old formatter
        let normalizedNumber = dialNumber;

        if (normalizedNumber.length === 10) {
            normalizedNumber = "91" + normalizedNumber;
        } else if (
            normalizedNumber.length === 11 &&
            normalizedNumber.charAt(0) === "0"
        ) {
            normalizedNumber = normalizedNumber.slice(1);
            normalizedNumber = "91" + normalizedNumber;
        }

        return (
            <div className="flex items-center gap-2">
                <span>{phone}</span>

                {phone !== "-" && (
                    <>
                        {/* WhatsApp */}
                        <i
                            className="ri-whatsapp-line text-green-600 cursor-pointer"
                            title="WhatsApp"
                            onClick={(e) => {
                                e.stopPropagation();
                                window.open(
                                    `https://wa.me/${normalizedNumber}?text=hello`,
                                    "_blank"
                                );
                            }}
                        />

                        {/* IVR / Dialer */}
                        {hasIvrService ? (
                            <i
                                className="ri-customer-service-2-line text-blue-600 cursor-pointer"
                                title="Call via IVR"
                                onClick={(e) => {
                                    e.stopPropagation();
                                    setCallerCandidate(row);
                                    setShowCallerDeskIVR(true);
                                }}
                            />
                        ) : (
                            <div className="mobiletel">
                                <a
                                    href={`tel:+${normalizedNumber}`}
                                    onClick={(e) => e.stopPropagation()}
                                >
                                    <i
                                        className="ri-customer-service-2-line text-blue-600 cursor-pointer"
                                        title="Call via Dialer"
                                    />
                                </a>
                            </div>
                        )}
                    </>
                )}
            </div>
        );
    };

    const handleShowTimeline = (lead) => {
        setSelectedLeadForTimeline(lead);
        setShowTimeline(true);
    };

    const getSiblingForRouteData = (lead) => {
        setSelectedLeadForRouteData(lead);
        setShowRouteData(true);
    };

    const refreshLeads = () => {
        xLeads();
    };

    const handleAbortAICall = async (row) => {
        const invitationId = row?.invitationId;
        if (!invitationId) {
            return;
        }

        const confirmed = window.confirm("Do you want to abort the furthur AI calls?");
        if (!confirmed) {
            return;
        }

        try {
            const res = await xFetch({
                path: '/services/xtremeGen/abortAIcall',
                method: 'POST',
                payload: { invitationId }
            });

            if (res?.status === false) {
                throw new Error(res?.error || res?.message || 'Failed to abort AI call');
            }

            setLeads((prev) =>
                prev.map((lead) =>
                    lead.invitationId === invitationId
                        ? { ...lead, status: 'AI Abort' }
                        : lead
                )
            );
        } catch (error) {
            console.error('AI abort failed:', error);
            alert(error?.message || 'Unable to abort AI call');
        }
    };
    
    const renderStatusTimelineCell = (row) => {
        const status = row.status || "-";
        const currentCorporateId = Number(
            branchId || Corporate?._id || Corporate?.id || Corporate?.corporateId || 0
        );
        const normalizedStatus = typeof status === 'string' ? status.trim().toUpperCase() : '';
        const shouldShowAIAbort =
            currentCorporateId === 658 &&
            normalizedStatus.startsWith('AI') &&
            normalizedStatus !== 'AI ABORT';

        // Status pill color mapping (same as before)
        const STATUS_MAP = {
            "Phone Not Picked": "bg-sky-500",
            "May Visit": "bg-indigo-500",
            "Visited": "bg-blue-500",
            "Hot Lead": "bg-red-500",
            "Warm Lead": "bg-amber-500",
            "Send Reminder": "bg-purple-500",
            "Joined": "bg-green-500",
            "Follow Up": "bg-orange-500",
            "Not Interested": "bg-gray-400",
            "PostMeeting FollowUp": "bg-cyan-500",
        };

        const pillColor = STATUS_MAP[status] || "bg-slate-400";

        // Followup Date logic (red link if missing)
        let followupDisplay = "";
        const followupDate = row.followupDate;

        if(followupDate && followupDate.trim() !== '' && row.isFollowupType === "1"){
            followupDisplay = (
            <span className="text-gray-600 text-xs ml-1.5">[{followupDate}]</span>
            );
        }
        
        if ( (!followupDate || followupDate.trim() === "" ) && row.isFollowupType === "1") {
            followupDisplay = (
                <span className="text-gray-600 text-xs ml-1.5">
                    <span
                        className="text-red-600 text-xs font-medium cursor-pointer hover:underline"
                        onClick={(e) => {
                        e.stopPropagation();
                        setSelectedCandidate(row);
                        setShowUpdatePopup(true);
                        }}
                    > [Specify Followup Date]
                    </span>
                </span>
            );
        }

        // Trainer name (if exists)
        const trainerName = row.trainerName ? (
            <span className="text-gray-500 text-xs ml-2">Trainer: {row.trainerName}</span>
        ) : null;

        // Icons section
        const timelineIcon = (
            <button
            type="button"
            className="text-blue-600 hover:text-blue-800 transition-colors"
            title="View Timeline"
            onClick={() => handleShowTimeline(row)}
            >
            <i className="ri-history-line text-xl" />
            </button>
        );

        const aiAbortIcon = shouldShowAIAbort ? (
            <button
                type="button"
                className="text-rose-600 hover:text-rose-700 transition-colors"
                title="AI Abort"
                onClick={() => handleAbortAICall(row)}
            >
                <i className="ri-stop-circle-line text-xl" />
            </button>
        ) : null;

        let extraIcons = null;
        if (status.toLowerCase().includes("meeting")) {
            extraIcons = (
            <div className="flex items-center gap-3">
                {timelineIcon}
                <button
                type="button"
                className="text-indigo-600 hover:text-indigo-800 transition-colors"
                title="View Meeting Details"
                onClick={() => showCandidateMeetingDetails(row.invitationId)} // ← your PHP function
                >
                <i className="ri-video-chat-line text-xl" />
                </button>
                {aiAbortIcon}
            </div>
            );
        }

        return (
            <div className="flex items-center gap-2 flex-wrap">
            {/* Status Pill */}
            <span className={`px-3 py-1 rounded-full text-xs font-medium text-white ${pillColor} whitespace-nowrap`}> {status} </span>

            {/* Followup Date */}
            {followupDisplay}

            {/* Trainer Name */}
            {trainerName}

            {/* Icons (timeline always, + video if Meeting, + AI Abort if eligible) */}
            {extraIcons || (
                <div className="flex items-center gap-3">
                    {timelineIcon}
                    {aiAbortIcon}
                </div>
            )}

            {/* Trainer name as fallback if no extra icons */}
            {!extraIcons && trainerName}
            </div>
        );
    };

    const renderProbability = (row) => {
        const value = Number(row.leadProbability || 0);
        if(value == 0) 
            return '-';

        let icon = "";
        let border = "";
        let bg = "";

        if (value >= 70) {
            icon = "🔥";
            border = "border-green-500";
            bg = "bg-green-100";
        } else if (value >= 40) {
            icon = "⏳";
            border = "border-amber-500";
            bg = "bg-amber-100";
        } else if (value > 0) {
            icon = "🧊";
            border = "border-slate-400";
            bg = "bg-slate-100";
        }

        return (
            <div
                className={`w-7 h-7 rounded-full flex items-center justify-center
                border ${border} ${bg} text-[13px]`}
                title={`${value}%`}
            >
                {icon}
            </div>
        );
    };

    const renderRemarkCell = (row) => {
        let remarksText = row.remarks || "";
        let audioSrc = "";

        // Extract audio src safely
        const audioMatch = remarksText.match(/<audio[^>]*src=["']([^"']+)["'][^>]*>/i);
        if (audioMatch) {
            audioSrc = audioMatch[1];
            remarksText = remarksText.replace(/<audio[^>]*>.*?<\/audio>/gi, "").trim();
        }

        // Clean text (strip HTML if you don't want rendering, or keep safe HTML)
        const tempDiv = document.createElement("div");
        tempDiv.innerHTML = remarksText;
        let safeText = tempDiv.textContent || tempDiv.innerText || "";
        safeText = safeText.replace(/\r\n/g, "\n").replace(/\r/g, "\n");
        safeText = safeText.replace(/\n{2,}/g, "\n").trim();

        // Add latest remarks date prefix
        if (row.latestRemarksDate) {
            safeText = `${row.latestRemarksDate}: ${safeText}`;
        }

        safeText = safeText.replace(/\n{2,}/g, "\n").trim();

        let displayValue = safeText.replace(/\n/g, "<br/>");
        let plainText = safeText;

        if (Corporate?.type !== 800 && row.additionalInfo && row.additionalInfo.trim().length > 0) {
            if (displayValue.length > 0) {
                displayValue += "<br/>";
            }
            displayValue +=
                '<font color="GREEN"><span class="glyphicon glyphicon-user"></span>&nbsp;-&nbsp;'
                + row.additionalInfo
                + '</font>';

            plainText = plainText ? `${plainText} - ${row.additionalInfo}` : row.additionalInfo;
        }

        const truncated = plainText.length > 120;
        const shortPlain = truncated ? plainText.substring(0, 120) : plainText;
        const escDiv = document.createElement("div");
        escDiv.textContent = shortPlain;
        const shortHtml = escDiv.innerHTML;

        // We give each expandable block a unique-ish id
        const blockId = `remarks-${row.id || Math.random().toString(36).slice(2, 10)}`;

        // Truncate + expand logic (same as before, but cleaner HTML)
        const html = truncated ? `
            <div data-remarks-id="${blockId}">
                <span>${shortHtml} <span class="text-blue-600 cursor-pointer hover:underline view-more" 
                    data-action="expand"> (view more)</span></span>
                <div class="full-remarks hidden mt-1">
                    ${displayValue}
                    <span class="text-red-600 cursor-pointer hover:underline ml-2 view-more" 
                        data-action="collapse"> (hide)</span>
                </div>
            </div>
        ` : displayValue;

        if ((!html || html.trim() === "") && !audioSrc) {
            return <div className="text-gray-400">-</div>;
        }

        return (
            <div className="min-w-[220px] max-w-[520px] space-y-3">
            {/* Audio player on left, fixed width */}
            {audioSrc && (
                <div className="h-8 w-[220px] min-w-[180px]">
                <audio
                    controls
                    className="h-8 w-[160px] min-w-[140px]"
                    style={{ margin: 0, padding: 0 }}
                >
                    <source src={audioSrc} type="audio/mpeg" />
                    Your browser does not support audio.
                </audio>
                </div>
            )}

            {/* Remarks text */}
            <div
                className="text-sm text-gray-800 break-words leading-relaxed"
                style={{
                    lineHeight: "1.45",
                    wordBreak: "break-word",
                    overflowWrap: "break-word",
                }}
                dangerouslySetInnerHTML={{ __html: html }}
            />
            </div>
        );
    };

    
    const PopupModal = ({ isOpen, onClose, title, children, onCopy }) => {
        if (!isOpen) return null;

        return (
            <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
            <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full max-h-[85vh] overflow-y-auto m-4">
                <div className="sticky top-0 bg-white px-6 py-4 border-b flex items-center justify-between">
                <h3 className="text-lg font-semibold text-gray-900">{title}</h3>
                <div className="flex items-center gap-3">
                    {onCopy && (
                    <button
                        onClick={onCopy}
                        className="text-gray-600 hover:text-gray-900 px-3 py-1.5 rounded hover:bg-gray-100 text-sm"
                    >
                        Copy
                    </button>
                    )}
                    <button
                    onClick={onClose}
                    className="text-gray-500 hover:text-gray-700 text-2xl leading-none"
                    >
                    x
                    </button>
                </div>
                </div>
                <div className="px-6 py-5 text-sm text-gray-800 leading-relaxed whitespace-pre-wrap">
                {children}
                </div>
            </div>
            </div>
        );
    };

    const prettifyAction = (action = '') => {
        if (!action) return 'Not set';
        return action
            .replace(/_/g, ' ')
            .split(' ')
            .filter(Boolean)
            .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
            .join(' ');
    };

    const normalizeSuggestionResponse = (res) => {
        const full = res?.full || {};
        const review = full?.conversation_review || {};
        const mistakes = Array.isArray(review?.mistakes) ? review.mistakes.filter(Boolean) : [];
        const improvements = Array.isArray(review?.improvements) ? review.improvements.filter(Boolean) : [];
        const tips = Array.isArray(full?.tips) ? full.tips.filter(Boolean) : [];

        return {
            source: res?.source || '',
            summary: res?.summary || '',
            conversationId: res?.conversation_id || '',
            action: res?.action || '',
            recommendedAction: full?.recommended_action || '',
            conversionProbability: Number(full?.conversion_probability || 0),
            confidence: Number(full?.confidence || 0),
            nextStep: full?.next_step || '',
            whatsappMessage: full?.whatsapp_message || '',
            callScript: full?.call_script || '',
            tips,
            hrReply: full?.hr_reply || '',
            reviewQuality: review?.quality || '',
            reviewMistakes: mistakes,
            reviewImprovements: improvements,
            raw: res
        };
    };

    const formatSuggestionForModal = (s) => {
        if (!s) return 'No AI suggestion available.';

        const lines = [];
        lines.push(`Recommended Action: ${prettifyAction(s.recommendedAction)}`);
        if (s.conversionProbability > 0) lines.push(`Conversion Probability: ${s.conversionProbability}%`);
        if (s.confidence > 0) lines.push(`Confidence: ${s.confidence}%`);
        if (s.nextStep) lines.push(`Next Step:\n${s.nextStep}`);
        if (s.whatsappMessage) lines.push(`WhatsApp Message:\n${s.whatsappMessage}`);
        if (s.callScript) lines.push(`Call Script:\n${s.callScript}`);
        if (s.tips.length > 0) lines.push(`Tips:\n${s.tips.map((t) => `- ${t}`).join('\n')}`);
        if (s.reviewQuality) lines.push(`Conversation Quality: ${s.reviewQuality}`);
        if (s.reviewMistakes.length > 0) lines.push(`Mistakes:\n${s.reviewMistakes.map((m) => `- ${m}`).join('\n')}`);
        if (s.reviewImprovements.length > 0) lines.push(`Improvements:\n${s.reviewImprovements.map((m) => `- ${m}`).join('\n')}`);
        if (s.hrReply) lines.push(`AI Reply for HR:\n${s.hrReply}`);

        return lines.join('\n\n');
    };

    const AINextStepCell = ({ lead }) => {
        const invitationId = lead.invitationId;
        const safeName = (lead.firstName || lead.name || 'there').trim();
        const phone = (lead.mobile || lead.altMobile || lead.additional_mobile || '').replace(/\D/g, '');

        const [suggestion, setSuggestion] = useState(null);
        const [loading, setLoading] = useState(false);
        const [error, setError] = useState(null);
        const [showModal, setShowModal] = useState(false);
        const [modalTitle, setModalTitle] = useState('');
        const [modalContent, setModalContent] = useState('');
        const [showConversationModal, setShowConversationModal] = useState(false);
        const [hrMessage, setHrMessage] = useState('');
        const [conversationReply, setConversationReply] = useState('');
        const [conversationLoading, setConversationLoading] = useState(false);

        const initialSummary = lead.aiNextStep || lead.aINextStep || 'No AI suggestion yet';

        const fetchSuggestion = async (action, extraPayload = {}) => {
            setLoading(true);
            setError(null);
            try {
                const payload = { invitationId, action, ...extraPayload };
                const res = await xFetch({
                    path: '/services/invite/getAINextStepSuggestion',
                    method: 'POST',
                    payload,
                });

                if (!res?.status) {
                    throw new Error(res?.error || 'Failed to fetch AI suggestion');
                }

                const normalized = normalizeSuggestionResponse(res);
                setSuggestion(normalized);
                return normalized;
            } catch (err) {
                const message = err?.message || 'Could not load AI suggestion';
                setError(message);
                return null;
            } finally {
                setLoading(false);
            }
        };

        const handleGenerateNextStep = async () => {
            const data = await fetchSuggestion('generate_next_step', { forceGenerate: true });
            if (!data) return;
            setModalTitle('Generated Next Step');
            setModalContent(formatSuggestionForModal(data));
            setShowModal(true);
        };

        const handleWhatsapp = async () => {
            const data = await fetchSuggestion('whatsapp');
            if (!data) return;

            const message = (data.whatsappMessage || `Hi ${safeName}, just following up.`)
                .replace(/{{firstName}}|{{name}}|\[Name\]/gi, safeName);
            const encoded = encodeURIComponent(message);
            window.open(`https://wa.me/${phone}?text=${encoded}`, '_blank');
        };

        const handleCallScript = async () => {
            const data = await fetchSuggestion('call_script');
            if (!data) return;
            const script = data.callScript || data.nextStep || 'No call script available.';
            setModalTitle('Call Script');
            setModalContent(script);
            setShowModal(true);
        };

        const handleConversationReview = async () => {
            const data = await fetchSuggestion('conversation_review');
            if (!data) return;
            const text = formatSuggestionForModal({
                ...data,
                whatsappMessage: '',
                callScript: '',
                nextStep: ''
            });
            setModalTitle('Conversation Review');
            setModalContent(text);
            setShowModal(true);
        };

        const handleLatestSuggestion = async () => {
            const data = await fetchSuggestion('latest_suggestion');
            if (!data) return;
            setModalTitle('Latest AI Suggestion');
            setModalContent(formatSuggestionForModal(data));
            setShowModal(true);
        };

        const openConversationAssistant = async () => {
            const data = suggestion || await fetchSuggestion('latest_suggestion');
            if (!data) return;
            setConversationReply(data.hrReply || '');
            setShowConversationModal(true);
        };

        const submitHRConversation = async () => {
            const cleaned = hrMessage.trim();
            if (!cleaned) return;

            setConversationLoading(true);
            try {
                const data = await fetchSuggestion('hr_conversation', { hrMessage: cleaned });
                if (data) {
                    setConversationReply(data.hrReply || data.nextStep || 'No response generated.');
                    setHrMessage('');
                }
            } finally {
                setConversationLoading(false);
            }
        };

        const copyModalContent = () => {
            navigator.clipboard.writeText(modalContent || '').catch(() => {});
        };

        return (
            <>
            <div className="min-w-[260px] max-w-[520px] space-y-2 text-sm">
                {loading ? (
                <div className="text-blue-600 animate-pulse">Working...</div>
                ) : error ? (
                <div className="text-red-600">
                    {error}
                    <button onClick={handleLatestSuggestion} className="ml-2 underline text-xs">
                    Retry
                    </button>
                </div>
                ) : (
                <>
                    <div className="font-medium text-gray-800 flex items-baseline gap-2 flex-wrap">
                    {suggestion?.summary || initialSummary}
                    {suggestion?.confidence > 0 && (
                        <span className="text-xs text-gray-500">(conf: {suggestion.confidence}%)</span>
                    )}
                    </div>

                    <div className="flex flex-wrap gap-4 mt-2">
                    <button
                        title="Generate Next Step"
                        onClick={handleGenerateNextStep}
                        disabled={loading}
                        className="text-purple-600 hover:text-purple-800"
                    >
                        <i className="ri-sparkling-2-line text-xl" />
                    </button>

                    <button
                        title="WhatsApp"
                        onClick={handleWhatsapp}
                        disabled={loading || !phone}
                        className={`text-green-600 hover:text-green-800 ${!phone ? 'opacity-40' : ''}`}
                    >
                        <i className="ri-whatsapp-line text-xl" />
                    </button>

                    <button
                        title="Call Script"
                        onClick={handleCallScript}
                        disabled={loading}
                        className="text-blue-600 hover:text-blue-800"
                    >
                        <i className="ri-phone-fill text-xl" />
                    </button>

                    <button
                        title="Conversation Review"
                        onClick={handleConversationReview}
                        disabled={loading}
                        className="text-rose-600 hover:text-rose-800"
                    >
                        <i className="ri-error-warning-line text-xl" />
                    </button>

                    <button
                        title="View Latest Suggestion"
                        onClick={handleLatestSuggestion}
                        disabled={loading}
                        className="text-indigo-600 hover:text-indigo-800"
                    >
                        <i className="ri-eye-fill text-xl" />
                    </button>

                    <button
                        title="AI Conversation"
                        onClick={openConversationAssistant}
                        disabled={loading}
                        className="text-amber-600 hover:text-amber-800"
                    >
                        <i className="ri-message-3-line text-xl" />
                    </button>
                    </div>
                </>
                )}
            </div>

            <PopupModal
                isOpen={showModal}
                onClose={() => setShowModal(false)}
                title={modalTitle}
                onCopy={copyModalContent}
            >
                {modalContent}
            </PopupModal>

            <PopupModal
                isOpen={showConversationModal}
                onClose={() => setShowConversationModal(false)}
                title="AI Conversation Assistant"
            >
                <div className="space-y-4">
                    <div className="text-sm border rounded-md p-3 bg-slate-50 whitespace-pre-wrap">
                        <div className="font-semibold mb-1">Latest Suggestion</div>
                        {formatSuggestionForModal(suggestion)}
                    </div>

                    {conversationReply ? (
                        <div className="text-sm border rounded-md p-3 bg-emerald-50 whitespace-pre-wrap">
                            <div className="font-semibold mb-1">AI Reply</div>
                            {conversationReply}
                        </div>
                    ) : null}

                    <textarea
                        value={hrMessage}
                        onChange={(e) => setHrMessage(e.target.value)}
                        placeholder="Write your message for AI. It will use the previous conversation context."
                        rows={4}
                        className="w-full border rounded-md p-3 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                    />
                    <div className="flex justify-end">
                        <button
                            onClick={submitHRConversation}
                            disabled={conversationLoading || !hrMessage.trim()}
                            className="bg-indigo-600 text-white rounded px-4 py-2 text-sm disabled:opacity-50"
                        >
                            {conversationLoading ? 'Sending...' : 'Ask AI'}
                        </button>
                    </div>
                </div>
            </PopupModal>
            </>
        );
    };

    const showConnectGoogleDriveDialog = () => {
        setShowGoogleConnectDialog(true);
    };

    const handleOpenDocuments = async (invitationId) => {
        // ─── 1. Check if we already know the status ───
        if (googleDriveConnected === true) {
            setDocsModalInvitationId(invitationId);
            setShowDocsModal(true);
            return;
        }

        if (googleDriveConnected === false) {
            showConnectGoogleDriveDialog();
            return;
        }

        // ─── 2. First time → fetch corporate details ───
        try {
            const corporateData = await xFetch({
                path: `/services/profile/getCorporateDetails?time=${Date.now()}`,
            });

            const isConnected = corporateData?.google_drive_connected === true;

            setGoogleDriveConnected(isConnected);
            setGoogleDriveToken(corporateData?.google_drive_token || "");

            if (isConnected) {
                setDocsModalInvitationId(invitationId);
                setShowDocsModal(true);
            } else {
                showConnectGoogleDriveDialog();
            }
        } catch (err) {
            console.error("Failed to check Google Drive status:", err);
            // Decide what to do – for now show dialog as fallback
            showConnectGoogleDriveDialog();
        }
    };

    const ConfirmDialog = ({ isOpen, onClose, title, message, onConfirm }) => {
        if (!isOpen) return null;

        return (
            <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-60">
            <div className="bg-white rounded-xl shadow-2xl max-w-md w-full mx-4 overflow-hidden">
                {/* Header */}
                <div className="px-6 py-4 border-b bg-gray-50">
                <h3 className="text-lg font-semibold text-gray-900">{title}</h3>
                </div>

                {/* Body */}
                <div className="px-6 py-5 text-gray-700">
                <p className="text-sm leading-relaxed">{message}</p>
                </div>

                {/* Footer */}
                <div className="px-6 py-4 border-t bg-gray-50 flex justify-end gap-3">
                <button
                    onClick={onClose}
                    className="px-4 py-2 text-gray-600 hover:bg-gray-100 rounded-lg transition"
                >
                    Cancel
                </button>
                <button
                    onClick={() => {
                    onConfirm?.();
                    onClose();
                    }}
                    className="px-5 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition"
                >
                    Connect Now
                </button>
                </div>
            </div>
            </div>
        );
    };

    const renderAINextStepCell = (row) => {
        return <AINextStepCell lead={row} />;
    };

    const renderActionCell = (row) => {
        return (
            <div className="action-column flex items-center">
            {/* Route Data */}
            <button
                title="Route Data"
                onClick={() =>
                    getSiblingForRouteData(row)
                }
                className="p-1 rounded hover:bg-gray-100 transition"
            >
                <i className="ri-share-forward-line text-lg text-blue-600" />
            </button>

            {/* Bookmark */}

            <button
                title={row.bookmark === "1" ? 'Remove Bookmark' : 'Bookmark'}
                onClick={() => toggleBookmark(row)}
                className="p-1 rounded hover:bg-gray-100 transition"
            >
                <i
                className={`text-lg ${
                    row.bookmark === "1"
                    ? 'ri-bookmark-fill text-yellow-500'
                    : 'ri-bookmark-line text-gray-400'
                }`}
            />
            </button>

            {/* Extended Form */}
            {[800, 100].includes(Corporate?.type) && (
                <button
                title="View Application Form Data"
                onClick={() => handleShowExtendedForm(row.invitationId)}
                className="p-1 rounded hover:bg-gray-100 transition"
                >
                <i className="ri-file-list-3-line text-lg text-emerald-600" />
                </button>
            )}

            {/* Corporate Type 800 */}
            {Corporate?.type === 800 && (
                <>
                    <button
                    title="University List"
                    onClick={() => {
                        setUniversityModalInvitationId(row.invitationId);
                        setShowUniversityModal(true);
                    }}
                    className="p-1.5 rounded hover:bg-indigo-50"
                    >
                    <i className="ri-school-line text-xl text-indigo-700" />
                    </button>

                    <button
                    title="Documents"
                    onClick={() => handleOpenDocuments(row.invitationId)}
                    className="p-1.5 rounded hover:bg-sky-50"
                    >
                    <i className="ri-folder-3-line text-xl text-sky-700" />
                    </button>
                </>
            )}
            </div>
        );
    };

    const toggleBookmark = (row) => {
        xFetch({
            path: "/services/invite/bookmark",
            method: "POST",
            payload: {
            invitationId: row.invitationId
            }
        })
        .then((data) => {
        if (data.status === "success") {
            setLeads((prev) =>
            prev.map((l) =>
                l.invitationId === row.invitationId
                ? { ...l, bookmark: data.isBookmarked }
                : l
            )
            );
        }
        })
        .catch((error) => {
            console.error("Bookmark toggle failed", error);
        });
    };

    useEffect(() => {

        if (!isSubordinatesLoaded) return; 

        syncSavedLeadView();
        LeadsCurrentPage.setValue(1);
        xLeads();
        window.tableRefresh = () => xLeads();
        HorizontalScroll();
        return () => {
            delete window.tableRefresh;
        };
    }, [isSubordinatesLoaded, testInfo]);

    useEffect(() => {
        const handleClick = (e) => {
            const target = e.target.closest('.view-more');
            if (!target) return;

            const container = target.closest('[data-remarks-id]');
            if (!container) return;

            const full = container.querySelector('.full-remarks');
            const shortSpan = container.querySelector('span:not(.full-remarks span)');

            if (target.dataset.action === 'expand') {
                full.style.display = 'block';
                shortSpan.style.display = 'none';
            } else if (target.dataset.action === 'collapse') {
                full.style.display = 'none';
                shortSpan.style.display = 'inline';
            }
        };

        document.addEventListener('click', handleClick);
        return () => document.removeEventListener('click', handleClick);
    }, []);

    /* =======================
     TANSTACK COLUMN DEFINITIONS
     ======================= */

    const tableColumns = useMemo(() => {
        const cols = [];

        // Checkbox + Expand column
        cols.push({
        id: 'select',
        size: 60,
        header: () => (
            <input
            ref={selectAllRef}
            type="checkbox"
            checked={
                leads.length > 0 &&
                leads.every(l => selectedLeadIds.includes(l.invitationId))
            }
            onChange={(e) =>
                setSelectedLeadIds(
                e.target.checked ? leads.map(l => l.invitationId) : []
                )
            }
            />
        ),
        cell: ({ row }) => {
            const isExpanded = row.getIsExpanded();
  
            return (
            <div className="flex items-center gap-2">
                {/* Checkbox */}
                <input
                type="checkbox"
                checked={selectedLeadIds.includes(row.original.invitationId)}
                onChange={(e) =>
                    setSelectedLeadIds(
                    e.target.checked
                        ? [...selectedLeadIds, row.original.invitationId]
                        : selectedLeadIds.filter(id => id !== row.original.invitationId)
                    )
                }
                />
                {/* Expand Icon */}
                <button
                type="button"
                onClick={(e) => {
                        e.stopPropagation();
                        row.toggleExpanded();
                    }}
                className="text-lg text-gray-500 hover:text-emerald-600 transition"
                title={isExpanded ? "Collapse" : "Related Enquiries"}
                >
                {row.getIsExpanded() ? (
                        <i className="ri-subtract-line" />
                    ) : (
                        <i className="ri-add-line" />
                    )}
                </button>
            </div>
            );
        },
        });
        
        columnOrder.forEach(col => {
        
        if (col === 'aINextStep' && Corporate?.is_ai_nextstep_enabled !== "1") {
            return; // skip this column entirely
        }
        cols.push({
            accessorKey: col,
            size: col === 'remarks' ? 200 : undefined,
            header: col === 'updateTime' ? (
                <button
                    type="button"
                    onClick={() => {
                        const nextDirection = updateTimeSortDirection === 'asc' ? 'desc' : 'asc';
                        setUpdateTimeSortDirection(nextDirection);
                        xLeads(undefined, { sortField: 'updateTime', sortDirection: nextDirection });
                    }}
                    className="flex w-full items-center justify-between gap-2 rounded px-1 py-0.5 font-semibold text-left cursor-pointer select-none hover:bg-slate-100"
                    title="Toggle update time sort"
                    aria-label="Sort by update time"
                >
                    <span>
                        {columns?.find(c => c.dataField === col)?.displayName
                            || columns?.find(c => c.dataField === col)?.fieldName
                            || 'Update Time'}
                    </span>
                    <span className="flex flex-col items-center justify-center text-[10px] leading-none">
                        <i
                            className={`transition ${
                                updateTimeSortDirection === 'asc'
                                    ? 'ri-arrow-up-s-fill text-emerald-600'
                                    : 'ri-arrow-up-s-line text-slate-400'
                            }`}
                        />
                        <i
                            className={`-mt-1 transition ${
                                updateTimeSortDirection === 'desc'
                                    ? 'ri-arrow-down-s-fill text-emerald-600'
                                    : 'ri-arrow-down-s-line text-slate-400'
                            }`}
                        />
                    </span>
                </button>
            ) : ((col === 'course' && Corporate?.type === 800) ? 'Country' : (columns?.find(c => c.dataField === col)?.displayName
                    || columns?.find(c => c.dataField === col)?.fieldName)),

            cell: ({ row }) => {
                const r = row.original;

                if (col === 'firstName') return renderNameCell(r);
                if (col === 'mobile') return renderMobileCell(r);
                if (col === 'remarks') return renderRemarkCell(r);
                if (col === 'status') return renderStatusTimelineCell(r);
                if (col === 'leadProbability') return renderProbability(r);
                if (col === 'aINextStep') return renderAINextStepCell(r);
                if (col === 'action') return renderActionCell(r);

                if (dataFormatters[col]) return dataFormatters[col](r);

                return r[col] ?? '-';
            }
        });

        });

        return cols;
    }, [columns, columnOrder, leads, selectedLeadIds, updateTimeSortDirection]);

    const table = useReactTable({
        data: sortedLeads,
        columns: tableColumns,
        getCoreRowModel: getCoreRowModel(),
        getRowCanExpand: () => true,
        state: {
            expanded: expandedRows,
        },
        onExpandedChange: setExpandedRows,
        getRowId: (row) => row.invitationId,
    });

    return (
        <>
        <AppliedFilters onOpenAdvanceFilter={onOpenAdvanceFilter} />

        {isUpdateTimeSorting && (
            <div className="mb-2 rounded-lg border border-blue-200 bg-blue-50 px-3 py-2 text-sm text-blue-700 flex items-center gap-2">
                <i className="ri-loader-4-line animate-spin" />
                Sorting by update time...
            </div>
        )}

        <div className="bg-white rounded-xl border flex-1 overflow-x-auto overflow-y-auto">
            <table className="w-full border-collapse text-sm leadstor-table-modern">
            <thead className={`sticky top-0 z-10 ${tableHeader}`}>
                {table.getHeaderGroups().map(headerGroup => (
                <tr key={headerGroup.id}>
                    {headerGroup.headers.map(header => (
                    <th
                        key={header.id}
                        className="p-2 text-left font-semibold border-b whitespace-nowrap"
                        style={{ 
                            width: header.column.columnDef.size 
                                ? `${header.column.columnDef.size}px` 
                                : undefined,
                            minWidth: header.column.columnDef.size 
                                ? `${header.column.columnDef.size}px` 
                                : undefined
                        }}
                    >
                        {flexRender(
                        header.column.columnDef.header,
                        header.getContext()
                        )}
                    </th>
                    ))}
                </tr>
                ))}
            </thead>

            <tbody>
            {table.getRowModel().rows.length === 0 ? (
                <tr>
                <td
                    colSpan={table.getAllColumns().length}
                    className="w-32 text-center py-10 text-slate-500"
                >
                    <div className="flex flex-col items-center gap-2">
                    <i className="ri-search-line text-2xl text-slate-400" />
                    <div className="font-medium">
                        No results found
                    </div>
                    {LeadSearch.value() && (
                        <div className="text-xs">
                        Try adjusting your search or filters
                        </div>
                    )}
                    </div>
                </td>
                </tr>
            ) : (
                table.getRowModel().rows.map(row => (
                    <>
                        {/* Main row */}
                        <tr
                            key={row.id}
                            className="border-b hover:bg-slate-50 transition h-[44px] align-top"
                        >
                            {row.getVisibleCells().map(cell => (
                                <td 
                                    key={cell.id} 
                                    className="p-2 align-top"
                                    style={{ 
                                        width: cell.column.columnDef.size 
                                            ? `${cell.column.columnDef.size}px` 
                                            : undefined,
                                        minWidth: cell.column.columnDef.size 
                                            ? `${cell.column.columnDef.size}px` 
                                            : undefined
                                    }}
                                >
                                    {flexRender(
                                        cell.column.columnDef.cell,
                                        cell.getContext()
                                    )}
                                </td>
                            ))}
                        </tr>

                        {/* Expanded content row — only shown when expanded */}
                        {row.getIsExpanded() && (
                            <tr key={`${row.id}-expanded`}>
                                <td colSpan={table.getAllColumns().length} className="p-0 bg-gray-50">
                                    <div className="p-4">
                                        <RelatedEnquiries
                                            testId={row.original.testId}
                                            emailId={row.original.emailId}
                                            mobile={row.original.mobile}
                                            invitationId={row.original.invitationId}
                                            onOpenTimeline={(lead) => handleShowTimeline(lead)}
                                        />
                                    </div>
                                </td>
                            </tr>
                        )}
                    </>
                ))
                
            )}
            </tbody>

            </table>
        </div>

        {/* MODALS */}
        {showUpdatePopup && (
            <UpdateLead
            selectedLead={selectedCandidate}
            onCancel={() => setShowUpdatePopup(false)}
            onSuccess={() => {
                setShowUpdatePopup(false);
                xLeads();
            }}
            />
        )}

        {showCallerDeskIVR && (
            <CallerDeskIVR
            candidate={callerCandidate}
            onClose={() => setShowCallerDeskIVR(false)}
            onNoIvrFallback={() => {
                const dialNumber = (callerCandidate?.mobile || callerCandidate?.altMobile || '').toString().trim();
                if (dialNumber) {
                    window.location.href = `tel:${dialNumber}`;
                }
            }}
            />
        )}

        {showTimeline && selectedLeadForTimeline && (
            <Timeline
            leadDetails={selectedLeadForTimeline}
            isOpen={showTimeline}
            onClose={() => setShowTimeline(false)}
            xLeads={refreshLeads}
            />
        )}

        {showRouteData && selectedLeadForRouteData && (
            <RouteData
            lead={selectedLeadForRouteData}
            isOpen={showRouteData}
            onClose={() => setShowRouteData(false)}
            onSuccess={refreshLeads}
            />
        )}

        {showExtendedFormModal && extendedFormInvitationId && (
            <ExtendedFormModal
                invitationId={extendedFormInvitationId}
                isOpen={showExtendedFormModal}
                onClose={() => {
                setShowExtendedFormModal(false);
                setExtendedFormInvitationId(null);
                }}
                onRefresh={refreshLeads}   // optional
            />
        )}

        {showUniversityModal && universityModalInvitationId && (
            <UniversityListModal
            invitationId={universityModalInvitationId}
            isOpen={showUniversityModal}
            onClose={() => {
                setShowUniversityModal(false);
                setUniversityModalInvitationId(null);
            }}
            onRefresh={refreshLeads} // optional
            />
        )}

        {showDocsModal && docsModalInvitationId && (
            <DocumentsModal
            invitationId={docsModalInvitationId}
            isOpen={showDocsModal}
            onClose={() => {
                setShowDocsModal(false);
                setDocsModalInvitationId(null);
            }}
            />
        )}

        {showGoogleConnectDialog && (
            <ConfirmDialog
                isOpen={showGoogleConnectDialog}
                onClose={() => setShowGoogleConnectDialog(false)}
                title="Google Drive Connection Required"
                message="Please connect Google Drive to use this feature. Go to Settings → Integration → Google Drive. If it is not connected, candidates will not be able to submit the form."
                onConfirm={() => {
                window.location.href = '/leads/settings/';
                }}
            />
        )}

        {/* STYLES */}
        <style jsx>{`
            /* ===== MODERN CRM TABLE ===== */
            
            .leadstor-table-modern th {
                height: 44px;
                white-space: nowrap;
                overflow: hidden;
                text-overflow: ellipsis;
                vertical-align: top;
            }

            .leadstor-table-modern thead th {
                background: #d4e0ec;
                font-size: 13px;
                font-weight: 600;
                background: #d4e0ec;
                color: #111827;
                height: 44px;
            }
            
            .leadstor-table-modern td {
                vertical-align: top !important;
                padding: 8px 12px !important;
            }

            .leadstor-table-modern td .flex.items-start {
                align-items: flex-start !important;
            }

            .audio-in-remarks {
                margin: 0 !important;
                padding: 0 !important;
            }
        `}</style>
        </>
    );
}

