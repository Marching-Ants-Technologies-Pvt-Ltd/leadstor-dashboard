'use client';

import { useState, useEffect } from "react";
import { LeadFilters, LeadsCurrentPage, LeadSavedView, LeadSearch } from '@/utility/TinyDB';

let globalOnCloseFn = null;

export function showAppliedFilter(items = [], onClose = null) {
  if (onClose && typeof onClose === 'function') {
    globalOnCloseFn = onClose;
  }
  // Trigger UI update via global setter
  if (typeof window !== 'undefined') {
    window.__setAppliedFilters?.(items?.length > 0 ? items : null);
  }
}

export default function AppliedFilters({ onOpenAdvanceFilter }) {
  const [filterOptions, setFilterOptions] = useState(null);
  const [hasSavedView, setHasSavedView] = useState(false);

    // Expose setter globally so showAppliedFilter can update it
    useEffect(() => {
        if (typeof window !== 'undefined') {
            window.__setAppliedFilters = setFilterOptions;
        }

        return () => {
            if (typeof window !== 'undefined') {
                delete window.__setAppliedFilters;
            }
        };
    }, []);

    useEffect(() => {
        const syncSavedState = () => {
            const savedView = LeadSavedView.value();
            setHasSavedView(Array.isArray(savedView) && savedView.length > 0);
        };

        syncSavedState();

        if (typeof window !== 'undefined') {
            window.addEventListener('lead-saved-view-updated', syncSavedState);
        }

        return () => {
            if (typeof window !== 'undefined') {
                window.removeEventListener('lead-saved-view-updated', syncSavedState);
            }
        };
    }, []);

    const handleClearFilters = () => {
        // 1. Clear storage
        LeadFilters.reset();
        LeadSearch.reset();

        // 2. Reset pagination
        LeadsCurrentPage.setValue(1);

        // 3. Hide the filter bar
        setFilterOptions(null);

        // 4. Call any external onClose if provided
        if (globalOnCloseFn) {
            globalOnCloseFn();
            globalOnCloseFn = null;
        }

        // 5. Trigger table refresh
        if (typeof window.tableRefresh === 'function') {
            window.tableRefresh();
        }
        if (window.resetFilterDrawerForm) {
            window.resetFilterDrawerForm();
        }
    };

    const handleSaveCurrentFilters = () => {
        if (!hasActiveFilters) return;

        LeadSavedView.setValue(filterOptions);
        setHasSavedView(true);

        if (typeof window !== 'undefined') {
            window.dispatchEvent(new Event('lead-saved-view-updated'));
        }
    };

    const handleClearSavedView = () => {
        LeadSavedView.reset();
        LeadFilters.reset();
        LeadSearch.reset();
        LeadsCurrentPage.setValue(1);
        setFilterOptions(null);
        setHasSavedView(false);

        if (typeof window !== 'undefined') {
            window.dispatchEvent(new Event('lead-saved-view-updated'));
        }

        if (window.resetFilterDrawerForm) {
            window.resetFilterDrawerForm();
        }

        if (typeof window.tableRefresh === 'function') {
            window.tableRefresh();
        }
    };

    // Listen for showAppliedFilter calls (your existing global mechanism)
    useEffect(() => {
        window.showAppliedFilter = (items = []) => {
        setFilterOptions(items?.length > 0 ? items : []);
        };
        return () => {
            delete window.showAppliedFilter;
        };
    }, []);

  const hasActiveFilters = Array.isArray(filterOptions) && filterOptions.length > 0;

  if (!hasActiveFilters && !hasSavedView) return null;

  const showSaveFilterButton = hasActiveFilters && !hasSavedView;

  return (
    <div className="bg-orange-50 w-full p-3 flex items-center gap-4 border-b shadow-sm">
      <div className="flex items-center gap-2 text-gray-700 pr-4 border-r">
        <i className="ri-filter-fill text-lg"></i>
        <span className="font-medium text-sm">Active Filters</span>
      </div>

      <div className="flex-1 flex flex-wrap gap-2">
        {hasActiveFilters && filterOptions
            .filter(opt => opt?.title !== 'Button')
            .map((opt, i) => (
                <div
                key={i}
                className="bg-white border border-gray-300 rounded px-3 py-1 text-sm"
                >
                <strong>{opt.title}:</strong> {opt.displayValue || opt.value}
                </div>
        ))}

      </div>

      <div className="flex items-center gap-2 flex-wrap">
        {showSaveFilterButton && (
          <button
            onClick={handleSaveCurrentFilters}
            className="px-4 py-1.5 text-sm font-medium text-emerald-700 bg-emerald-50 hover:bg-emerald-100 border border-emerald-200 rounded-full transition-colors duration-200"
          >
            Save Filter
          </button>
        )}
        {hasSavedView && (
          <button
            onClick={handleClearSavedView}
            className="px-4 py-1.5 text-sm font-medium text-red-700 bg-red-50 hover:bg-red-100 border border-red-200 rounded-full transition-colors duration-200"
          >
            Clear Saved View
          </button>
        )}
        <button
            onClick={onOpenAdvanceFilter}
            className="px-4 py-1.5 text-sm font-medium text-gray-700 bg-gray-100 hover:bg-gray-200 
                        border border-gray-300 rounded-full transition-colors duration-200 
                        focus:outline-none focus:ring-2 focus:ring-gray-400 focus:ring-offset-1"
            >
            Modify Filters
        </button>
        <button
          onClick={hasSavedView ? handleClearSavedView : handleClearFilters}
          className="text-red-600 hover:text-red-800 p-1 rounded-full hover:bg-red-50"
          title={hasSavedView ? 'Clear saved view' : 'Clear active filters'}
        >
          <i className="ri-close-line text-xl"></i>
        </button>
      </div>
    </div>
  );
}