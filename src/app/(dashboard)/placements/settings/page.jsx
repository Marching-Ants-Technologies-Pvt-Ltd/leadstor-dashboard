'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import PlacementColumnMapping from '@/components/dashboard/placement/PlacementColumnMapping';
import PlacementTableReorder from '@/components/dashboard/placement/PlacementTableReorder';

const MENU = [
  { key: 'columnMapping', label: 'Column Mapping' },
  { key: 'tableReorder', label: 'Table Reorder' },
];

export default function PlacementSettings() {
  const router = useRouter();
  const [activeMenu, setActiveMenu] = useState('columnMapping');

  const renderContent = () => {
    switch (activeMenu) {
      case 'columnMapping':
        return <PlacementColumnMapping />;
      case 'tableReorder':
        return <PlacementTableReorder />;
      default:
        return <div className="text-gray-500">Select an item from the menu</div>;
    }
  };

  return (
    <div className="flex h-screen w-full border rounded-md shadow-sm overflow-hidden">
      {/* SIDEBAR */}
      <aside className="w-52 bg-gray-100 p-3 overflow-y-auto text-sm">
        <h3 className="mb-4 text-lg font-semibold text-gray-700">Placement Settings</h3>

        <ul className="ml-3 mt-1 space-y-1 border-l pl-2 border-gray-300 text-sm">
          {MENU.map((item) => (
            <li
              key={item.key}
              onClick={() => setActiveMenu(item.key)}
              className={`cursor-pointer px-2 py-1 rounded ${
                activeMenu === item.key
                  ? 'bg-blue-100 text-blue-600 font-medium'
                  : 'hover:text-blue-600'
              }`}
            >
              {item.label}
            </li>
          ))}
        </ul>

        <button
          onClick={() => router.push('/placements')}
          className="w-full mt-3 px-2 py-1.5 bg-blue-600 text-white text-sm rounded hover:bg-blue-700"
        >
          ← Back
        </button>
      </aside>

      {/* MAIN CONTENT */}
      <section className="flex-1 p-4 bg-white overflow-y-auto text-sm">
        {renderContent()}
      </section>
    </div>
  );
}