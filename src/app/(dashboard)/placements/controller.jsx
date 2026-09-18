'use client'

import { useEffect, useState } from 'react'
import { ToastContainer, toast, Bounce } from 'react-toastify'
import { xFetch } from '@/utility/xFetch'
import { Corporate } from '@/utility/TinyDB'
import * as XLSX from 'xlsx'
import { Plus, Trash2, Filter, FileText, Search, RefreshCw, Download, BarChart3 } from 'lucide-react'
import PlacementReadyTable from './table'
import CandidateFormModal from '@/components/dashboard/placement/CandidateFormModal'
import FilterModal from '@/components/dashboard/placement/FilterModal'
import PlacementReportView from '@/components/dashboard/placement/PlacementReportView'
import BatchRemarksModal from '@/components/dashboard/placement/BatchRemarksModal'

export default function PlacementReadyController() {
    const corporateId = Corporate?._id

    const [candidates, setCandidates] = useState([])
    const [loading, setLoading] = useState(true)
    const [total, setTotal] = useState(0)          // ← total from server

    const [search, setSearch] = useState('')
    const [selectedIds, setSelectedIds] = useState([])

    const [page, setPage] = useState(1)
    const [limit, setLimit] = useState(10)         // ← now changeable

    const [sortField, setSortField] = useState(null)
    const [sortDirection, setSortDirection] = useState('ASC')
    const [isModalOpen, setIsModalOpen] = useState(false)
    const [modalMode, setModalMode] = useState('add')
    const [selectedCandidate, setSelectedCandidate] = useState(null)
    const totalPages = Math.ceil(total / limit)
    const [isBatchRemarksOpen, setIsBatchRemarksOpen] = useState(false)

    // Filter states
    const [filters, setFilters] = useState({})
    const [filterSummary, setFilterSummary] = useState('')
    const [showFilterModal, setShowFilterModal] = useState(false)
    const [filterOptions, setFilterOptions] = useState({
        statuses: [],
        locations: [],
        courses: [],
        job_profiles: [],
        lastDesignations: [],
        expectedDesignations: [],
        totalExperiences: [],
        relevantExperiences: [],
        expectedCTCs: [],
        educationalQualifications: [],
    })

    // Report view state
    const [showReportView, setShowReportView] = useState(false)
    const [reportData, setReportData] = useState([])
    const [reportTotal, setReportTotal] = useState(0)
    const [reportPage, setReportPage] = useState(1)
    const [reportLoading, setReportLoading] = useState(false)

    // Fetch filter options once
    useEffect(() => {
        const fetchFilterOptions = async () => {
        try {
            const data = await xFetch({
            path: '/services/job/getFilterParameters',
            payload: { corporateId }
            })
            setFilterOptions(data || {})
        } catch (err) {
            toast.error('Failed to load filter options')
        }
        }
        fetchFilterOptions()
    }, [corporateId])

    useEffect(() => {
        setPage(1)
    }, [limit, search, filters])

    // Filter modal logic
    const applyFilters = (newFilters) => {
        setFilters(newFilters)
        setPage(1)

        const parts = []

        if (newFilters.status?.length) {
            parts.push(`Status: ${newFilters.status.join(', ')}`)
        }
        if (newFilters.course?.length) {
            parts.push(`Course: ${newFilters.course.join(', ')}`)
        }
        if (newFilters.location?.length) {
            parts.push(`City: ${newFilters.location.join(', ')}`)
        }
        if (newFilters.jobProfile?.length) {
            parts.push(`Job Profile: ${newFilters.jobProfile.join(', ')}`)
        }
        if (newFilters.lastDesignation?.length) {
            parts.push(`Last Desig: ${newFilters.lastDesignation.join(', ')}`)
        }
        if (newFilters.expectedDesignation?.length) {
            parts.push(`Exp Desig: ${newFilters.expectedDesignation.join(', ')}`)
        }
        if (newFilters.totalExperience?.length) {
            parts.push(`Total Exp: ${newFilters.totalExperience.join(', ')}`)
        }
        if (newFilters.relevantExperience?.length) {
            parts.push(`Relevant Exp: ${newFilters.relevantExperience.join(', ')}`)
        }
        if (newFilters.expectedCTC?.length) {
            parts.push(`Exp CTC: ${newFilters.expectedCTC.join(', ')}`)
        }
        if (newFilters.educationalQualification?.length) {
            parts.push(`Qual: ${newFilters.educationalQualification.join(', ')}`)
        }
        if (newFilters.yearOfPassing) {
            parts.push(`YOP: ${newFilters.yearOfPassing}`)
        }

        setFilterSummary(parts.length > 0 ? parts.join(' | ') : '')
    }

    const clearFilters = () => {
        setFilters({})
        setFilterSummary('')
        setPage(1)
    }

    const reloadCandidates = async () => {
        setLoading(true)
        try {
        const offset = (page - 1) * limit

        const params = {
            corporateId: String(corporateId),
            offset: String(offset),
            limit: String(limit),
            ...filters,
        }

        if (search.trim()) {
            params.search = search.trim()
        }

        if (sortField) {
            params.order = `${sortField} ${sortDirection}`
        }

        const data = await xFetch({
            path: '/services/job/getCandidates',
            payload: params,
        })

        const list = Array.isArray(data) ? data : (data?.rows || data?.data || [])
        setCandidates(list)
        setTotal(data?.total || 0)

        } catch (err) {
            console.error(err)
            toast.error('Failed to load placement ready candidates')
        } finally {
            setLoading(false)
        }
    }

    // ─── Bulk Delete ───────────────────────────────────────
    const handleBulkDelete = async () => {
        if (!selectedIds.length) {
        toast.warn('No candidates selected')
        return
        }

        if (!window.confirm(`Delete ${selectedIds.length} candidate(s)?`)) return

        try {
        for (const id of selectedIds) {
            await xFetch({
            path: '/services/job/deleteCandidate',
            method: 'POST',
            payload: { candidateId: id }
            })
        }
        toast.success(`${selectedIds.length} candidate(s) deleted`)
        setSelectedIds([])
        reloadCandidates()
        } catch (err) {
        toast.error('Delete failed')
        }
    }

    // ─── Client-side Export (using current page data) ──────
    const handleExport = () => {
        if (!candidates.length) {
            toast.warn('No data to export')
            return
        }

        const data = candidates.map(c => ({
            Name: c.name || '',
            Email: c.email || '',
            Mobile: c.mobile || '',
            Qualification: c.qualification || '',
            'Year of Passing': c.yearOfPassing || '',
            'Current City': c.currentCity || '',
            'Job Profiles': formatArrayOrString(c.jobTags),
            Batch: c.batchNames || '',
            'Placement Status': c.placementStatus || '',
            Resume: c.resumeName || '',
            Course: c.course || '',
            'Course Start': c.courseStartDate || '',
            'Course End': c.courseEndDate || '',
            'Job Status': c.jobStatus || '',
            'Total Exp (Years)': c.totalExperience || '',
            'Relevant Exp (Years)': c.relevantExperience || '',
            'Last Organization': c.lastOrganizationName || '',
            'Expected Job Type': c.expectedJobType || '',
            'Expected Location': formatArrayOrString(c.expectedLocationPreference),
            'Last Designation': c.lastDesignation || '',
            'Expected Designation': c.expectedDesignation || '',
            'Last CTC': c.lastCTC || '',
            'Expected CTC': c.expectedCTC || '',
            Remarks: c.remarks || '',
            'Receive Job Opportunities': c.receiveJobOpportunities || '',
            'Updated Time': c.updatedDate || ''
        }))

        const ws = XLSX.utils.json_to_sheet(data)
        const wb = XLSX.utils.book_new()
        XLSX.utils.book_append_sheet(wb, ws, 'Placement Ready')
        XLSX.writeFile(wb, `placement-ready-page-${page}-${new Date().toISOString().slice(0,10)}.xlsx`)
        toast.success('Current page exported')

        toast.success('Full report exported')
    }

    // Add handler functions
    const openAddModal = () => {
        setModalMode('add')
        setSelectedCandidate({})
        setIsModalOpen(true)
    }

    const openEditModal = (row) => {
        setModalMode('edit')
        setSelectedCandidate(row)
        setIsModalOpen(true)
    }

    const formatArrayOrString = (value) => {
        if (Array.isArray(value)) return value.join(', ')
        if (typeof value === 'string') return value
        return '' // null, undefined, number, object, etc.
    }

    // Report list reload
    const reloadReport = async () => {
      setReportLoading(true);

      try {
        const params = {
          corporateId: String(corporateId),
          offset: String((reportPage - 1) * 1000),
          limit: '1000',
          search: '',
          order: 'asc',
          time: Date.now()
        };

        console.log('Report Params:', params);

        const data = await xFetch({
          path: '/services/job/getPlacementReadyReport',
          payload: params,
        });

        console.log('Report Response:', data);

        setReportData(data?.rows || []);
        setReportTotal(data?.total || 0);
      } catch (err) {
        console.error('Report Error:', err);
        toast.error('Failed to load report');
      } finally {
        setReportLoading(false);
      }
    };

    // Load main list or report based on view
    useEffect(() => {
      if (showReportView) {
        reloadReport()
      } else {
        reloadCandidates()
      }
    }, [page, limit, search, sortField, sortDirection, filters, corporateId, showReportView, reportPage])

    // Toggle report view
    const toggleReportView = () => {
      setShowReportView(prev => {
        if (!prev) reloadReport() // load report when switching
        return !prev
      })
    }

    // Export full report (server-side)
    const exportPlacementReport = async () => {
      try {
        const params = { corporateId: String(corporateId) }
        const blob = await xFetch({
          path: '/services/job/exportPlacementReport',
          payload: params,
          responseType: 'blob'
        })

        const url = window.URL.createObjectURL(blob)
        const link = document.createElement('a')
        link.href = url
        link.download = `${corporateId}_placementReadyReport.xlsx`
        document.body.appendChild(link)
        link.click()
        document.body.removeChild(link)
        window.URL.revokeObjectURL(url)

        toast.success('Report exported')
      } catch (err) {
        toast.error('Export failed')
      }
    }

  return (
    <div className="flex flex-col h-full bg-gradient-to-b from-gray-50 to-gray-100">
      <ToastContainer theme="light" transition={Bounce} position="top-right" autoClose={2200} />

      {showReportView ? (
          <PlacementReportView
            corporateId={corporateId}
            reportData={reportData}
            reportTotal={reportTotal}
            reportLoading={reportLoading}
            reportPage={reportPage}
            setReportPage={setReportPage}
            onBack={() => setShowReportView(false)}
          />
        ) : (
          <>

          {/* Toolbar - Modern Lead Page Style with Blue Theme */}
          <div className="bg-white border-b border-gray-200 px-6 py-4 shadow-sm">
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
              <div className="flex flex-wrap items-center gap-2.5">
                <button
                  className="inline-flex items-center gap-2 px-4 py-2.5 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white text-sm font-semibold rounded-full shadow-md hover:shadow-lg transition-all hover:-translate-y-0.5"
                  onClick={openAddModal}
                >
                  <Plus size={16} />
                  Add Candidate
                </button>

                <button
                  onClick={handleBulkDelete}
                  disabled={!selectedIds.length}
                  className={`inline-flex items-center gap-2 px-4 py-2.5 text-sm font-semibold rounded-full shadow-md transition-all hover:-translate-y-0.5 ${
                    selectedIds.length
                      ? 'bg-gradient-to-r from-red-600 to-red-700 hover:from-red-700 hover:to-red-800 text-white hover:shadow-lg'
                      : 'bg-gray-200 text-gray-500 cursor-not-allowed'
                  }`}
                >
                  <Trash2 size={16} />
                  Delete {selectedIds.length ? `(${selectedIds.length})` : ''}
                </button>
                
                <button
                  onClick={() => setIsBatchRemarksOpen(true)}
                  disabled={!selectedIds.length}
                  className={`inline-flex items-center gap-2 px-4 py-2.5 text-sm font-semibold rounded-full shadow-md transition-all hover:-translate-y-0.5 ${
                    selectedIds.length
                      ? 'bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white hover:shadow-lg'
                      : 'bg-gray-200 text-gray-500 cursor-not-allowed'
                  }`}
                >
                  Update Remarks {selectedIds.length ? `(${selectedIds.length})` : ''}
                </button>
                <button
                  onClick={() => setShowFilterModal(true)}
                  className={`
                    inline-flex items-center gap-2 px-4 py-2.5 border text-sm font-semibold rounded-full shadow-sm transition-all hover:-translate-y-0.5
                    ${filterSummary
                    ? 'bg-gradient-to-r from-blue-600 to-indigo-600 text-white border-blue-700 hover:shadow-md'
                    : 'border-gray-300 hover:bg-gray-100 text-gray-700 hover:shadow-md'}
                  `}
                >
                  <Filter size={16} />
                  Filter
                  {filterSummary && (
                    <span className="ml-1 bg-white bg-opacity-20 px-2 py-0.5 rounded-full text-xs">
                      Active
                    </span>
                  )}
                </button>

                <button 
                  onClick={() => setShowReportView(true)}
                  className="inline-flex items-center gap-2 px-4 py-2.5 border border-gray-300 hover:bg-blue-50 hover:border-blue-300 text-sm font-semibold rounded-full shadow-sm transition-all hover:-translate-y-0.5 hover:shadow-md"
                >
                  <BarChart3 size={16} />
                  Report
                </button>
              </div>

              <div className="flex items-center gap-3 w-full sm:w-auto">
                <div className="relative flex-1 sm:flex-none">
                  <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                  <input
                    className="w-full sm:w-72 pl-10 pr-4 py-2.5 border border-gray-300 rounded-full text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent shadow-sm hover:shadow-md transition-all"
                    placeholder="Search name, email, mobile..."
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                  />
                </div>

                <button
                  onClick={reloadCandidates}
                  className="p-2.5 border border-gray-300 hover:bg-blue-50 hover:border-blue-300 rounded-full shadow-sm transition-all hover:shadow-md"
                  title="Refresh"
                >
                  <RefreshCw size={18} className="text-gray-600" />
                </button>

                <button
                  onClick={handleExport}
                  className="p-2.5 border border-gray-300 hover:bg-blue-50 hover:border-blue-300 rounded-full shadow-sm transition-all hover:shadow-md"
                  title="Export to Excel"
                >
                  <Download size={18} className="text-gray-600" />
                </button>
              </div>
            </div>

            {/* Filter summary */}
            {filterSummary && (
              <div className="mt-4 bg-gradient-to-r from-blue-50 to-indigo-50 border-l-4 border-blue-500 p-4 rounded-r-lg flex items-center justify-between">
                <div className="text-sm text-blue-800 font-medium flex items-center gap-2">
                  <Filter size={16} />
                  {filterSummary}
                </div>
                <button
                  onClick={clearFilters}
                  className="text-blue-600 hover:text-blue-800 text-sm font-semibold hover:underline"
                >
                  Clear Filter ×
                </button>
              </div>
            )}
          </div>

          {/* Table Area */}
          <div className="flex-1 flex flex-col min-h-0 px-6 pb-6 overflow-hidden">
              <div className="flex-1 overflow-auto border border-gray-200 rounded-xl bg-white shadow-lg">
                {loading ? (
                  <div className="flex items-center justify-center h-64 text-gray-500">
                    <div className="flex flex-col items-center gap-3">
                      <div className="animate-spin h-8 w-8 border-4 border-blue-500 border-t-transparent rounded-full"></div>
                      <span className="font-medium">Loading placement ready candidates...</span>
                    </div>
                  </div>
                ) : (
                  <PlacementReadyTable
                      rows={candidates}
                      selectedIds={selectedIds}
                      onSelectionChange={setSelectedIds}
                      onEdit={openEditModal}
                      onStatusChange={(id, status) => {
                          reloadCandidates()
                      }}
                      onDelete={(id) => {
                          if (window.confirm('Delete this candidate?')) {
                          // single delete logic (similar to bulk)
                          xFetch({
                              path: '/services/job/deleteCandidate',
                              method: 'POST',
                              payload: { candidateId: id }
                          }).then(() => {
                              toast.success('Candidate deleted')
                              reloadCandidates()
                          }).catch(() => toast.error('Delete failed'))
                      }
                      }}
                      corporateId={corporateId}
                  />
                )}
              </div>

              {/* Pagination + Rows per page dropdown - Modern Style with Blue Theme */}
              {!loading && total > 0 && (
                <div className="mt-4 flex flex-col sm:flex-row justify-between items-center gap-4 text-sm text-gray-600 bg-white rounded-xl shadow-sm border border-gray-200 px-6 py-4">
                  <div className="flex items-center gap-3">
                    <span className="font-medium">
                      Showing <strong className="text-blue-600">{(page - 1) * limit + 1}</strong>–
                      <strong className="text-blue-600">{Math.min(page * limit, total)}</strong> of <strong className="text-blue-600">{total.toLocaleString()}</strong>
                    </span>

                    <select
                      value={limit}
                      onChange={(e) => {
                        setLimit(Number(e.target.value))
                        setPage(1) // reset to first page
                      }}
                      className="border border-gray-300 rounded-full px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white font-medium"
                    >
                      <option value={10}>10</option>
                      <option value={25}>25</option>
                      <option value={50}>50</option>
                    </select>

                    <span className="font-medium">per page</span>
                  </div>

                  {/* Page navigation */}
                  <div className="flex items-center gap-2">
                    <button
                      disabled={page === 1}
                      onClick={() => setPage(p => Math.max(1, p - 1))}
                      className="px-4 py-2 border border-gray-300 rounded-full hover:bg-blue-50 hover:border-blue-300 disabled:opacity-40 transition-all font-semibold hover:shadow-md"
                    >
                      Previous
                    </button>

                    {Array.from({ length: Math.min(totalPages, 10) }, (_, i) => {
                      const pageNum = i + 1
                      return (
                        <button
                          key={pageNum}
                          onClick={() => setPage(pageNum)}
                          className={`px-4 py-2 rounded-full min-w-[40px] transition-all font-bold ${
                            page === pageNum
                              ? 'bg-gradient-to-r from-blue-600 to-indigo-600 text-white shadow-lg scale-110'
                              : 'border border-gray-300 hover:bg-blue-50 hover:border-blue-300 hover:shadow-md'
                          }`}
                        >
                          {pageNum}
                        </button>
                      )
                    })}

                    {totalPages > 10 && (
                      <>
                        <span className="px-2 text-gray-400">...</span>
                        <button
                          onClick={() => setPage(totalPages)}
                          className={`px-4 py-2 rounded-full min-w-[40px] transition-all font-bold ${
                            page === totalPages
                              ? 'bg-gradient-to-r from-blue-600 to-indigo-600 text-white shadow-lg scale-110'
                              : 'border border-gray-300 hover:bg-blue-50 hover:border-blue-300 hover:shadow-md'
                          }`}
                        >
                          {totalPages}
                        </button>
                      </>
                    )}

                    <button
                      disabled={page >= totalPages}
                      onClick={() => setPage(p => p + 1)}
                      className="px-4 py-2 border border-gray-300 rounded-full hover:bg-blue-50 hover:border-blue-300 disabled:opacity-40 transition-all font-semibold hover:shadow-md"
                    >
                      Next
                    </button>
                  </div>
                </div>
              )}
          </div>
        </>
        )}

        {isModalOpen && (
        <CandidateFormModal
            isOpen={isModalOpen}
            onClose={() => setIsModalOpen(false)}
            onSuccess={() => {
            reloadCandidates()
            setIsModalOpen(false)
            }}
            mode={modalMode}
            initialData={selectedCandidate}
            corporateId={corporateId}
        />
        )}

        {isBatchRemarksOpen && (
          <BatchRemarksModal
            isOpen={isBatchRemarksOpen}
            onClose={() => setIsBatchRemarksOpen(false)}
            onSuccess={() => {
              reloadCandidates()
              setSelectedIds([])
            }}
            selectedCandidates={candidates
              .filter((c) => selectedIds.includes(c.id))
              .map((c) => ({
                candidateId: c.candidateId,
                name: c.name,
                mobile: c.mobile,
                email: c.email,
              }))}
          />
        )}

        {/* Filter Modal */}
        {showFilterModal && (
            <FilterModal
            isOpen={showFilterModal}
            onClose={() => setShowFilterModal(false)}
            options={filterOptions}
            onApply={applyFilters}
            currentFilters={filters}
            onReset={clearFilters}
        />
        )}
    </div>
  )
}
