'use client'

import { useEffect, useState, useRef } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { ToastContainer, toast, Bounce } from 'react-toastify';
import { xFetch, jsonToQueryParams, xDownload, xDownloadBlob} from '@/utility/xFetch';
import { Corporate,User } from '@/utility/TinyDB';
import { Users, ArrowLeft } from 'lucide-react';
import PaymentsTable from './table';
import ReportDropdown from './reportMenu';
import DatePickerModal from '@/components/elements/DatePickerModal';
import TextareaModal from '@/components/elements/TextareaModal';
import FilterPopup from './filterPopup';
import PaymentAnalyticsOfTheDay from './analytics';

export default function PaymentsSectionController() {
    const searchParams = useSearchParams();
    const router = useRouter();
    const branchCorporateId = searchParams.get('corporateId');
    const branchTestId = searchParams.get('testId');
    const branchTestType = searchParams.get('testType');

    const corporateId = Corporate?._id;

    const [leads, setLeads] = useState(null);
    const [counsellor, setCounsellor] = useState([]);
    const [trainer, setTrainer] = useState([]);
    const [filterParams, setFilterParams] = useState({});
    const [filterPopup, setFilterPopup] = useState(false);
    const [openDatePicker, setOpenDatePicker] = useState(false);
    const [sendBulkSMS, setSendBulkSMS] = useState(false);
    const [sendBulkEmail, setSendBulkEmail] = useState(false);
    const searchTimeoutRef = useRef(null);
    const [downloadReport, setDownloadReport] = useState(false);
    const [limitPopup, setLimitPopup] = useState(false);
    const [loading, setLoading] = useState(true);
    const [branchTestInfo, setBranchTestInfo] = useState({ testId: null, testType: null });

    const userRoles = Array.isArray(User.role) 
    ? User.role.map(r => String(r).trim())
    : [String(User.role).trim()];

    // Fetch test info for branch if coming from branch
    useEffect(() => {
        if (branchCorporateId && !branchTestId) {
            // Fetch test list for this corporate
            xFetch({
                path: '/services/profile/getTestList',
                payload: { corporateId: branchCorporateId }
            }).then(testData => {
                if (testData && testData.length > 0) {
                    setBranchTestInfo({
                        testId: testData[0].id || testData[0]._id,
                        testType: testData[0].testType || 'S'
                    });
                }
            }).catch(() => {
                setBranchTestInfo({ testId: null, testType: null });
            });
        } else if (branchTestId && branchTestType) {
            setBranchTestInfo({ testId: branchTestId, testType: branchTestType });
        } else {
            setBranchTestInfo({ testId: null, testType: null });
        }
    }, [branchCorporateId, branchTestId, branchTestType]);

    const [query, setQuery] = useState({
        corporateId: branchCorporateId || Corporate._id,
        search: '',
        order: 'asc',
        offset: 0,
        limit: 50
    });

    const [appliedFilters, setAppliedFilters] = useState({
        selected: {},
        range: {
            from: null,
            to: null
        }
    });

    // Helper Functions
    const pad = (n) => String(n).padStart(2, "0");

    const refresh = () => {
        setQuery((prev) => ({
            ...prev,
            offset: 0
        }));
    }

    const handleKeyUp = (event) => {
        clearTimeout(searchTimeoutRef.current);

        searchTimeoutRef.current = setTimeout(() => {
            setQuery((prev) => ({
                ...prev,
                offset: 0,
                search: event.target.value
            }));
        }, 300);
    };

    const totalRecords = leads?.total || 0;
    const totalPages = Math.ceil(totalRecords / query.limit);
    const currentPage = Math.floor(query.offset / query.limit) + 1;
    const getPages = () => {
        const pages = [];
        const delta = 1; // pages to show around current

        if (totalPages <= 7) {
            // Show all pages if total is small
            for (let i = 1; i <= totalPages; i++) {
            pages.push(i);
            }
            return pages;
        }

        // Always show first page
        pages.push(1);

        const start = Math.max(2, currentPage - delta);
        const end = Math.min(totalPages - 1, currentPage + delta);

        if (start > 2) pages.push("...");

        for (let i = start; i <= end; i++) {
            pages.push(i);
        }

        if (end < totalPages - 1) {
            if (end < totalPages - 2) pages.push("...");
            pages.push(totalPages);
        }

        return pages;
    };

    const changePage = (newPage) => {
        if (newPage < 1 || newPage > totalPages) return;

        setQuery((prev) => ({
            ...prev,
            offset: (newPage - 1) * prev.limit,
        }));
    };

    const changeLimit = (newLimit) => {
        setQuery((prev) => ({
            ...prev,
            limit: newLimit,
            offset: 0,
        }));
        setLimitPopup(false);
    };

    const toggleDueTodayFilter = () => {
        setQuery((prev) => {
            const nextQuery = {
                ...prev,
                offset: 0
            };

            if (prev.dueToday) {
                delete nextQuery.dueToday;
                delete nextQuery.pending;
                return nextQuery;
            }

            nextQuery.dueToday = true;
            nextQuery.pending = true;
            return nextQuery;
        });
    };

    const filterPendingPayments = (e) => {
        let status = (e.target.getAttribute('data-status') === '0');
        e.target.setAttribute('data-status', ((status) ? '1' : '0'));
        let span = e.target.querySelector('span');
        if (span) span.style.display = (status) ? '' : 'none';

        if (status) {
            setQuery((prev) => ({
                ...prev,
                pending: true,
                offset: 0 // reset to first page
            }));

            return;
        }

        // remove `pending` when status is false
        setQuery(prev => {
            const { pending, ...rest } = prev;
            return {
                ...rest,
                offset: 0
            };
        });

    }

    const cbChangePlacementReadyStatus = (id) => {
        xFetch({
            method: 'POST',
            path: '/services/joinees/changePlacementReadystatus',
            payload: { trackingId: id, corporateId: Corporate._id }
        })
            .then(data => {
                toast('Placement Ready Status Updated');
                refresh();
            })
            .catch(error => {
                console.error(`An error occurred while fetching leads`, error);
                toast.error('Server error occurred, Try again');
            });
    }

    const cbDeleteRecord = (id) => {
        xFetch({
            method: 'POST',
            path: '/services/joinees/deleteMyJoineeRecord',
            payload: { trackingId: id }
        })
            .then(data => {
                toast('Joinee Record Deleted');
                refresh();
            })
            .catch(error => {
                console.error(`An error occurred while fetching leads`, error);
                toast.error('Unable to delete, Try again');
            });
    }

    const cbChangeCounsellorOrTrainer = (who, payload) => {
        xFetch({
            method: 'POST',
            path: `/services/joinees/${(who === 'Counsellor') ? 'updateAssignTo' : 'assignTrainer'}`,
            payload: payload
        })
            .then(data => {
                toast(`${who} Updated For Joinee`);
                refresh();
            })
            .catch(error => {
                console.error(`An error occurred while fetching leads`, error);
                toast.error(`Unable to update ${who.toLowerCase()}, Try again`);
            });
    }

    const exportReport = (data) => {
        data['corporateId'] = Corporate._id;
        let target = '';

        switch (data?.type) {
            case 'Collection':
                target = 'paymentReportExcelGenerator';
                break;

            case 'PendingPayment':
                target = 'pendingPaymentReportExcelGenerator';
                break;

            case 'Joinees':
                target = 'joineeReportExcelGenerator';
                break;

            default:
                target = 'joineeReportExcelGenerator';   // fallback
                break;
        }
        console.log(`${target}.php?${jsonToQueryParams(data)}`);
        xDownload(`${target}.php?${jsonToQueryParams(data)}`);

    }

    const downloadJoineesReport = (type) => {
        if (!type) return;

        if (type === 'Joinee@Detailed_Download') {
            xDownload(
                `services/joinees/getJoineesDetailedReport?corporateId=${Corporate._id}`
            );
            return;
        }

        // old columns structure
        const columns = {
            C1: { key: "candidateId", value: "Candidate Tracking Id" },
            C2: { key: "name", value: "Name" },
            C3: { key: "email", value: "Email" },
            C4: { key: "mobile", value: "Mobile" },
            C5: { key: "label", value: "Course Label" },
            C6: { key: "batchName", value: "Batch Name" },
            C7: { key: "doj", value: "Date of Joining" },
            C8: { key: "currency", value: "Currency" },
            C9: { key: "agreedPayment", value: "Agreed Payment" },
            C10: { key: "upcomingPayment", value: "Upcoming Payment" },
            C11: { key: "completedPayment", value: "Completed Installments" },
            C12: { key: "pendingAmount", value: "Pending Installments" },
            C13: { key: "balance", value: "Total Balance" },
            C14: { key: "lastPaymentDate", value: "Last Payment Date" },
            C15: { key: "remarks", value: "Remarks" },
            C16: { key: "source", value: "Source" },
            C17: { key: "assignedUserId", value: "Counsellor" },
            C18: { key: "assignedTrainerId", value: "Trainer" },
            C19: { key: "status", value: "Status" },
            C20: { key: "lastPaymentRefNo", value: "Payment Ref No" },
            C21: { key: "associatedCenters", value: "Associated Centers" },
            C22: { key: "uniqueId", value: "Unique Id" }
        };

        const exportFilters = Object.fromEntries(
            Object.entries(query).filter(([key, value]) => {
                if (['offset', 'limit', 'order', 'corporateId'].includes(key)) {
                    return false;
                }

                return value !== '' && value !== null && value !== undefined;
            })
        );

        const params = new URLSearchParams({
            corporateId: branchCorporateId || Corporate._id,
            corporateType: Corporate.type,
            columnNames: encodeURIComponent(JSON.stringify(columns)),
            filters: new URLSearchParams(exportFilters).toString()
        });

        xDownload(`services/joinees/exportAllJoinees?${params.toString()}`);
        setDownloadReport(false);
    };

    const downloadPaymentReceipt = async (payload) => {
        try {
            await xDownloadBlob(
            `services/joinees/generateReceipt?${jsonToQueryParams(payload)}`
            );

            toast.success('Receipt downloaded successfully');
        } catch (error) {
            console.error('Receipt download failed', error);

            toast.error(
            error?.message || 'Unable to download receipt'
            );
        }
    };

    const base64Encode = (str) => {
        const bytes = new TextEncoder().encode(str);
        return btoa(
            Array.from(bytes, b => String.fromCharCode(b)).join('')
        );
    }

    const sendBulkPaymentAlert = (content, type) => {
        let rows = [...document.querySelectorAll('table#paymentsReportTable tbody td input[type=checkbox]:checked')].map(i => i.id);
        let payload = { content, type, candidates: rows.join(',') };
        checkUncheckRows();

        xFetch({
            method: 'POST',
            path: '/services/joinees/sendPaymentNotification',
            payload: payload
        })
            .then(data => {
                toast(`${type} sent successfully to ${rows.length} joinees.`);
            })
            .catch(error => {
                console.error(`An error occurred while sending notification`, error);
                toast.error('Server error occurred, Try again');
            });
    }

    const openTextArea = (type) => {
        let rows = [...document.querySelectorAll('table#paymentsReportTable tbody td input[type=checkbox]:checked')].map(i => i.id);
        if (rows.length < 1) {
            toast.warning(`Select Joinees to Send ${type}`);
            return;
        }

        if (type === 'SMS') {
            setSendBulkSMS(rows.length);
            return;
        }

        setSendBulkEmail(rows.length);
    }

    const checkUncheckRows = (state = false) => {
        [...document.querySelectorAll('table#paymentsReportTable tbody td input[type=checkbox]')].map(i => i.checked = state);
    }

    useEffect(() => {
        let isMounted = true;

        Promise.all([
            xFetch({
                path: '/services/profile/getUsers',
                payload: { userRole: 'Counsellor', list: 1 }
            }),
            xFetch({
                path: '/services/profile/getUsers',
                payload: { userRole: 'Trainer', list: 1 }
            }),
            xFetch({
                path: '/services/joinees/getFilterParameters',
                payload: { corporateId: Corporate._id }
            })
        ])
            .then(([counsellors, trainers, filterParams]) => {
                if (!isMounted) return;

                setCounsellor(counsellors);
                setTrainer(trainers);
                setFilterParams(filterParams);
            })
            .catch(error => {
                console.error('Error loading initial data', error);
                toast.error('Server error occurred, Try again');
            });

        return () => {
            isMounted = false;
        };
    }, [corporateId]);

    useEffect(() => {
        setLoading(true);
        xFetch({
            path: '/services/joinees/admissions',
            payload: {
                ...query,
                corporateId: branchCorporateId || Corporate._id
            }
        })
            .then(data => {
                setLeads(data);
                setLoading(false);
            })
            .catch(error => {
                console.error(`An error occurred while fetching admissions`, error);
                toast.error('Server error occurred, Try again');
            });
    }, [query, branchCorporateId])

    return (
        <div>
            <ToastContainer
                position="top-right"
                autoClose={3000}
                hideProgressBar={false}
                newestOnTop={false}
                closeOnClick={false}
                rtl={false}
                pauseOnFocusLoss
                draggable
                pauseOnHover
                theme="light"
                transition={Bounce}
            />
            <DatePickerModal
                open={openDatePicker}
                onConfirm={(date) => {
                    const startDate = date?.startDate;
                    const endDate = date?.endDate || date?.startDate;
                    let value = `${startDate.getFullYear()}-${pad(startDate.getMonth() + 1)}-${pad(startDate.getDate())},${endDate.getFullYear()}-${pad(endDate.getMonth() + 1)}-${pad(endDate.getDate())}`;
                    let [type, interval] = openDatePicker?.split('@')
                    let payload = {
                        type,
                        fileName: `ConceptNinjas_${type}_${interval}`,
                        instituteName: Corporate.name,
                        monthInterval: value,
                        qutype: 2
                    }

                    exportReport(payload);
                }}
                onClose={() => setOpenDatePicker(false)}
            />

            <TextareaModal
                open={sendBulkSMS}
                title="SMS 📲"
                description="Enter message to send as Payment Notification over SMS, it will be sent to all selected joinees."
                primaryText="Send SMS"
                placeholder="Enter SMS & signature. Limited to 160 characters."
                onConfirm={(text) => {
                    sendBulkPaymentAlert(text, 'SMS');
                }}
                maxChar={160}
                onClose={() => setSendBulkSMS(false)}
            />

            <TextareaModal
                open={sendBulkEmail}
                title="Email 📤"
                description="Enter message to send as Payment Notification over Email, it will be sent to all selected joinees."
                primaryText="Send Email"
                placeholder="Enter email content & signature."
                rows={8}
                onConfirm={(text) => {
                    sendBulkPaymentAlert(text, 'Email');
                }}
                onClose={() => setSendBulkEmail(false)}
            />

            <FilterPopup
                open={filterPopup}
                onApply={(data) => {
                    let isItClearFilterEvent = !(Object.keys(data?.selected ?? {}).length > 0 || data?.range?.from);
                    // Preserve the applied ones
                    setAppliedFilters(data);

                    // Applying Filter to Query<state>
                    let doj = '';
                    let dojend = '';
                    if (data?.range?.from && data?.range?.to) {
                        doj = `${data.range.from.getFullYear()}-${pad(data.range.from.getMonth() + 1)}-${pad(data.range.from.getDate())}`;
                        dojend = `${data.range.to.getFullYear()}-${pad(data.range.to.getMonth() + 1)}-${pad(data.range.to.getDate())}`;
                    }

                    setQuery(prev => ({
                        ...prev,
                        offset: 0,
                        search: '',
                        ['label']: base64Encode((data?.selected?.course_label ?? []).join(',')),
                        ['source']: (data?.selected?.source ?? []).join(','),
                        ['counsellor']: (data?.selected?.counsellor ?? []).join(','),
                        ['trainer']: (data?.selected?.trainer ?? []).join(','),
                        ['batchid']: (data?.selected?.batch_name ?? []).join(','),
                        ['subServiceId']: (data?.selected?.sub_service ?? []).join(','),
                        ['leadCategoryType']: (data?.selected?.leadCategoryType ?? []).join(','),
                        ['associatedCenters']: (data?.selected?.associatedCenters ?? []).join(','),
                        ['status']: (data?.selected?.status ?? []).join(','),
                        ['doj']: doj,
                        ['dojend']: dojend
                    }));

                }}
                onClose={() => setFilterPopup(false)}
            />

            <div className="bg-white border-b border-slate-200 px-5 py-3 flex justify-between items-center">
                <PaymentAnalyticsOfTheDay
                    onDueTodayClick={toggleDueTodayFilter}
                    dueTodayActive={Boolean(query.dueToday)}
                />

                <div className="flex gap-2">
                    {branchCorporateId && (
                        <>
                            <button
                                className="px-3 py-1.5 text-xs border border-indigo-300 rounded-full bg-indigo-50 text-indigo-600 hover:bg-indigo-100 flex items-center gap-1.5 transition-all"
                                onClick={() => {
                                    const testParams = branchTestInfo.testId && branchTestInfo.testType
                                        ? `&testId=${branchTestInfo.testId}&testType=${branchTestInfo.testType}`
                                        : '';
                                    router.push(`/leads?corporateId=${branchCorporateId}${testParams}`);
                                }}
                            >
                                <Users size={14} />
                                View Leads
                            </button>
                            <button
                                className="px-3 py-1.5 text-xs border border-gray-300 rounded-full bg-gray-50 hover:bg-gray-100 flex items-center gap-1.5 transition-all"
                                onClick={() => router.push('/branches')}
                            >
                                <ArrowLeft size={14} />
                                Back to Branches
                            </button>
                        </>
                    )}
                    <button className="px-4 py-2 text-sm border border-slate-300 rounded bg-slate-50">🔗‍️ Send Payment Link</button>
                    <button className="px-4 py-2 text-sm border border-slate-300 rounded bg-slate-50">📝 Add Note</button>
                    <button className="px-4 py-2 text-sm rounded bg-blue-600 text-white">Payment Analytics</button>
                </div>
            </div>

            <div>
                {/* Controllers */}
                <div className="flex items-center gap-1.5 px-4 py-2 bg-white border-b border-slate-200">
                    <button title='Add Candidate' className="border px-2 py-1.5 rounded" onClick={(e) => router.push('/payments/create')}>
                        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width="20" height="20" color="#505050" fill="none" stroke="#505050" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                            <path d="M15 8C15 5.23858 12.7614 3 10 3C7.23858 3 5 5.23858 5 8C5 10.7614 7.23858 13 10 13C12.7614 13 15 10.7614 15 8Z" />
                            <path d="M17.5 21L17.5 14M14 17.5H21" />
                            <path d="M3 20C3 16.134 6.13401 13 10 13C11.4872 13 12.8662 13.4638 14 14.2547" />
                        </svg>
                    </button>
                    <button title='Send SMS' className="border px-2 py-1.5 rounded" onClick={() => openTextArea('SMS')}>
                        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width="20" height="20" color="#505050" fill="none" stroke="#505050" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                            <path d="M8 13.5H16M8 8.5H12" />
                            <path d="M6.09881 19C4.7987 18.8721 3.82475 18.4816 3.17157 17.8284C2 16.6569 2 14.7712 2 11V10.5C2 6.72876 2 4.84315 3.17157 3.67157C4.34315 2.5 6.22876 2.5 10 2.5H14C17.7712 2.5 19.6569 2.5 20.8284 3.67157C22 4.84315 22 6.72876 22 10.5V11C22 14.7712 22 16.6569 20.8284 17.8284C19.6569 19 17.7712 19 14 19C13.4395 19.0125 12.9931 19.0551 12.5546 19.155C11.3562 19.4309 10.2465 20.0441 9.14987 20.5789C7.58729 21.3408 6.806 21.7218 6.31569 21.3651C5.37769 20.6665 6.29454 18.5019 6.5 17.5" />
                        </svg>
                    </button>
                    <button title='Send Email' className="border px-2 py-1.5 rounded" onClick={() => openTextArea('Email')}>
                        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width="20" height="20" color="#505050" fill="none" stroke="#505050" strokeWidth="1.5" strokeLinejoin="round">
                            <path d="M2 6L8.91302 9.91697C11.4616 11.361 12.5384 11.361 15.087 9.91697L22 6" />
                            <path d="M2.01577 13.4756C2.08114 16.5412 2.11383 18.0739 3.24496 19.2094C4.37608 20.3448 5.95033 20.3843 9.09883 20.4634C11.0393 20.5122 12.9607 20.5122 14.9012 20.4634C18.0497 20.3843 19.6239 20.3448 20.7551 19.2094C21.8862 18.0739 21.9189 16.5412 21.9842 13.4756C22.0053 12.4899 22.0053 11.5101 21.9842 10.5244C21.9189 7.45886 21.8862 5.92609 20.7551 4.79066C19.6239 3.65523 18.0497 3.61568 14.9012 3.53657C12.9607 3.48781 11.0393 3.48781 9.09882 3.53656C5.95033 3.61566 4.37608 3.65521 3.24495 4.79065C2.11382 5.92608 2.08114 7.45885 2.01576 10.5244C1.99474 11.5101 1.99475 12.4899 2.01577 13.4756Z" />
                        </svg>
                    </button>
                    <button
                        className="border px-2 py-1.5 rounded relative"
                        onClick={() => setFilterPopup({ counsellor, trainer, filterParams, applied: appliedFilters })}
                    >
                        <div>
                            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width="20" height="20" color="#505050" fill="none" stroke="#505050" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                                <path d="M8.85746 12.5061C6.36901 10.6456 4.59564 8.59915 3.62734 7.44867C3.3276 7.09253 3.22938 6.8319 3.17033 6.3728C2.96811 4.8008 2.86701 4.0148 3.32795 3.5074C3.7889 3 4.60404 3 6.23433 3H17.7657C19.396 3 20.2111 3 20.672 3.5074C21.133 4.0148 21.0319 4.8008 20.8297 6.37281C20.7706 6.83191 20.6724 7.09254 20.3726 7.44867C19.403 8.60062 17.6261 10.6507 15.1326 12.5135C14.907 12.6821 14.7583 12.9567 14.7307 13.2614C14.4837 15.992 14.2559 17.4876 14.1141 18.2442C13.8853 19.4657 12.1532 20.2006 11.226 20.8563C10.6741 21.2466 10.0043 20.782 9.93278 20.1778C9.79643 19.0261 9.53961 16.6864 9.25927 13.2614C9.23409 12.9539 9.08486 12.6761 8.85746 12.5061Z" />
                            </svg>
                        </div>
                        {(Object.keys(appliedFilters?.selected ?? {}).length > 0 || appliedFilters?.range?.from) &&
                            <div className='pointer-events-none'>
                                <div className='h-3 w-3 bg-blue-600 absolute -top-1.5 -right-1 rounded-full'></div>
                                <div className='h-3 w-3 bg-blue-600 absolute -top-1.5 -right-1 rounded-full animate-ping'></div>
                            </div>
                        }

                    </button>

                    {/* Backdrop: Report Download */}
                    {downloadReport && <div onClick={() => setDownloadReport(false)} className="absolute inset-0 bg-transparent z-10" />}

                    {/* Backdrop: Pagination */}
                    {limitPopup && <div onClick={() => setLimitPopup(false)} className='bg-transparent inset-0 absolute z-0'></div>}

                    <div className="relative w-44 text-sm">
                        <button
                            onClick={() => setDownloadReport({ filtered: (Object.keys(appliedFilters?.selected ?? {}).length > 0 || appliedFilters?.range?.from) })}
                            className="w-full border rounded px-3 py-2 text-left bg-white flex justify-between items-center">
                            <span>Download Report</span>
                            <span className="text-gray-400">⏷</span>
                        </button>
                        <ReportDropdown
                            onChange={(value, label) => {

                                if (value.includes('Custom')) {
                                    setOpenDatePicker(value);
                                    return;
                                }

                                if (value.includes('Download')) {
                                    downloadJoineesReport(value);
                                    return;
                                }

                                let [type, interval] = value.split('@')
                                let payload = {
                                    type,
                                    fileName: `ConceptNinjas_${type}_${label}`,
                                    monthInterval: interval,
                                    qutype: 1
                                }

                                exportReport(payload);
                                setDownloadReport(false);
                            }}

                            open={downloadReport}
                        />
                    </div>

                    <button className="border px-2 py-1 rounded" data-status="0" onClick={filterPendingPayments}>📢<span className='text-rose-500 pointer-events-none' style={{ display: "none" }}>&bull; Reset ✘</span></button>

                    <div className="flex-1"></div>

                    <div className='relative'>
                        <input className="border px-2 py-1.5 mr-2 pl-8 text-sm rounded outline-none" placeholder="Search" onKeyUp={handleKeyUp} />
                        <div className="absolute left-[9px] -top-[5px] text-3xl text-gray-400">⌕</div>
                    </div>
                    <button className="border px-2 py-2 rounded" onClick={refresh}>
                        <div className={`${(loading) ? 'animate-spin' : ''}`}>
                            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width="16" height="16" color="#505050" fill="none" stroke="#505050" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                                <path d="M20.4879 15C19.2524 18.4956 15.9187 21 12 21C7.02943 21 3 16.9706 3 12C3 7.02943 7.02943 3 12 3C15.7292 3 18.9286 5.26806 20.2941 8.5" />
                                <path d="M15 9H18C19.4142 9 20.1213 9 20.5607 8.56066C21 8.12132 21 7.41421 21 6V3" />
                            </svg>
                        </div>
                    </button>
                    <button className="border px-2 py-2 -ml-1 rounded" onClick={() => router.push('/payments/settings')}>                        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width="16" height="16" color="#505050" fill="none" stroke="#141B34" strokeWidth="1.5">
                            <path d="M16.3083 4.38394C15.7173 4.38394 15.4217 4.38394 15.1525 4.28405C15.1151 4.27017 15.0783 4.25491 15.042 4.23828C14.781 4.11855 14.5721 3.90959 14.1541 3.49167C13.1922 2.52977 12.7113 2.04882 12.1195 2.00447C12.04 1.99851 11.96 1.99851 11.8805 2.00447C11.2887 2.04882 10.8077 2.52977 9.84585 3.49166C9.42793 3.90959 9.21897 4.11855 8.95797 4.23828C8.92172 4.25491 8.88486 4.27017 8.84747 4.28405C8.57825 4.38394 8.28273 4.38394 7.69171 4.38394H7.58269C6.07478 4.38394 5.32083 4.38394 4.85239 4.85239C4.38394 5.32083 4.38394 6.07478 4.38394 7.58269V7.69171C4.38394 8.28273 4.38394 8.57825 4.28405 8.84747C4.27017 8.88486 4.25491 8.92172 4.23828 8.95797C4.11855 9.21897 3.90959 9.42793 3.49166 9.84585C2.52977 10.8077 2.04882 11.2887 2.00447 11.8805C1.99851 11.96 1.99851 12.04 2.00447 12.1195C2.04882 12.7113 2.52977 13.1922 3.49166 14.1541C3.90959 14.5721 4.11855 14.781 4.23828 15.042C4.25491 15.0783 4.27017 15.1151 4.28405 15.1525C4.38394 15.4217 4.38394 15.7173 4.38394 16.3083V16.4173C4.38394 17.9252 4.38394 18.6792 4.85239 19.1476C5.32083 19.6161 6.07478 19.6161 7.58269 19.6161H7.69171C8.28273 19.6161 8.57825 19.6161 8.84747 19.716C8.88486 19.7298 8.92172 19.7451 8.95797 19.7617C9.21897 19.8815 9.42793 20.0904 9.84585 20.5083C10.8077 21.4702 11.2887 21.9512 11.8805 21.9955C11.96 22.0015 12.0399 22.0015 12.1195 21.9955C12.7113 21.9512 13.1922 21.4702 14.1541 20.5083C14.5721 20.0904 14.781 19.8815 15.042 19.7617C15.0783 19.7451 15.1151 19.7298 15.1525 19.716C15.4217 19.6161 15.7173 19.6161 16.3083 19.6161H16.4173C17.9252 19.6161 18.6792 19.6161 19.1476 19.1476C19.6161 18.6792 19.6161 17.9252 19.6161 16.4173V16.3083C19.6161 15.7173 19.6161 15.4217 19.716 15.1525C19.7298 15.1151 19.7451 15.0783 19.7617 15.042C19.8815 14.781 20.0904 14.5721 20.5083 14.1541C21.4702 13.1922 21.9512 12.7113 21.9955 12.1195C22.0015 12.0399 22.0015 11.96 21.9955 11.8805C21.9512 11.2887 21.4702 10.8077 20.5083 9.84585C20.0904 9.42793 19.8815 9.21897 19.7617 8.95797C19.7451 8.92172 19.7298 8.88486 19.716 8.84747C19.6161 8.57825 19.6161 8.28273 19.6161 7.69171V7.58269C19.6161 6.07478 19.6161 5.32083 19.1476 4.85239C18.6792 4.38394 17.9252 4.38394 16.4173 4.38394H16.3083Z" />
                            <path d="M15.5 12C15.5 13.933 13.933 15.5 12 15.5C10.067 15.5 8.5 13.933 8.5 12C8.5 10.067 10.067 8.5 12 8.5C13.933 8.5 15.5 10.067 15.5 12Z" />
                        </svg>
                    </button>
                </div>

                {/* Table View */}
                <div className="flex flex-col h-[calc(100vh-180px)]">
                    <div className="flex-1 overflow-auto">
                        <PaymentsTable
                            rows={leads?.rows || []}
                            router={router}
                            changePlacementReadyStatus={cbChangePlacementReadyStatus}
                            deleteRecord={cbDeleteRecord}
                            counsellors={counsellor}
                            trainers={trainer}
                            filterParams={filterParams}
                            changeCounsellorOrTrainer={cbChangeCounsellorOrTrainer}
                            checkUncheckRows={checkUncheckRows}
                            downloadReceipt={downloadPaymentReceipt}
                            userRoles={userRoles}
                        />
                    </div>
                    
                    <div className="bg-white border-t border-slate-200 px-4 py-2 flex justify-between items-center text-sm">
        
                        {/* Left */}
                        <div className="flex items-center gap-3">
                            <span>
                                Showing {query.offset + 1} to {Math.min(query.offset + query.limit, totalRecords)} of {totalRecords}
                            </span>

                            <div className="relative">
                                <button
                                    onClick={() => setLimitPopup(!limitPopup)}
                                    className="border px-3 py-1 rounded bg-white flex items-center gap-1"
                                >
                                    {query.limit} ▼
                                </button>

                                {limitPopup && (
                                    <div className="absolute bottom-full mb-1 bg-white shadow border rounded w-20">
                                        {[50, 100, 200, 500].map(num => (
                                            <div
                                                key={num}
                                                onClick={() => changeLimit(num)}
                                                className="px-3 py-1 hover:bg-gray-100 cursor-pointer text-center"
                                            >
                                                {num}
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </div>

                            <span className="text-gray-500">rows per page</span>
                        </div>

                        {/* Right */}
                        <div className="flex items-center gap-1">
                            <button
                                onClick={() => changePage(currentPage - 1)}
                                disabled={currentPage === 1}
                                className="border w-8 h-8 flex items-center justify-center rounded disabled:opacity-40"
                            >
                                ‹
                            </button>

                            {getPages().map((page, i) =>
                                page === "..." ? (
                                    <span key={i}>…</span>
                                ) : (
                                    <button
                                        key={i}
                                        onClick={() => changePage(page)}
                                        className={`w-8 h-8 rounded ${
                                            currentPage === page
                                                ? "bg-blue-600 text-white"
                                                : "border"
                                        }`}
                                    >
                                        {page}
                                    </button>
                                )
                            )}

                            <button
                                onClick={() => changePage(currentPage + 1)}
                                disabled={currentPage === totalPages}
                                className="border w-8 h-8 flex items-center justify-center rounded disabled:opacity-40"
                            >
                                ›
                            </button>
                        </div>

                    </div>
                </div>
            </div>
        </div>
    )
}
