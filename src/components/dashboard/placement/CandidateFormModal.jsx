'use client'

import { useEffect, useState } from 'react'
import { AlertTriangle, PencilLine } from 'lucide-react'
import { xFetch } from '@/utility/xFetch'
import { toast } from 'react-toastify'

export default function CandidateFormModal({
  isOpen,
  onClose,
  onSuccess,
  mode,
  initialData = {},
  corporateId,
}) {
  const getJobTagValue = (tag) => String(
    tag?.value ??
    tag?.id ??
    tag?.jobTagId ??
    tag?.tagId ??
    tag ?? ''
  ).trim()

  const getJobTagLabel = (tag) => String(
    tag?.text ??
    tag?.jobProfileTag ??
    tag?.name ??
    tag?.jobTag ??
    tag?.job_tag ??
    tag?.tagName ??
    tag ?? ''
  ).trim()

  const normalizeMultiValue = (value) => {
    if (Array.isArray(value)) return value.map((item) => String(item).trim()).filter(Boolean)
    if (typeof value === 'string' && value.trim()) return value.split(',').map((item) => item.trim()).filter(Boolean)
    return []
  }

  const normalizeSelectedJobTags = (value, options = []) => {
    const incomingTags = normalizeMultiValue(value)
    if (incomingTags.length < 1) return []

    const optionEntries = options.map((tag) => ({
      value: getJobTagValue(tag),
      label: getJobTagLabel(tag),
    }))

    const optionValues = new Set(optionEntries.map((tag) => tag.value))
    const optionLabels = new Map(
      optionEntries.map((tag) => [tag.label.toLowerCase(), tag.value])
    )

    return [...new Set(
      incomingTags
        .map((tag) => {
          if (optionValues.has(tag)) return tag
          return optionLabels.get(tag.toLowerCase()) || ''
        })
        .filter(Boolean)
    )]
  }

  const [formData, setFormData] = useState({
    candidateName: '',
    candidateEmail: '',
    candidateMobile: '',
    qualification: '',
    currentCity: '',
    candidateCourse: '',
    courseStartDate: '',
    courseEndDate: '',
    jobStatus: '',
    totalExperience: '',
    relevantExperience: '',
    lastOrganizationName: '',
    expectedJobType: [],
    jobTags: [],
    expectedLocationPreference: [],
    lastDesignation: '',
    expectedDesignation: '',
    lastCTC: '',
    expectedCTC: '',
    remarks: '',
    associatedCenters: '',
    receiveJobOpportunities: 'Yes',
    candidateFile: null,
  })

  const [jobTagsOptions, setJobTagsOptions] = useState([])
  const [locationsOptions, setLocationsOptions] = useState([])
  const [loadingOptions, setLoadingOptions] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [associatedCentersOptions, setAssociatedCentersOptions] = useState([])
  const [sensitiveEditEnabled, setSensitiveEditEnabled] = useState(false)
  const [showSensitiveEditWarning, setShowSensitiveEditWarning] = useState(false)
  const [showSensitiveUpdateWarning, setShowSensitiveUpdateWarning] = useState(false)

  const closeModal = () => {
    setSensitiveEditEnabled(false)
    setShowSensitiveEditWarning(false)
    setShowSensitiveUpdateWarning(false)
    onClose?.()
  }

  const hasSensitiveChanges = () => {
    if (mode !== 'edit') return false

    const sensitivePairs = [
      ['candidateName', initialData.name],
      ['candidateEmail', initialData.email],
      ['candidateMobile', initialData.mobile],
    ]

    return sensitivePairs.some(([field, originalValue]) => {
      const currentValue = String(formData[field] ?? '').trim()
      const initialValue = String(originalValue ?? '').trim()
      return currentValue !== initialValue
    })
  }

  const submitCandidateUpdate = async ({ showToast = true } = {}) => {
    const payload = new FormData()

    Object.entries(formData).forEach(([key, val]) => {
      if (key === 'candidateFile') {
        if (val) {
          payload.append('candidateFile', val)
        }
      } else if (Array.isArray(val)) {
        val.forEach((v) => payload.append(`${key}[]`, v))
      } else if (val !== null && val !== undefined && val !== '') {
        payload.append(key, String(val))
      }
    })

    if (mode === 'edit' && initialData.candidateId) {
      payload.append('candidateId', String(initialData.candidateId))
    }

    console.log('Sending FormData:')
    for (const [k, v] of payload.entries()) {
      console.log(k, v instanceof File ? `[File: ${v.name}]` : v)
    }

    await xFetch({
      path: '/services/job/addCandidate',
      method: 'POST',
      payload,
      isFormData: true,
    })

    if (showToast) {
      toast.success(mode === 'add' ? 'Added!' : 'Updated!')
    }
  }

  const submitPlacementReadyUpdate = async () => {
    setSubmitting(true)
    try {
      await submitCandidateUpdate({ showToast: false })

      toast.success(mode === 'add' ? 'Added!' : 'Updated!')

      onSuccess?.()
      closeModal()
    } catch (err) {
      console.error('Submit error:', err)
      toast.error('Save failed - check console')
    } finally {
      setSubmitting(false)
    }
  }

  useEffect(() => {
    if (!isOpen) return

    const fetchOptions = async () => {
      setLoadingOptions(true)
      try {
        const tagsRes = await xFetch({
          path: '/services/job/getJobTags',
          payload: { corporateId },
        })
        setJobTagsOptions(Array.isArray(tagsRes) ? tagsRes : tagsRes?.rows || tagsRes?.data || [])

        const locRes = await xFetch({ path: '/services/job/getCities' })
        setLocationsOptions(Array.isArray(locRes) ? locRes : locRes?.rows || locRes?.data || [])

        const centerRes = await xFetch({
          path: '/services/profile/getAssociatedCenters',
        })

        setAssociatedCentersOptions(
          Array.isArray(centerRes)
            ? centerRes
            : centerRes?.rows || centerRes?.data || []
        )
      } catch (err) {
        toast.error('Failed to load dropdown options')
      } finally {
        setLoadingOptions(false)
      }
    }

    fetchOptions()
  }, [isOpen, corporateId])

  useEffect(() => {
    if (!isOpen) return

    const formatDate = (dateStr) => {
      if (!dateStr) return ''
      try {
        const [day, month, year] = dateStr.split(' ')
        const monthNum = new Date(Date.parse(`${month} 1, 2020`)).getMonth() + 1
        return `${year}-${String(monthNum).padStart(2, '0')}-${day.padStart(2, '0')}`
      } catch {
        return ''
      }
    }

    if (mode === 'add') {
      setFormData({
        candidateName: '',
        candidateEmail: '',
        candidateMobile: '',
        qualification: '',
        currentCity: '',
        candidateCourse: '',
        courseStartDate: '',
        courseEndDate: '',
        jobStatus: '',
        totalExperience: '',
        relevantExperience: '',
        lastOrganizationName: '',
        expectedJobType: [],
        jobTags: [],
        expectedLocationPreference: [],
        associatedCenters: '',
        lastDesignation: '',
        expectedDesignation: '',
        lastCTC: '',
        expectedCTC: '',
        remarks: '',
        receiveJobOpportunities: 'Yes',
        candidateFile: null,
      })
      return
    }

    setFormData({
      candidateName: initialData.name || '',
      candidateEmail: initialData.email || '',
      candidateMobile: initialData.mobile || '',
      qualification: initialData.qualification || '',
      currentCity: initialData.currentCity || '',
      candidateCourse: initialData.course || '',
      courseStartDate: formatDate(initialData.courseStartDate) || '',
      courseEndDate: formatDate(initialData.courseEndDate) || '',
      jobStatus: initialData.jobStatus || '',
      totalExperience: initialData.totalExperience || '',
      relevantExperience: initialData.relevantExperience || '',
      lastOrganizationName: initialData.lastOrganizationName || '',
      expectedJobType: normalizeMultiValue(initialData.expectedJobType),
      jobTags: normalizeSelectedJobTags(
        initialData.jobTagIds?.length ? initialData.jobTagIds : initialData.jobTags,
        jobTagsOptions
      ),
      expectedLocationPreference: normalizeMultiValue(initialData.expectedLocationPreference),
      lastDesignation: initialData.lastDesignation || '',
      expectedDesignation: initialData.expectedDesignation || '',
      lastCTC: initialData.lastCTC || '',
      expectedCTC: initialData.expectedCTC || '',
      remarks: initialData.remarks || '',
      receiveJobOpportunities: initialData.receiveJobOpportunities || 'Yes',
      candidateFile: null,
      associatedCenters: initialData.associatedCenters || '',
    })
  }, [isOpen, mode, initialData, jobTagsOptions])

  useEffect(() => {
    if (!isOpen) {
      setSensitiveEditEnabled(false)
      setShowSensitiveEditWarning(false)
      setShowSensitiveUpdateWarning(false)
      return
    }

    setSensitiveEditEnabled(false)
    setShowSensitiveEditWarning(false)
    setShowSensitiveUpdateWarning(false)
  }, [isOpen, mode, initialData?.candidateId])

  const handleChange = (e) => {
    const { name, value, type, files, multiple } = e.target

    if (type === 'file') {
      setFormData((prev) => ({ ...prev, candidateFile: files?.[0] || null }))
      return
    }

    if (multiple) {
      const selectedValues = Array.from(e.target.selectedOptions).map((option) => option.value)
      setFormData((prev) => ({ ...prev, [name]: selectedValues }))
      return
    }

    setFormData((prev) => ({ ...prev, [name]: value }))
  }

  const handleSubmit = async (e) => {
    e.preventDefault()

    if (mode === 'edit' && sensitiveEditEnabled && hasSensitiveChanges()) {
      setShowSensitiveUpdateWarning(true)
      return
    }

    await submitPlacementReadyUpdate()
  }

  if (!isOpen) return null

  const sensitiveFieldsLocked = mode === 'edit' && !sensitiveEditEnabled

  return (
    <div className="fixed inset-0 bg-black bg-opacity-60 flex items-center justify-center z-50 overflow-y-auto p-4">
      <div className="bg-white rounded-lg shadow-2xl w-full max-w-5xl max-h-[92vh] flex flex-col">
        <div className="bg-blue-600 text-white px-6 py-4 flex items-center justify-between sticky top-0 z-10 shadow-md">
          <h2 className="text-xl font-semibold">
            {mode === 'add' ? 'Add Candidate Details' : 'Update Candidate Details'}
          </h2>
          <button
            onClick={closeModal}
            className="text-white hover:text-gray-200 text-3xl leading-none"
          >
            ×
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-6">
          <form onSubmit={handleSubmit} className="space-y-8">
            <div className="bg-gray-50 border border-gray-200 rounded-lg p-6">
              <h3 className="text-lg font-bold text-gray-800 mb-5 uppercase tracking-wide">
                CANDIDATE DETAILS
              </h3>

              {mode === 'edit' && (
                <div className="mb-5 flex flex-col gap-3 rounded-lg border border-amber-200 bg-amber-50 px-4 py-4 md:flex-row md:items-center md:justify-between">
                  <div>
                    <div className="flex items-center gap-2 font-semibold text-amber-900">
                      <AlertTriangle size={18} />
                      Sensitive fields are locked
                    </div>
                    <p className="mt-1 text-sm text-amber-800">
                      Name, email, and mobile are used across payment and batch management.
                    </p>
                  </div>

                  <button
                    type="button"
                    onClick={() => setShowSensitiveEditWarning(true)}
                    disabled={sensitiveEditEnabled}
                    className={`inline-flex items-center justify-center gap-2 rounded-md px-4 py-2 text-sm font-semibold transition-colors ${
                      sensitiveEditEnabled
                        ? 'cursor-default bg-emerald-100 text-emerald-800'
                        : 'bg-amber-600 text-white hover:bg-amber-700'
                    }`}
                  >
                    <PencilLine size={16} />
                    {sensitiveEditEnabled ? 'Sensitive Editing Enabled' : 'Edit Sensitive Details'}
                  </button>
                </div>
              )}

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Candidate Name <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    name="candidateName"
                    value={formData.candidateName}
                    onChange={handleChange}
                    disabled={sensitiveFieldsLocked}
                    title={sensitiveFieldsLocked ? 'Click Edit Sensitive Details to enable this field' : ''}
                    className={`w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${
                      sensitiveFieldsLocked ? 'cursor-not-allowed bg-gray-100 text-gray-500' : ''
                    }`}
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Mobile <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="tel"
                    name="candidateMobile"
                    value={formData.candidateMobile}
                    onChange={handleChange}
                    disabled={sensitiveFieldsLocked}
                    title={sensitiveFieldsLocked ? 'Click Edit Sensitive Details to enable this field' : ''}
                    className={`w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${
                      sensitiveFieldsLocked ? 'cursor-not-allowed bg-gray-100 text-gray-500' : ''
                    }`}
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Email ID <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="email"
                    name="candidateEmail"
                    value={formData.candidateEmail}
                    onChange={handleChange}
                    disabled={sensitiveFieldsLocked}
                    title={sensitiveFieldsLocked ? 'Click Edit Sensitive Details to enable this field' : ''}
                    className={`w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${
                      sensitiveFieldsLocked ? 'cursor-not-allowed bg-gray-100 text-gray-500' : ''
                    }`}
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Location</label>
                  <input
                    type="text"
                    name="currentCity"
                    value={formData.currentCity}
                    onChange={handleChange}
                    className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Qualification</label>
                  <input
                    type="text"
                    name="qualification"
                    value={formData.qualification}
                    onChange={handleChange}
                    className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Course</label>
                  <input
                    type="text"
                    name="candidateCourse"
                    value={formData.candidateCourse}
                    onChange={handleChange}
                    className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Course Start Date</label>
                  <input
                    type="date"
                    name="courseStartDate"
                    value={formData.courseStartDate}
                    onChange={handleChange}
                    className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Course End Date</label>
                  <input
                    type="date"
                    name="courseEndDate"
                    value={formData.courseEndDate}
                    onChange={handleChange}
                    className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  />
                </div>
              </div>
            </div>

            <div className="bg-gray-50 border border-gray-200 rounded-lg p-6">
              <h3 className="text-lg font-bold text-gray-800 mb-5 uppercase tracking-wide">
                JOB / PLACEMENT UPDATE
              </h3>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Job Status</label>
                  <select
                    name="jobStatus"
                    value={formData.jobStatus}
                    onChange={handleChange}
                    className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  >
                    <option value="">-- Select --</option>
                    <option value="Fresher">Fresher</option>
                    <option value="Experienced">Experienced</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Receive Job Opportunities?</label>
                  <select
                    name="receiveJobOpportunities"
                    value={formData.receiveJobOpportunities}
                    onChange={handleChange}
                    className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  >
                    <option value="Yes">Yes</option>
                    <option value="No">No</option>
                  </select>
                </div>

                <div className="col-span-2 grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Total Experience (Years)</label>
                    <input
                      type="number"
                      name="totalExperience"
                      value={formData.totalExperience}
                      onChange={handleChange}
                      min="0"
                      step="0.1"
                      className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Functional Experience (Years)</label>
                    <input
                      type="number"
                      name="relevantExperience"
                      value={formData.relevantExperience}
                      onChange={handleChange}
                      min="0"
                      step="0.1"
                      className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    />
                  </div>
                </div>

                <div className="col-span-2">
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Job Tags</label>
                    <select
                      name="jobTags"
                      multiple
                      value={formData.jobTags || []}
                      onChange={handleChange}
                      className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2 focus:ring-teal-500 focus:border-teal-500 h-32"
                    >
                      {jobTagsOptions.map((tag, index) => (
                        <option key={`${getJobTagValue(tag)}-${index}`} value={getJobTagValue(tag)}>
                          {getJobTagLabel(tag)}
                        </option>
                      ))}
                    </select>
                    <p className="text-xs text-gray-500 mt-1">Hold Ctrl/Cmd to select multiple</p>
                  </div>
                </div>

                <div className="col-span-2">
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Expected Location Preference</label>
                    <select
                      name="expectedLocationPreference"
                      multiple
                      value={formData.expectedLocationPreference || []}
                      onChange={handleChange}
                      className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2 focus:ring-teal-500 focus:border-teal-500 h-32"
                    >
                      {locationsOptions.map((loc) => (
                        <option key={loc.value} value={loc.value}>
                          {loc.text}
                        </option>
                      ))}
                    </select>
                    <p className="text-xs text-gray-500 mt-1">Hold Ctrl/Cmd to select multiple</p>
                  </div>
                </div>

                <div className="col-span-2">
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Associated Centers</label>
                    <select
                      name="associatedCenters"
                      value={formData.associatedCenters || ''}
                      onChange={handleChange}
                      className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2 focus:ring-teal-500 focus:border-teal-500"
                    >
                      <option value="">-- Select Associated Center --</option>
                      {associatedCentersOptions.map((center) => (
                        <option
                          key={center.id}
                          value={center.associatedCenter}
                        >
                          {center.associatedCenter}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Last Organization Name</label>
                  <input
                    type="text"
                    name="lastOrganizationName"
                    value={formData.lastOrganizationName}
                    onChange={handleChange}
                    className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Expected Job Type</label>
                  <select
                    name="expectedJobType"
                    multiple
                    value={formData.expectedJobType || []}
                    onChange={handleChange}
                    className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500 h-32"
                  >
                    <option value="Full Time">Full Time</option>
                    <option value="Part Time">Part Time</option>
                    <option value="Internship">Internship</option>
                    <option value="Contract">Contract</option>
                    <option value="Contract to Hire">Contract to Hire</option>
                    <option value="Work From Home">Work From Home</option>
                  </select>
                  <p className="text-xs text-gray-500 mt-1">Hold Ctrl/Cmd to select multiple</p>
                </div>

                <div className="col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-1">Remarks</label>
                  <textarea
                    name="remarks"
                    value={formData.remarks}
                    onChange={handleChange}
                    rows={4}
                    className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  />
                </div>

                <div className="col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-1">Upload Resume</label>
                  <input
                    type="file"
                    name="candidateFile"
                    accept=".pdf,.doc,.docx"
                    onChange={handleChange}
                    className="block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100"
                  />
                  {formData.candidateFile && (
                    <p className="mt-2 text-sm text-gray-600">
                      Selected: {formData.candidateFile.name}
                    </p>
                  )}
                </div>
              </div>
            </div>

            <div className="flex justify-end gap-4 pt-6 border-t">
              <button
                type="button"
                onClick={closeModal}
                disabled={submitting}
                className="px-8 py-2.5 bg-gray-300 hover:bg-gray-400 text-gray-800 font-medium rounded-md transition-colors disabled:opacity-50"
              >
                Cancel
              </button>

              <button
                type="submit"
                disabled={submitting || loadingOptions}
                className="px-8 py-2.5 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-md transition-colors disabled:opacity-50 flex items-center gap-2"
              >
                {submitting && (
                  <div className="animate-spin h-5 w-5 border-2 border-white border-t-transparent rounded-full" />
                )}
                {mode === 'add' ? 'Add Candidate' : 'Save Changes'}
              </button>
            </div>
          </form>
        </div>

        {showSensitiveEditWarning && (
          <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/60 p-4">
            <div className="w-full max-w-lg rounded-2xl bg-white shadow-2xl">
              <div className="flex items-start gap-3 rounded-t-2xl border-b border-amber-100 bg-amber-50 px-6 py-4">
                <div className="rounded-full bg-amber-100 p-2 text-amber-700">
                  <AlertTriangle size={20} />
                </div>
                <div className="flex-1">
                  <h4 className="text-lg font-semibold text-gray-900">Edit Sensitive Details</h4>
                  <p className="mt-1 text-sm text-gray-600">
                    Editing name, email, or mobile is not recommended.
                  </p>
                </div>
              </div>

              <div className="px-6 py-5">
                <p className="text-sm leading-6 text-gray-700">
                  These values affect payment and batch management. If you still want to continue, click proceed anyway.
                </p>
              </div>

              <div className="flex justify-end gap-3 border-t bg-gray-50 px-6 py-4">
                <button
                  type="button"
                  onClick={() => setShowSensitiveEditWarning(false)}
                  className="rounded-md border border-gray-300 px-4 py-2 text-sm font-semibold text-gray-700 hover:bg-gray-100"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setSensitiveEditEnabled(true)
                    setShowSensitiveEditWarning(false)
                  }}
                  className="rounded-md bg-amber-600 px-4 py-2 text-sm font-semibold text-white hover:bg-amber-700"
                >
                  Proceed anyway
                </button>
              </div>
            </div>
          </div>
        )}

        {showSensitiveUpdateWarning && (
          <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/60 p-4">
            <div className="w-full max-w-lg rounded-2xl bg-white shadow-2xl">
              <div className="flex items-start gap-3 rounded-t-2xl border-b border-red-100 bg-red-50 px-6 py-4">
                <div className="rounded-full bg-red-100 p-2 text-red-700">
                  <AlertTriangle size={20} />
                </div>
                <div className="flex-1">
                  <h4 className="text-lg font-semibold text-gray-900">Confirm Sensitive Update</h4>
                  <p className="mt-1 text-sm text-gray-600">
                    Changing this information will reflect on Payment page and batch management.
                  </p>
                </div>
              </div>

              <div className="px-6 py-5">
                <p className="text-sm leading-6 text-gray-700">
                  Please double-check the new values before continuing. You can cancel if you want to review them again.
                </p>
              </div>

              <div className="flex justify-end gap-3 border-t bg-gray-50 px-6 py-4">
                <button
                  type="button"
                  onClick={() => setShowSensitiveUpdateWarning(false)}
                  className="rounded-md border border-gray-300 px-4 py-2 text-sm font-semibold text-gray-700 hover:bg-gray-100"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  disabled={submitting}
                  onClick={() => {
                    setShowSensitiveUpdateWarning(false)
                    submitPlacementReadyUpdate()
                  }}
                  className="rounded-md bg-red-600 px-4 py-2 text-sm font-semibold text-white hover:bg-red-700 disabled:opacity-50"
                >
                  Update anyway
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
