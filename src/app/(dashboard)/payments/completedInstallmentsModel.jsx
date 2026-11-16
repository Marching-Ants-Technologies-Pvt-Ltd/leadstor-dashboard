import { useState, useEffect } from "react";
import { toast } from 'react-toastify';
import { xFetch } from '@/utility/xFetch';
import { STATUS, toInstallmentList } from './paymentUtils';

export default function CompletedInstallments({ open, onLinkClick, onClose }) {

    const [info, setInfo] = useState(null);
    const [loadFailed, setLoadFailed] = useState(false);
    const [downloadingInstallment, setDownloadingInstallment] = useState(null);

    useEffect(() => {
        setInfo(null);
        setLoadFailed(false);
        if (open && open?.amount !== '0' && open?.amount !== '') {
            xFetch({
                path: '/services/joinees/getCompletedPaymentInstallments',
                payload: { trackingId: open?.id }
            })
                .then(data => {
                    const list = toInstallmentList(data);
                    if (list) {
                        setInfo(list);
                    } else {
                        setLoadFailed(true);
                    }
                })
                .catch(error => {
                    console.error(`An error occurred while fetching completed installments`, error);
                    setLoadFailed(true);
                    toast.error('Server error occurred, Try again');
                });
        }
    }, [open]);

    const handleDownload = async (installmentNum) => {
        // Prevent multiple clicks while downloading
        if (downloadingInstallment !== null) {
            return;
        }

        setDownloadingInstallment(installmentNum);

        try {
            await onLinkClick(
                open?.id,
                installmentNum
            );
        } catch (error) {
            console.error(
                'Receipt download failed',
                error
            );
        } finally {
            setDownloadingInstallment(null);
        }
    };

    if (!open) return;
    if (open?.amount === '0' || open?.amount === '') return;

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
            {/* Backdrop */}
            <div className="absolute inset-0 bg-black/40" />

            {/* Modal */}
            <div className="relative bg-white rounded-lg shadow-xl w-[500px] p-5">
                {/* Top-right actions */}
                <div className="absolute -top-10 right-0 flex gap-2">
                    <button
                        onClick={onClose}
                        className="w-8 h-8 flex items-center justify-center rounded-full bg-white border shadow hover:bg-gray-100"
                        aria-label="Close"
                    >
                        ×
                    </button>
                </div>
                {loadFailed ? (
                    <h3 className="text-base font-semibold text-gray-800">
                        Unable to load completed installments. Please try again.
                    </h3>
                ) : !info ? (
                    <h3 className="text-base font-semibold text-gray-800">
                        Getting Completed Installments...
                    </h3>
                ) : info.length < 1 ? (
                    <h3 className="text-base font-semibold text-gray-800">
                        No Installment Found
                    </h3>
                ) : (
                    <div className="">
                        <h3 className="text-lg font-semibold text-gray-800 ">
                            Completed Installments
                        </h3>
                        <p className="text-sm text-gray-600 border-b border-gray-300 pb-4 mb-3 mt-1">Below is the list of completed installments. Click the download button to generate and download the receipt.</p>
                        {downloadingInstallment !== null && (
                            <p className="text-sm text-blue-600 mb-2">
                                Generating receipt for installment #{downloadingInstallment}...
                            </p>
                        )}
                        <div className="max-h-[400px] overflow-y-auto">
                            {info.map(item => {
                                const isDownloading = downloadingInstallment === item?.installmentNum;

                                return (
                                    <div key={item?.installmentNum} className="border rounded-md flex items-center gap-4 py-2 my-2 pl-14 relative">
                                        <div className="bg-green-500 absolute left-0 h-full rounded-l-md w-12 flex justify-center items-center text-base font-semibold text-white">
                                            #{item?.installmentNum ?? ''}
                                        </div>
                                        <div className="flex-1">
                                            <p className="text-lg font-semibold text-green-600">₹ {item?.agreedInstallmentAmount ?? '0'}</p>
                                            <p className="text-sm text-gray-700">{item?.agreedInstallmentPaymentDate ?? ''} &bull; <span className="text-blue-500 font-medium">{STATUS[item?.isPaymentDone ?? '0']}</span></p>
                                        </div>
                                        <button
                                            type="button"
                                            onClick={() => handleDownload(item?.installmentNum)}
                                            disabled={downloadingInstallment !== null}
                                            className={`px-4 ${downloadingInstallment !== null ? 'cursor-not-allowed opacity-70' : 'cursor-pointer'}`}
                                            aria-label={`Download receipt for installment ${item?.installmentNum}`}
                                        >
                                            {isDownloading ? (
                                                <svg className="animate-spin" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width="24" height="24" fill="none">
                                                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="#505050" strokeWidth="3"></circle>
                                                    <path className="opacity-75" fill="#505050" d="M4 12a8 8 0 018-8V1C6.477 1 2 5.477 2 11h2z"></path>
                                                </svg>
                                            ) : (
                                                <svg className="pointer-events-none" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width="24" height="24" color="#505050" fill="none" stroke="#505050" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                                                    <path d="M2.99969 17.0002C2.99969 17.9302 2.99969 18.3952 3.10192 18.7767C3.37932 19.8119 4.18796 20.6206 5.22324 20.898C5.60474 21.0002 6.06972 21.0002 6.99969 21.0002L16.9997 21.0002C17.9297 21.0002 18.3947 21.0002 18.7762 20.898C19.8114 20.6206 20.6201 19.8119 20.8975 18.7767C20.9997 18.3952 20.9997 17.9302 20.9997 17.0002" />
                                                    <path d="M16.4998 11.5002C16.4998 11.5002 13.1856 16.0002 11.9997 16.0002C10.8139 16.0002 7.49976 11.5002 7.49976 11.5002M11.9997 15.0002V3.00016" />
                                                </svg>
                                            )}
                                        </button>
                                    </div>
                                )
                            })}
                        </div>
                    </div>
                )}
            </div>
        </div>
    )
}
