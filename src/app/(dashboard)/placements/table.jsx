'use client';

import { useMemo, useState } from 'react';
import { xFetch } from '@/utility/xFetch';
import { ToastContainer, toast, Bounce } from 'react-toastify';
import { Pencil, Trash2, Briefcase, Download, Mail, Phone, MapPin, Calendar, User, X, Check } from 'lucide-react';

export default function PlacementReadyTable({
  rows = [],
  selectedIds = [],
  onSelectionChange,
  onEdit,
  onStatusChange,
  onDelete,
  onViewDetails,
  corporateId,
}) {
  const allIds = useMemo(() => rows.map(r => r.id), [rows]);
  const selectedSet = useMemo(() => new Set(selectedIds), [selectedIds]);

  const [showStatusModal, setShowStatusModal] = useState(false);
  const [selectedCandidateForStatus, setSelectedCandidateForStatus] = useState(null);
  const [expandedRemarks, setExpandedRemarks] = useState({});
  const [statusFormData, setStatusFormData] = useState({
    placementStatus: '',
    placedDate: '',
    placedOrganization: ''
  });
  const [updatingStatus, setUpdatingStatus] = useState(false);
  
  const isAllSelected = allIds.length > 0 && allIds.every(id => selectedSet.has(id));

  const handleSelectAll = () => {
    onSelectionChange(isAllSelected ? [] : [...allIds]);
  };

  const handleToggle = (id) => {
    const newSelection = selectedSet.has(id)
      ? selectedIds.filter(x => x !== id)
      : [...selectedIds, id];
    onSelectionChange(newSelection);
  };

  const downloadResume = async (candidateId, fileName) => {
    try {
      const blob = await xFetch({
        path: '/services/job/downloadCandidateResume',
        payload: { id: candidateId },
        responseType: 'blob',
      });

      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      let downloadName = fileName?.trim() || `resume_${candidateId}`;

      if (!downloadName.includes('.')) {
        const contentType = blob.type;
        if (contentType.includes('pdf')) downloadName += '.pdf';
        else if (contentType.includes('msword') || contentType.includes('wordprocessingml')) downloadName += '.docx';
        else downloadName += '.pdf';
      }

      link.download = downloadName;
      link.style.display = 'none';

      document.body.appendChild(link);
      link.click();

      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);

      toast.success('Resume downloaded successfully');
    } catch (error) {
      console.error('Resume download failed:', error);
      toast.error('Failed to download resume. Please try again.');
    }
  };

  const handleStatusClick = (item) => {
    setSelectedCandidateForStatus(item);
    
    // Strip HTML tags from status for the form
    const cleanStatus = item.placementStatus?.replace(/<br\s*\/?>/gi, ' | ').trim() || '';
    
    // Extract status (first word before | or space)
    const statusValue = cleanStatus.split(' | ')[0] || cleanStatus.split(' ')[0] || '';
    
    // Extract date from status string if it exists (format: "Status | Date | Organization")
    const statusParts = cleanStatus.split(' | ');
    let extractedDate = '';
    let extractedOrganization = '';
    
    if (statusParts.length >= 2 && statusParts[1].match(/\d{4}/)) {
      // Second part looks like a date (contains year)
      extractedDate = statusParts[1].trim();
    }
    
    if (statusParts.length >= 3) {
      // Third part is organization
      extractedOrganization = statusParts[2].trim();
    } else if (statusParts.length === 2 && !statusParts[1].match(/\d{4}/)) {
      // Second part is organization (no date)
      extractedOrganization = statusParts[1].trim();
    }
    
    // Convert extracted date to YYYY-MM-DD format for date input
    let formattedDate = '';
    if (extractedDate) {
      const parsedDate = new Date(extractedDate);
      if (!isNaN(parsedDate.getTime())) {
        formattedDate = parsedDate.toISOString().split('T')[0];
      }
    }
    
    // Use existing placedDate from item if available, otherwise use extracted date
    const finalDate = item.placedDate || formattedDate || '';
    const finalOrganization = item.placedOrganization || extractedOrganization || '';
    
    setStatusFormData({
      placementStatus: statusValue,
      placedDate: finalDate,
      placedOrganization: finalOrganization
    });
    setShowStatusModal(true);
  };

  const handleUpdateStatus = async () => {
    if (!statusFormData.placementStatus) {
      toast.error('Please select placement status');
      return;
    }

    setUpdatingStatus(true);

    try {
      const response = await xFetch({
        path: '/services/job/updatePlacementStatus',
        method: 'POST',
        payload: {
          id: selectedCandidateForStatus.id,
          placementStatus: statusFormData.placementStatus,
          placedDate: statusFormData.placedDate,
          placedOrganization: statusFormData.placedOrganization
        }
      });

      if (response) {
        toast.success('Placement status updated successfully');
        setShowStatusModal(false);
        // Refresh the table
        if (onStatusChange) {
          onStatusChange(selectedCandidateForStatus.id, statusFormData.placementStatus);
        }
      } else {
        toast.error('Failed to update status');
      }
    } catch (error) {
      console.error('Update status failed:', error);
      toast.error('Failed to update placement status');
    } finally {
      setUpdatingStatus(false);
    }
  };

  // Helper function to strip HTML tags and get clean status
  const getCleanStatus = (status) => {
    if (!status) return 'Placement Ready';
    // Remove <br> tags and get just the status text
    return status.replace(/<br\s*\/?>/gi, ' | ').replace(/\s+/g, ' ').trim();
  };

  const toggleRemarks = (id) => {
    setExpandedRemarks(prev => ({
      ...prev,
      [id]: !prev[id],
    }));
  };

  return (
    <>
    <table className="text-[13px] border-collapse bg-white w-full" id="placementCandidatesTable">
      <thead className="bg-gradient-to-r from-blue-50 via-white to-blue-50 sticky top-0 z-10">
        <tr className="border-b border-blue-200">
          <th className="p-3 w-10">
            <input
              className="h-4 w-4 cursor-pointer rounded border-gray-300 text-blue-600 focus:ring-blue-500 hover:border-blue-500"
              type="checkbox"
              checked={isAllSelected}
              onChange={(e) => handleSelectAll()}
            />
          </th>
          <th className="p-3 text-left text-xs font-bold text-gray-700 uppercase tracking-wider min-w-40">Name</th>
          <th className="p-3 text-left text-xs font-bold text-gray-700 uppercase tracking-wider min-w-52">Email</th>
          <th className="p-3 text-left text-xs font-bold text-gray-700 uppercase tracking-wider min-w-36">Mobile</th>
          <th className="p-3 text-left text-xs font-bold text-gray-700 uppercase tracking-wider min-w-32">Qualification</th>
          <th className="p-3 text-left text-xs font-bold text-gray-700 uppercase tracking-wider min-w-28">YOP</th>
          <th className="p-3 text-left text-xs font-bold text-gray-700 uppercase tracking-wider min-w-32">Current City</th>
          <th className="p-3 text-left text-xs font-bold text-gray-700 uppercase tracking-wider min-w-44">Job Profiles</th>
          <th className="p-3 text-left text-xs font-bold text-gray-700 uppercase tracking-wider min-w-44">Placement Status</th>
          <th className="p-3 text-left text-xs font-bold text-gray-700 uppercase tracking-wider min-w-52">Resume</th>
          <th className="p-3 text-left text-xs font-bold text-gray-700 uppercase tracking-wider min-w-32">Course</th>
          <th className="p-3 text-left text-xs font-bold text-gray-700 uppercase tracking-wider min-w-36">Course Start</th>
          <th className="p-3 text-left text-xs font-bold text-gray-700 uppercase tracking-wider min-w-36">Course End</th>
          <th className="p-3 text-left text-xs font-bold text-gray-700 uppercase tracking-wider min-w-36">Batch</th>
          <th className="p-3 text-left text-xs font-bold text-gray-700 uppercase tracking-wider min-w-36">Associated Center</th>
          <th className="p-3 text-left text-xs font-bold text-gray-700 uppercase tracking-wider min-w-28">Job Status</th>
          <th className="p-3 text-center text-xs font-bold text-gray-700 uppercase tracking-wider min-w-28">Total Exp</th>
          <th className="p-3 text-center text-xs font-bold text-gray-700 uppercase tracking-wider min-w-28">Relevant Exp</th>
          <th className="p-3 text-left text-xs font-bold text-gray-700 uppercase tracking-wider min-w-44">Last Org</th>
          <th className="p-3 text-left text-xs font-bold text-gray-700 uppercase tracking-wider min-w-40">Exp Job Type</th>
          <th className="p-3 text-left text-xs font-bold text-gray-700 uppercase tracking-wider min-w-44">Exp Location</th>
          <th className="p-3 text-left text-xs font-bold text-gray-700 uppercase tracking-wider min-w-40">Last Desig</th>
          <th className="p-3 text-left text-xs font-bold text-gray-700 uppercase tracking-wider min-w-40">Exp Desig</th>
          <th className="p-3 text-center text-xs font-bold text-gray-700 uppercase tracking-wider min-w-28">Last CTC</th>
          <th className="p-3 text-center text-xs font-bold text-gray-700 uppercase tracking-wider min-w-28">Exp CTC</th>
          <th className="p-3 text-left text-xs font-bold text-gray-700 uppercase tracking-wider min-w-52">Remarks</th>
          <th className="p-3 text-left text-xs font-bold text-gray-700 uppercase tracking-wider min-w-44">Receive Job Opp</th>
          <th className="p-3 text-left text-xs font-bold text-gray-700 uppercase tracking-wider min-w-44">Updated</th>
        </tr>
      </thead>

      <tbody className="divide-y divide-gray-100">
        {rows.length === 0 ? (
          <tr>
            <td colSpan={27} className="text-center py-16 text-gray-500">
              <div className="flex flex-col items-center gap-3">
                <div className="p-4 bg-gray-100 rounded-full">
                  <User size={40} className="text-gray-400" />
                </div>
                <span className="font-semibold text-lg">No placement-ready candidates found</span>
                <span className="text-sm">Add candidates to get started</span>
              </div>
            </td>
          </tr>
        ) : (
          rows.map((item) => {
            const isSelected = selectedSet.has(item.id);
            const hasMobile = item.mobile && item.mobile.length > 3;

            return (
              <tr
                key={item.id}
                className={`hover:bg-blue-50 transition-colors ${
                  isSelected 
                    ? 'bg-gradient-to-r from-blue-50 via-indigo-50 to-blue-50 border-l-4 border-blue-500' 
                    : 'border-l-4 border-transparent'
                }`}
              >
                <td className="p-3 text-center align-top">
                  <input
                    className="h-4 w-4 mt-0.5 cursor-pointer rounded border-gray-300 text-blue-600 focus:ring-blue-500 hover:border-blue-500"
                    type="checkbox"
                    checked={isSelected}
                    onChange={() => handleToggle(item.id)}
                  />
                </td>

                <td className="p-3 align-top">
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => onEdit?.(item)}
                      className="p-1 text-blue-600 hover:bg-blue-50 rounded transition-colors"
                      title="Edit candidate"
                    >
                      <Pencil size={14} />
                    </button>
                    <span className="font-semibold text-gray-900">{item.name || '-'}</span>
                  </div>
                </td>

                <td className="p-3 text-gray-600 align-top">
                  <a href={`mailto:${item.email}`} className="hover:text-blue-600 hover:underline transition-colors">
                    {item.email || '-'}
                  </a>
                </td>

                <td className="p-3 align-top">
                  <div className="flex items-center gap-2">
                    <span className="text-gray-600">{item.mobile || '-'}</span>
                    {hasMobile && (
                      <a
                        href={`https://wa.me/${item.mobile.replace(/\D/g, '')}?text=Hello`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="p-1 hover:bg-green-50 rounded transition-colors"
                        title="Send WhatsApp message"
                      >
                        <svg
                          xmlns="http://www.w3.org/2000/svg"
                          viewBox="0 0 24 24"
                          width="16"
                          height="16"
                          color="#4CAF50"
                          fill="none"
                          stroke="#4CAF50"
                          strokeWidth="1.5"
                          strokeLinejoin="round"
                        >
                          <path d="M12 22C17.5228 22 22 17.5228 22 12C22 6.47715 17.5228 2 12 2C6.47715 2 2 6.47715 2 12C2 13.3789 2.27907 14.6926 2.78382 15.8877C3.06278 16.5481 3.20226 16.8784 3.21953 17.128C3.2368 17.3776 3.16334 17.6521 3.01642 18.2012L2 22L5.79877 20.9836C6.34788 20.8367 6.62244 20.7632 6.87202 20.7805C7.12161 20.7977 7.45185 20.9372 8.11235 21.2162C9.30745 21.7209 10.6211 22 12 22Z" />
                          <path d="M8.58815 12.3773L9.45909 11.2956C9.82616 10.8397 10.2799 10.4153 10.3155 9.80826C10.3244 9.65494 10.2166 8.96657 10.0008 7.58986C9.91601 7.04881 9.41086 7 8.97332 7C8.40314 7 8.11805 7 7.83495 7.12931C7.47714 7.29275 7.10979 7.75231 7.02917 8.13733C6.96539 8.44196 7.01279 8.65187 7.10759 9.07169C7.51023 10.8548 8.45481 12.6158 9.91948 14.0805C11.3842 15.5452 13.1452 16.4898 14.9283 16.8924C15.3481 16.9872 15.558 17.0346 15.8627 16.9708C16.2477 16.8902 16.7072 16.5229 16.8707 16.165C17 15.8819 17 15.5969 17 15.0267C17 14.5891 16.9512 14.084 16.4101 13.9992C15.0334 13.7834 14.3451 13.6756 14.1917 13.6845C13.5847 13.7201 13.1603 14.1738 12.7044 14.5409L11.6227 15.4118" />
                        </svg>
                      </a>
                    )}
                  </div>
                </td>

                <td className="p-3 text-gray-600 align-top">
                  <span className="inline-flex items-center px-2.5 py-1 bg-gray-100 text-gray-700 text-xs font-semibold rounded-full">
                    {item.qualification || '-'}
                  </span>
                </td>
                <td className="p-3 text-gray-600 align-top">{item.yearOfPassing || '-'}</td>
                <td className="p-3 text-gray-600 align-top">
                  <div className="flex items-center gap-1">
                    <MapPin size={12} className="text-gray-400" />
                    {item.currentCity || '-'}
                  </div>
                </td>

                <td className="p-3 align-top">
                  {item.jobTags?.length ? (
                    <div className="flex flex-wrap gap-1.5">
                      {item.jobTags.map((tag, i) => (
                        <span
                          key={i}
                          className="inline-flex items-center px-2.5 py-1 bg-blue-100 text-blue-800 text-xs font-semibold rounded-full border border-blue-200"
                        >
                          {tag}
                        </span>
                      ))}
                    </div>
                  ) : (
                    '-'
                  )}
                </td>

                <td className="p-3 align-top">
                  <button
                    onClick={() => handleStatusClick(item)}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-gradient-to-r from-blue-100 to-indigo-100 text-blue-800 text-xs font-semibold rounded-full border border-blue-200 hover:shadow-md transition-all cursor-pointer"
                    title="Change placement status"
                  >
                    <Briefcase size={12} />
                    {getCleanStatus(item.placementStatus)}
                  </button>
                </td>

                <td className="p-3 align-top">
                  {item.resumeName ? (
                    <button
                      onClick={() => downloadResume(item.candidateId, item.resumeName)}
                      className="inline-flex items-center gap-1.5 text-blue-600 hover:text-blue-800 hover:underline transition-colors font-medium"
                      title="Download Resume"
                    >
                      <Download size={14} />
                      {item.resumeName}
                    </button>
                  ) : (
                    <span className="text-gray-400">-</span>
                  )}
                </td>

                <td className="p-3 text-gray-600 align-top">
                  <div className="flex items-center gap-1">
                    <Calendar size={12} className="text-gray-400" />
                    {item.course || '-'}
                  </div>
                </td>
                <td className="p-3 text-gray-600 align-top">{item.courseStartDate || '-'}</td>
                <td className="p-3 text-gray-600 align-top">{item.courseEndDate || '-'}</td>
                <td className="p-3 align-top">
                  {item.batchNames ? (
                    <div className="flex flex-wrap gap-1.5">
                      {item.batchNames.split(',').map((batch, i) => (
                        <span
                          key={i}
                          className="inline-flex items-center px-2.5 py-1 bg-blue-100 text-blue-800 text-xs font-semibold rounded-full border border-blue-200"
                        >
                          {batch.trim()}
                        </span>
                      ))}
                    </div>
                  ) : (
                    '-'
                  )}
                </td>
                <td className="p-3 text-gray-600 align-top">{item.associatedCenters || '-'}</td>
                <td className="p-3 align-top">
                  <span className={`inline-flex items-center px-2.5 py-1 text-xs font-semibold rounded-full ${
                    item.jobStatus === 'Active' 
                      ? 'bg-green-100 text-green-800' 
                      : 'bg-gray-100 text-gray-700'
                  }`}>
                    {item.jobStatus || '-'}
                  </span>
                </td>
                <td className="p-3 text-center text-gray-600 align-top">
                  {item.totalExperience ? `${item.totalExperience} yrs` : '-'}
                </td>
                <td className="p-3 text-center text-gray-500 align-top">
                  {item.relevantExperience ? `${item.relevantExperience} yrs` : '-'}
                </td>
                <td className="p-3 text-gray-600 align-top">{item.lastOrganizationName || '-'}</td>
                <td className="p-3 text-gray-600 align-top">{item.expectedJobType || '-'}</td>
                <td className="p-3 text-gray-600 align-top">
                  {Array.isArray(item.expectedLocationPreference)
                    ? item.expectedLocationPreference.join(', ')
                    : item.expectedLocationPreference || '-'}
                </td>
                <td className="p-3 text-gray-600 align-top">{item.lastDesignation || '-'}</td>
                <td className="p-3 text-gray-600 align-top">{item.expectedDesignation || '-'}</td>
                <td className="p-3 text-center text-gray-600 align-top">
                  {item.lastCTC ? `₹${item.lastCTC} L` : '-'}
                </td>
                <td className="p-3 text-center text-gray-600 align-top">
                  {item.expectedCTC ? `₹${item.expectedCTC} L` : '-'}
                </td>
                <td className="p-3 text-gray-600 align-top max-w-xs">
                  {item.remarks ? (
                    <div className="max-w-xs">
                      <div
                        className={`text-sm leading-5 whitespace-pre-wrap break-words ${
                          expandedRemarks[item.id]
                            ? ''
                            : 'line-clamp-2'
                        }`}
                      >
                        {item.remarks}
                      </div>

                      {item.remarks.length > 100 && (
                        <button
                          type="button"
                          onClick={() => toggleRemarks(item.id)}
                          className="mt-1 text-blue-600 hover:text-blue-800 text-xs font-semibold hover:underline"
                        >
                          {expandedRemarks[item.id] ? 'View Less' : 'View More'}
                        </button>
                      )}
                    </div>
                  ) : (
                    '-'
                  )}
                </td>
                <td className="p-3 text-gray-600 align-top">{item.receiveJobOpportunities || '-'}</td>
                <td className="p-3 text-gray-500 align-top text-xs">
                  {item.updatedDate || '-'}
                </td>
              </tr>
            );
          })
        )}
      </tbody>
    </table>

    {/* Change Placement Status Modal */}
    {showStatusModal && selectedCandidateForStatus && (
      <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-[100] p-4">
        <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md overflow-hidden border border-gray-200">
          {/* Modal Header */}
          <div className="bg-gradient-to-r from-blue-600 to-indigo-600 text-white px-6 py-4 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Briefcase size={18} className="text-blue-200" />
              <h3 className="text-lg font-bold">Change Placement Status</h3>
            </div>
            <button
              onClick={() => setShowStatusModal(false)}
              className="text-white hover:bg-white/20 p-2 rounded-full transition-colors"
            >
              <X size={18} />
            </button>
          </div>

          {/* Modal Body */}
          <div className="p-6 space-y-4">
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                Placement Status <span className="text-red-500">*</span>
              </label>
              <select
                id="placementStatus"
                value={statusFormData.placementStatus}
                onChange={(e) => setStatusFormData({ ...statusFormData, placementStatus: e.target.value })}
                className="w-full px-4 py-2.5 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="">--Select Status--</option>
                <option value="Inactive">Inactive</option>
                <option value="Placed">Placed</option>
                <option value="Placement Ready">Placement Ready</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                Placed Date
              </label>
              <input
                id="placedDate"
                type="date"
                value={statusFormData.placedDate}
                onChange={(e) => setStatusFormData({ ...statusFormData, placedDate: e.target.value })}
                className="w-full px-4 py-2.5 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>

            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                Placed Organization
              </label>
              <input
                id="placedOrganization"
                type="text"
                value={statusFormData.placedOrganization}
                onChange={(e) => setStatusFormData({ ...statusFormData, placedOrganization: e.target.value })}
                placeholder="Enter organization name"
                className="w-full px-4 py-2.5 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
          </div>

          {/* Modal Footer */}
          <div className="border-t border-gray-200 px-6 py-4 bg-gray-50 flex justify-end gap-3">
            <button
              onClick={() => setShowStatusModal(false)}
              className="px-5 py-2.5 bg-amber-500 hover:bg-amber-600 text-white text-sm font-semibold rounded-full transition-all shadow-md hover:shadow-lg"
            >
              Close
            </button>
            <button
              onClick={handleUpdateStatus}
              disabled={updatingStatus}
              className="inline-flex items-center gap-2 px-5 py-2.5 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white text-sm font-semibold rounded-full transition-all shadow-md hover:shadow-lg disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {updatingStatus ? (
                <>
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                  Updating...
                </>
              ) : (
                <>
                  <Check size={16} />
                  Update
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    )}
    </>
  );
}
