"use client"

import { useCallback, useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { SessionProvider, getSession } from "next-auth/react";
import Image from 'next/image';
import { IoIosExit } from "react-icons/io";
import Link from 'next/link';

export default function GeneralLayout({
    children,
}: Readonly<{
    children: React.ReactNode;
}>) {
    const router = useRouter();
    const [ready, setReady] = useState<boolean>(false);

    const ping = useCallback(async (token: string) => {

        let code = "FAILED";
        try {
            const myHeaders = new Headers();
            myHeaders.append("Content-Type", "application/json");
            myHeaders.append("Authorization", "Bearer " + token);

            const response = await fetch(`${process.env.NEXT_PUBLIC_LEADSTOR_REST}/services/profile/ping`, {
                method: "GET",
                headers: myHeaders,
                redirect: "follow"
            });

            if (response.status !== 200) {
                throw new Error(`Failed to fetch overdue balance EC-${response.status}`);
            }

            code = "OK";

        } catch (error) {
            console.error('[LEADSTOR]', error);
        } finally {
            return { code }
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
            const status = await ping(data?.user?.cn_token);

            if (status.code !== "OK") {
                router.push('/');
            }

            localStorage.setItem('LEADSTOR_SESSION_TOKEN', data?.user?.cn_token);
            setReady(true);
        };

        fetchSession();

    }, [router, ping]);

    return (
        <SessionProvider>
            <div className="min-h-screen bg-slate-50 px-4 py-8 sm:px-6 lg:px-8">
                <div className="mx-auto max-w-6xl">

                    {/* Header */}
                    <div className='flex justify-between items-center mb-16'>
                        <div className="flex items-center gap-2">
                            <div className="flex h-7 w-7 items-center justify-center">
                                <Image
                                    src="/icons/leadstor.png"
                                    alt='Leadstor Logo'
                                    width={50}
                                    height={50}
                                    className='h-7 w-7'
                                />
                            </div>

                            <span className=" text-lg font-medium text-slate-500">Leadstor</span>
                        </div>
                        <div className="flex items-center justify-center gap-2">
                            <Link href="/signout" className='bg-zinc-50 border-zinc-200 text-zinc-500 hover:bg-rose-50 hover:text-rose-500 cursor-pointer px-2 h-7 flex justify-center items-center gap-1'>
                                <span className='text-[13px] font-semibold'>SignOut</span>
                                <IoIosExit size={20} className='text-rose-500' />
                            </Link>
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