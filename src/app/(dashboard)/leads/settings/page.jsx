'use client';

import React, { useState, useMemo, Suspense, useEffect } from 'react';
import dynamic from 'next/dynamic';
import { useRouter } from 'next/navigation';
import { RiArrowDownSLine, RiArrowRightSLine } from "react-icons/ri";
import { Corporate } from '@/utility/TinyDB';
import { xFetch } from '@/utility/xFetch';
// ---------------------------------------------------
// ⚡ 1. DYNAMIC IMPORTS (Lazy Loading)
// ---------------------------------------------------
const Statuses = dynamic(() => import('@/components/dashboard/Lead/Settings/Statuses'), { ssr: false });
const Sources = dynamic(() => import('@/components/dashboard/Lead/Settings/Sources'), { ssr: false });
const LeadAllocation = dynamic(() => import('@/components/dashboard/Lead/Settings/LeadAllocation'), { ssr: false });
const FieldMapping = dynamic(() => import('@/components/dashboard/Lead/Settings/FieldMapping'), { ssr: false });
const TableReorder = dynamic(() => import('@/components/dashboard/Lead/Settings/TableReorder'), { ssr: false });
const CourseAndFee = dynamic(() => import('@/components/dashboard/Lead/Settings/CourseAndFee'), { ssr: false });
const Preferences = dynamic(() => import('@/components/dashboard/Lead/Settings/Preferences'), { ssr: false });
const Images = dynamic(() => import('@/components/dashboard/Lead/Settings/Images'), { ssr: false });
const CurrencySettings = dynamic(() => import('@/components/dashboard/Lead/Settings/CurrencySettings'), { ssr: false });

const WelcomeTemplate = dynamic(() => import('@/components/dashboard/Lead/Settings/WelcomeTemplate'), { ssr: false });
const EmailTemplateManager = dynamic(() => import('@/components/dashboard/Lead/Settings/EmailTemplateManager'), { ssr: false });
const StatusTemplateMapping = dynamic(() => import('@/components/dashboard/Lead/Settings/StatusTemplateMapping'), { ssr: false });
const CourseTemplateMapping = dynamic(() => import('@/components/dashboard/Lead/Settings/CourseTemplateMapping'), { ssr: false });

const JustdialSulekha = dynamic(() => import('@/components/dashboard/Lead/Settings/JustdialSulekha'), { ssr: false });
const WebSync = dynamic(() => import('@/components/dashboard/Lead/Settings/WebSync'), { ssr: false });
const WhatsAppConfig = dynamic(() => import('@/components/dashboard/Lead/Settings/WhatsAppConfig'), { ssr: false });
const WhatsAppAutomation = dynamic(() => import('@/components/dashboard/Lead/Settings/WhatsAppAutomation'), { ssr: false });
const Calendly = dynamic(() => import('@/components/dashboard/Lead/Settings/Calendly'), { ssr: false });
const GoogleDrive = dynamic(() => import('@/components/dashboard/Lead/Settings/GoogleDrive'), { ssr: false });
const IVRSettings = dynamic(() => import('@/components/dashboard/Lead/Settings/IVRSettings'), { ssr: false });
const Facebook = dynamic(() => import('@/components/dashboard/Lead/Settings/Facebook'), { ssr: false });
const PreferredCourses = dynamic(() => import('@/components/dashboard/Lead/Settings/PreferredCourses'), { ssr: false });
const Loading = dynamic(() => import('@/components/dashboard/Lead/Settings/loading'), { ssr: false });
const Category = dynamic(() => import('@/components/dashboard/Lead/Settings/Category'), { ssr: false });
const SubServices = dynamic(() => import('@/components/dashboard/Lead/Settings/SubServices'), { ssr: false });
const AssociatedCenters = dynamic(() => import('@/components/dashboard/Lead/Settings/AssociatedCenters'), { ssr: false });
const Qualification = dynamic(() => import('@/components/dashboard/Lead/Settings/Qualification'), { ssr: false });
const XtremeConfig = dynamic(() => import('@/components/dashboard/Lead/Settings/XtremeConfig'), { ssr: false });
const CourseAgentMapping = dynamic(() => import('@/components/dashboard/Lead/Settings/CourseAgentMapping'), { ssr: false });
const MyForms = dynamic(() => import('@/components/dashboard/Lead/Settings/MyForms'), { ssr: false });
// ---------------------------------------------------
// ⚡ 2. SETTINGS PAGE
// ---------------------------------------------------
export default function Settings() {
  const router = useRouter();

  // Active selected content
  const [activeMenu, setActiveMenu] = useState("statuses");

  // Dropdown states
  const [openMenus, setOpenMenus] = useState({ leadSetup: true });
  const [openSubMenus, setOpenSubMenus] = useState({});
  const [showXtremeMenu, setShowXtremeMenu] = useState(null);

  useEffect(() => {
    let isMounted = true;

    xFetch({ path: "/services/profile/getXtremeMenuAccess" })
      .then((res) => {
        if (isMounted) {
          setShowXtremeMenu(res?.showMenu === true);
        }
      })
      .catch(() => {
        if (isMounted) {
          setShowXtremeMenu(false);
        }
      });

    return () => {
      isMounted = false;
    };
  }, []);

  // ---------------------------------------------------
  // MENU STRUCTURE MEMOIZED (Optimized)
  // ---------------------------------------------------
  const menuStructure = useMemo(() => {
    const isCorporate800 = Corporate?.type === 800;
    return [
      {
        label: "Integrations",
        key: "integrations",
        collapsible: true,
        children: [
          { key: "facebook", label: "Facebook" },
          { key: "justdial", label: "Justdial - Sulekha" },
          { key: "webSync", label: "WebSync" },
          { key: "IVR", label: "IVR" },
          {
            key: "whatsApp",
            label: "WhatsApp",
            nested: true,
            children: [
              { key: "whatsAppConfig", label: "WhatsApp Config" },
              { key: "whatsAppAutomation", label: "WhatsApp Automation" },
            ]
          },
          { key: "googleDrive", label: "Google Drive" },
          { key: "calendly", label: "Calendly" },
        ...(showXtremeMenu === true
          ? [{
              label: "Xtreme Gen AI",
              key: "xtremeGenAI",
              nested: true,
              children: [
                { key: "xtremeConfig", label: "Xtreme Config" },
                { key: "courseAgentMapping", label: "Course Agent Mapping" }
              ]
            }]
            : []),
        ]
      },
      {
        label: "Templates",
        key: "templates",
        collapsible: true,
        children: [
          { key: "welcomeTemplate", label: "Welcome Template" },
          { key: "emailTemplateManagement", label: "Email Template Management" },
          {
            key: "templateMapping",
            label: "Template Mapping",
            nested: true,
            children: [
              { key: "templateStatusWise", label: "Status - Course Wise" },
              { key: "templateCourseWise", label: "Course Wise" },
            ]
          }
        ]
      },
      {
        label: "Lead Settings",
        key: "leadSetup",
        collapsible: true,
        children: [
          { key: "statuses", label: "Statuses" },
          { key: "courses", label: isCorporate800 ? "Country & Processing Fee" : "Courses & Fee",},
          ...(isCorporate800 ? [{ key: "preferredCourses", label: "Preferred Courses" }] : []),
          { key: "subServices", label: "Sub Services" },
          { key: "categories", label: "Lead Category" },
          { key: "associatedCenters", label: "Associated Centers" },
          { key: "sources", label: "Sources" },
          { key: "qualifications", label: "Qualifications" },
          { key: "leadAllocation", label: "Lead Allocation" },
          { key: "mapping", label: "Field Mapping" },
          { key: "tableReorder", label: "Table Reorder" },
        ]
      },
      {
        label: "General",
        key: "general",
        collapsible: true,
        children: [
          { key: "preferences", label: "Preferences" },
          { key: "images", label: "Images" },
          { key: "currencySettings", label: "Currency Settings" }
        ]
      },
      {
        label: "My Forms",
        key: "myForms",
        standalone: true
      }
    ];
    }, [Corporate?.type, showXtremeMenu]);


  // ---------------------------------------------------
  // SELECT CONTENT LAZILY
  // ---------------------------------------------------
  // const renderContent = () => {
  //   switch (activeMenu) {
  //     case "statuses": return <Statuses />;
  //     case "sources": return <Sources />;
  //     case "leadAllocation": return <LeadAllocation />;
  //     case "mapping": return <FieldMapping />;
  //     case "tableReorder": return <TableReorder />;
  //     case "courses": return <CourseAndFee />;
  //     Corporate?.type === 800 && case "preferredCourses": return <PreferredCourses />;
  //     case "preferences": return <Preferences />;
  //     case "images": return <Images />;
  //     case "currencySettings": return <CurrencySettings />;

  //     case "welcomeTemplate": return <WelcomeTemplate />;
  //     case "emailTemplateManagement": return <EmailTemplateManager />;
  //     case "templateStatusWise": return <StatusTemplateMapping />;
  //     case "templateCourseWise": return <CourseTemplateMapping />;

  //     case "justdial": return <JustdialSulekha />;
  //     case "webSync": return <WebSync />;
  //     case "whatsAppConfig": return <WhatsAppConfig />;
  //     case "whatsAppAutomation": return <WhatsAppAutomation />;
  //     case "calendly": return <Calendly />;
  //     case "googleDrive": return <GoogleDrive />;
  //     case "facebook": return <Facebook />;
  //     case "IVR": return <IVRSettings />;

  //     default:
  //       return <div className="text-gray-500">Select an item from the menu</div>;
  //   }
  // };
  

  const renderContent = () => {
    switch (activeMenu) {
      case "statuses":
        return <Statuses />;

      case "sources":
        return <Sources />;

      case "categories":
        return <Category />;

      case "subServices":
        return <SubServices />;

      case "associatedCenters":
        return <AssociatedCenters />;
      
      case "qualifications":
        return <Qualification />;

      case "leadAllocation":
        return <LeadAllocation />;

      case "mapping":
        return <FieldMapping />;

      case "tableReorder":
        return <TableReorder />;

      case "courses":
        return <CourseAndFee />;

      case "preferredCourses":
        // Only render for corporate type 800
        if (Corporate?.type !== 800) {
          return null; // or <div>Not available for this corporate type</div>
        }
        return <PreferredCourses />;

      case "preferences":
        return <Preferences />;

      case "images":
        return <Images />;

      case "currencySettings":
        return <CurrencySettings />;

      case "xtremeConfig":
        return <XtremeConfig />;

      case "courseAgentMapping":
        return <CourseAgentMapping />;

      case "welcomeTemplate":
        return <WelcomeTemplate />;

      case "emailTemplateManagement":
        return <EmailTemplateManager />;

      case "templateStatusWise":
        return <StatusTemplateMapping />;

      case "templateCourseWise":
        return <CourseTemplateMapping />;

      case "justdial":
        return <JustdialSulekha />;

      case "webSync":
        return <WebSync />;

      case "whatsAppConfig":
        return <WhatsAppConfig />;

      case "whatsAppAutomation":
        return <WhatsAppAutomation />;

      case "calendly":
        return <Calendly />;

      case "googleDrive":
        return <GoogleDrive />;

      case "facebook":
        return <Facebook />;

      case "IVR":
        return <IVRSettings />;

      case "myForms":
        return <MyForms />;
      default:
        return <div className="text-gray-500">Select an item from the menu</div>;
    }
  };


  // ---------------------------------------------------
  // TOGGLES
  // ---------------------------------------------------
  const toggleMenu = (key) => {
    setOpenMenus({ [key]: !openMenus[key] }); // closes other menus
  };

  const toggleSubMenu = (key) => {
    setOpenSubMenus(prev => ({ ...prev, [key]: !prev[key] }));
  };


  // ---------------------------------------------------
  // PAGE LAYOUT
  // ---------------------------------------------------
  return (
    <div className="flex h-screen w-full border rounded-md shadow-sm overflow-hidden">

      {/* SIDEBAR */}
      <aside className="w-52 bg-gray-100 p-3 overflow-y-auto text-sm">
        <h3 className="mb-4 text-lg font-semibold text-gray-700">Settings</h3>

        <ul className="ml-3 mt-1 space-y-1 border-l pl-2 border-gray-300 text-sm">

          {menuStructure.map(menu => {
            if (menu.standalone) {
              return (
                <li
                  key={menu.key}
                  onClick={() => setActiveMenu(menu.key)}
                  className={`cursor-pointer px-2 py-1 rounded ${
                    activeMenu === menu.key
                      ? "bg-blue-100 text-blue-600 font-medium"
                      : "hover:bg-gray-200"
                  }`}
                >
                  {menu.label}
                </li>
              );
            }
            return (
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
                  {menu.children.map(child => {

                    if (child.nested) {
                      return (
                        <li key={child.key}>
                          <div
                            onClick={() => toggleSubMenu(child.key)}
                            className="cursor-pointer flex justify-between items-center px-2 py-1 hover:bg-gray-200 rounded"
                          >
                            <span>{child.label}</span>
                            {openSubMenus[child.key] ? <RiArrowDownSLine /> : <RiArrowRightSLine />}
                          </div>

                          {openSubMenus[child.key] && (
                            <ul className="ml-4 mt-1 space-y-1 border-l pl-3 border-gray-300">
                              {child.children.map(sub => (
                                <li
                                  key={sub.key}
                                  onClick={() => setActiveMenu(sub.key)}
                                  className={`cursor-pointer px-2 py-1 rounded ${
                                    activeMenu === sub.key
                                      ? "bg-blue-100 text-blue-600 font-medium"
                                      : "hover:text-blue-600"
                                  }`}
                                >
                                  {sub.label}
                                </li>
                              ))}
                            </ul>
                          )}
                        </li>
                      );
                    }

                    return (
                      <li
                        key={child.key}
                        onClick={() => setActiveMenu(child.key)}
                        className={`cursor-pointer px-2 py-1 rounded ${
                          activeMenu === child.key
                            ? "bg-blue-100 text-blue-600 font-medium"
                            : "hover:text-blue-600"
                        }`}
                      >
                        {child.label}
                      </li>
                    );
                  })}
                </ul>
              )}
            </li>
          );
        })}

        </ul>

        <button
          onClick={() => router.push('/leads')}
          className="w-full mt-3 px-2 py-1.5 bg-blue-600 text-white text-sm rounded hover:bg-blue-700"
        >
          ← Back
        </button>
      </aside>

      {/* MAIN CONTENT */}
      <section className="flex-1 p-4 bg-white overflow-y-auto text-sm">
        <Suspense fallback={<Loading />}>
          {renderContent()}
        </Suspense>
      </section>

    </div>
  );
}
