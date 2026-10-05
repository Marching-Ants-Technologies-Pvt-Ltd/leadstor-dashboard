'use client'
import React, { useState, useEffect, useMemo } from 'react';
import { toast } from 'react-toastify';
import 'react-datepicker/dist/react-datepicker.css';
import { Corporate, User, Test, LeadFilters, LeadColumns, LeadFilterParams, LeadsCurrentPage } from '@/utility/TinyDB';
import DateInputPicker from "@/components/DateInputPicker/DateInputPicker";
import { xFetch } from '@/utility/xFetch';

const FilterDrawer = ({ isOpen, onClose, onApplyFilters }) => {
  const [resetKey, setResetKey] = useState(0);
  const [columns, setColumns] = useState([]);
  const [filterOptions, setFilterOptions] = useState({});
  const [rawOwners, setRawOwners] = useState({});
  const [loading, setLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [applying, setApplying] = useState(false);
  const [searches, setSearches] = useState({});
  const [openDropdown, setOpenDropdown] = useState(null);
  const dropdownRef = React.useRef(null);
  const [hydratedForOpen, setHydratedForOpen] = useState(false);
  const [subOrdinates, setSubOrdinates] = useState([String(User._id)]);
  const [isSubordinatesLoaded, setIsSubordinatesLoaded] = useState(false);
  const [isPureCounsellor, setIsPureCounsellor] = useState(false);

  const probabilityOptions = [
    { label: 'Low', value: '20' },
    { label: 'Medium', value: '55' },
    { label: 'High', value: '85' }
  ];
  
  const userRoles = Array.isArray(User.role) 
    ? User.role.map(r => String(r).trim())
    : [String(User.role).trim()];

  const shouldShowOwnerFilter = useMemo(() => {
    if (!User) return false;

    const hasAdminRole = userRoles.some((role) =>
      ["Admin", "Administrator"].includes(role)
    );

    const hasSuperCounsellor = userRoles.includes("Super Counsellor");

    const isManager = User?.isManager === 1;

    return hasAdminRole || hasSuperCounsellor || isManager;
  }, [User]);

  // Get session data
  const sessionData = useMemo(() => {
    return { corporate: Corporate, user: User, test: Test };
  }, []);

  // Initialize selected filters dynamically based on columns
  const [selectedFilters, setSelectedFilters] = useState({
    owner: [],
    courseMode: '',
    probability: [],
    associatedCenters: [],
    enquiryDateFrom: '',
    enquiryDateTo: '',
    updatedDateFrom: '',
    updatedDateTo: '',
    followupDate: '',
    followupDate_end: '',
  });

  // Reset function
  const resetFilterForm = () => {
    const reset = {
      owner: [],
      courseMode: '',
      probability: [],
      enquiryDateFrom: '',
      enquiryDateTo: '',
      updatedDateFrom: '',
      updatedDateTo: '',
      followupDate: '',
      followupDate_end: '',
    };
    columns.forEach(col => {
      if (col.filterable) {
        reset[col.dataField] = [];
      }
    });
    setSelectedFilters(reset);
    setSearches({});
    setOpenDropdown(null);
    setResetKey(prev => prev + 1);
  };

  // Fields to exclude from filter
  const EXCLUDED_FIELDS = ['mobile', 'firstName', 'emailId', 'action', 'updateTime', 'createdDate', 'aINextStep', 'remarks', 'message'];
  const STATUS_FIELD = 'status';

  // Fetch columns from API
  const fetchColumns = async () => {
    try {
      const data = await xFetch({ path: "/services/profile/columns" });
      const filterableColumns = (Array.isArray(data) ? data : []).filter(
        col => !EXCLUDED_FIELDS.includes(col.dataField)
      );
      setColumns(filterableColumns);

      setSelectedFilters(prev => {
        const updated = { ...prev };
        filterableColumns.forEach(col => {
          if (!updated.hasOwnProperty(col.dataField)) {
            updated[col.dataField] = [];
          }
        });
        return updated;
      });
    } catch (error) {
      console.error('Error fetching columns:', error);
      setColumns([]);
    }
  };

  // Fetch Subordinates (same logic as LeadsTable)
    useEffect(() => {
        const fetchSubordinates = async () => {
          const checkCounsellor = userRoles.includes("Counsellor") && 
                         !userRoles.includes("Super Counsellor") && 
                         User?.isManager !== 1;

            setIsPureCounsellor(checkCounsellor);
            if (isPureCounsellor || User._id == -1) {
                setSubOrdinates([String(User._id)]);
                setIsSubordinatesLoaded(true);
                return;
            }

            try {
                const data = await xFetch({
                    path: `/services/profile/getSubordinates?userId=${User._id}&time=${new Date().getTime()}`
                });

                let subs = Array.isArray(data) ? data :
                           (data?.subordinates || data?.data || []);

                const formatted = Array.isArray(subs)
                    ? subs.map(id => String(id).trim()).filter(Boolean)
                    : [String(User._id)];

                setSubOrdinates(formatted.length > 0 ? formatted : [String(User._id)]);
            } catch (err) {
                console.error("Failed to fetch subordinates in filter:", err);
                setSubOrdinates([String(User._id)]);
            } finally {
                setIsSubordinatesLoaded(true);
            }
        };

        if (isOpen) {
            fetchSubordinates();
        }
    }, [isOpen]);

  // Fetch filter options from backend
  const fetchFilterOptions = async () => {
    if (!sessionData?.test?._id) return;
    setLoading(true);
    try {
      const params = new URLSearchParams({
        testId: sessionData.test._id,
        corporateType: sessionData.corporate?.type ?? '',
        isManager: sessionData.user?.isManager ?? ''
      }).toString();

      const response = await xFetch({
        method: 'GET',
        path: `/services/invite/getFilterParameters&${params}`
      });

      if (!response || typeof response !== 'object') {
        throw new Error('Invalid response format');
      }

      const optionsMap = {};
      
      if (response.statuses) {
        optionsMap.status = transformOptions(response.statuses);
      }
      if (response.courses) {
        optionsMap.course = transformOptions(response.courses);
      }
      if (response.sources) {
        optionsMap.source = transformOptions(response.sources);
      }
      if (response.locations) {
        optionsMap.location = transformOptions(response.locations);
      }
      if (response.owners) {
          setRawOwners(response.owners);
          optionsMap.owner = transformOwnerOptions(response.owners);
      }
      if (response.courseModes) {
        optionsMap.courseMode = transformOptions(response.courseModes);
      }
      if (response.workExperiences) {
        optionsMap.workExperience = transformOptions(response.workExperiences);
      }
      if (response.qualifications) {
        optionsMap.qualification = transformOptions(response.qualifications);
      }
      if (response.schoolNames) {
        optionsMap.schoolName = transformOptions(response.schoolNames);
      }
      if (response.workingOrganizations) {
        optionsMap.workingOrganization = transformOptions(response.workingOrganizations);
      }
      if (response.categories) {
        optionsMap.category = transformOptions(response.categories);
      }
      if (response.industries) {
        optionsMap.industry = transformOptions(response.industries);
      }
      if (response.associatedCenters) {
          optionsMap.associatedCenters = transformOptions(response.associatedCenters);
      }
      setFilterOptions(optionsMap);
    } catch (e) {
      console.error('Error fetching filter options:', e);
      setFilterOptions({});
    } finally {
      setLoading(false);
    }
  };

  const transformOptions = (options) => {
    if (!options) return [];
    let optionsArray;
    if (Array.isArray(options)) {
      optionsArray = options;
    } else if (typeof options === 'object' && options !== null) {
      optionsArray = Object.values(options);
    } else {
      return [];
    }

    return optionsArray.map(option => {
      if (typeof option === 'string') {
        return { label: option, value: option };
      }
      if (option && typeof option === 'object') {
        return {
          label: option.label || option.name || option.title || option.status || option.value || String(option),
          value: option.value || option.id || option.name || option.title || option.status || String(option)
        };
      }
      return { label: String(option), value: String(option) };
    });
  };

  // const transformOwnerOptions = (owners) => {console.log(owners);
  //       if (!owners || Object.keys(owners).length === 0) return [];

  //       let list = Object.entries(owners).map(([key, value]) => ({
  //           key: String(key),
  //           value: String(value),
  //           label: String(value) 
  //       }));

  //       // For Counsellor → filter by subordinates
  //       if (isPureCounsellor && isSubordinatesLoaded) {
  //           list = list.filter(owner => subOrdinates.includes(owner.key));
  //       }
  //       const map = new Map();

  //       if (userRoles.includes("Super Counsellor") && User?.isManager === 1) {
  //           // map.set(String(User.originalId), { key: User.originalId, value: User.name });
  //            map.set(String(User.originalId), { 
  //               key: String(User.originalId),
  //               value: String(User.originalId),
  //               label: User.name   // 👈 important
  //           });
  //       }

  //       if (!userRoles.includes("Counsellor")) {
  //           map.set("0", { key: "0", value: "--Not Allocated--" });
  //       }

  //       const finalOptions = Array.from(map.values());console.log(finalOptions);

  //       return [...finalOptions, ...list];
  // };

  const transformOwnerOptions = (owners) => {
    if (!owners || Object.keys(owners).length === 0) return [];

    let list = Object.entries(owners).map(([key, value]) => ({
        key: String(key),
        value: String(value),
        label: String(value)
    }));

    // Counsellor -> only show own/subordinate owners
    if (isPureCounsellor && isSubordinatesLoaded) {
        list = list.filter(owner =>
            subOrdinates.includes(owner.key)
        );
    }

    const map = new Map();

    /**
     * Manager:
     * Always show the logged-in manager first,
     * followed by his/her subordinates.
     */
    if (User?.isManager === 1) {
        const managerId = String(User.originalId ?? User._id);

        map.set(managerId, {
            key: managerId,
            value: managerId,
            label: User.name
        });
    }

    // Add Not Allocated for non-counsellors
    if (!userRoles.includes("Counsellor")) {
        map.set("0", {
            key: "0",
            value: "0",
            label: "--Not Allocated--"
        });
    }

    // Add owners/subordinates returned from API
    list.forEach(owner => {
        // Don't duplicate manager if API already returns manager
        if (!map.has(owner.key)) {
            map.set(owner.key, owner);
        }
    });

    return Array.from(map.values());
};

  // Re-apply owner transformation when subordinates are loaded
  useEffect(() => {
        if (isSubordinatesLoaded && Object.keys(rawOwners).length > 0 && shouldShowOwnerFilter) {
            setFilterOptions(prev => ({
                ...prev,
                owner: transformOwnerOptions(rawOwners)
            }));
        }
    }, [isSubordinatesLoaded, subOrdinates, rawOwners, shouldShowOwnerFilter]);

    // ==================== FETCH DATA WHEN DRAWER OPENS ====================
    useEffect(() => {
        if (isOpen) {
            fetchColumns();
            fetchFilterOptions();             // This will get raw owners
            setHydratedForOpen(false);
        }
    }, [isOpen]);

  useEffect(() => {
    if (columns.length > 0) {
      setSelectedFilters(prev => {
        const updated = {
          owner: prev?.owner || [],
          courseMode: prev?.courseMode || '',
          probability: prev?.probability || [],
          enquiryDateFrom: prev?.enquiryDateFrom || '',
          enquiryDateTo: prev?.enquiryDateTo || '',
          updatedDateFrom: prev?.updatedDateFrom || '',
          updatedDateTo: prev?.updatedDateTo || '',
          followupDate: prev?.followupDate || '',
          followupDate_end: prev?.followupDate_end || '',
        };
        columns.forEach(col => {
          updated[col.dataField] = prev?.[col.dataField] ?? [];
        });
        return updated;
      });
    }
  }, [columns]);

  const parseStoredDate = (value) => {
    if (!value) return '';
    const str = String(value).trim();
    // Expected format: dd-MMM-yyyy (e.g., 07-Feb-2026)
    const parts = str.split('-');
    if (parts.length === 3) {
      const [day, mon, year] = parts;
      const parsed = new Date(`${mon} ${day}, ${year}`);
      if (!isNaN(parsed.getTime())) return parsed;
    }
    const fallback = new Date(str);
    return isNaN(fallback.getTime()) ? '' : fallback;
  };

  const renderOwnerFilter = () => {
    if (!shouldShowOwnerFilter) return null;
    if (!filterOptions.owner || filterOptions.owner.length === 0) return null;
    return renderMultiSelectField('owner', filterOptions.owner, 'owner');
  };

  const base64Decode = (value) => {
    try {
      if (typeof window === 'undefined') return value;
      const binary = atob(value);
      const bytes = Uint8Array.from(binary, c => c.charCodeAt(0));
      return new TextDecoder().decode(bytes);
    } catch (e) {
      return value;
    }
  };

  const hydrateSelectedFiltersFromStorage = (cols) => {
    const stored = LeadFilters?.value?.() || [];
    if (!Array.isArray(stored) || stored.length === 0) return;

    const hydrated = {
      owner: [],
      courseMode: '',
      probability: [],
      enquiryDateFrom: '',
      enquiryDateTo: '',
      updatedDateFrom: '',
      updatedDateTo: '',
      followupDate: '',
      followupDate_end: '',
    };

    const safeCols = Array.isArray(cols) ? cols : [];
    safeCols.forEach(col => {
      if (col?.filterable) {
        hydrated[col.dataField] = [];
      }
    });

    stored.forEach(filter => {
      const query = filter?.query;
      if (!query || query === 'button') return;

      if (query === 'owner') {
        hydrated.owner = String(filter?.value || '').split(',').filter(Boolean);
        return;
      }
      if (query === 'courseModeFilter') {
        hydrated.courseMode = filter?.value || '';
        return;
      }
      if (query === 'leadProbability') {
        hydrated.probability = String(filter?.value || '').split(',').filter(Boolean);
        return;
      }
      if (query === 'frmDate') {
        hydrated.enquiryDateFrom = parseStoredDate(filter?.value);
        return;
      }
      if (query === 'toDate') {
        hydrated.enquiryDateTo = parseStoredDate(filter?.value);
        return;
      }
      if (query === 'updatedFrmDate') {
        hydrated.updatedDateFrom = parseStoredDate(filter?.value);
        return;
      }
      if (query === 'updatedToDate') {
        hydrated.updatedDateTo = parseStoredDate(filter?.value);
        return;
      }
      if (query === 'followupDate') {
        hydrated.followupDate = parseStoredDate(filter?.value);
        return;
      }
      if (query === 'followupDate_end') {
        hydrated.followupDate_end = parseStoredDate(filter?.value);
        return;
      }

      if (query === "associatedCenters") {
          hydrated.associatedCenters = String(filter.value || "")
              .split(",")
              .filter(Boolean);
          return;
      }

      const col = safeCols.find(c => c.dataField === query);
      if (!col && !Object.prototype.hasOwnProperty.call(hydrated, query)) {
        hydrated[query] = [];
      }
      let raw = filter?.value || '';
      if (query === 'course') {
        raw = base64Decode(raw);
        try {
          const parsed = JSON.parse(raw);
          hydrated[query] = Array.isArray(parsed) ? parsed.filter(Boolean) : [];
          return;
        } catch (err) {
          // Backward compatibility for older comma-joined saved filters.
        }
      }
      hydrated[query] = String(raw).split(',').filter(Boolean);
    });

    setSelectedFilters(prev => ({ ...prev, ...hydrated }));
    setResetKey(prev => prev + 1);
  };

  useEffect(() => {
    if (isOpen && !hydratedForOpen) {
      hydrateSelectedFiltersFromStorage(columns);
      setHydratedForOpen(true);
    }
  }, [isOpen, columns, hydratedForOpen]);

  const orderedColumns = useMemo(() => {
    if (!columns || columns.length === 0) return [];
    const list = [...columns];
    const idx = list.findIndex(c => c.dataField === STATUS_FIELD);
    if (idx > 0) {
      const [statusCol] = list.splice(idx, 1);
      list.unshift(statusCol);
    }
    return list;
  }, [columns]);

  useEffect(() => {
    if (typeof window !== 'undefined') {
      window.resetFilterDrawerForm = resetFilterForm;
    }
    return () => {
      delete window.resetFilterDrawerForm;
    };
  }, []);

  // Close dropdown on outside click
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (openDropdown && !e.target.closest('.multi-select-container')) {
        setOpenDropdown(null);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [openDropdown]);

  const refreshFilter = async () => {
    if (refreshing) return;
    setRefreshing(true);

    try {
      const response = await xFetch({
        method: 'POST',
        path: `/services/invite/refreshFilter`
      });

      if (response === 'success') {
        const params = new URLSearchParams({
          testId: sessionData.test?._id || '',
          corporateType: sessionData.corporate?.type ?? '',
          isManager: sessionData.user?.isManager ?? '',
          time: new Date().getMilliseconds()
        }).toString();

        const parameters = await xFetch({
          method: 'GET',
          path: `/services/invite/getFilterParameters&${params}`
        });

        window.localStorage.setItem('filterParameters', JSON.stringify(parameters));

        const optionsMap = {};
        if (parameters.statuses) optionsMap.status = transformOptions(parameters.statuses);
        if (parameters.courses) optionsMap.course = transformOptions(parameters.courses);
        if (parameters.sources) optionsMap.source = transformOptions(parameters.sources);
        if (parameters.locations) optionsMap.location = transformOptions(parameters.locations);
        if (parameters.owners) optionsMap.owner = transformOwnerOptions(parameters.owners);
        if (parameters.courseModes) optionsMap.courseMode = transformOptions(parameters.courseModes);
        if (parameters.workExperiences) optionsMap.workExperience = transformOptions(parameters.workExperiences);
        if (parameters.qualifications) optionsMap.qualification = transformOptions(parameters.qualifications);
        if (parameters.schoolNames) optionsMap.schoolName = transformOptions(parameters.schoolNames);
        if (parameters.workingOrganizations) optionsMap.workingOrganization = transformOptions(parameters.workingOrganizations);
        if (parameters.categories) optionsMap.category = transformOptions(parameters.categories);
        if (parameters.industries) optionsMap.industry = transformOptions(parameters.industries);
        if (parameters.associatedCenters) {
            optionsMap.associatedCenters = transformOptions(parameters.associatedCenters);
        }
        setFilterOptions(optionsMap);
        toast.success('Filters refreshed successfully');
      } else {
        toast.error('Failed to refresh filters');
      }
    } catch (error) {
      console.error('Refresh filter error:', error);
      toast.error('Failed to refresh filters');
    } finally {
      setRefreshing(false);
    }
  };

  const toggleMultiSelect = (field) => {
    setOpenDropdown(openDropdown === field ? null : field);
    setSearches(prev => ({
      ...prev,
      [field]: prev[field] || ''
    }));
  };

  const selectMultiOption = (type, value) => {
    setSelectedFilters(prev => ({
      ...prev,
      [type]: (prev[type] || []).includes(value)
        ? (prev[type] || []).filter(item => item !== value)
        : [...(prev[type] || []), value]
    }));
  };

  const toggleSelectAllOptions = (type, values = []) => {
    const uniqueValues = [...new Set((values || []).filter(Boolean))];
    if (uniqueValues.length === 0) return;

    setSelectedFilters(prev => {
      const current = prev[type] || [];
      const hasAll = uniqueValues.every(v => current.includes(v));

      if (hasAll) {
        return {
          ...prev,
          [type]: current.filter(v => !uniqueValues.includes(v))
        };
      }

      return {
        ...prev,
        [type]: [...new Set([...current, ...uniqueValues])]
      };
    });
  };

  const updateSingleFilter = (type, value) => {
    setSelectedFilters(prev => ({
      ...prev,
      [type]: value
    }));
  };

  const getDisplayText = (type) => {
    const selected = selectedFilters[type];
    if (!selected || selected.length === 0) {
      return `Select ${getLabelForField(type)}`;
    }

    // Special handling for probability
    if (type === 'probability') {
      const labels = selected.map(v => {
        const opt = probabilityOptions.find(p => p.value === v);
        return opt?.label || v;
      });
      if (labels.length === 1) return labels[0];
      return `${labels[0]} +${labels.length - 1}`;
    }

    const optionMap = Object.fromEntries(
      (filterOptions[type] || []).map(opt => [opt.value, opt.label])
    );
    const labels = selected.map(v => optionMap[v] || v);

    if (labels.length === 1) return labels[0];
    return `${labels[0]} +${labels.length - 1}`;
  };

  const getLabelForField = (field) => {
    const column = columns.find(col => col.dataField === field);
    if (column) {
      return column.displayName || column.fieldName || field;
    }
    const specialLabels = {
      courseMode: 'Course Mode',
      probability: 'Probability',
      enquiryDateFrom: 'Enquiry Date From',
      enquiryDateTo: 'Enquiry Date To',
      updatedDateFrom: 'Updated Date From',
      updatedDateTo: 'Updated Date To',
      followupDate: 'Pending Followup From',
      followupDate_end: 'Pending Followup To',
    };
    return specialLabels[field] || field;
  };

  const clearFilters = () => {
    resetFilterForm();
  };

  const convertDateFormat = (dateString) => {
    if (!dateString) return '';
    const date = new Date(dateString);
    const day = date.getDate().toString().padStart(2, '0');
    const month = date.toLocaleString('en-US', { month: 'short' });
    const year = date.getFullYear();
    return `${day}-${month}-${year}`;
  };

  function base64Encode(str) {
    const bytes = new TextEncoder().encode(str);
    let binary = '';
    bytes.forEach(b => binary += String.fromCharCode(b));
    return btoa(binary);
  }

  const buildLeadFilters = () => {
    const filters = [];

    filters.push({
      title: 'Button',
      value: "FilterLeads",
      query: 'button'
    });

    columns.forEach(col => {
      const value = selectedFilters[col.dataField];
      if (Array.isArray(value) && value.length > 0) {
        const filterObj = {
          title: col.displayName || col.fieldName || col.dataField,
          query: col.dataField
        };

        if (col.dataField === 'course') {
          filterObj.value = base64Encode(JSON.stringify(value));
          filterObj.displayValue = value.join(',');
        } else {
          filterObj.value = value.join(',');
        }

        filters.push(filterObj);
      }
    });

    if (selectedFilters.owner?.length > 0) {
      const ownerIds = selectedFilters.owner.join(',');
      filters.push({
        title: 'Owner',
        value: ownerIds,
        displayValue: selectedFilters.owner
          .map(id => {
            const opt = filterOptions.owner?.find(o => o.key === id);
            return opt?.value || id;
          })
          .join(', '),
        query: 'owner'
      });
    }

    if (selectedFilters.courseMode) {
      filters.push({
        title: 'Course Mode',
        value: selectedFilters.courseMode,
        query: 'courseModeFilter'
      });
    }

    if (selectedFilters.probability.length > 0) {
      filters.push({
        title: 'Probability',
        value: selectedFilters.probability.join(','),
        displayValue: selectedFilters.probability
          .map(v => probabilityOptions.find(p => p.value === v)?.label || v)
          .join(', '),
        query: 'leadProbability'
      });
    }

    if (selectedFilters.enquiryDateFrom || selectedFilters.enquiryDateTo) {
      if (selectedFilters.enquiryDateFrom) {
        filters.push({
          title: 'From Date',
          value: convertDateFormat(selectedFilters.enquiryDateFrom),
          query: 'frmDate'
        });
      }
      if (selectedFilters.enquiryDateTo) {
        filters.push({
          title: 'To Date',
          value: convertDateFormat(selectedFilters.enquiryDateTo),
          query: 'toDate'
        });
      }
    }

    if (selectedFilters.updatedDateFrom || selectedFilters.updatedDateTo) {
      if (selectedFilters.updatedDateFrom) {
        filters.push({
          title: 'Updated From',
          value: convertDateFormat(selectedFilters.updatedDateFrom),
          query: 'updatedFrmDate'
        });
      }
      if (selectedFilters.updatedDateTo) {
        filters.push({
          title: 'Updated To',
          value: convertDateFormat(selectedFilters.updatedDateTo),
          query: 'updatedToDate'
        });
      }
    }

    if (selectedFilters.followupDate || selectedFilters.followupDate_end) {
      if (selectedFilters.followupDate) {
        filters.push({
          title: 'Pending Followup From',
          value: convertDateFormat(selectedFilters.followupDate),
          query: 'followupDate'
        });
      }
      if (selectedFilters.followupDate_end) {
        filters.push({
          title: 'Pending Followup To',
          value: convertDateFormat(selectedFilters.followupDate_end),
          query: 'followupDate_end'
        });
      }
    }

    return filters;
  };

  const hasAnyFilter = () => {
    for (const col of columns) {
      const value = selectedFilters[col.dataField];
      if (Array.isArray(value) && value.length > 0) return true;
    }
    return (
      selectedFilters.owner?.length > 0 ||
      selectedFilters.courseMode ||
      selectedFilters.associatedCenters?.length > 0 ||
      selectedFilters.probability.length > 0 ||
      selectedFilters.enquiryDateFrom ||
      selectedFilters.enquiryDateTo ||
      selectedFilters.updatedDateFrom ||
      selectedFilters.updatedDateTo ||
      selectedFilters.followupDate ||
      selectedFilters.followupDate_end
    );
  };

  const handleApplyFilters = async () => {
    if (!hasAnyFilter()) return;
    setApplying(true);

    const filters = buildLeadFilters();
    LeadFilters.setValue(filters);
    LeadsCurrentPage.setValue(1);

    if (window.showAppliedFilter) {
      window.showAppliedFilter(filters);
    }

    if (window.tableRefresh) {
      window.tableRefresh();
    }

    setApplying(false);
    onClose();
  };

  const handleSearchChange = (field, value) => {
    setSearches(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const getFilteredOptions = (options, field) => {
    const search = searches[field] || '';
    if (!search.trim()) return options;
    return options.filter(opt => 
      opt.label?.toLowerCase().includes(search.toLowerCase()) ||
      opt.value?.toLowerCase().includes(search.toLowerCase())
    );
  };

  // Render multi-select filter field with search
  const renderMultiSelectField = (field, options, selectedKey = field) => {
    const selected = selectedFilters[selectedKey] || [];
    const search = searches[field] || '';
    const filteredOptions = getFilteredOptions(options, field);
    const filteredOptionKeys = [...new Set(filteredOptions.map(option => option.key || option.value).filter(Boolean))];
    const areAllFilteredSelected =
      filteredOptionKeys.length > 0 && filteredOptionKeys.every(key => selected.includes(key));
    const supportsSelectAll = ['course', 'status', 'source'].includes(field);
    const isOpen = openDropdown === selectedKey;

    return (
      <div className="mb-5 relative multi-select-container">
        <label className="block font-medium text-gray-700 mb-2 text-sm">
          {getLabelForField(field)}
        </label>
        <div className="relative">
          <div
            className="w-full px-4 py-2.5 bg-white border border-gray-300 rounded-lg text-sm cursor-pointer flex items-center justify-between hover:border-gray-400 transition"
            onClick={() => toggleMultiSelect(selectedKey)}
          >
            <span className="text-gray-700 truncate">
              {selected.length === 0 
                ? `Select ${getLabelForField(field)}`
                : selected.map(val => {
                    const opt = options.find(o => (o.key || o.value) === val);
                    return opt?.label || opt?.value || val;
                  }).join(', ')
              }
            </span>
            <svg className={`w-4 h-4 text-gray-500 flex-shrink-0 ml-2 transition-transform ${isOpen ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7" />
            </svg>
          </div>

          {isOpen && (
            <div className="absolute top-full left-0 right-0 mt-1 bg-white border border-gray-200 rounded-lg shadow-lg z-50">
              {/* Search Input */}
              <div className="p-2 border-b border-gray-200 sticky top-0 bg-white rounded-t-lg">
                <div className="relative">
                  <input
                    type="text"
                    className="w-full pl-9 pr-3 py-2 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="Search..."
                    value={search}
                    onChange={(e) => handleSearchChange(field, e.target.value)}
                    onClick={(e) => e.stopPropagation()}
                  />
                  <svg className="absolute left-2.5 top-2.5 w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                  </svg>
                </div>
              </div>

              {/* Options List */}
              <div className="max-h-48 overflow-y-auto p-2">
                {supportsSelectAll && filteredOptionKeys.length > 0 && (
                  <div
                    className="px-3 py-2 mb-1 text-sm flex items-center gap-3 cursor-pointer rounded-md transition text-blue-700 bg-blue-50 hover:bg-blue-100"
                    onClick={(e) => {
                      e.stopPropagation();
                      toggleSelectAllOptions(selectedKey, filteredOptionKeys);
                    }}
                  >
                    <div
                      className={`w-4 h-4 border rounded flex items-center justify-center flex-shrink-0 ${
                        areAllFilteredSelected ? 'bg-blue-600 border-blue-600' : 'border-blue-400'
                      }`}
                    >
                      {areAllFilteredSelected && (
                        <svg className="w-3 h-3 text-white" fill="currentColor" viewBox="0 0 20 20">
                          <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                        </svg>
                      )}
                    </div>
                    <span className="truncate">
                      {areAllFilteredSelected ? 'Unselect all (filtered)' : 'Select all (filtered)'}
                    </span>
                  </div>
                )}
                {filteredOptions.length > 0 ? (
                  filteredOptions.map(option => {
                    const optionKey = option.key || option.value;
                    const isSelected = selected.includes(optionKey);
                    return (
                      <div
                        key={optionKey}
                        className={`px-3 py-2 text-sm flex items-center gap-3 cursor-pointer rounded-md transition ${
                          isSelected ? 'bg-blue-50 text-blue-700' : 'text-gray-700 hover:bg-gray-50'
                        }`}
                        onClick={() => selectMultiOption(selectedKey, optionKey)}
                      >
                        <div
                          className={`w-4 h-4 border rounded flex items-center justify-center flex-shrink-0 ${
                            isSelected ? 'bg-blue-600 border-blue-600' : 'border-gray-300'
                          }`}
                        >
                          {isSelected && (
                            <svg className="w-3 h-3 text-white" fill="currentColor" viewBox="0 0 20 20">
                              <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                            </svg>
                          )}
                        </div>
                        <span className="truncate">{option.label || option.value}</span>
                      </div>
                    );
                  })
                ) : (
                  <div className="px-3 py-4 text-center text-gray-400 text-sm">
                    No options found
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      </div>
    );
  };

  // Render single select field
  const renderSingleSelectField = (field, options) => {
    const value = selectedFilters[field];
    return (
      <div className="mb-5">
        <label className="block font-medium text-gray-700 mb-2 text-sm">
          {getLabelForField(field)}
        </label>
        <select
          value={value || ''}
          onChange={e => updateSingleFilter(field, e.target.value)}
          className="w-full px-4 py-2.5 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-200 focus:border-blue-500 outline-none bg-white"
        >
          <option value="">Select {getLabelForField(field)}</option>
          {options.map(opt => (
            <option key={opt.value} value={opt.value}>
              {opt.label}
            </option>
          ))}
        </select>
      </div>
    );
  };

  return (
    <>
      {/* Backdrop */}
      <div
        className={`fixed inset-0 bg-black/50 backdrop-blur-sm z-40 transition-opacity duration-300 ${
          isOpen ? 'opacity-100' : 'opacity-0 pointer-events-none'
        }`}
        onClick={onClose}
      />

      {/* Drawer Panel */}
      <div
        className={`fixed top-0 right-0 h-full w-[480px] bg-white shadow-2xl z-50 transform transition-transform duration-300 ease-in-out ${
          isOpen ? 'translate-x-0' : 'translate-x-full'
        }`}
      >
        <div className="flex flex-col h-full">
          {/* Header */}
          <div className="px-6 py-4 border-b border-gray-200 flex items-center justify-between bg-gradient-to-r from-blue-50 to-indigo-50">
            <div className="flex items-center gap-3">
              <h2 className="text-xl font-semibold text-gray-800">Advanced Filters</h2>
              <button
                onClick={refreshFilter}
                disabled={refreshing}
                className={`p-2 rounded-lg hover:bg-white transition ${refreshing ? 'opacity-50 cursor-not-allowed' : ''}`}
                title="Refresh filters"
              >
                <i className={`ri-refresh-line text-lg ${refreshing ? 'animate-spin' : ''}`}></i>
              </button>
            </div>
            <button
              onClick={onClose}
              className="text-gray-500 hover:text-gray-700 w-8 h-8 flex items-center justify-center rounded-full hover:bg-gray-100 transition"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>

          {/* Content */}
          <div className="flex-1 overflow-y-auto p-6 custom-scroll">
            {loading ? (
              <div className="flex items-center justify-center py-12">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
                <span className="ml-3 text-gray-600">Loading filters...</span>
              </div>
            ) : (
              <div>
                {/* Column Filters */}
                {orderedColumns.map(col => {
                  const field = col.dataField;
                  if (field === 'owner' || field === 'assignedUserId' || field === 'assignedTo') {
                    return null;
                  }
                  const options = filterOptions[field] || [];
                  if (options.length === 0) return null;
                  return renderMultiSelectField(field, options, field);
                })}

                {/* Owner Filter */}
                {renderOwnerFilter()}

                {/* Course Mode */}
                {(filterOptions.courseMode || []).length > 0 && renderSingleSelectField('courseMode', filterOptions.courseMode)}

                {/* Probability */}
                <div className="mb-5 multi-select-container">
                  <label className="block font-medium text-gray-700 mb-2 text-sm">Probability</label>
                  <div className="relative">
                    <div
                      className="w-full px-4 py-2.5 bg-white border border-gray-300 rounded-lg text-sm cursor-pointer flex items-center justify-between hover:border-gray-400 transition"
                      onClick={() => toggleMultiSelect('probability')}
                    >
                      <span className="text-gray-700 truncate">
                        {getDisplayText('probability')}
                      </span>
                      <svg className={`w-4 h-4 text-gray-500 flex-shrink-0 ml-2 transition-transform ${openDropdown === 'probability' ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7" />
                      </svg>
                    </div>

                    {openDropdown === 'probability' && (
                      <div className="absolute top-full left-0 right-0 mt-1 bg-white border border-gray-200 rounded-lg shadow-lg z-20" onClick={(e) => e.stopPropagation()}>
                        <div className="p-2 border-b border-gray-200 sticky top-0 bg-white rounded-t-lg">
                          <div className="relative">
                            <input
                              type="text"
                              className="w-full pl-9 pr-3 py-2 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                              placeholder="Search..."
                              value={searches.probability || ''}
                              onChange={(e) => handleSearchChange('probability', e.target.value)}
                              onClick={(e) => e.stopPropagation()}
                            />
                            <svg className="absolute left-2.5 top-2.5 w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                            </svg>
                          </div>
                        </div>

                        <div className="max-h-48 overflow-y-auto p-2">
                          {getFilteredOptions(probabilityOptions, 'probability').map(option => (
                            <div
                              key={option.value}
                              className={`px-3 py-2 text-sm flex items-center gap-3 cursor-pointer rounded-md transition ${
                                selectedFilters.probability.includes(option.value) ? 'bg-blue-50 text-blue-700' : 'text-gray-700 hover:bg-gray-50'
                              }`}
                              onClick={(e) => {
                                e.stopPropagation();
                                selectMultiOption('probability', option.value);
                              }}
                            >
                              <div
                                className={`w-4 h-4 border rounded flex items-center justify-center flex-shrink-0 ${
                                  selectedFilters.probability.includes(option.value) ? 'bg-blue-600 border-blue-600' : 'border-gray-300'
                                }`}
                              >
                                {selectedFilters.probability.includes(option.value) && (
                                  <svg className="w-3 h-3 text-white" fill="currentColor" viewBox="0 0 20 20">
                                    <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                                  </svg>
                                )}
                              </div>
                              <span>{option.label}</span>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                </div>

                {/* Enquiry Date */}
                <div className="mb-5">
                  <label className="block font-medium text-gray-700 mb-2 text-sm">Enquiry Date</label>
                  <div className="flex items-center gap-3">
                    <DateInputPicker
                      key={`enquiry-from-${resetKey}`}
                      value={selectedFilters.enquiryDateFrom}
                      onChange={date => updateSingleFilter('enquiryDateFrom', date)}
                      placeholder="From"
                      isTimeInterval={false}
                      className="flex-1"
                    />
                    <span className="text-gray-500 text-sm">to</span>
                    <DateInputPicker
                      key={`enquiry-to-${resetKey}`}
                      value={selectedFilters.enquiryDateTo}
                      onChange={date => updateSingleFilter('enquiryDateTo', date)}
                      placeholder="To"
                      isTimeInterval={false}
                      className="flex-1"
                    />
                  </div>
                </div>

                {/* Updated Date */}
                <div className="mb-5">
                  <label className="block font-medium text-gray-700 mb-2 text-sm">Updated Date</label>
                  <div className="flex items-center gap-3">
                    <DateInputPicker
                      key={`updated-from-${resetKey}`}
                      value={selectedFilters.updatedDateFrom}
                      onChange={date => updateSingleFilter('updatedDateFrom', date)}
                      placeholder="From"
                      isTimeInterval={false}
                      className="flex-1"
                    />
                    <span className="text-gray-500 text-sm">to</span>
                    <DateInputPicker
                      key={`updated-to-${resetKey}`}
                      value={selectedFilters.updatedDateTo}
                      onChange={date => updateSingleFilter('updatedDateTo', date)}
                      placeholder="To"
                      isTimeInterval={false}
                      className="flex-1"
                    />
                  </div>
                </div>

                {/* Pending Followup Date */}
                <div className="mb-5">
                  <label className="block font-medium text-gray-700 mb-2 text-sm">Pending Followup Date</label>
                  <div className="flex items-center gap-3">
                    <DateInputPicker
                      key={`pending-from-${resetKey}`}
                      value={selectedFilters.followupDate}
                      onChange={date => updateSingleFilter('followupDate', date)}
                      placeholder="From"
                      isTimeInterval={false}
                      className="flex-1"
                    />
                    <span className="text-gray-500 text-sm">to</span>
                    <DateInputPicker
                      key={`pending-to-${resetKey}`}
                      value={selectedFilters.followupDate_end}
                      onChange={date => updateSingleFilter('followupDate_end', date)}
                      placeholder="To"
                      isTimeInterval={false}
                      className="flex-1"
                    />
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Footer */}
          <div className="px-6 py-4 border-t border-gray-200 bg-gray-50 flex gap-3 flex-shrink-0">
            <button
              onClick={clearFilters}
              className="flex-1 px-5 py-2.5 bg-gray-200 text-gray-700 rounded-lg font-medium hover:bg-gray-300 transition disabled:opacity-50"
            >
              Clear All
            </button>
            <button
              onClick={handleApplyFilters}
              disabled={applying || !hasAnyFilter()}
              className="flex-1 px-5 py-2.5 bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-lg font-medium hover:from-blue-700 hover:to-indigo-700 transition disabled:opacity-50 disabled:cursor-not-allowed shadow-lg"
            >
              {applying ? 'Applying...' : 'Apply Filters'}
            </button>
          </div>
        </div>
      </div>

      {/* Custom styles */}
      <style>{`
        .custom-scroll::-webkit-scrollbar {
          width: 6px;
        }
        .custom-scroll::-webkit-scrollbar-track {
          background: #f1f5f9;
          border-radius: 10px;
        }
        .custom-scroll::-webkit-scrollbar-thumb {
          background: #cbd5e1;
          border-radius: 10px;
        }
        .custom-scroll::-webkit-scrollbar-thumb:hover {
          background: #94a3b8;
        }
        .ri-spin {
          animation: spin 1s linear infinite;
        }
        @keyframes spin {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
      `}</style>
    </>
  );
};

export default FilterDrawer;
