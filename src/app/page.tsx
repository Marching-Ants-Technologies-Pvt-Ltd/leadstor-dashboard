'use client';

import Image from 'next/image';
import { useRouter, usePathname } from 'next/navigation';
import { useCallback, useEffect, useState } from 'react';
import { signOut, getSession } from "next-auth/react";

const validPathList: any = {
  'SIGNIN': "/signin",
  'VALIDATE_EMAIL': '/account-verification',
  'LEAD': '/leads',
  'PAYMENT_DUE': '/payment-overdue',
};

export default function Home() {
  const router = useRouter();
  const [label, setLabel] = useState('Collecting Resources')

  // Set Current Session Data In LocalStorage and Decide Final Destination
  const setCurrentSessionData = useCallback(async (info: any) => {

    let page = "/leads";

    try {
      const myHeaders = new Headers();
      myHeaders.append("Content-Type", "application/json");
      myHeaders.append("Authorization", "Bearer " + (info?.user?.cn_token || ''));

      const corporateInfo = await fetch(`${process.env.NEXT_PUBLIC_LEADSTOR_REST}/services/profile/corporate`, {
        method: "GET",
        headers: myHeaders,
        redirect: "follow"
      });

      const data = await corporateInfo.json();

      data['session'] = {
        "provider": info.user.auth_provider,
        "uuid": info.user.uuid,
      };

      localStorage.setItem('CurrentSessionData', JSON.stringify(data));

      const userRoles = Array.isArray(data['user']?.role)
        ? data['user'].role.map((r: any) => String(r).trim())
        : [String(data['user']?.role).trim()];

      if (userRoles.includes("Finance")) page = "/payments";
      if (userRoles.includes("Placement Officer")) page = "/placements";
      if (userRoles.includes("Trainer")) page = "/batches";

    } catch (error) {
      console.error('CHECK:NEXT_PAGE', error)
    } finally {
      return { page }
    }
  }, [])

  const whatNext = useCallback(async (token: string) => {
    // Check if token is of valid length
    if (token.length < 30) return { page: "/signout" }

    let page = "/support";

    try {
      const myHeaders = new Headers();
      myHeaders.append("Content-Type", "application/json");

      const response = await fetch(`${process.env.NEXT_PUBLIC_LEADSTOR_REST}/services/leadstor/nextPage`, {
        method: "POST",
        headers: myHeaders,
        body: JSON.stringify({ api_token: token }),
        redirect: "follow"
      });

      const result = await response.json();

      if (result.error) throw new Error(result.error);

      page = validPathList[result.page] ?? '/support';

      // Intentional - remove it after testing
      page = '/payment-overdue';

    } catch (error) {
      console.error('CHECK:NEXT_PAGE', error)
    } finally {
      return { page }
    }

  }, [])

  useEffect(() => {
    const fetchSession = async () => {

      setLabel('Checking Session Status')
      const sessionData = await getSession();

      if (!sessionData) {
        router.push('/signin');
        return;
      }

      // router.push('/leads');
      console.log('We have session buddy', sessionData);

      setLabel('Verifying Your Credentials')
      const data = JSON.parse(JSON.stringify(sessionData));
      let _next = await whatNext(data?.user?.cn_token ?? '')
      console.log('Next', _next);

      // We need to setup few credentials before we take user to /leads page
      if (_next.page === "/leads") {
        setLabel('Preparing Dashboard')
        _next = await setCurrentSessionData(data);
      }

      // Clean session cache from local before sending to signIn page
      if (_next.page === "/signin") {
        localStorage.removeItem('CurrentSessionData');
        localStorage.removeItem('LeadOwnersById');
        localStorage.removeItem('LeadsPerPage');
        localStorage.removeItem('TotalLeads');
        localStorage.removeItem('LeadsCurrentPage');
        signOut();
      }

      router.push(_next.page);

    };

    setTimeout(fetchSession, 1500)

  }, [router, whatNext, setCurrentSessionData]);

  return (
    <div className="flex items-center justify-center py-10 h-dvh">
      <div className='flex flex-col items-center gap-8'>
        <Image
          src="/icons/leadstor.png"
          alt='Leadstor Logo'
          width={200}
          height={200}
          className='w-20 h-20'
        />
        <div className='flex justify-center items-center gap-2 h-8'>
          <div className='w-[18px] h-[18px] border-[3px] border-blue-500 rounded-full border-r-white animate-spin'></div>
          <span className='text-xl font-semibold text-zinc-700 relative -top-[2px]'>{label}</span>
        </div>
      </div>
    </div>
  );
}
