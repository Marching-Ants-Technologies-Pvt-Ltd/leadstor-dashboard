// lib/sidebarConfig.ts
export const menuItems = [
  {
    icon: 'ri-dashboard-line',
    label: 'Leads',
    href: '/leads',
    allowedRoles: ['Admin', 'Administrator', 'Super Counsellor', 'Counsellor', 'Telecaller', 'Read Only Super User'],
  },
  {
    icon: 'ri-bank-card-line',
    label: 'Payments',
    href: '/payments',
    allowedRoles: ['Admin', 'Administrator', 'Finance'],
    isDefaultForRoles: ['Finance'],
  },
  {
    icon: 'ri-stack-line',
    label: 'Batches',
    href: '/batches',
    allowedRoles: ['Admin', 'Administrator', 'Telecaller','Trainer'],
  },
  {
    icon: 'ri-briefcase-line',
    label: 'Job Posting',
    href: '/jobs',
    allowedRoles: ['Admin', 'Administrator','Placement Officer'],
  },
  {
    icon: 'ri-user-star-line',
    label: 'Placement',
    href: '/placements',
    allowedRoles: ['Admin', 'Administrator','Placement Officer'],
  },
  {
    icon: 'ri-receipt-line',
    label: 'Invoices',
    href: '/invoices',
    allowedRoles: ['Admin', 'Administrator', 'Finance', 'Super Counsellor', 'Telecaller'],
  },
  {
    icon: 'ri-building-line',
    label: 'Branches',
    href: '/branches',
    allowedRoles: ['Admin', 'Administrator'],
  },
  {
    icon: 'ri-wallet-3-line',
    label: 'Expenses',
    href: '/expenses',
    allowedRoles: ['Admin', 'Administrator', 'Finance'],
  },
] as const;