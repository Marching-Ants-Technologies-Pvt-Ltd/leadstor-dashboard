'use client';

// Make sure this utility can only be called from session
let CurrentSessionData = {};
let LeadOwnersById = {};

if (typeof window !== 'undefined') {
    try {
        CurrentSessionData = JSON.parse(localStorage.getItem('CurrentSessionData') ?? '{}');
        LeadOwnersById = JSON.parse(localStorage.getItem('LeadOwnersById') ?? '{}');
    } catch (e) {
        console.error(`Unable to parse current state of user`, e);
    }
}

export const Corporate = CurrentSessionData?.corporate;
export const Test = CurrentSessionData?.test;
export const User = CurrentSessionData?.user;
export const Owners = LeadOwnersById;

export function getLeadOwnerById(id, defaultValue = '') {
    if (id === null || id === undefined) return defaultValue;

    const parsedId =
        typeof id === 'number'
            ? id
            : typeof id === 'string'
                ? Number(id.trim())
                : NaN;

    // Must be a finite integer (allows +ve / -ve)
    if (!Number.isFinite(parsedId) || !Number.isInteger(parsedId)) {
        return defaultValue;
    }

    if (parsedId === -1) {
        return 'Admin';
    }

    return LeadOwnersById[parsedId] ?? defaultValue;
}

export function getCurrentUserMobile() {
    try {
        const session = JSON.parse(localStorage.getItem('CurrentSessionData') ?? '{}');
        return session?.user?.mobile || '';
    } catch (e) {
        // ignore
    }
    return '';
}

export function getCurrentUserNameIfAdmin() {
    try {
        const session = JSON.parse(localStorage.getItem('CurrentSessionData') ?? '{}');
        if (session?.user && session.user._id === -1) {
            return session.user.name || '';
        }
    } catch (e) {
        // ignore
    }
    return '';
}

export const LeadsPerPage = {
    value: () => parseInt(localStorage.getItem('LeadsPerPage') ?? '50'),
    setValue: (value) => localStorage.setItem('LeadsPerPage', value)
}
export const TotalLeads = {
    value: () => parseInt(localStorage.getItem('TotalLeads') ?? '0'),
    setValue: (value) => localStorage.setItem('TotalLeads', value)
}

export const LeadsCurrentPage = {
    value: () => parseInt(localStorage.getItem('LeadsCurrentPage') ?? '1'),
    setValue: (value) => localStorage.setItem('LeadsCurrentPage', value)
}

export const LeadsLastPage = {
    value: () => parseInt(localStorage.getItem('LeadsLastPage') ?? '1'),
    setValue: (value) => localStorage.setItem('LeadsLastPage', value)
}

export const LeadFilters = {
    value: () => JSON.parse(localStorage.getItem('LeadFilters') ?? '[]'),
    setValue: (value) => localStorage.setItem('LeadFilters', JSON.stringify(value)),
    reset: () => localStorage.setItem('LeadFilters', '[]'),
}

export const LeadSavedView = {
    value: () => JSON.parse(localStorage.getItem('LeadSavedView') ?? 'null'),
    setValue: (value) => localStorage.setItem('LeadSavedView', JSON.stringify(value)),
    reset: () => localStorage.removeItem('LeadSavedView'),
}

export const PaymentSavedView = {
    value: () => JSON.parse(localStorage.getItem('PaymentSavedView') ?? 'null'),
    setValue: (value) => localStorage.setItem('PaymentSavedView', JSON.stringify(value)),
    reset: () => localStorage.removeItem('PaymentSavedView'),
}

export const LeadSearch = {
  value: () => localStorage.getItem('LeadSearch') ?? '',
  setValue: (value) => localStorage.setItem('LeadSearch', value),
  reset: () => localStorage.setItem('LeadSearch', '')
};