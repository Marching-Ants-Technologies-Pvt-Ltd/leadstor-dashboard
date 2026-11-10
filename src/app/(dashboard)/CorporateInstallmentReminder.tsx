"use client"

import Link from "next/link";
import { useCallback, useEffect, useState } from "react"

type PaymentState = 'OK' | 'UPCOMING' | 'OVERDUE' | 'BLOCKED';

interface PaymentStatus {
    state: PaymentState;
    dueDate: string;
    overdueDays: number;
    message: string;
}

export default function CorporateInstallmentReminder() {
    const [status, setStatus] = useState<PaymentStatus>({
        state: 'OK',
        dueDate: '',
        overdueDays: 0,
        message: '',
    });

    const checkOverdueStatus = useCallback(async (token: string) => {

        let _data: PaymentStatus = {
            state: 'OK',
            dueDate: '',
            overdueDays: 0,
            message: '',
        };

        if (token.length < 30) return _data;

        try {
            const myHeaders = new Headers();
            myHeaders.append("Content-Type", "application/json");
            myHeaders.append("Authorization", "Bearer " + token);

            const response = await fetch(`${process.env.NEXT_PUBLIC_LEADSTOR_REST}/services/profile/paymentOverdue`, {
                method: "GET",
                headers: myHeaders,
                redirect: "follow"
            });

            if (response.status !== 200) {
                throw new Error(`Failed to fetch overdue balance EC-${response.status}`);
            }

            const data = await response.json();

            _data.state = data?.state || 'OK';
            _data.dueDate = data?.dueDate || '';
            _data.overdueDays = data?.overdueDays || 0;
            _data.message = data?.message || '';

        } catch (error) {
            console.error('[LEADSTOR]', error);
        } finally {
            return _data
        }
    }, [])

    useEffect(() => {
        const checkExpiryDate = async () => {
            const token = localStorage.getItem('access_token')
                || localStorage.getItem('LEADSTOR_SESSION_TOKEN')
                || "";
            const result = await checkOverdueStatus(token);

            setStatus(result);
        }

        setTimeout(checkExpiryDate, 5000);

    }, [checkOverdueStatus])

    // Only UPCOMING / OVERDUE / BLOCKED states show the banner.
    const isVisible = status.state !== 'OK' && status.message.length > 3;
    const isCritical = status.state === 'OVERDUE' || status.state === 'BLOCKED';

    return (

        <div className={`w-full h-12 text-zinc-800 ${isVisible ? 'flex' : 'hidden'} justify-between items-center px-10 gap-2 bg-${isCritical ? 'rose' : 'orange'}-200`}>
            <div className='w-4 h-4 flex justify-center items-center relative'>
                <div className={`w-2 h-2 rounded-full bg-${isCritical ? 'rose' : 'orange'}-600`}></div>
                <div className={`w-4 h-4 absolute top-0 left-0 rounded-full animate-ping bg-${isCritical ? 'rose' : 'orange'}-600`}></div>

                <span className="bg-orange-600 hidden"></span>
                <span className="bg-orange-200 hidden"></span>
                <span className="bg-rose-600 hidden"></span>
                <span className="bg-rose-200 hidden"></span>
            </div>
            <div className='text-sm flex-1'>
                {status.message}
            </div>
            <Link
                href='/pay/subscription'
                className='bg-zinc-800 text-white rounded-md cursor-pointer text-xs px-4 py-2 font-semibold'>
                Pay Now
            </Link>
        </div>

    )
}