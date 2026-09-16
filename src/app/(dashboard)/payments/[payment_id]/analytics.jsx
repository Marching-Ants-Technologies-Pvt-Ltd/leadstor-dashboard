import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';

export default function JoineePaymentAnalytics({
    agreedPayment = 0,
    installments = {},
    currency = '₹',
    onChat = () => { },
    gotoNotes = () => { },
    onSave = () => { }
}) {
    const [report, setReport] = useState({
        agreed: 0,
        refunded: 0,
        paid: 0,
        pending: 0,
        overdue: 0
    });

    const router = useRouter();

    useEffect(() => {
        let paidAmount = 0;
        let refundedAmount = 0;
        let overdueAmount = 0;
        const today = new Date();
        today.setHours(0, 0, 0, 0); // normalize

        Object.values(installments).forEach(item => {
            const amount = Math.abs(Number(item.amount) || 0);
            const status = Number(item.status) || 0;

            // Parse date like "11-Jan-2026"
            const installmentDate = new Date(item.date);

            if (status > 0 && status < 9) {
                paidAmount += amount;
            } else if (status > 9) {
                refundedAmount += amount;
            } else if (
                status === 0 &&
                installmentDate instanceof Date &&
                !isNaN(installmentDate) &&
                installmentDate < today
            ) {
                overdueAmount += amount;
            }
        });

        const safeAgreedPayment = Number(agreedPayment) || 0;
        const effectivePaid = Math.max(paidAmount - refundedAmount, 0);
        const pendingAmount = Math.max(
            safeAgreedPayment - effectivePaid,
            0
        );

        setReport({
            agreed: safeAgreedPayment,
            paid: paidAmount,
            refunded: refundedAmount,
            pending: pendingAmount,
            overdue: overdueAmount,
        });
    }, [installments, agreedPayment]);

    return (
        <div style={{ boxSizing: 'border-box', width: 'calc(100% - 65px)' }} className="bg-white border-b z-10 border-slate-200 px-5 py-4 flex justify-between items-center fixed">
            <div className="flex gap-7 text-xs text-slate-500">
                <div>
                    <div>Total Agreed</div>
                    <div className="text-base font-semibold text-slate-900">{currency} {agreedPayment}</div>
                </div>
                <div>
                    <div>Total Paid</div>
                    <div className="text-base font-semibold text-green-600">{currency} {report.paid}</div>
                </div>
                <div>
                    <div>Pending</div>
                    <div className="text-base font-semibold text-amber-600">{currency} {report.pending}</div>
                </div>
                <div>
                    <div>Refunded</div>
                    <div className="text-base font-semibold text-blue-600">{currency} {report.refunded}</div>
                </div>
                <div>
                    <div>Overdue</div>
                    <div className="text-base font-semibold text-red-600">{currency} {report.overdue}</div>
                </div>
            </div>

            <div className="flex gap-2">
                <button className="px-4 py-2 text-sm border border-slate-300 rounded bg-slate-50" onClick={gotoNotes}>📝 Add Note</button>
                <button className="px-4 py-2 text-sm rounded bg-green-500 text-white flex justify-center items-center gap-2" onClick={onChat}>
                    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width="22" height="22" color="#ffffff" fill="none" stroke="#ffffff" strokeWidth="1.5" strokeLinejoin="round">
                        <path d="M12 22C17.5228 22 22 17.5228 22 12C22 6.47715 17.5228 2 12 2C6.47715 2 2 6.47715 2 12C2 13.3789 2.27907 14.6926 2.78382 15.8877C3.06278 16.5481 3.20226 16.8784 3.21953 17.128C3.2368 17.3776 3.16334 17.6521 3.01642 18.2012L2 22L5.79877 20.9836C6.34788 20.8367 6.62244 20.7632 6.87202 20.7805C7.12161 20.7977 7.45185 20.9372 8.11235 21.2162C9.30745 21.7209 10.6211 22 12 22Z" />
                        <path d="M8.58815 12.3773L9.45909 11.2956C9.82616 10.8397 10.2799 10.4153 10.3155 9.80826C10.3244 9.65494 10.2166 8.96657 10.0008 7.58986C9.91601 7.04881 9.41086 7 8.97332 7C8.40314 7 8.11805 7 7.83495 7.12931C7.47714 7.29275 7.10979 7.75231 7.02917 8.13733C6.96539 8.44196 7.01279 8.65187 7.10759 9.07169C7.51023 10.8548 8.45481 12.6158 9.91948 14.0805C11.3842 15.5452 13.1452 16.4898 14.9283 16.8924C15.3481 16.9872 15.558 17.0346 15.8627 16.9708C16.2477 16.8902 16.7072 16.5229 16.8707 16.165C17 15.8819 17 15.5969 17 15.0267C17 14.5891 16.9512 14.084 16.4101 13.9992C15.0334 13.7834 14.3451 13.6756 14.1917 13.6845C13.5847 13.7201 13.1603 14.1738 12.7044 14.5409L11.6227 15.4118" />
                    </svg>
                    <div>Whatsapp Chat</div>
                </button>
                <button className="px-4 py-2 text-sm border border-blue-500 bg-blue-500 rounded text-white" onClick={onSave}>Save Changes</button>
                <button className='border-l border-gray-200 pl-4 ml-4' title='Close' onClick={() => router.back()}>
                    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width="24" height="24" color="#f54646" fill="none" stroke="#f54646" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M18 6L6.00081 17.9992M17.9992 18L6 6.00085" />
                    </svg>
                </button>
            </div>
        </div>

    );

}
