"use client"

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { SessionProvider, getSession } from "next-auth/react";
import Image from 'next/image';
import { IoIosExit } from "react-icons/io";


export default function GeneralLayout({
    children,
}: Readonly<{
    children: React.ReactNode;
}>) {
    const router = useRouter();

    useEffect(() => {
        const fetchSession = async () => {

            const sessionData = await getSession();

            if (!sessionData) {
                router.push('/signin');
                return;
            }

        };

        fetchSession();

    }, [router]);
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
                            <button className='bg-zinc-50 border-zinc-200 text-zinc-500 hover:bg-rose-50 hover:text-rose-500 cursor-pointer px-2 h-7 flex justify-center items-center gap-1'>
                                <span className='text-[13px] font-semibold'>SignOut</span>
                                <IoIosExit size={20} className='text-rose-500' />
                            </button>
                        </div>
                    </div>

                    {children}

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