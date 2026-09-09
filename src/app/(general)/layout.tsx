"use client"

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { SessionProvider, getSession } from "next-auth/react";


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
            {children}
        </SessionProvider>
    )
}