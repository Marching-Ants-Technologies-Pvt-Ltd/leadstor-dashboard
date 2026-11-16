import { useState, useEffect } from "react";
import { toast } from 'react-toastify';
import { xFetch } from '@/utility/xFetch';
import { toInstallmentList } from './paymentUtils';

export default function PendingInstallments({ open, onClose }) {

    const [info, setInfo] = useState(null);
    const [loadFailed, setLoadFailed] = useState(false);

    useEffect(() => {
        setInfo(null);
        setLoadFailed(false);
        if (open && open?.amount !== '0' && open?.amount !== '') {
            xFetch({
                path: '/services/joinees/getPendingPaymentInstallments',
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
                    console.error(`An error occurred while fetching pending installments`, error);
                    setLoadFailed(true);
                    toast.error('Server error occurred, Try again');
                });
        }
    }, [open]);

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
                        ✕
                    </button>
                </div>
                {loadFailed ? (
                    <h3 className="text-base font-semibold text-gray-800">
                        Unable to load pending installments. Please try again.
                    </h3>
                ) : !info ? (
                    <h3 className="text-base font-semibold text-gray-800">
                        Getting Pending Installments...
                    </h3>
                ) : info.length < 1 ? (
                    <h3 className="text-base font-semibold text-gray-800">
                        No Installment Found
                    </h3>
                ) : (
                    <div className="">
                        <h3 className="text-lg font-semibold text-gray-800 ">
                            Pending Installments
                        </h3>
                        <p className="text-sm text-gray-600 border-b border-gray-300 pb-4 mb-3 mt-1">Below is the list of pending installments. Please ensure the payment is completed on or before the due date.</p>
                        <div className="max-h-[400px] overflow-y-auto">
                            {info.map(item => {
                                return (
                                    <div key={item?.installmentNum} className="border rounded-md flex items-center gap-4 py-2 my-2 pl-14 relative">
                                        <div className="bg-amber-500 absolute left-0 h-full rounded-l-md w-12 flex justify-center items-center text-base font-semibold text-white">
                                            #{item?.installmentNum ?? ''}
                                        </div>
                                        <div className="flex-1">
                                            <p className="text-lg font-semibold text-gray-600">₹ {item?.agreedInstallmentAmount ?? '0'}</p>
                                            <p className="text-sm text-gray-700">{item?.agreedInstallmentPaymentDate ?? ''} &bull; <span className="text-amber-500 font-medium">Pending</span></p>
                                        </div>
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
