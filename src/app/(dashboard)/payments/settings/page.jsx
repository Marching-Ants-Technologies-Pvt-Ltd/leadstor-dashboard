'use client';

import React, { useState } from 'react';
import dynamic from 'next/dynamic';
import { useRouter } from 'next/navigation';
import { RiArrowDownSLine, RiArrowRightSLine } from "react-icons/ri";

const AdmissionStatuses = dynamic(() => import('@/components/dashboard/Payments/Settings/AdmissionStatuses'), { ssr: false });

export default function PaymentsSettings() {
  const router = useRouter();
  const [activeMenu, setActiveMenu] = useState("admissionStatuses");
  const [openMenus, setOpenMenus] = useState({ paymentSetup: true });

  const menuStructure = [
    {
      label: "Payment Settings",
      key: "paymentSetup",
      children: [
        { key: "admissionStatuses", label: "Admission Statuses" },
      ]
    }
  ];

  const renderContent = () => {
    switch (activeMenu) {
      case "admissionStatuses":
        return <AdmissionStatuses />;
      default:
        return <div className="text-gray-500">Select an item from the menu</div>;
    }
  };

  const toggleMenu = (key) => {
    setOpenMenus({ [key]: !openMenus[key] });
  };

  return (
    <div className="flex h-screen w-full border rounded-md shadow-sm overflow-hidden">
      <aside className="w-52 bg-gray-100 p-3 overflow-y-auto text-sm">
        <h3 className="mb-4 text-lg font-semibold text-gray-700">Settings</h3>
        <ul className="ml-3 mt-1 space-y-1 border-l pl-2 border-gray-300 text-sm">
          {menuStructure.map(menu => (
            <li key={menu.key}>
              <div
                onClick={() => toggleMenu(menu.key)}
                className="cursor-pointer flex justify-between items-center px-2 py-1 hover:bg-gray-200 rounded"
              >
                <span>{menu.label}</span>
                {openMenus[menu.key] ? <RiArrowDownSLine /> : <RiArrowRightSLine />}
              </div>
              {openMenus[menu.key] && (
                <ul className="ml-4 mt-1 space-y-1 border-l pl-3 border-gray-300">
                  {menu.children.map(child => (
                    <li
                      key={child.key}
                      onClick={() => setActiveMenu(child.key)}
                      className={`cursor-pointer px-2 py-1 rounded ${
                        activeMenu === child.key ? "bg-blue-100 text-blue-600 font-medium" : "hover:text-blue-600"
                      }`}
                    >
                      {child.label}
                    </li>
                  ))}
                </ul>
              )}
            </li>
          ))}
        </ul>
        <button
          onClick={() => router.push('/payments')}
          className="w-full mt-3 px-2 py-1.5 bg-blue-600 text-white text-sm rounded hover:bg-blue-700"
        >
          ← Back
        </button>
      </aside>

      <section className="flex-1 p-4 bg-white overflow-y-auto text-sm">
        {renderContent()}
      </section>
    </div>
  );
}