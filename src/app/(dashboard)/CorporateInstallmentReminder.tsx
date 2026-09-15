"use client"

import Link from "next/link";
import { useCallback, useEffect, useState } from "react"

export default function CorporateInstallmentReminder() {
    const [expiryDate, setExpiryDate] = useState<string>('');
    const [isExpired, setIsExpired] = useState<boolean>(false);

    const checkOverdueStatus = useCallback(async (token: string) => {

        let _data = {
            expiryDate: "",
            isExpired: false
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

            _data.expiryDate = data?.expiryDate || '';
            _data.isExpired = data?.isExpired || false;

        } catch (error) {
            console.error('[LEADSTOR]', error);
        } finally {
            return _data
        }
    }, [])

    useEffect(() => {
        const checkExpiryDate = async () => {
            let token = localStorage.getItem('access_token') || "";
            let status = await checkOverdueStatus(token);

            setExpiryDate(status.expiryDate);
            setIsExpired(status.isExpired);

        }

        setTimeout(checkExpiryDate, 5000);

    }, [checkOverdueStatus])


    return (

        <div className={`w-full h-12 text-zinc-800 ${(expiryDate.length > 3) ? 'flex' : 'hidden'} justify-between items-center px-10 gap-2 bg-${isExpired ? 'rose' : 'orange'}-200`}>
            <div className='w-4 h-4 flex justify-center items-center relative'>
                <div className={`w-2 h-2 rounded-full bg-${isExpired ? 'rose' : 'orange'}-600`}></div>
                <div className={`w-4 h-4 absolute top-0 left-0 rounded-full animate-ping bg-${isExpired ? 'rose' : 'orange'}-600`}></div>

                <span className="bg-orange-600 hidden"></span>
                <span className="bg-orange-200 hidden"></span>
                <span className="bg-rose-600 hidden"></span>
                <span className="bg-rose-200 hidden"></span>
            </div>
            <div className='text-sm flex-1'>
                Your Leadstor subscription {isExpired ? 'is expired' : 'will expires'} on <strong>{expiryDate}</strong>. Renew today to avoid any interruption in your services.
            </div>
            <Link
                href={(isExpired) ? '/pay/overdue' : '/pay/subscription'}
                className='bg-zinc-800 text-white rounded-md cursor-pointer text-xs px-4 py-2 font-semibold'>
                {isExpired ? "Pay Now" : "Renew Now"}
            </Link>
        </div>

    )
}