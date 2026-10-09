const Leads = [
    { selector: '.leads-search-bar', content: 'Search Leads — Use this searchbar to find leads by name, email and phone number.' },
    { selector: '.leads-add-btn', content: 'Add New Lead — Use this button to manually add a new lead in your collection.' },
    { selector: '.leads-ai-sales-insight-btn', content: 'AI Sales Insight — Use this button to get AI-powered insights and recommendations about your leads.' },
    { selector: '.leads-export-btn', content: 'Export — Use this dropdown to download lead data as an Excel file. Choose from Daily Report or Enquiries Export.' },
    { selector: '.leads-filter-btn', content: 'Filter — Use this dropdown to filter leads using quick filters or advanced filter options.' },
    { selector: '.leads-settings-btn', content: 'Settings — Use this button to configure lead table columns, email templates, triggers, and workflows.' },
    { selector: '.leads-refresh-btn', content: 'Refresh — Use this button to refresh and sync the leads table with the latest lead data.' },
    { selector: '.leads-enquiries-count', content: 'Enquiries On This Page — View the number of enquiries currently displayed on this page along with the total number of leads.' },
    { selector: '.leads-page-size-btn', content: 'Enquiries Per Page — Adjust the number of enquiries shown per page. The default is 50.' },
    { selector: '.leads-fullscreen-btn', content: 'Go Full Screen — Use this button to hide unnecessary elements and view the leads table in full-screen mode.' },
    { selector: '.leads-pagination', content: 'Jump to Pages — Use these page buttons to quickly navigate between different pages of leads.' },
];
export function getTourSteps(page) {
    if (page === '/leads') return Leads;

    // Default
    return [
        { selector: '.analytics-button', content: 'Analytics — Click here to see the Overview of your leads and conversions.' },
        { selector: '.notification-button', content: 'Notification — You\'ll see a badge when there is new leads arrives in your system.' },
        { selector: '.profile-button', content: 'Profile — Here we have a dropdown to view your profile, manage your team members and Signout from current session.' }
    ];
}