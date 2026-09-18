import { useState } from 'react';
import ConfirmDelete from '@/components/elements/ConfirmDelete';
import { STATUS, MonthNameByIndex } from '../paymentUtils';

export default function JoineeInstallments({
    installments = {},
    currency = '₹',
    onInstallmentEdit = (e) => { },
    onInstallmentDelete = (e) => { }
}) {

    const [deleteInstallment, setDeleteInstallment] = useState(null);
    const Items = Object.entries(installments);
    const today = new Date();
    const todayStr = `${String(today.getDate()).padStart(2, '0')}-${MonthNameByIndex[today.getMonth()]}-${today.getFullYear()}`;

    const formatInstallmentDate = (value = '') => {
        if (!value) return '-';

        const datePart = `${value}`.split(' ')[0];
        const parts = datePart.split('-');

        if (parts.length !== 3) return value;

        // New format: YYYY-MM-DD HH:mm:ss
        if (parts[0].length === 4) {
            const [year, month, day] = parts;
            const monthName = MonthNameByIndex[Number(month) - 1];
            if (!monthName) return value;

            return `${String(Number(day)).padStart(2, '0')}-${monthName}-${year}`;
        }

        // Old format: DD-Mon-YYYY
        return value;
    };

    const addNewInstallment = () => {
        onInstallmentEdit({ count: Items.length + 1, type: 'Create', currencyIcon: currency, date: todayStr });
    } 

    return (
        <div className="bg-white border border-gray-200 rounded-[10px] p-5 mt-5">

            <h4 className="text-sm font-semibold mb-1">
                Installments
            </h4>

            <ConfirmDelete
                open={deleteInstallment}
                onClose={() => setDeleteInstallment(null)}
                onConfirm={() => {
                    onInstallmentDelete(deleteInstallment);
                    setDeleteInstallment(null);
                }}
            />

            {Items.length > 0 ? (
                <div>
                    <div id="InstallmentCards flex gap-2">
                        {Items.map(([key, value]) => (
                            <InstallmentCard
                                key={key}
                                counter={key}
                                currencyIcon={currency}
                                amount={value?.amount ?? 0}
                                date={formatInstallmentDate(value?.date ?? '-')}
                                initialAgreedPaymentDate={formatInstallmentDate(value?.initialAgreedPaymentDate ?? value?.date ?? '')}
                                status={value?.status ?? '0'}
                                refNo={value?.refNum ?? ''}
                                receiptDate={value?.receiptDate ?? value?.receipt_date ?? ''}
                                onDelete={setDeleteInstallment}
                                onEdit={onInstallmentEdit}
                            />
                        ))}
                    </div>
                    <button onClick={addNewInstallment} className="mt-6 px-3 py-2 text-[13px] bg-blue-600 text-white rounded-md hover:bg-blue-800">
                        ✚ Add Installment
                    </button>
                </div>
            ) : (
                <div className="bg-green-50 rounded-md w-full min-h-52 flex justify-center items-center flex-col mt-3">

                    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width="36" height="36" color="#292525" fill="none" stroke="#292525" strokeWidth="1" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M14.4998 19H12.4998C9.67139 19 8.25718 19 7.3785 18.1213C6.49982 17.2426 6.49982 15.8284 6.49982 13V8C6.49982 5.17157 6.49982 3.75736 7.3785 2.87868C8.25718 2 9.67139 2 12.4998 2H13.843C14.6605 2 15.0692 2 15.4368 2.15224C15.8043 2.30448 16.0933 2.59351 16.6714 3.17157L19.3282 5.82843C19.9063 6.40648 20.1953 6.69552 20.3476 7.06306C20.4998 7.4306 20.4998 7.83935 20.4998 8.65685V13C20.4998 15.8284 20.4998 17.2426 19.6211 18.1213C18.7425 19 17.3282 19 14.4998 19Z" />
                        <path d="M14.9998 2.5V3.5C14.9998 5.38562 14.9998 6.32843 15.5856 6.91421C16.1714 7.5 17.1142 7.5 18.9998 7.5H19.9998" />
                        <path d="M6.49945 5C4.8426 5 3.49945 6.34315 3.49945 8V16C3.49945 18.8285 3.49945 20.2427 4.37813 21.1213C5.25681 22 6.67102 22 9.49945 22H14.4998C16.1566 22 17.4998 20.6568 17.4998 19" />
                        <path d="M10 11H14M10 15H17" />
                    </svg>
                    <p className="text-sm text-gray-700 mt-4">Records Not Found!</p>
                    <p className="text-xs text-gray-700 mt-1">
                        <span onClick={addNewInstallment} className="text-blue-500 font-semibold cursor-pointer hover:underline">Click here</span> to add first installment</p>
                </div>
            )}

        </div>
    )
}

// Helper Components
function InstallmentCard({ counter = '1', currencyIcon = '₹', amount, date, initialAgreedPaymentDate = '', status = '0', refNo = '', receiptDate = '', onDelete = (e) => { }, onEdit = (e) => { } }) {

    let statusText = STATUS?.[status] ?? 'Not Paid';
    let statusInt = Number(status || 0);
    const hasPaidInfo = (statusInt > 0 && statusInt < 10) && (initialAgreedPaymentDate !== '');
    return (
        <div className="flex rounded-xl border bg-white overflow-hidden mt-2">

            <div className={`group/item w-14 text-white flex flex-col items-center py-3 transition-colors has-[button:hover]:bg-red-500 ${(statusInt < 1) ? 'bg-yellow-400' : (statusInt > 9) ? 'bg-blue-500' : 'bg-green-500'}`}>
                <span className="font-bold">#{counter}</span>
                <button className="mt-auto hover:scale-110 transition-transform" onClick={() => onDelete(counter)}>
                    <svg className="pointer-events-none" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width="20" height="20" color="#ffffff" fill="none" stroke="#ffffff" strokeWidth="1.5" strokeLinecap="round">
                        <path d="M19.5 5.5L18.8803 15.5251C18.7219 18.0864 18.6428 19.3671 18.0008 20.2879C17.6833 20.7431 17.2747 21.1273 16.8007 21.416C15.8421 22 14.559 22 11.9927 22C9.42312 22 8.1383 22 7.17905 21.4149C6.7048 21.1257 6.296 20.7408 5.97868 20.2848C5.33688 19.3626 5.25945 18.0801 5.10461 15.5152L4.5 5.5" />
                        <path d="M3 5.5H21M16.0557 5.5L15.3731 4.09173C14.9196 3.15626 14.6928 2.68852 14.3017 2.39681C14.215 2.3321 14.1231 2.27454 14.027 2.2247C13.5939 2 13.0741 2 12.0345 2C10.9688 2 10.436 2 9.99568 2.23412C9.8981 2.28601 9.80498 2.3459 9.71729 2.41317C9.32164 2.7167 9.10063 3.20155 8.65861 4.17126L8.05292 5.5" />
                        <path d="M9.5 16.5L9.5 10.5" />
                        <path d="M14.5 16.5L14.5 10.5" />
                    </svg>
                </button>
            </div>

            <div className="flex-1 px-5 py-3 space-y-1 text-sm" onClick={() => onEdit({ count: parseInt(counter), amount, date, initialAgreedPaymentDate, status, refNo, receipt_date: receiptDate, type: `Edit #${counter}`, currencyIcon })}>
                <div className="flex justify-between">
                    <span className="text-gray-500">Amount</span>
                    <span title='Click to edit' className="font-semibold cursor-pointer">{currencyIcon}{amount}</span>
                </div>

                <div className="flex justify-between">
                    <span className="text-gray-500">Payment Date</span>
                    <span title='Click to edit' className="cursor-pointer">{date}</span>
                </div>

                <div className="flex justify-between">
                    <span className="text-gray-500">Status</span>
                    <span title='Click to edit' className={`font-medium cursor-pointer ${(statusInt < 1) ? 'text-amber-500' : (statusInt > 9) ? 'text-blue-500' : 'text-green-500'}`}>
                        {statusText}
                    </span>
                </div>

                {!(status === '0') &&
                    <div className="flex justify-between">
                        <span className="text-gray-500">Ref No</span>
                        <span title='Click to edit' className="cursor-pointer">{refNo}</span>
                    </div>
                }

                {hasPaidInfo && (
                    <>
                        <div className="flex justify-between">
                            <span className="text-gray-500">Agreed Payment Date</span>
                            <span title='Click to edit' className="cursor-pointer">{initialAgreedPaymentDate}</span>
                        </div>
                    </>
                )}
            </div>
        </div>
    )
}
