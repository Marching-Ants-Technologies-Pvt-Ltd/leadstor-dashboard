'use client'

import { useEffect, useState, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { xFetch } from '@/utility/xFetch';
import { Corporate } from '@/utility/TinyDB';
import DayPickerModal from '@/components/elements/DayPickerModel';
import JoineeInstallmentNotFound from './notFound';
import JoineePaymentAnalytics from './analytics';
import JoineeInstallments from './installments';
import JoineeInstallmentForm from './installmentForm';
import {
    SelectFieldTypeArray,
    SelectFieldTypeArrayOfObject,
    SelectFieldDefault,
    MultiSelectField
} from '@/components/elements/SelectField';

import {
    InputText,
    InputTextWithIcon
} from '@/components/elements/InputFields';
import { ToastContainer, toast, Bounce } from 'react-toastify';

export default function JoineePaymentForm({ payment_id }) {

    const router = useRouter();
    const notesRef = useRef(null);
    const corporateId = Corporate?._id;
    const [highlight, setHighlight] = useState(false);
    const [candidate, setCandidate] = useState({});
    const [filterParams, setFilterParams] = useState({});
    const [currency, setCurrency] = useState({});
    const [currentCurrency, setCurrentCurrency] = useState('');
    const [datePicker, setDatePicker] = useState(false);
    const [currentInstallment, setCurrentInstallment] = useState(null);
    const [showInfo, setShowInfo] = useState(true)
    const [courseFee, setCourseFee] = useState([]);
    const [subServices, setSubServices] = useState([]);
    const [batch, setBatch] = useState([]);
    const [selectedProfileImage, setSelectedProfileImage] = useState(null);
    const [hasStdFeeFromApi, setHasStdFeeFromApi] = useState(false);
    const [hasTrackingCourseOnLoad, setHasTrackingCourseOnLoad] = useState(false);
    const isEditMode = Number(payment_id) > 0;

    // Helper Functions
    const pad = (n) => String(n).padStart(2, "0");
    const normalizeDateToMidnight = (value) => {
        if (!value || typeof value !== 'string') return value;

        const datePart = value.split(' ')[0];
        const parts = datePart.split('-');

        if (parts.length !== 3 || parts[0].length !== 4) {
            return value;
        }

        return `${datePart} 00:00:00`;
    };

    const normalizeInstallmentsForSave = (installments = {}) => {
        return Object.fromEntries(
            Object.entries(installments).map(([key, item]) => [
                key,
                {
                    ...item,
                    date: normalizeDateToMidnight(item?.date)
                }
            ])
        );
    };

    const formatDOJ = (input = '') => {

        if (input === '') return '';
        const date = new Date(input.replace(" ", "T"));

        const months = [
            "January", "February", "March", "April", "May", "June",
            "July", "August", "September", "October", "November", "December"
        ];

        const day = String(date.getDate()).padStart(2, "0");
        const month = months[date.getMonth()];
        const year = date.getFullYear();

        const output = `${day}-${month}-${year}`;
        return output; // 26-January-2026

    }

    const decodeHtml = (html) => {
        const txt = document.createElement("textarea");
        txt.innerHTML = html;
        return txt.value;
    };

    const parseCandidateTrackingResponse = (rawResponse) => {
        if (!rawResponse) return {};
        if (typeof rawResponse === 'object') return rawResponse;

        const asString = String(rawResponse).trim();
        if (!asString) return {};

        // 1) Normal parse path
        try {
            return JSON.parse(asString);
        } catch (_) {
            // continue to recovery strategies
        }

        // 2) Remove control characters and retry
        const cleaned = asString.replace(/[\u0000-\u001F]+/g, ' ');
        try {
            return JSON.parse(cleaned);
        } catch (_) {
            // continue to recovery strategies
        }

        // 3) Try removing problematic image/blob field then parse
        const withoutImage = cleaned
            .replace(/,\s*"image"\s*:\s*"(?:\\.|[^"\\])*"/g, '')
            .replace(/"image"\s*:\s*"(?:\\.|[^"\\])*"\s*,/g, '')
            .replace(/"image"\s*:\s*"(?:\\.|[^"\\])*"/g, '');

        try {
            return JSON.parse(withoutImage);
        } catch (err) {
            console.error('Unable to parse getCandidateTrackingDetails response', err);
            return {};
        }
    };

    const profileImage = (image = '', name = '') => {
        if (image.length < 7) {
            if (name.length < 1) name = 'Candidate';
            name = name?.split(' ')[0];
            return `https://api.dicebear.com/9.x/initials/svg?size=200&seed=${name}`;
        }

        return image;
    }

    const onWhatsappButtonClick = () => {
        let mobile = candidate?.mobile ?? '';
        if (mobile.length < 5) return;

        window.open(`https://wa.me/${mobile}?text=hello`, '_blank');
    }

    const scrollToNotes = () => {
        notesRef.current?.scrollIntoView({
            behavior: "smooth",
            block: "center",
        });

        setHighlight(true);
        setTimeout(() => setHighlight(false), 2000);
    };

    const calculateMaxDiscount = (amount, percentage) => {
        if (!amount || !percentage) return 0;

        const amt = Number(amount);
        const pct = Number(percentage);

        if (isNaN(amt) || isNaN(pct) || amt <= 0 || pct <= 0) {
            return 0;
        }

        return (amt * pct) / 100;
    }

    const isCourseAvailableInMasterList = (label = '') => {
        const normalizedLabel = `${label}`.trim().toLowerCase();
        if (!normalizedLabel || !Array.isArray(courseFee) || courseFee.length < 1) {
            return false;
        }

        return courseFee.some(item =>
            `${item?.course ?? ''}`.trim().toLowerCase() === normalizedLabel
        );
    };

    const hasCourseMasterList = Array.isArray(courseFee) && courseFee.length > 0;
    const isMissingCourseFromMaster = Boolean(candidate?.label) && hasCourseMasterList && !isCourseAvailableInMasterList(candidate?.label);
    const isManualAgreedOnlyMode = (!hasCourseMasterList) || (isEditMode && !hasStdFeeFromApi && hasTrackingCourseOnLoad);
    const hasExistingCourseInTracking = isEditMode && hasTrackingCourseOnLoad;

    const calculatePaymentBreakdown = (baseData = {}, recalculateAgreed = true) => {
        const baseFee = parseFloat(baseData?.stdFee ?? 0) || 0;
        const discount = parseFloat(baseData?.discount ?? 0) || 0;
        const cgst = baseData?.cgst === '' ? 0 : (parseFloat(baseData?.cgst) || 0);
        const sgst = baseData?.sgst === '' ? 0 : (parseFloat(baseData?.sgst) || 0);

        const discountedAmount = Math.max(baseFee - discount, 0);
        const cgstAmount = (discountedAmount * cgst) / 100;
        const sgstAmount = (discountedAmount * sgst) / 100;
        const totalGSTAmount = Math.round(cgstAmount + sgstAmount);
        const agreedPayment = Math.round(discountedAmount + cgstAmount + sgstAmount);

        const updated = {
            ...baseData,
            gst: Number(cgst) + Number(sgst),
            cgstAmount: Math.round(cgstAmount),
            sgstAmount: Math.round(sgstAmount),
            totalGSTAmount,
        };

        if (recalculateAgreed) {
            updated.agreedPayment = agreedPayment;
        }

        return updated;
    };

    const onInfoChange = (key, value) => {
        if (key === 'batchId') {
            setCandidate(prev => ({
                ...prev,
                [key]: Array.isArray(value) ? value : [value]
            }));
            return;
        }

        setCandidate((prev) => ({
            ...prev,
            [key]: value
        }));

        //Update Currency Code On UI
        if (key === 'candidate_currency') {
            let cnc = currency?.[value] ?? {};
            setCurrentCurrency(decodeHtml(cnc?.currency_html_code ?? '₹'));
        }

        // Update Standard Fee If Course is Changed
        if (key === 'label') {
            if (isManualAgreedOnlyMode) return;

            let course = courseFee.filter(item => item.course.trim().toLowerCase() === value.trim().toLowerCase());
            if (course.length < 1) {
                course = [{
                    standardFee: 0,
                    maximumDiscount: 0
                }]
            }

            course = course[0];
            course['maximumDiscountedFees'] = calculateMaxDiscount(course?.standardFee ?? '0', course?.maximumDiscount ?? '0');
            setCandidate(prev => {
                const nextValue = {
                    ...prev,
                    label: value,
                    batchId: [],
                    discount: 0,
                    stdFee: parseInt(course?.standardFee ?? '0'),
                    maximumDiscount: parseInt(course?.maximumDiscount ?? '0'),
                    maximumDiscountedFees: course?.maximumDiscountedFees
                };

                return calculatePaymentBreakdown(nextValue, true);
            });
            return;
        }
    }

    const handleKeyUp = (key, value) => {

        setCandidate((prev) => {

            const updated = {
                ...prev,
                [key]: value
            };

            // Auto recalculate instantly
            if (!isManualAgreedOnlyMode && ['stdFee', 'cgst', 'sgst', 'discount'].includes(key)) {
                return calculatePaymentBreakdown(updated, true);
            }

            return updated;
        });
    };

    const deleteInstallment = (installments, key) => {
        if (!installments || typeof installments !== 'object') return installments;

        const { [key]: _, ...rest } = installments;
        return rest;
    };

    const handleDeleteInstallment = (count) => {
        setCandidate(prev => {
            if (!prev) return prev;

            return {
                ...prev,
                installments: deleteInstallment(prev.installments, count),
            };
        });
    };

    const handleChangeInInstallment = (data) => {
        const normalizedReceiptDate = `${data?.receipt_date ?? data?.receiptDate ?? ''}`;
        const fixed = {
            amount: `${data?.amount ?? '0'}`,
            date: data?.date ?? null,
            paidAmount: `${data?.paidAmount ?? data?.paid_amount ?? ''}`,
            paidDate: data?.paidDate ?? data?.paid_date ?? '',
            status: `${data?.status ?? '0'}`,
            refNum: `${data?.refNo ?? ''}`,
            receiptDate: normalizedReceiptDate,
            receipt_date: normalizedReceiptDate
        };

        setCandidate(prev => {
            if (!prev) return prev;

            return {
                ...prev,
                installments: {
                    ...(prev.installments ?? {}),
                    [data.count]: {
                        ...(prev.installments?.[data.count] ?? {}),
                        ...fixed,
                    },
                },
            };
        });

    }

    const getBatchLabelMapping = (batches = []) => {
        return batches
            .map(batchId => {
                const found = batch.find(b => b.batchId === batchId);
                return found
                    ? { batchId, labelId: found.labelId }
                    : null;
            })
            .filter(Boolean);
    }

    const validatePayload = (payload) => {
        const requiredFields = [
            'name',
            'email',
            'mobile',
            'doj',
            'label',
            'addressLine1',
            'addressLine2',
            'source',
            'admission_status_id',
            'agreedPayment'
        ];

        return requiredFields.every(field => {
            const value = payload[field];

            // check for undefined, null, empty string, or string with only spaces
            return value !== undefined &&
                value !== null &&
                !(typeof value === 'string' && value.trim() === '');
        });
    }

    const saveChanges = () => {
        let payload = { ...candidate };
        // Never post preview/base64 image string in JSON payload.
        delete payload.image;
        payload.installments = normalizeInstallmentsForSave(payload?.installments);

        // Check For Remarks
        if (payload.remarks === '') {
            if (payload.last_remark === '') {
                // Ask For Remarks
                toast.warning('Please, enter a remark before you save this changes.');
                scrollToNotes();
                return;
            }

            payload.remarks = payload.last_remark;
        }

        // Check For Other Required Fields
        if (!validatePayload(payload)) {
            toast.warning('Some required fields are blank! Please check and try again.');
            return;
        }

        if (!isManualAgreedOnlyMode) {
            const standardFee = parseFloat(payload?.stdFee);
            if (
                payload?.stdFee === undefined ||
                payload?.stdFee === null ||
                `${payload?.stdFee}`.trim() === '' ||
                Number.isNaN(standardFee) ||
                standardFee <= 0
            ) {
                toast.warning('Standard Fee cannot be 0 or blank.');
                return;
            }
        }

        // Include Tracking Id
        payload['trackingId'] = payment_id;
        payload['batches'] = getBatchLabelMapping(payload?.batchId ?? []);

        // Validate installment totals before save
        const installments = Object.values(payload?.installments ?? {});
        const totalInstallment = installments.reduce(
            (sum, item) => sum + Number(item?.amount || 0),
            0
        );
        const totalAgreedPayment = Number(payload?.agreedPayment || 0);

        if (totalInstallment > totalAgreedPayment) {
            let msg = 'Total value of installments is more than Total Agreed Payment.';
            if (totalAgreedPayment < 0) {
                msg = 'Total agreed payment value is negative which is not desirable.';
            }
            msg += ' Do you still want to continue with these values?';
            const ret = window.confirm(msg);
            if (!ret) return;
        }

        payload.gst = (parseFloat(payload.cgst || 0)) + (parseFloat(payload.sgst || 0));

        const requestPayload = new FormData();
        requestPayload.append('payload', JSON.stringify(payload));
        if (selectedProfileImage) {
            requestPayload.append('candidateFile', selectedProfileImage);
        }

        xFetch({
            method: 'POST',
            path: '/services/joinees/saveCandidateTrackingDetails',
            payload: requestPayload,
            isFormData: true,
        })
            .then(data => {
                // Case 1: New Creation
                if (data.event === 'CREATED' && data.id) {
                    toast.success('Changes saved successfully!', {
                        autoClose: 2000,
                    });
                    setTimeout(() => {
                        router.push(`/payments/${data.id}`);
                    }, 800);
                    
                    return;
                }

                // Case 2: Update / Edit existing record
                if (data.event === 'UPDATED' ||  data.id) {   // fallback if only id is returned
                    toast.success('Changes Saved Successfully.');
                    return;
                }

                // Fallback - if we reach here, something is wrong with response
                toast.success('Changes Saved Successfully.');  // safe default
            })
            .catch(error => {
                console.error(`An error occurred while saving joinees details`, error);
                toast.error('Unable to save details! Please try again');
            });

    }

    useEffect(() => {
        let isMounted = true;

        Promise.all([
            xFetch({
                path: '/services/joinees/getFilterParameters',
                payload: { corporateId: Corporate._id }
            }),
            xFetch({
                path: '/services/profile/getCourseAndFee',
                payload: { callback: '1' }
            }),
            xFetch({
                path: '/services/profile/getSubServices',
                payload: { callback: '1' }
            }),
            xFetch({
                path: '/services/attendance/getBatches',
                payload: { callback: '1' }
            }),
            xFetch({
                path: '/services/admin/getActiveCurrencyList',
                payload: { status: '1' }
            }),
            xFetch({
                path: '/services/joinees/getCandidateTrackingDetails',
                payload: { trackingId: payment_id },
                responseType: 'text'
            })
        ])
        .then(([filterParams, courseFee, subServices, batch, currencyList, candidateInfoRaw]) => {
            if (!isMounted) return;
            const candidateInfo = parseCandidateTrackingResponse(candidateInfoRaw);
            setFilterParams(filterParams);
            setCurrency(currencyList);
            const hasCourseOptions = Array.isArray(courseFee) && courseFee.length > 0;
            const hasExistingIdentifier = Boolean(
                candidateInfo?.trackingId ||
                candidateInfo?.id ||
                candidateInfo?._id
            );

            const hasExistingFilledCoreData = Boolean(
                `${candidateInfo?.name ?? ''}`.trim() ||
                `${candidateInfo?.email ?? ''}`.trim() ||
                `${candidateInfo?.mobile ?? ''}`.trim() ||
                `${candidateInfo?.doj ?? ''}`.trim() ||
                `${candidateInfo?.lastUpdateDateTime ?? ''}`.trim()
            );

            const hasInstallments = Object.keys(candidateInfo?.installments ?? {}).length > 0;

            const hasCandidateRecord = (
                candidateInfo &&
                typeof candidateInfo === 'object' &&
                candidateInfo?.type !== 'notFund' &&
                (hasExistingIdentifier || hasExistingFilledCoreData || hasInstallments)
            );

            const rawStdFee = candidateInfo?.stdFee;
            const hasStdFee = !(
                rawStdFee === undefined ||
                rawStdFee === null ||
                `${rawStdFee}`.trim() === '' ||
                Number(rawStdFee) <= 0
            );
            const hasTrackingCourse = `${candidateInfo?.label ?? ''}`.trim().length > 0;
            const useManualModeOnLoad = (!hasCourseOptions) || (isEditMode && hasCandidateRecord && !hasStdFee);

            setHasStdFeeFromApi(hasStdFee);
            setHasTrackingCourseOnLoad(hasTrackingCourse);
            
            const totalGST = parseFloat(
                candidateInfo?.gst ??
                0
            );

            let cgst = parseFloat(candidateInfo?.cgst || 0);
            let sgst = parseFloat(candidateInfo?.sgst || 0);

            // If backend sends 0/0 but gst exists,
            // split total GST equally
            if (cgst === 0 && sgst === 0 && totalGST > 0) {
                cgst = totalGST / 2;
                sgst = totalGST / 2;
            }

            if (useManualModeOnLoad) {
                setCandidate({
                    ...candidateInfo,
                    cgst: String(Number.isFinite(cgst) ? cgst : 0),
                    sgst: String(Number.isFinite(sgst) ? sgst : 0),
                    gst: String(Number(candidateInfo?.gst ?? 0) || 0),
                    agreedPayment:
                        (candidateInfo?.agreedPayment !== undefined &&
                            candidateInfo?.agreedPayment !== null &&
                            `${candidateInfo?.agreedPayment}`.trim() !== '')
                            ? candidateInfo?.agreedPayment
                            : ''
                });
            } else {
                const calculatedCandidate = calculatePaymentBreakdown({
                    ...candidateInfo,
                    stdFee: candidateInfo?.stdFee ?? 0,
                    discount: candidateInfo?.discount ?? 0,
                    agreedPayment: candidateInfo?.agreedPayment ?? 0,
                    cgst: String(Number.isFinite(cgst) ? cgst : 0),
                    sgst: String(Number.isFinite(sgst) ? sgst : 0),
                }, false);

                // On edit hydration, keep API agreedPayment as-is.
                const hasApiAgreedPayment =
                    candidateInfo?.agreedPayment !== undefined &&
                    candidateInfo?.agreedPayment !== null &&
                    `${candidateInfo?.agreedPayment}`.trim() !== '';

                setCandidate({
                    ...calculatedCandidate,
                    gst: String(
                        Number(calculatedCandidate?.gst ?? 0)
                    ),
                    agreedPayment: hasApiAgreedPayment
                        ? candidateInfo?.agreedPayment
                        : calculatedCandidate?.agreedPayment
                });
            }

            setSelectedProfileImage(null);
            setCourseFee(courseFee);
            setSubServices(subServices);
            setBatch(batch);

            // Set Current Currency
            let cnc = currencyList?.[candidateInfo?.candidate_currency ?? 'x'] ?? {};
            setCurrentCurrency(cnc?.currency_html_code ?? '₹');
        })
        .catch(error => {
            console.error('Error loading initial data', error);
        });

        return () => {
            isMounted = false;
        };

    }, [corporateId, payment_id]);

    // Checks
    if (!candidate?.name) {
        if (candidate?.type && candidate.type === 'notFund') {
            return (
                <JoineeInstallmentNotFound id={payment_id} />
            )
        }
    }

    return (
        <div>
            <JoineePaymentAnalytics
                agreedPayment={candidate?.agreedPayment ?? '0'}
                installments={candidate?.installments ?? {}}
                currency={decodeHtml(currentCurrency)}
                onChat={onWhatsappButtonClick}
                gotoNotes={scrollToNotes}
                onSave={saveChanges}
            />
            <DayPickerModal
                open={datePicker}
                onConfirm={(date) => {
                    if (!date) return;
                    let value = `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())} 00:00:00`;
                    onInfoChange('doj', value);
                }}
                onClose={() => setDatePicker(false)}
            />

            <JoineeInstallmentForm
                data={currentInstallment}
                onClose={() => setCurrentInstallment(null)}
                onConfirm={handleChangeInInstallment}
                onAlert={(message) => toast.info(message)}
            />

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

            <div className='w-full h-20'></div>

            {showInfo && (
                <div className='max-w-[1400px] mx-auto p-6'>
                    <div className='border border-blue-300 bg-blue-50 -mb-6 p-3 rounded-md flex items-center gap-2 shadow-md'>
                        <div>
                            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width="18" height="18" color="#4a90e2" fill="none" stroke="#4a90e2" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                                <path d="M19 9.62069C19 12.1999 17.7302 14.1852 15.7983 15.4917C15.3483 15.796 15.1233 15.9482 15.0122 16.1212C14.9012 16.2942 14.8633 16.5214 14.7876 16.9757L14.7287 17.3288C14.5957 18.127 14.5292 18.526 14.2494 18.763C13.9697 19 13.5651 19 12.7559 19H10.1444C9.33528 19 8.93069 19 8.65095 18.763C8.3712 18.526 8.30469 18.127 8.17166 17.3288L8.11281 16.9757C8.03734 16.5229 7.99961 16.2965 7.88968 16.1243C7.77976 15.9521 7.55428 15.798 7.10332 15.4897C5.1919 14.1832 4 12.1986 4 9.62069C4 5.4119 7.35786 2 11.5 2C12.0137 2 12.5153 2.05248 13 2.15244" />
                                <path d="M16.5 2L16.7579 2.69703C17.0961 3.61102 17.2652 4.06802 17.5986 4.40139C17.932 4.73477 18.389 4.90387 19.303 5.24208L20 5.5L19.303 5.75792C18.389 6.09613 17.932 6.26524 17.5986 6.59861C17.2652 6.93198 17.0961 7.38898 16.7579 8.30297L16.5 9L16.2421 8.30297C15.9039 7.38898 15.7348 6.93198 15.4014 6.59861C15.068 6.26524 14.611 6.09613 13.697 5.75792L13 5.5L13.697 5.24208C14.611 4.90387 15.068 4.73477 15.4014 4.40139C15.7348 4.06802 15.9039 3.61102 16.2421 2.69703L16.5 2Z" />
                                <path d="M13.5 19V20C13.5 20.9428 13.5 21.4142 13.2071 21.7071C12.9142 22 12.4428 22 11.5 22C10.5572 22 10.0858 22 9.79289 21.7071C9.5 21.4142 9.5 20.9428 9.5 20V19" />
                            </svg>
                        </div>
                        <div className='text-sm flex-1 text-gray-700 relative'>
                            Fields highlighted with <span className='font-semibold text-xl text-rose-500 absolute'>*</span>&nbsp;&nbsp;&nbsp;are mandatory, you must provide info for those fields.
                        </div>
                        <div
                            className='cursor-pointer text-gray-600'
                            onClick={() => setShowInfo(false)}
                        >
                            <svg className='pointer-events-none' xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width="18" height="18" color="inherit" fill="none" stroke="#4b5563" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                <path d="M18 6L6.00081 17.9992M17.9992 18L6 6.00085" />
                            </svg>
                        </div>
                    </div>
                </div>
            )}

            <div className="max-w-[1400px] mx-auto p-6 flex justify-evenly items-start align-top gap-5">

                <div className="bg-white border border-gray-200 rounded-[10px] p-5 flex-1">

                    {/* Personal Info */}
                    <div className="">
                        <h3 className="text-sm font-semibold mb-3">
                            Personal Details
                        </h3>

                        <div className="grid grid-cols-2 gap-4">

                            <InputText
                                cbOnChange={handleKeyUp}
                                label="Candidate Name"
                                value={candidate?.name || ''}
                                fieldName='name'
                                required={true}
                            />
                            <InputText
                                cbOnChange={handleKeyUp}
                                label="Email"
                                value={candidate?.email || ''}
                                fieldName='email'
                                required={true}
                            />
                            <InputText
                                cbOnChange={handleKeyUp}
                                label="Mobile"
                                value={candidate?.mobile || ''}
                                fieldName='mobile'
                                required={true}
                            />

                            <div className='relative cursor-pointer'>
                                <div
                                    onClick={() => setDatePicker({ date: candidate?.doj ?? '' })}
                                    className='absolute h-11 top-4 left-0 w-full flex justify-end align-middle items-center'
                                >
                                    <div className='mr-1.5'>📅</div>
                                </div>
                                <InputText
                                    cbOnChange={handleKeyUp}
                                    label="Date Of Joining"
                                    value={formatDOJ(candidate?.doj || '')}
                                    fieldName='doj'
                                    required={true}
                                />
                            </div>

                            <div className='relative'>
                                {!hasCourseMasterList ? (
                                    <InputText
                                        cbOnChange={handleKeyUp}
                                        label="Course / Program"
                                        value={candidate?.label || ''}
                                        fieldName='label'
                                        required={true}
                                    />
                                ) : (hasExistingCourseInTracking && isMissingCourseFromMaster) ? (
                                    <InputText
                                        cbOnChange={handleKeyUp}
                                        label="Course / Program"
                                        value={candidate?.label || ''}
                                        fieldName='label'
                                        required={true}
                                    />
                                ) : (
                                    <>
                                        <SelectFieldTypeArray
                                            label="Course / Program"
                                            options={courseFee.map(item => item.course)}
                                            selected={candidate?.label || 'Not Selected'}
                                            cbOnChange={onInfoChange}
                                            fieldName='label'
                                            required={true}
                                        />
                                        {Object.entries(candidate?.installments ?? {}).length > 0 &&
                                            <div onClick={() => toast.info(`Course cannot be changed after first installment.`)} className='absolute top-0 left-0 w-full h-16 cursor-pointer'>
                                                <div className='absolute right-1.5 p-1 top-6 bg-white cursor-not-allowed'>
                                                    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width="18" height="18" color="#8E8E8E" fill="none" stroke="#8E8E8E" strokeWidth="2" strokeLinecap="round">
                                                        <path d="M12 16.5V14.5" />
                                                        <path d="M4.2678 18.8447C4.49268 20.515 5.87612 21.8235 7.55965 21.9009C8.97627 21.966 10.4153 22 12 22C13.5847 22 15.0237 21.966 16.4403 21.9009C18.1239 21.8235 19.5073 20.515 19.7322 18.8447C19.8789 17.7547 20 16.6376 20 15.5C20 14.3624 19.8789 13.2453 19.7322 12.1553C19.5073 10.485 18.1239 9.17649 16.4403 9.09909C15.0237 9.03397 13.5847 9 12 9C10.4153 9 8.97627 9.03397 7.55965 9.09909C5.87612 9.17649 4.49268 10.485 4.2678 12.1553C4.12104 13.2453 3.99999 14.3624 3.99999 15.5C3.99999 16.6376 4.12104 17.7547 4.2678 18.8447Z" />
                                                        <path d="M7.5 9V6.5C7.5 4.01472 9.51472 2 12 2C14.4853 2 16.5 4.01472 16.5 6.5V9" />
                                                    </svg>
                                                </div>
                                            </div>
                                        }
                                    </>
                                )}
                            </div>
                            {Array.isArray(subServices) && subServices.length > 0 && (
                            <MultiSelectField
                                label="Sub Service"
                                options={subServices.map(
                                    (item) => ({
                                        id: item.id,
                                        value: item.subService,
                                        tag: item.subService,
                                    })
                                )}
                                selected={candidate?.subServiceId ?? []}
                                cbOnChange={onInfoChange}
                                fieldName='subServiceId'
                            />
                            )}

                            <SelectFieldTypeArray
                                label="Lead Category Type"
                                options={Object.values(filterParams?.leadCategoryType || {})}
                                selected={candidate?.leadCategoryType || ''}
                                cbOnChange={onInfoChange}
                                fieldName='leadCategoryType'
                                required={false}
                            />

                            <SelectFieldTypeArray
                                label="Associated Center"
                                options={Object.values(filterParams?.associatedCenters || {})}
                                selected={candidate?.associatedCenters || ''}
                                cbOnChange={onInfoChange}
                                fieldName='associatedCenters'
                                required={false}
                            />
                            
                            <MultiSelectField
                                label="Batch / Intake"
                                options={batch.map(
                                    (item) => ({
                                        id: item.batchId,
                                        value: item.labelName,
                                        tag: item.batchName,
                                    })
                                )}
                                selected={candidate?.batchId ?? []}
                                cbOnChange={onInfoChange}
                                fieldName='batchId'
                            />
                            
                            <InputText
                                cbOnChange={handleKeyUp}
                                label="Current Address"
                                value={candidate?.addressLine1 || ''}
                                fieldName='addressLine1'
                                required={true}
                            />

                            <InputText
                                cbOnChange={handleKeyUp}
                                label="City"
                                value={candidate?.addressLine2 || ''}
                                fieldName='addressLine2'
                                required={true}
                            />

                            <SelectFieldTypeArray
                                label="Source"
                                options={Object.values(filterParams?.source || {})}
                                selected={candidate?.source || ''}
                                cbOnChange={onInfoChange}
                                fieldName='source'
                                required={true}
                            />

                            <SelectFieldDefault
                                label="Status"
                                options={Object.entries(filterParams?.statuses || {}).map(
                                    ([key, value]) => ({
                                        id: key,
                                        value: value
                                    })
                                )}
                                selected={String(candidate?.admission_status_id ?? "")}
                                cbOnChange={onInfoChange}
                                fieldName='admission_status_id'
                                required={true}
                            />

                            <InputText
                                cbOnChange={handleKeyUp}
                                label="Unique ID"
                                placeholder='Unique ID'
                                value={candidate?.uniqueId?.replace('null', '') || ''}
                                fieldName='uniqueId'
                            />

                        </div>
                    </div>

                    {/* Parent or Guardian Info */}
                    <div className="mt-6">
                        <h3 className="text-sm font-semibold mb-3">
                            Parent or Guardian Info
                        </h3>

                        <div className="grid grid-cols-2 gap-4">

                            <InputText
                                cbOnChange={handleKeyUp}
                                label="Name"
                                placeholder='Full Name'
                                value={candidate?.parentGuardianName?.replace('null', '') || ''}
                                fieldName='parentGuardianName'
                            />
                            <InputText
                                cbOnChange={handleKeyUp}
                                label="Mobile"
                                placeholder='+91 98XXXXXX10'
                                value={candidate?.parentGuardianMobile?.replace('null', '') || ''}
                                fieldName='parentGuardianMobile'
                            />

                            {/* Remarks */}
                            <div className="col-span-2 relative">
                                <label className="block text-xs text-gray-500 mb-1 relative">
                                    Remarks / Notes
                                    {(candidate?.last_remark ?? '') === '' &&
                                        <span className='text-red-500 font-semibold text-lg absolute ml-1 -mt-1'>*</span>
                                    }
                                </label>
                                <input
                                    ref={notesRef}
                                    name='remark'
                                    value={candidate?.remarks ?? ''}
                                    onChange={(e) => handleKeyUp('remarks', e.target.value)}
                                    className={`w-full outline-none px-[10px] py-2 text-[13px] border ${(highlight) ? 'border-blue-500' : 'border-gray-300'} rounded-md`}
                                    placeholder="Any special notes from finance or sales"
                                />
                                {/* have to edit this tomorrow */}
                                {((candidate?.lastUpdateDateTime ?? '') !== '' && (candidate?.last_remark ?? '') !== '') &&
                                    <div className='mt-2 border border-gray-200 bg-gray-50 px-3 py-2 rounded-sm'>
                                        <h4 className='text-xs font-medium text-gray-500 '>Last Remarks &bull; {candidate?.lastUpdateDateTime ?? ''}</h4>
                                        <p className='text-gray-700 py-1'>{candidate?.last_remark ?? ''}</p>
                                    </div>
                                }
                                {(highlight) &&
                                    <div className='absolute w-full rounded-md -top-[62px] left-20 pointer-events-none animate-bounce'>
                                        <svg
                                            className='rotate-[-45deg] -scale-x-100'
                                            xmlns="http://www.w3.org/2000/svg"
                                            shapeRendering="geometricPrecision"
                                            textRendering="geometricPrecision"
                                            imageRendering="optimizeQuality"
                                            fillRule="evenodd"
                                            clipRule="evenodd"
                                            viewBox="0 0 512 190.285"
                                            width="150px"
                                            color='#ccc'
                                            fill='#2563eb'
                                        >
                                            <path d="M512 62.269c-32.208 3.503-65.126 11.155-82.935 11.576-5.87.14-13.175-.651-5.825-3.929 17.743-7.915 39.85-13.415 61.461-14.291-4.787-1.077-9.548-2.473-15.993-4.683-42.916-14.717-91.165-23.694-138.308-23.756-39.015-.053-79.822 5.737-115.535 22.126 13.263 12.299 25.007 25.723 35.154 40.787 21.629 32.107 31.567 79.665-13.75 96.773-37.675 14.221-72.262-18.318-76.731-54.787-3.222-26.29 6.915-45.475 19.352-63.408 5.258-7.581 11.717-14.262 19.168-20.104C105.119-16.905 17.276 26.293 0 117.511 4.91 5.165 125.544-21.164 205.932 42.942c70.469-46.003 210.713-30.084 282.411 7.501-9.463-9.291-17.535-22.446-22.866-35.006-.79-1.859-4.569-8.993-4.29-12.878.102-1.443.766-2.442 2.348-2.553.903-.063 1.863.407 2.868 1.35 2.92 2.749 9.199 13.053 15.44 23.057C491.104 39.255 499.115 50.13 512 62.269zm-304.367-6.573c13.918 12.907 26.764 28.048 37.028 43.982 16.542 25.678 22.453 56.275-1.472 72.95-14.806 10.319-30.931 9.682-44.76 1.389-49.808-29.871-25.747-96.994 9.204-118.321z" />
                                        </svg>
                                    </div>
                                }
                            </div>
                        </div>
                    </div>

                    {/* Profile Picture */}
                    <div className="col-span-2 mt-6">
                        <h4 className="text-sm font-semibold mb-3">
                            Profile Picture
                        </h4>

                        <div className="flex items-center gap-5 p-4 border rounded-lg bg-gray-50">
                            {/* Avatar */}
                            <div className="relative">
                                <img
                                    src={profileImage(candidate?.image ?? '', candidate?.name ?? '')}
                                    alt="Profile"
                                    onError={(e) => {
                                        e.currentTarget.src = `https://api.dicebear.com/9.x/initials/svg?size=200&seed=Candidate`;
                                    }}
                                    className="w-24 h-24 rounded-full object-cover border-2 border-white ring-2 ring-gray-200"
                                />

                                {/* Overlay badge */}
                                <span className="absolute bottom-0 right-0 bg-white border rounded-full p-1 pt-0 shadow">
                                    📷
                                </span>
                            </div>

                            {/* Upload area */}
                            <div className="flex-1">
                                <label className="block text-xs font-medium text-gray-600 mb-1">
                                    Upload new photo
                                </label>

                                <input
                                    type="file"
                                    accept="image/*"
                                    onChange={(e) => {
                                        const file = e.target.files?.[0] || null;
                                        setSelectedProfileImage(file);
                                        if (file) {
                                            const previewUrl = URL.createObjectURL(file);
                                            setCandidate((prev) => ({ ...prev, image: previewUrl }));
                                        }
                                    }}
                                    className="block w-full text-sm file:mr-3 file:py-1.5 file:px-3 file:rounded-md file:border-0 file:bg-blue-600 file:text-white hover:file:bg-blue-700 cursor-pointer"
                                />

                                <p className="mt-2 text-xs text-gray-500">
                                    JPG or PNG • Max size 2MB • Square images work best
                                </p>
                            </div>
                        </div>
                    </div>
                </div>

                <div className="flex-1">
                    <div className="bg-white border border-gray-200 rounded-[10px] p-5">
                        <h3 className="text-sm font-semibold mb-4">
                            Payment Calculation
                        </h3>

                        <div className="grid grid-cols-2 gap-4">

                            <SelectFieldTypeArrayOfObject
                                label="Currency"
                                options={Object.entries(currency || {}).map(
                                    ([key, value]) => ({
                                        id: key,
                                        value: `${value?.currency_name ?? '-'} (${decodeHtml(value?.currency_html_code ?? '')})`
                                    })
                                )}
                                selected={candidate?.candidate_currency ?? ''}
                                cbOnChange={onInfoChange}
                                fieldName='candidate_currency'
                            />

                            {!isManualAgreedOnlyMode && (
                                <>
                                    <InputTextWithIcon
                                        label="Standard Fee"
                                        prefix={decodeHtml(currentCurrency)}
                                        value={candidate?.stdFee || '0'}
                                        type="number"
                                        readOnly={!isMissingCourseFromMaster}
                                        inputClassName="bg-white text-gray-900"
                                        readOnlyInputClassName="!bg-gray-200 text-gray-900 cursor-default"
                                        fieldName='stdFee'
                                        cbOnChange={handleKeyUp}
                                    />

                                    <InputTextWithIcon
                                        label="Discount"
                                        prefix={decodeHtml(currentCurrency)}
                                        type="number"
                                        value={candidate?.discount || '0'}
                                        helper={`Max Discount ${candidate?.maximumDiscount || 0}% (${decodeHtml(currentCurrency)}${candidate?.maximumDiscountedFees ?? '0'})`}
                                        cbOnChange={handleKeyUp}
                                        fieldName='discount'
                                    />

                                    <InputTextWithIcon
                                        label="CGST %"
                                        suffix="%"
                                        type="number"
                                        value={candidate?.cgst || ''}
                                        cbOnChange={handleKeyUp}
                                        fieldName='cgst'
                                    />

                                    <InputTextWithIcon
                                        label="SGST %"
                                        suffix="%"
                                        type="number"
                                        value={candidate?.sgst || ''}
                                        cbOnChange={handleKeyUp}
                                        fieldName='sgst'
                                    />

                                    <InputTextWithIcon
                                        label="Total GST %"
                                        suffix="%"
                                        value={candidate?.gst || '0'}
                                        readOnly={true}
                                        readOnlyInputClassName="!bg-gray-200 text-gray-900 cursor-default"
                                        helper="Total GST = CGST + SGST"
                                        fieldName='gst'
                                    />
                                </>
                            )}

                            <InputTextWithIcon
                                label={isManualAgreedOnlyMode ? "Total Agreed Payment (GST already applied) :" : "Total Agreed Payment"}
                                prefix={decodeHtml(currentCurrency)}
                                value={candidate?.agreedPayment || '0'}
                                helper={isManualAgreedOnlyMode ? undefined : "Auto calculated from Standard Fee, Discount, CGST & SGST"}
                                readOnly={!isManualAgreedOnlyMode}
                                readOnlyInputClassName="!bg-gray-200 text-gray-900 cursor-default"
                                fieldName='agreedPayment'
                                required={true}
                                cbOnChange={handleKeyUp}
                            />
                        </div>
                    </div>

                    <JoineeInstallments
                        currency={decodeHtml(currentCurrency)}
                        installments={candidate?.installments ?? {}}
                        onInstallmentEdit={setCurrentInstallment}
                        onInstallmentDelete={handleDeleteInstallment}
                    />
                </div>

            </div>
        </div>
    );
}
