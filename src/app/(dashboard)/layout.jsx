'use client';

import { TourProvider } from '@reactour/tour'
import 'remixicon/fonts/remixicon.css';
import Sidebar from '@/components/dashboard/Navbar/Sidebar';
import Navbar from '@/components/dashboard/Navbar/Navbar';
import Loading from '@/components/elements/Loading';
import { ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import { useRouter, usePathname } from 'next/navigation';
import { useEffect, useState } from 'react';
import { SessionProvider, getSession } from "next-auth/react";
import { LeadsCurrentPage, LeadFilters, LeadSearch, User } from '@/utility/TinyDB';
import ReminderPopup from '@/components/ReminderPopup';

export default function ClientLayout({ children }) {
  const [session, setSession] = useState(null);
  const router = useRouter();
  const pathname = usePathname();
  const [collapsed, setCollapsed] = useState(true);

  useEffect(() => {
    const fetchSession = async () => {
      const sessionData = await getSession();
      if (!sessionData) {
        router.push('/signin');
        return;
      }
      const data = JSON.parse(localStorage.getItem('CurrentSessionData'));
      setSession(data);
    };

    fetchSession();
  }, [router]);

  function getPageInfo(path) {
    if (!path) return { title: 'Dashboard Overview', description: '' };
    const parts = path.split('/').filter(Boolean);

    if (parts.length >= 1) {
      switch (parts[0]) {
        case 'leads': return { title: 'Lead Management' };
        case 'conversions': return { title: 'Conversion Tracking' };
        case 'dashboard': return { title: 'Dashboard Overview' };
        case 'integrations': return { title: 'Integration Center' };
        case 'automation': return { title: 'Automation Hub' };
        case 'reports': return { title: 'Analytics & Reports' };
        case 'campaigns': return { title: 'Campaign Manager' };
        case 'contacts': return { title: 'Contact Directory' };
        case 'settings': return { title: 'System Settings' };
        case 'profile': return { title: 'Profile Settings' };
        default:
          return { title: `${parts[0][0].toUpperCase()}${parts[0].slice(1)} Management` };
      }
    }
    return { title: 'Dashboard Overview' };
  }

  const pageInfo = getPageInfo(pathname);

  useEffect(() => {
    LeadFilters.reset();
    LeadSearch?.reset?.(); // if search is also persisted
    LeadsCurrentPage.setValue(1);

    window.refreshLeadMenu?.();
    window.tableRefresh?.();
    window.onTableRefresh?.();

    return () => {
      delete window.tableRefresh;
    };
  }, []);


  if (!session) return <Loading />;

  return (
    <SessionProvider>
      <ToastContainer position="top-right" autoClose={3000} />
      <TourProvider>
        <div className="flex h-screen overflow-hidden bg-[#f5f6f8] font-[-apple-system,BlinkMacSystemFont,Segoe_UI,Arial]">
          {/* Sidebar */}
          <Sidebar collapsed={collapsed} setCollapsed={setCollapsed} userRole={User?.role || ''} />

          <div className="flex flex-col flex-1 min-w-0">
            {/* Navbar / Header */}
            <Navbar data={session} collapsed={collapsed} setCollapsed={setCollapsed} />

            <div className="flex-1 overflow-hidden flex flex-col">
              {/* Main content area */}
              {children}
              {/* ✅ SSE Listener mounted globally */}
              <ReminderPopup />
            </div>
          </div>
        </div>
      </TourProvider>
    </SessionProvider>
  );
}

export const experimental_ppr = true;