'use client';
import React, { useState, useRef, useEffect } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import {Corporate, User} from "@/utility/TinyDB";
import { usePathname } from 'next/navigation';
import { MANAGE_ACCESS_CORPORATE_ID } from '@/utility/accessControl';

export default function Navbar({ collapsed, setCollapsed, data }) {
  const [open, setOpen] = useState(false);
  const menuRef = useRef(null);

  const [openAnalytics, setOpenAnalytics] = useState(false);
  const dropdownRef = useRef(null);
  const pathname = usePathname();

  const userRoles = Array.isArray(User.role) 
      ? User.role.map(r => String(r).trim())
      : [String(User.role).trim()];
  

  const pageTitles = {
    '/leads': 'Lead Management',
    '/leads/settings': 'Lead Settings',
    '/payments': 'Payment Management',
    '/placements': 'Placements',
    '/jobs': 'Job Postings',
    '/jobs/settings': 'Job Settings',
    '/batches': 'Batches',
    '/invoices': 'Invoices',
    '/branches': 'Branches',
    '/expenses': 'Expenses',
    '/businessProfile': 'Business Profile',
    '/teams': 'Teams',
    '/analytics/classic-analytics': 'Analytics',
    '/': 'Dashboard',
  };

  const currentTitle = pageTitles[pathname] 
    || Object.keys(pageTitles).find(p => pathname.startsWith(p + '/')) 
    || 'Lead Management';

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target)) {
        setOpenAnalytics(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);


  useEffect(() => {
    function onDoc(e) {
      if (menuRef.current && !menuRef.current.contains(e.target)) {
        setOpen(false);
      }
    }
    document.addEventListener('click', onDoc);
    return () => document.removeEventListener('click', onDoc);
  }, []);


  return (
  <header className="h-14 flex items-center px-5 bg-white/80 backdrop-blur-md border-b border-transparent shadow-sm z-30 sticky">

    {/* LEFT */}
    <div className="flex items-center gap-4 h-full">
      <i
        className="ri-menu-line cursor-pointer text-slate-500 hover:text-blue-600"
        onClick={() => setCollapsed(!collapsed)}
      />
      <span className="font-medium text-slate-800">
        {currentTitle}
      </span>
    </div>

    {/* RIGHT */}
    <div className="ml-auto flex items-center gap-6 h-full">

      <div className="flex items-center gap-4" ref={menuRef}>

      {/* icon buttons */}
      <div className="flex items-center gap-3">
      
        
      {/* Analytics Hover Dropdown */}
      {( userRoles.includes("Admin") || userRoles.includes("Administrator") || userRoles.includes("Super Counsellor")) && (
      
        <div className="relative group">
          <button className="nav-icon" title='Analytics'>
            <Link
                href="/analytics/classic-analytics"
              ><i className="ri-pie-chart-line"></i>
            </Link>
          </button>
        </div>
      )}

        <button className="nav-icon" title="Notifications">
          <i className="ri-notification-2-line"></i>
        </button>
      </div>

      {/* user area */}
      <div className="relative">
        <button
          onClick={() => setOpen(v => !v)}
          className="flex items-center gap-3 px-2 py-1 rounded hover:bg-gray-50"
          aria-haspopup="true"
          aria-expanded={open}
        >
          <Image src={data.user.image} alt="avatar" width={28} height={28} className="rounded-full" />
        </button>

        {open && (
            <div
                className="dropdown-panel"
                role="menu"
            >
              <div className="hidden md:block ml-5 leading-tight">
                <div className="text-xs text-gray-600">{data.user.name} [{data.user.role}]</div>
                <div className="text-xs text-gray-400"> {Corporate?.name}</div>
              </div>

                <Link href="/businessProfile">
                <div className="dropdown-row">
                    <i className="ri-user-3-line text-blue-500 text-lg"></i>
                    <span>Profile</span>
                </div>
                </Link>

                {( userRoles.includes("Admin") || userRoles.includes("Administrator")) && (
                  <Link href="/teams">
                  <div className="dropdown-row">
                      <i className="ri-team-line text-emerald-500 text-lg"></i>
                      <span>Teams</span>
                  </div>
                  </Link>
                )}

                {Corporate?._id === MANAGE_ACCESS_CORPORATE_ID && (
                  <Link href="/manage-access">
                    <div className="dropdown-row">
                      <i className="ri-shield-user-line text-indigo-500 text-lg"></i>
                      <span>Manage Access</span>
                    </div>
                  </Link>
                )}

                <div className="dropdown-divider" />

                <Link href="/signout">
                <div className="dropdown-row">
                    <i className="ri-logout-box-r-line text-rose-500 text-lg"></i>
                    <span>Sign out</span>
                </div>
                </Link>
            </div>
        )}

      </div>
      

      <style jsx>{`
        .nav-icon {
            width: 34px;
            height: 34px;
            display: inline-flex;
            align-items: center;
            justify-content: center;
            border-radius: 8px;
            color: #4b5563;
            transition: 0.15s ease;
        }
        .nav-icon:hover {
            background: #eef6ff;
            color: #2563eb;
        }

        /* Dropdown Container */
        .dropdown-panel {
            position: absolute;
            right: 0;
            margin-top: 8px;
            width: 160px;
            background: #ffffff;
            border: 1px solid #e5e7eb;
            border-radius: 12px;
            box-shadow: 0 6px 18px rgba(0,0,0,0.08);
            padding: 6px 0;
            z-index: 50;
        }

        /* Dropdown Item */
        .dropdown-row {
            display: flex;
            align-items: center;
            gap: 10px;
            padding: 8px 14px;
            font-size: 14px;
            color: #374151;
            cursor: pointer;
            transition: 0.15s ease;
        }

        .dropdown-row:hover {
            background: #f8fafc;
        }

        .dropdown-divider {
            height: 1px;
            background: #e5e7eb;
            margin: 4px 0;
        }
        `}</style>

    </div>
    </div>
  </header>
);

}
