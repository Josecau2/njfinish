import React, { useEffect, useMemo, useState } from 'react'
import {
  CBadge,
  CButton,
  CCard,
  CCardBody,
  CCardHeader,
  CCol,
  CContainer,
  CFormInput,
  CFormSelect,
  CFormTextarea,
  CModal,
  CModalBody,
  CModalHeader,
  CModalTitle,
  CRow,
  CSpinner,
  CTable,
  CTableBody,
  CTableDataCell,
  CTableHead,
  CTableHeaderCell,
  CTableRow,
} from '@coreui/react'
import { cilReload, cilSend, cilNotes, cilX } from '@coreui/icons'
import CIcon from '@coreui/icons-react'
import axiosInstance from '../../helpers/axiosInstance'
import PageHeader from '../../components/PageHeader'
import Swal from 'sweetalert2'
import { useTranslation } from 'react-i18next'

// Custom styles for enhanced modal appearance
const modalStyles = `
  .lead-details-modal .modal-content {
    border: none;
    border-radius: 16px;
    overflow: hidden;
    box-shadow: 0 20px 60px rgba(0, 0, 0, 0.15);
  }

  .lead-details-modal .modal-body {
    padding: 0;
  }

  .lead-details-modal .card {
    transition: all 0.2s ease;
  }

  .lead-details-modal .card:hover {
    transform: translateY(-1px);
    box-shadow: 0 4px 20px rgba(0, 0, 0, 0.08);
  }

  .lead-details-modal .badge {
    font-weight: 500;
    letter-spacing: 0.025em;
  }

  .lead-details-modal .form-control {
    border: 2px solid #e9ecef;
    transition: all 0.2s ease;
  }

  .lead-details-modal .form-control:focus {
    border-color: var(--cui-primary);
    box-shadow: 0 0 0 0.2rem rgba(13, 110, 253, 0.15);
  }

  .lead-details-modal .btn {
    font-weight: 500;
    letter-spacing: 0.025em;
    transition: all 0.2s ease;
  }

  .lead-details-modal .btn:hover {
    transform: translateY(-1px);
  }

  /* Ensure SweetAlert overlays above CoreUI modal/backdrop */
  .swal2-container {
    z-index: 200000 !important;
  }
  .swal2-container.swal2-backdrop-show,
  .swal2-container.swal2-shown {
    z-index: 200000 !important;
  }
`

const STATUS_VALUES = ['all', 'new', 'reviewing', 'contacted', 'closed']
const statusBadgeColor = {
  new: 'primary',
  reviewing: 'info',
  contacted: 'success',
  closed: 'secondary',
}

const formatSubmittedDate = (value) => {
  if (!value) return null
  try {
    const date = new Date(value)
    if (Number.isNaN(date.getTime())) return null
    return date.toLocaleString()
  } catch {
    return null
  }
}

// --- Metadata normalization helpers (frontend safety) ---
const safeParseJson = (value) => {
  if (!value) return null
  if (typeof value === 'object') return value
  try {
    return JSON.parse(value)
  } catch {
    return null
  }
}

const normalizeMetadata = (metadata) => {
  const m = safeParseJson(metadata) || {}
  if (!Array.isArray(m.notes)) m.notes = []
  return m
}

const normalizeLead = (lead) => {
  if (!lead) return lead
  return {
    ...lead,
    metadata: normalizeMetadata(lead.metadata),
  }
}

const getLeadValue = (lead, key) => {
  if (!lead) return ''
  if (lead[key]) return lead[key]
  const contact = lead.metadata?.contact
  if (contact && contact[key]) return contact[key]
  return ''
}

const getLeadFullName = (lead) => {
  if (!lead) return ''
  const first = getLeadValue(lead, 'firstName')
  const last = getLeadValue(lead, 'lastName')
  const combined = [first, last].filter(Boolean).join(' ').trim()
  return combined || lead.name || ''
}

const getLeadLocation = (lead) => {
  const city = getLeadValue(lead, 'city')
  const state = getLeadValue(lead, 'state')
  const zip = getLeadValue(lead, 'zip')
  return [city, state, zip].filter(Boolean).join(', ')
}

const getStatusBadgeVariant = (status) => {
  switch ((status || '').toLowerCase()) {
    case 'new':
      return 'success' // Changed from 'light' to 'success' for better contrast
    case 'reviewing':
      return 'info'
    case 'contacted':
      return 'success'
    case 'closed':
      return 'secondary'
    default:
      return 'secondary' // Changed from 'light' to 'secondary' for better contrast
  }
}

const LeadsPage = () => {
  const { t } = useTranslation()
  const [leads, setLeads] = useState([])
  const [loading, setLoading] = useState(true)
  const [statusFilter, setStatusFilter] = useState('all')
  const [searchTerm, setSearchTerm] = useState('')
  const [selectedLead, setSelectedLead] = useState(null)
  const [noteText, setNoteText] = useState('')
  const [savingNote, setSavingNote] = useState(false)
  const [updatingStatusId, setUpdatingStatusId] = useState(null)

  const statusOptions = useMemo(
    () =>
      STATUS_VALUES.map((value) => ({
        value,
        label:
          value === 'all'
            ? t('leadsPage.filters.status.options.all')
            : t(`leadsPage.status.${value}`),
      })),
    [t],
  )

  const statusLabelMap = useMemo(() => {
    const map = Object.fromEntries(statusOptions.map((option) => [option.value, option.label]))
    map.unknown = t('leadsPage.status.unknown')
    return map
  }, [statusOptions, t])

  const statusUpdateOptions = useMemo(
    () => statusOptions.filter((option) => option.value !== 'all'),
    [statusOptions],
  )

  const selectedLeadSubmittedAt = selectedLead ? formatSubmittedDate(selectedLead.createdAt) : null
  const selectedLeadStatusText = selectedLead
    ? (statusLabelMap[selectedLead.status] ?? statusLabelMap.unknown)
    : statusLabelMap.unknown
  const selectedLeadStatusBadge = selectedLead
    ? {
        text: selectedLeadStatusText,
        variant: getStatusBadgeVariant(selectedLead.status),
      }
    : null
  const selectedLeadSubmittedText = selectedLeadSubmittedAt
    ? t('leadsPage.modal.status.submittedAt', { date: selectedLeadSubmittedAt })
    : t('leadsPage.modal.status.submittedUnknown')

  const selectedLeadFullName = selectedLead ? getLeadFullName(selectedLead) : ''
  const selectedLeadFirstName = selectedLead ? getLeadValue(selectedLead, 'firstName') : ''
  const selectedLeadLastName = selectedLead ? getLeadValue(selectedLead, 'lastName') : ''
  const selectedLeadPhone = selectedLead ? getLeadValue(selectedLead, 'phone') : ''
  const selectedLeadCity = selectedLead ? getLeadValue(selectedLead, 'city') : ''
  const selectedLeadState = selectedLead ? getLeadValue(selectedLead, 'state') : ''
  const selectedLeadZip = selectedLead ? getLeadValue(selectedLead, 'zip') : ''
  const selectedLeadDisplayName = selectedLeadFullName || (selectedLead ? selectedLead.name : '')

  const fetchLeads = async (opts = {}) => {
    const { status = statusFilter, search = searchTerm } = opts
    setLoading(true)
    try {
      const params = {}
      if (status && status !== 'all') params.status = status
      if (search) params.search = search
      const res = await axiosInstance.get('/api/admin/leads', { params })
      const incoming = Array.isArray(res.data?.leads) ? res.data.leads : []
      setLeads(incoming.map(normalizeLead))
    } catch (err) {
      console.error('Failed to fetch leads:', err)
      Swal.fire(t('common.error'), t('leadsPage.alerts.fetchError'), 'error')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchLeads()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  useEffect(() => {
    fetchLeads({ status: statusFilter, search: searchTerm })
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [statusFilter])

  const filteredLeads = useMemo(() => {
    if (!searchTerm) return leads
    const term = searchTerm.toLowerCase()
    return leads.filter((lead) => {
      const haystack = [
        getLeadFullName(lead),
        lead.name,
        lead.email,
        lead.company,
        getLeadValue(lead, 'phone'),
        getLeadValue(lead, 'city'),
        getLeadValue(lead, 'state'),
        getLeadValue(lead, 'zip'),
      ]
      return haystack.filter(Boolean).some((value) => String(value).toLowerCase().includes(term))
    })
  }, [leads, searchTerm])

  const handleStatusChange = async (lead, nextStatus) => {
    setUpdatingStatusId(lead.id)
    try {
      await axiosInstance.patch(`/api/admin/leads/${lead.id}`, { status: nextStatus })
      await fetchLeads()
      Swal.fire(t('common.success'), t('leadsPage.alerts.statusUpdated'), 'success')
    } catch (err) {
      console.error('Failed to update lead status:', err)
      Swal.fire(t('common.error'), t('leadsPage.alerts.statusUpdateFailed'), 'error')
    } finally {
      setUpdatingStatusId(null)
    }
  }

  const handleNoteSubmit = async () => {
    if (!selectedLead) return
    const note = noteText.trim()
    if (!note) return
    setSavingNote(true)
    try {
      let patchResponse
      try {
        patchResponse = await axiosInstance.put(`/api/admin/leads/${selectedLead.id}`, {
          adminNote: note,
        })
      } catch (putErr) {
        const status = putErr?.response?.status
        // Fallback to PATCH if PUT is not available (404/405 on older backend)
        if (status === 404 || status === 405) {
          patchResponse = await axiosInstance.patch(`/api/admin/leads/${selectedLead.id}`, {
            adminNote: note,
          })
        } else {
          throw putErr
        }
      }
      let updatedLeadFromServer = normalizeLead(patchResponse.data.lead)

      // Ensure the new note is visible immediately (optimistic safety)
      if (updatedLeadFromServer && updatedLeadFromServer.id === selectedLead.id) {
        const now = new Date().toISOString()
        const ensuredMeta = normalizeMetadata(updatedLeadFromServer.metadata)
        const hasNewNote =
          ensuredMeta.notes && ensuredMeta.notes.length > 0 && ensuredMeta.notes[0]?.note === note
        if (!hasNewNote) {
          ensuredMeta.notes = [
            { note, at: now, byName: selectedLead?.currentUserName || 'Admin' },
            ...ensuredMeta.notes,
          ]
        }
        updatedLeadFromServer = { ...updatedLeadFromServer, metadata: ensuredMeta }
      }

      // Update the leads array with the new data
      setLeads((prevLeads) =>
        prevLeads.map((lead) => (lead.id === selectedLead.id ? updatedLeadFromServer : lead)),
      )

      // Update the selected lead with the server response
      setSelectedLead(updatedLeadFromServer)
      setNoteText('')
      Swal.fire({
        title: t('common.success'),
        text: t('leadsPage.alerts.noteSaved'),
        icon: 'success',
        zIndex: 9999,
      })
    } catch (err) {
      console.error('Failed to add note:', err)
      Swal.fire({
        title: t('common.error'),
        text: t('leadsPage.alerts.noteSaveFailed'),
        icon: 'error',
        zIndex: 9999,
      })
    } finally {
      setSavingNote(false)
    }
  }

  const closeModal = () => {
    setSelectedLead(null)
    setNoteText('')
  }

  return (
    <>
      <style>{modalStyles}</style>
      <CContainer fluid className="py-4">
        <CRow className="mb-3 align-items-end">
          <CCol md={3} sm={6} className="mb-2">
            <CFormSelect
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              label={t('leadsPage.filters.status.label')}
            >
              {statusOptions.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </CFormSelect>
          </CCol>
          <CCol md={5} sm={6} className="mb-2">
            <CFormInput
              type="search"
              placeholder={t('leadsPage.filters.searchPlaceholder')}
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </CCol>
          <CCol md={2} sm={3} className="mb-2">
            <CButton
              color="primary"
              className="w-100"
              onClick={() => fetchLeads({ status: statusFilter, search: searchTerm })}
              disabled={loading}
            >
              <CIcon icon={cilReload} className="me-2" /> {t('common.refresh')}
            </CButton>
          </CCol>
        </CRow>

        <CCard className="border-0 shadow-sm">
          <CCardHeader>
            <h5 className="mb-0">{t('leadsPage.title')}</h5>
          </CCardHeader>
          <CCardBody>
            {loading ? (
              <div className="text-center py-5">
                <CSpinner color="primary" />
              </div>
            ) : filteredLeads.length === 0 ? (
              <p className="text-muted mb-0">{t('leadsPage.table.noResults')}</p>
            ) : (
              <CTable responsive hover align="middle">
                <CTableHead>
                  <CTableRow>
                    <CTableHeaderCell scope="col">
                      {t('leadsPage.table.columns.name')}
                    </CTableHeaderCell>
                    <CTableHeaderCell scope="col">
                      {t('leadsPage.table.columns.email')}
                    </CTableHeaderCell>
                    <CTableHeaderCell scope="col">
                      {t('leadsPage.table.columns.phone')}
                    </CTableHeaderCell>
                    <CTableHeaderCell scope="col">
                      {t('leadsPage.table.columns.location')}
                    </CTableHeaderCell>
                    <CTableHeaderCell scope="col">
                      {t('leadsPage.table.columns.company')}
                    </CTableHeaderCell>
                    <CTableHeaderCell scope="col">
                      {t('leadsPage.table.columns.submitted')}
                    </CTableHeaderCell>
                    <CTableHeaderCell scope="col">
                      {t('leadsPage.table.columns.status')}
                    </CTableHeaderCell>
                    <CTableHeaderCell scope="col" className="text-end">
                      {t('leadsPage.table.columns.actions')}
                    </CTableHeaderCell>
                  </CTableRow>
                </CTableHead>
                <CTableBody>
                  {filteredLeads.map((lead) => {
                    const displayName = getLeadFullName(lead) || lead.name || '—'
                    const phone = getLeadValue(lead, 'phone') || '—'
                    const location = getLeadLocation(lead) || '—'
                    const company = lead.company || '—'
                    const submittedAt = lead.createdAt
                      ? new Date(lead.createdAt).toLocaleString()
                      : '—'
                    return (
                      <CTableRow key={lead.id}>
                        <CTableDataCell>{displayName}</CTableDataCell>
                        <CTableDataCell>{lead.email}</CTableDataCell>
                        <CTableDataCell>{phone}</CTableDataCell>
                        <CTableDataCell>{location}</CTableDataCell>
                        <CTableDataCell>{company}</CTableDataCell>
                        <CTableDataCell>{submittedAt}</CTableDataCell>
                        <CTableDataCell>
                          <CFormSelect
                            size="sm"
                            value={lead.status}
                            onChange={(e) => handleStatusChange(lead, e.target.value)}
                            disabled={updatingStatusId === lead.id}
                          >
                            {statusUpdateOptions.map((option) => (
                              <option key={option.value} value={option.value}>
                                {option.label}
                              </option>
                            ))}
                          </CFormSelect>
                        </CTableDataCell>
                        <CTableDataCell className="text-end">
                          <CButton
                            size="sm"
                            color="light"
                            className="me-2"
                            onClick={() => setSelectedLead(normalizeLead(lead))}
                          >
                            <CIcon icon={cilNotes} className="me-1" />{' '}
                            {t('leadsPage.table.actions.details')}
                          </CButton>
                        </CTableDataCell>
                      </CTableRow>
                    )
                  })}
                </CTableBody>
              </CTable>
            )}
          </CCardBody>
        </CCard>

        <CModal
          visible={!!selectedLead}
          onClose={closeModal}
          size="lg"
          alignment="top"
          className="lead-details-modal"
        >
          <CModalBody className="p-0">
            {selectedLead && (
              <>
                <PageHeader
                  title={t('leadsPage.modal.title')}
                  subtitle={
                    selectedLeadSubmittedAt ? `Submitted ${selectedLeadSubmittedAt}` : undefined
                  }
                  badge={selectedLeadStatusBadge}
                  mobileLayout="compact"
                  cardClassName="mb-0 rounded-0 rounded-top"
                  rightContent={
                    <CButton
                      color="light"
                      size="sm"
                      onClick={closeModal}
                      className="border-0 rounded-circle p-2"
                      style={{ width: '40px', height: '40px' }}
                    >
                      <CIcon icon={cilX} size="lg" />
                    </CButton>
                  }
                />

                <div className="p-4">
                  {/* Contact Information Card */}
                  <CCard className="border-0 shadow-sm mb-4 bg-light">
                    <CCardBody className="p-3">
                      <CRow>
                        <CCol md={6}>
                          <div className="mb-3 mb-md-0">
                            <h6 className="fw-bold text-primary mb-2 d-flex align-items-center">
                              <div
                                className="bg-primary bg-opacity-10 rounded-circle p-2 me-2"
                                style={{ width: '32px', height: '32px' }}
                              >
                                <CIcon icon={cilNotes} size="sm" className="text-primary" />
                              </div>
                              {t('leadsPage.modal.contact.heading')}
                            </h6>
                            <div className="ms-4">
                              <CRow className="gy-3">
                                <CCol md={12}>
                                  <small className="text-muted text-uppercase fw-semibold">
                                    {t('leadsPage.modal.contact.fullName')}
                                  </small>
                                  <div className="fw-semibold">
                                    {selectedLeadDisplayName || '—'}
                                  </div>
                                </CCol>
                                <CCol md={6}>
                                  <small className="text-muted text-uppercase fw-semibold">
                                    {t('leadsPage.modal.contact.firstName')}
                                  </small>
                                  <div className="fw-semibold">{selectedLeadFirstName || '—'}</div>
                                </CCol>
                                <CCol md={6}>
                                  <small className="text-muted text-uppercase fw-semibold">
                                    {t('leadsPage.modal.contact.lastName')}
                                  </small>
                                  <div className="fw-semibold">{selectedLeadLastName || '—'}</div>
                                </CCol>
                                <CCol md={6}>
                                  <small className="text-muted text-uppercase fw-semibold">
                                    {t('leadsPage.modal.contact.email')}
                                  </small>
                                  <div>
                                    {selectedLead?.email ? (
                                      <a
                                        href={'mailto:' + selectedLead.email}
                                        className="text-decoration-none"
                                      >
                                        {selectedLead.email}
                                      </a>
                                    ) : (
                                      '—'
                                    )}
                                  </div>
                                </CCol>
                                <CCol md={6}>
                                  <small className="text-muted text-uppercase fw-semibold">
                                    {t('leadsPage.modal.contact.phone')}
                                  </small>
                                  <div>
                                    {selectedLeadPhone ? (
                                      <a
                                        href={'tel:' + selectedLeadPhone}
                                        className="text-decoration-none"
                                      >
                                        {selectedLeadPhone}
                                      </a>
                                    ) : (
                                      '—'
                                    )}
                                  </div>
                                </CCol>
                                <CCol md={4}>
                                  <small className="text-muted text-uppercase fw-semibold">
                                    {t('leadsPage.modal.contact.city')}
                                  </small>
                                  <div className="fw-semibold">{selectedLeadCity || '—'}</div>
                                </CCol>
                                <CCol md={4}>
                                  <small className="text-muted text-uppercase fw-semibold">
                                    {t('leadsPage.modal.contact.state')}
                                  </small>
                                  <div className="fw-semibold">{selectedLeadState || '—'}</div>
                                </CCol>
                                <CCol md={4}>
                                  <small className="text-muted text-uppercase fw-semibold">
                                    {t('leadsPage.modal.contact.zip')}
                                  </small>
                                  <div className="fw-semibold">{selectedLeadZip || '—'}</div>
                                </CCol>
                                <CCol md={12}>
                                  <small className="text-muted text-uppercase fw-semibold">
                                    {t('leadsPage.modal.contact.company')}
                                  </small>
                                  <div className="fw-semibold">
                                    {selectedLead?.company ||
                                      t('leadsPage.modal.contact.companyMissing')}
                                  </div>
                                </CCol>
                              </CRow>
                            </div>
                          </div>
                        </CCol>
                        <CCol md={6}>
                          <h6 className="fw-bold text-primary mb-2 d-flex align-items-center">
                            <div
                              className="bg-primary bg-opacity-10 rounded-circle p-2 me-2"
                              style={{ width: '32px', height: '32px' }}
                            >
                              <CBadge
                                color={getStatusBadgeVariant(selectedLead.status)}
                                className="p-1"
                              >
                                <div style={{ width: '8px', height: '8px' }}></div>
                              </CBadge>
                            </div>
                            {t('leadsPage.modal.status.heading')}
                          </h6>
                          <div className="ms-4">
                            <div
                              className="px-3 py-2 mb-2 text-capitalize rounded-pill d-inline-block fw-semibold"
                              style={{
                                fontSize: '0.875rem',
                                backgroundColor:
                                  selectedLead.status === 'new'
                                    ? '#198754'
                                    : selectedLead.status === 'reviewing'
                                      ? '#0dcaf0'
                                      : selectedLead.status === 'contacted'
                                        ? '#198754'
                                        : selectedLead.status === 'closed'
                                          ? '#6c757d'
                                          : '#6c757d',
                                color: '#ffffff',
                                border: 'none',
                                textShadow: '0 1px 2px rgba(0,0,0,0.1)',
                                boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
                              }}
                            >
                              {selectedLeadStatusText}
                            </div>
                            <p className="text-muted mb-0 small">{selectedLeadSubmittedText}</p>
                          </div>
                        </CCol>
                      </CRow>
                    </CCardBody>
                  </CCard>

                  {/* Message Section */}
                  <CCard className="border-0 shadow-sm mb-4">
                    <CCardBody className="p-3">
                      <h6 className="fw-bold text-primary mb-3 d-flex align-items-center">
                        <div
                          className="bg-primary bg-opacity-10 rounded-circle p-2 me-2"
                          style={{ width: '32px', height: '32px' }}
                        >
                          <CIcon icon={cilSend} size="sm" className="text-primary" />
                        </div>
                        {t('leadsPage.modal.message.heading')}
                      </h6>
                      <div className="ms-4">
                        <div className="bg-light rounded p-3 border-start border-primary border-4">
                          <p className="mb-0" style={{ lineHeight: '1.6' }}>
                            {selectedLead.message
                              ? selectedLead.message
                              : t('leadsPage.modal.message.empty')}
                          </p>
                        </div>
                      </div>
                    </CCardBody>
                  </CCard>

                  {/* Notes Section */}
                  <CCard className="border-0 shadow-sm mb-4">
                    <CCardBody className="p-3">
                      <h6 className="fw-bold text-primary mb-3 d-flex align-items-center">
                        <div
                          className="bg-primary bg-opacity-10 rounded-circle p-2 me-2"
                          style={{ width: '32px', height: '32px' }}
                        >
                          <CIcon icon={cilNotes} size="sm" className="text-primary" />
                        </div>
                        {t('leadsPage.modal.notes.heading')}
                      </h6>
                      <div className="ms-4">
                        {Array.isArray(selectedLead.metadata?.notes) &&
                        selectedLead.metadata.notes.length > 0 ? (
                          <div className="bg-light rounded p-3">
                            {selectedLead.metadata.notes.map((item, index) => (
                              <div key={index} className="mb-3 pb-3 border-bottom border-light">
                                <div className="d-flex justify-content-between align-items-start mb-2">
                                  <strong className="text-dark">
                                    {item.byName || t('leadsPage.modal.notes.defaultAuthor')}
                                  </strong>
                                  <small className="text-muted">
                                    {item.at ? new Date(item.at).toLocaleString() : ''}
                                  </small>
                                </div>
                                <p className="mb-0" style={{ lineHeight: '1.6' }}>
                                  {item.note}
                                </p>
                              </div>
                            ))}
                          </div>
                        ) : (
                          <div className="bg-light rounded p-3 text-center">
                            <p className="text-muted mb-0">{t('leadsPage.modal.notes.empty')}</p>
                          </div>
                        )}
                      </div>
                    </CCardBody>
                  </CCard>

                  {/* Add Note Section */}
                  <CCard className="border-0 shadow-sm">
                    <CCardBody className="p-3">
                      <h6 className="fw-bold text-primary mb-3 d-flex align-items-center">
                        <div
                          className="bg-primary bg-opacity-10 rounded-circle p-2 me-2"
                          style={{ width: '32px', height: '32px' }}
                        >
                          <CIcon icon={cilSend} size="sm" className="text-primary" />
                        </div>
                        {t('leadsPage.modal.addNote.heading')}
                      </h6>
                      <div className="ms-4">
                        <CFormTextarea
                          rows={4}
                          placeholder={t('leadsPage.modal.addNote.placeholder')}
                          value={noteText}
                          onChange={(e) => setNoteText(e.target.value)}
                          className="border-2 rounded-3"
                          style={{ resize: 'vertical' }}
                        />
                        <div className="text-end mt-3">
                          <CButton
                            color="primary"
                            disabled={savingNote || !noteText.trim()}
                            onClick={handleNoteSubmit}
                            className="px-4 py-2 rounded-3"
                          >
                            {savingNote ? (
                              <CSpinner size="sm" className="me-2" />
                            ) : (
                              <CIcon icon={cilSend} className="me-2" />
                            )}
                            {t('leadsPage.modal.addNote.submit')}
                          </CButton>
                        </div>
                      </div>
                    </CCardBody>
                  </CCard>
                </div>
              </>
            )}
          </CModalBody>
        </CModal>
      </CContainer>
    </>
  )
}

export default LeadsPage
