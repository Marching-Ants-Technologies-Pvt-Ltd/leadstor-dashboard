"use client"

import { useCallback, useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { SessionProvider, getSession } from "next-auth/react";
import Image from 'next/image';
import { IoIosExit } from "react-icons/io";
import { FiArrowRight } from "react-icons/fi";
import Link from 'next/link';

export default function GeneralLayout({
    children,
}: Readonly<{
    children: React.ReactNode;
}>) {
    const router = useRouter();
    const [ready, setReady] = useState<boolean>(false);
    const [paymentState, setPaymentState] = useState<string>('OK');

    const checkOverdueStatus = useCallback(async (token: string) => {

        let _data = {
            state: "OK",
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

            _data.state = data?.state || 'OK';
            _data.expiryDate = data?.expiryDate || '';
            _data.isExpired = data?.isExpired || false;

        } catch (error) {
            console.error('[LEADSTOR]', error);
        } finally {
            return _data
        }
    }, [])

    useEffect(() => {
        const fetchSession = async () => {

            const sessionData = await getSession();

            if (!sessionData) {
                router.push('/signin');
                return;
            }

            const data = JSON.parse(JSON.stringify(sessionData));

            if (window.location.pathname.startsWith('/pay/')) {
                const status = await checkOverdueStatus(data?.user?.cn_token);

                // If the account is BLOCKED, always keep the user on the pay
                // screen (even with no pending installment — they must contact
                // support). Otherwise, if there is nothing pending, send them
                // back to the dashboard.
                if (status.state !== 'BLOCKED' && status.expiryDate.length < 3) {
                    router.push('/');
                    return;
                }

                setPaymentState(status.state);
            }

            localStorage.setItem('LEADSTOR_SESSION_TOKEN', data?.user?.cn_token);
            setReady(true);
        };

        fetchSession();

    }, [router, checkOverdueStatus]);

    return (
        <SessionProvider>
            <div className="min-h-screen bg-slate-50 px-4 py-8 sm:px-6 lg:px-8">
                <div className="mx-auto max-w-6xl">

                    {/* Header */}
                    <div className='flex justify-between items-center mb-12 pb-5 border-b border-zinc-200'>
                        <div className="flex items-center gap-2.5">
                            <div className="flex h-8 w-8 items-center justify-center">
                                <Image
                                    src="/icons/leadstor.png"
                                    alt='Leadstor Logo'
                                    width={50}
                                    height={50}
                                    className='h-8 w-8'
                                />
                            </div>

                            <div className="flex flex-col leading-none">
                                <span className="text-base font-semibold text-slate-700">Leadstor</span>
                                <span className="text-[11px] text-slate-400 mt-0.5">Subscription &amp; Billing</span>
                            </div>
                        </div>
                        <div className="flex items-center justify-center gap-2">
                            {paymentState === 'BLOCKED' ? (
                                <Link href="/signout" className='bg-zinc-50 border border-zinc-200 text-zinc-500 hover:bg-rose-50 hover:text-rose-500 hover:border-rose-200 cursor-pointer rounded-md px-3 h-8 flex justify-center items-center gap-1.5 transition'>
                                    <span className='text-[13px] font-semibold'>Sign Out</span>
                                    <IoIosExit size={18} className='text-rose-500' />
                                </Link>
                            ) : (
                                <Link href="/" className='bg-zinc-900 text-white hover:bg-zinc-800 cursor-pointer rounded-md px-3 h-8 flex justify-center items-center gap-1.5 transition'>
                                    <span className='text-[13px] font-semibold'>Go to Dashboard</span>
                                    <FiArrowRight size={16} />
                                </Link>
                            )}
                        </div>
                    </div>

                    {ready ? (<>{children}</>) : (
                        <div className='general-container flex justify-center items-center'>
                            <div className="flex items-center justify-center gap-2 py-10 h-full w-full">
                                <div className="h-4 w-4 animate-spin rounded-full border-2 border-blue-500 border-t-transparent" />
                                <div className="text-sm text-zinc-400">It may take few seconds. Please wait</div>
                            </div>
                        </div>
                    )}

                    {/* Footer */}
                    <div className='flex justify-between items-center border-t border-zinc-200 pt-5 mt-16 text-xs text-slate-400'>
                        <div className="">
                            &copy; {new Date().getFullYear()} Leadstor &mdash; All rights reserved.
                        </div>
                        <div className='flex justify-center items-center gap-2'>
                            <a className='hover:text-zinc-500' href='https://leadstor.in/terms' target='_blank'>Terms Of Use</a>
                            <span>&bull;</span>
                            <a className='hover:text-zinc-500' href='https://leadstor.in/privacy-policy' target='_blank'>Privacy Policy</a>
                            <span>&bull;</span>
                            <a className='hover:text-zinc-500' href='https://leadstor.in/refund-policy' target='_blank'>Refund Policy</a>
                        </div>
                    </div>
                </div>
            </div>
        </SessionProvider>
    )
}