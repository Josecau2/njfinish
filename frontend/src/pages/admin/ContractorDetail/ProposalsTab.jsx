import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import { useDispatch, useSelector } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import {
  CRow,
  CCol,
  CCard,
  CCardBody,
  CCardHeader,
  CTable,
  CTableBody,
  CTableDataCell,
  CTableHead,
  CTableHeaderCell,
  CTableRow,
  CBadge,
  CButton,
  CFormSelect,
  CInputGroup,
  CInputGroupText,
  CFormInput,
  CSpinner,
  CModal,
  CModalHeader,
  CModalTitle,
  CModalBody,
  CModalFooter,
  CListGroup,
  CListGroupItem,
  CAlert,
  CButtonGroup,
  CAccordion,
  CAccordionItem,
  CAccordionHeader,
  CAccordionBody,
  CProgress,
  CTooltip
} from '@coreui/react';
import CIcon from '@coreui/icons-react';
import EmptyState from '../../../components/common/EmptyState';
import { notifyError } from '../../../helpers/notify';
import {
  cilSearch,
  cilBriefcase,
  cilCalendar,
  cilDollar,
  cilUser,
  cilLocationPin,
  cilExternalLink,
  cilClipboard,
  cilHistory,
  cilCheckCircle,
  cilXCircle,
  cilClock,
  cilInfo,
  cilPaperPlane
} from '@coreui/icons';
import { 
  fetchContractorProposals, 
  fetchProposalDetails,
  clearProposalDetails 
} from '../../../store/slices/contractorSlice';
import PaginationComponent from '../../../components/common/PaginationComponent';

const ProposalsTab = ({ contractor, groupId }) => {
  const { t } = useTranslation();
  const dispatch = useDispatch();
  const navigate = useNavigate();
  
  const { 
    contractorProposals: { data: proposals, pagination, loading, error },
    proposalDetails
  } = useSelector(state => state.contractors);
  
  const [searchTerm, setSearchTerm] = useState('');
  const [debouncedSearchTerm, setDebouncedSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [sortConfig, setSortConfig] = useState({ key: 'createdAt', direction: 'desc' });
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage] = useState(10);
  const [showModal, setShowModal] = useState(false);
  const [selectedProposal, setSelectedProposal] = useState(null);

  // Status definitions with counts and colors
  const statusDefinitions = {
    all: { label: t('proposals.tabs.all'), color: 'primary', icon: cilClipboard },
    draft: { label: t('proposals.status.draft'), color: 'secondary', icon: cilClipboard },
    sent: { label: t('proposals.status.sent'), color: 'info', icon: cilPaperPlane },
    pending: { label: t('contractorsAdmin.detail.proposals.status.pending'), color: 'warning', icon: cilClock },
    approved: { label: t('contractorsAdmin.detail.proposals.status.approved'), color: 'success', icon: cilCheckCircle },
    accepted: { label: t('proposals.status.accepted'), color: 'success', icon: cilCheckCircle },
    rejected: { label: t('proposals.status.rejected'), color: 'danger', icon: cilXCircle },
    expired: { label: t('proposals.status.expired'), color: 'dark', icon: cilClock },
    in_progress: { label: t('contractorsAdmin.detail.proposals.status.inProgress'), color: 'info', icon: cilClock },
    completed: { label: t('contractorsAdmin.detail.proposals.status.completed'), color: 'success', icon: cilCheckCircle }
  };

  // Debounce search term
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearchTerm(searchTerm);
    }, 500);

    return () => clearTimeout(timer);
  }, [searchTerm]);

  useEffect(() => {
    if (groupId) {
      dispatch(fetchContractorProposals({ 
        groupId, 
        page: currentPage, 
        limit: itemsPerPage, 
        status: statusFilter === 'all' ? undefined : statusFilter,
        search: debouncedSearchTerm
      }));
    }
  }, [dispatch, groupId, currentPage, itemsPerPage, statusFilter, debouncedSearchTerm]);

  // notify on load error
  useEffect(() => {
    if (error) {
  notifyError(t('contractorsAdmin.detail.proposals.loadFailed'), typeof error === 'string' ? error : '')
    }
  }, [error])

  const handleViewProposal = (proposal) => {
    setSelectedProposal(proposal);
    setShowModal(true);
    dispatch(fetchProposalDetails(proposal.id));
  };

  const handleCloseModal = () => {
    setShowModal(false);
    setSelectedProposal(null);
    dispatch(clearProposalDetails());
  };

  const handleGoToProposal = (proposalId) => {
    // Navigate to admin read-only proposal view
    navigate(`/proposals/${proposalId}/admin-view`);
  };

  const handlePageChange = (page) => {
    setCurrentPage(page);
  };

  const handleStatusFilterChange = (status) => {
    setStatusFilter(status);
    setCurrentPage(1); // Reset to first page when filter changes
  };

  const handleSearchChange = (e) => {
    setSearchTerm(e.target.value);
    setCurrentPage(1); // Reset to first page when search changes
  };

  const handleSort = (key) => {
    setSortConfig((prev) => {
      const direction = prev.key === key && prev.direction === 'asc' ? 'desc' : 'asc';
      return { key, direction };
    });
  };

  const getStatusColor = (status) => {
    return statusDefinitions[status]?.color || 'secondary';
  };

  const getStatusIcon = (status) => {
    return statusDefinitions[status]?.icon || cilClipboard;
  };

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD'
    }).format(amount || 0);
  };

  // Calculate total amount from manufacturersData
  const calculateTotalAmount = (proposal) => {
    if (!proposal.manufacturersData) return 0;
    
    try {
      const manufacturersData = JSON.parse(proposal.manufacturersData);
      let totalAmount = 0;
      
      manufacturersData.forEach(manufacturer => {
        if (manufacturer.summary && manufacturer.summary.grandTotal) {
          totalAmount += manufacturer.summary.grandTotal;
        }
      });
      
      return totalAmount;
    } catch (error) {
      console.error('Error parsing manufacturer data for proposal', proposal.id, error);
      return 0;
    }
  };

  const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    
    try {
      const date = new Date(dateString);
      // Check if the date is valid
      if (isNaN(date.getTime())) {
        return 'N/A';
      }
      return date.toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      });
    } catch (error) {
      console.error('Error formatting date:', error);
      return 'N/A';
    }
  };

  const formatDateShort = (dateString) => {
    if (!dateString) return 'N/A';
    
    try {
      const date = new Date(dateString);
      // Check if the date is valid
      if (isNaN(date.getTime())) {
        return 'N/A';
      }
      return date.toLocaleDateString('en-US', {
        month: 'short',
        day: 'numeric'
      });
    } catch (error) {
      console.error('Error formatting date:', error);
      return 'N/A';
    }
  };

  // Calculate status counts from the actual proposals data
  const statusCounts = useMemo(() => {
    const counts = { all: proposals?.length || 0 };
    if (proposals && proposals.length > 0) {
      proposals.forEach(proposal => {
        const status = proposal.status || 'draft';
        counts[status] = (counts[status] || 0) + 1;
      });
    }
    return counts;
  }, [proposals]);

  // Create status timeline for proposal
  const getStatusTimeline = (proposal) => {
    const timeline = [];
    
    // Always show creation
    timeline.push({
      status: 'created',
      label: 'Created',
      date: proposal.createdAt,
      icon: cilClipboard,
      color: 'secondary',
      completed: true
    });

    // Add sent status if it exists
    if (proposal.sent_at) {
      timeline.push({
        status: 'sent',
        label: 'Sent to Customer',
        date: proposal.sent_at,
        icon: cilPaperPlane,
        color: 'info',
        completed: true
      });
    }

    // Add accepted status if it exists
    if (proposal.accepted_at) {
      timeline.push({
        status: 'accepted',
        label: 'Accepted',
        date: proposal.accepted_at,
        icon: cilCheckCircle,
        color: 'success',
        completed: true
      });
    }

    // Add current status if it's different from sent/accepted
    if (proposal.status && !['draft', 'sent', 'accepted'].includes(proposal.status)) {
      timeline.push({
        status: proposal.status,
        label: statusDefinitions[proposal.status]?.label || proposal.status,
        date: proposal.updatedAt,
        icon: getStatusIcon(proposal.status),
        color: getStatusColor(proposal.status),
        completed: true
      });
    }

    return timeline;
  };

  // Since filtering is done server-side, use proposals directly
  const displayProposals = proposals || [];
  
  const totalPages = pagination?.totalPages || 1;

  if (loading) {
    return (
      <div className="d-flex justify-content-center align-items-center" style={{ minHeight: '200px' }}>
        <CSpinner color="primary" />
      </div>
    );
  }

  return (
    <>
      <CRow>
        <CCol xs={12}>
          <CCard>
            <CCardHeader>
              <strong>
                <CIcon icon={cilBriefcase} className="me-2" />
                {t('contractorsAdmin.detail.proposals.header', { count: pagination?.total || 0 })}
              </strong>
            </CCardHeader>
            <CCardBody>
              {error && notifyError(t('contractorsAdmin.detail.proposals.loadFailed'), typeof error === 'string' ? error : '')}

              {/* Search and Status Filter Chips */}
              <CRow className="mb-4">
                <CCol md={6}>
                  <CInputGroup>
                    <CInputGroupText>
                      <CIcon icon={cilSearch} />
                    </CInputGroupText>
                    <CFormInput
                      type="text"
                      placeholder={t('contractorsAdmin.detail.proposals.searchPlaceholder')}
                      value={searchTerm}
                      onChange={handleSearchChange}
                    />
                  </CInputGroup>
                </CCol>
                <CCol md={6} className="d-flex align-items-center justify-content-end">
                  <small className="text-muted me-2">{t('contractorsAdmin.detail.proposals.quickFilters')}</small>
                </CCol>
              </CRow>

              {/* Status Filter Chips */}
              <div className="mb-4">
                <CButtonGroup className="flex-wrap">
                  {Object.entries(statusDefinitions).map(([status, definition]) => {
                    const count = statusCounts[status] || 0;
                    const isActive = statusFilter === status;
                    
                    return (
                      <CButton
                        key={status}
                        variant={isActive ? 'solid' : 'outline'}
                        color={definition.color}
                        size="sm"
                        className="me-2 mb-2"
                        onClick={() => handleStatusFilterChange(status)}
                        disabled={count === 0 && status !== 'all'}
                      >
                        <CIcon icon={definition.icon} className="me-1" size="sm" />
                        {definition.label}
                        {count > 0 && (
                          <CBadge 
                            color={isActive ? 'light' : definition.color} 
                            className="ms-1"
                          >
                            {count}
                          </CBadge>
                        )}
                      </CButton>
                    );
                  })}
                </CButtonGroup>
              </div>

              {/* Table */}
              <div className="table-responsive">
                <CTable hover striped>
                  <CTableHead>
                    <CTableRow>
                      <CTableHeaderCell
                        scope="col"
                        className="cursor-pointer"
                        onClick={() => handleSort('title')}
                      >
                        {t('contractorsAdmin.detail.proposals.table.title')}
                      </CTableHeaderCell>
                      <CTableHeaderCell
                        scope="col"
                        className="cursor-pointer"
                        onClick={() => handleSort('customer_name')}
                      >
                        {t('proposals.headers.customer')}
                      </CTableHeaderCell>
                      <CTableHeaderCell
                        scope="col"
                        className="cursor-pointer"
                        onClick={() => handleSort('status')}
                      >
                        {t('proposals.headers.status')}
                      </CTableHeaderCell>
                      <CTableHeaderCell
                        scope="col"
                        className="cursor-pointer"
                        onClick={() => handleSort('total_amount')}
                      >
                        {t('contractorsAdmin.detail.proposals.table.amount')}
                      </CTableHeaderCell>
                      <CTableHeaderCell
                        scope="col"
                        className="cursor-pointer"
                        onClick={() => handleSort('createdAt')}
                      >
                        {t('proposals.headers.date')}
                        {sortConfig.key === 'createdAt' && (
                          <span className="ms-1">
                            {sortConfig.direction === 'asc' ? '↑' : '↓'}
                          </span>
                        )}
                      </CTableHeaderCell>
                      <CTableHeaderCell
                        scope="col"
                        className="cursor-pointer"
                        onClick={() => handleSort('updatedAt')}
                      >
                        {t('contractorsAdmin.detail.proposals.table.updated')}
                        {sortConfig.key === 'updatedAt' && (
                          <span className="ms-1">
                            {sortConfig.direction === 'asc' ? '↑' : '↓'}
                          </span>
                        )}
                      </CTableHeaderCell>
                      <CTableHeaderCell scope="col" className="text-center" style={{ width: '150px' }}>
                        {t('proposals.headers.actions')}
                      </CTableHeaderCell>
                    </CTableRow>
                  </CTableHead>
                  <CTableBody>
                    {displayProposals.length === 0 ? (
                      <CTableRow>
                        <CTableDataCell colSpan="7">
                          <EmptyState
                            title={t('contractorsAdmin.detail.proposals.empty.title')}
                            subtitle={t('contractorsAdmin.detail.proposals.empty.subtitle')}
                          />
                        </CTableDataCell>
                      </CTableRow>
                    ) : (
                      displayProposals.map((proposal) => (
                        <CTableRow key={proposal.id} className="align-middle">
                          <CTableDataCell>
                            <div>
                              <div className="fw-semibold">{proposal.title || `Proposal #${proposal.id}`}</div>
                              <small className="text-muted">ID: {proposal.id}</small>
                            </div>
                          </CTableDataCell>
                          <CTableDataCell>
                            <div className="d-flex align-items-center">
                              <CIcon icon={cilUser} className="me-1 text-muted" size="sm" />
                              {proposal.customer?.name || proposal.customer_name || 'N/A'}
                            </div>
                          </CTableDataCell>
                          <CTableDataCell>
                            <CBadge 
                              color={getStatusColor(proposal.status)} 
                              className="d-flex align-items-center"
                              style={{ width: 'fit-content' }}
                            >
                              <CIcon icon={getStatusIcon(proposal.status)} className="me-1" size="sm" />
                              {statusDefinitions[proposal.status]?.label || proposal.status || t('proposals.status.draft')}
                            </CBadge>
                          </CTableDataCell>
                          <CTableDataCell>
                            <div className="fw-bold text-success">{formatCurrency(calculateTotalAmount(proposal))}</div>
                          </CTableDataCell>
                          <CTableDataCell>
                            <div>
                              <small className="text-muted">{formatDateShort(proposal.createdAt)}</small>
                            </div>
                          </CTableDataCell>
                          <CTableDataCell>
                            <div>
                              <small className="text-muted">{formatDateShort(proposal.updatedAt)}</small>
                            </div>
                          </CTableDataCell>
                          <CTableDataCell className="text-center">
                            <CButtonGroup size="sm">
                              <CTooltip content="View Details">
                                <CButton
                                  color="outline-info"
                                  size="sm"
                                  onClick={() => handleViewProposal(proposal)}
                                >
                                  <CIcon icon={cilSearch} size="sm" />
                                </CButton>
                              </CTooltip>
                              <CTooltip content="Go to Proposal">
                                <CButton
                                  color="outline-primary"
                                  size="sm"
                                  onClick={() => handleGoToProposal(proposal.id)}
                                >
                                  <CIcon icon={cilExternalLink} size="sm" />
                                </CButton>
                              </CTooltip>
                            </CButtonGroup>
                          </CTableDataCell>
                        </CTableRow>
                      ))
                    )}
                  </CTableBody>
                </CTable>
              </div>

              {/* Pagination */}
              {pagination?.totalPages > 1 && (
                <div className="pt-3 border-top border-light">
                  <PaginationComponent
                    currentPage={currentPage}
                    totalPages={pagination?.totalPages || 1}
                    onPageChange={handlePageChange}
                    itemsPerPage={itemsPerPage}
                  />
                </div>
              )}
            </CCardBody>
          </CCard>
        </CCol>
      </CRow>

      {/* Enhanced Proposal Detail Modal */}
      <CModal
        visible={showModal}
        onClose={handleCloseModal}
        size="xl"
        scrollable
        className="proposal-detail-modal"
      >
        <CModalHeader>
          <CModalTitle>
            <CIcon icon={cilBriefcase} className="me-2" />
            {t('contractorsAdmin.detail.proposals.modal.title')}
            {selectedProposal && (
              <CBadge color={getStatusColor(selectedProposal.status)} className="ms-2">
                {statusDefinitions[selectedProposal.status]?.label || selectedProposal.status || 'Draft'}
              </CBadge>
            )}
          </CModalTitle>
        </CModalHeader>
        <CModalBody>
          {proposalDetails.loading ? (
            <div className="d-flex justify-content-center align-items-center" style={{ minHeight: '300px' }}>
              <CSpinner color="primary" size="lg" />
              <span className="ms-3">{t('contractorsAdmin.detail.proposals.modal.loading')}</span>
            </div>
          ) : proposalDetails.data ? (
            <div>
              {/* Header Summary */}
              <CRow className="mb-4">
                <CCol md={8}>
                  <h4 className="mb-2">{proposalDetails.data.title || `Proposal #${proposalDetails.data.id}`}</h4>
                  <div className="d-flex flex-wrap gap-3 text-muted">
                    <div>
                      <CIcon icon={cilUser} className="me-1" />
                      <strong>{t('proposalAcceptance.labels.customer')}:</strong> {proposalDetails.data.customer?.name || t('common.na')}
                    </div>
                    <div>
                      <CIcon icon={cilCalendar} className="me-1" />
                      <strong>{t('proposals.headers.date')}:</strong> {formatDate(proposalDetails.data.createdAt)}
                    </div>
                    <div>
                      <CIcon icon={cilLocationPin} className="me-1" />
                      <strong>{t('contractorsAdmin.detail.proposals.modal.group')}:</strong> {contractor?.name || t('common.na')}
                    </div>
                  </div>
                </CCol>
                <CCol md={4} className="text-end">
                  <div className="mb-2">
                    <h3 className="text-success mb-0">{formatCurrency(calculateTotalAmount(proposalDetails.data))}</h3>
                    <small className="text-muted">{t('contractorsAdmin.detail.proposals.modal.totalAmount')}</small>
                  </div>
                  <CButton
                    color="primary"
                    size="sm"
                    onClick={() => handleGoToProposal(proposalDetails.data.id)}
                    className="me-2"
                  >
                    <CIcon icon={cilExternalLink} className="me-1" />
                    {t('contractorsAdmin.detail.proposals.modal.goToProposal')}
                  </CButton>
                </CCol>
              </CRow>

              <CAccordion flush>
                {/* Basic Information */}
                <CAccordionItem itemKey="1">
                  <CAccordionHeader>
                    <CIcon icon={cilInfo} className="me-2" />
                    {t('contractorsAdmin.detail.proposals.modal.basicInfo')}
                  </CAccordionHeader>
                  <CAccordionBody>
                    <CRow>
                      <CCol md={6}>
                        <CListGroup flush>
                          <CListGroupItem className="d-flex justify-content-between align-items-center border-0 px-0">
                            <span className="text-muted">{t('contractorsAdmin.detail.proposals.modal.proposalId')}</span>
                            <strong>#{proposalDetails.data.id}</strong>
                          </CListGroupItem>
                          <CListGroupItem className="d-flex justify-content-between align-items-center border-0 px-0">
                            <span className="text-muted">{t('proposals.headers.status')}</span>
                            <CBadge color={getStatusColor(proposalDetails.data.status)}>
                              <CIcon icon={getStatusIcon(proposalDetails.data.status)} className="me-1" size="sm" />
                              {statusDefinitions[proposalDetails.data.status]?.label || proposalDetails.data.status || t('proposals.status.draft')}
                            </CBadge>
                          </CListGroupItem>
                          <CListGroupItem className="d-flex justify-content-between align-items-center border-0 px-0">
                            <span className="text-muted">{t('proposalAcceptance.labels.customer')}</span>
                            <span>{proposalDetails.data.customer?.name || 'N/A'}</span>
                          </CListGroupItem>
                          <CListGroupItem className="d-flex justify-content-between align-items-center border-0 px-0">
                            <span className="text-muted">{t('contractorsAdmin.detail.proposals.modal.totalAmount')}</span>
                            <strong className="text-success">{formatCurrency(calculateTotalAmount(proposalDetails.data))}</strong>
                          </CListGroupItem>
                        </CListGroup>
                      </CCol>
                      <CCol md={6}>
                        <CListGroup flush>
                          <CListGroupItem className="d-flex justify-content-between align-items-center border-0 px-0">
                            <span className="text-muted">{t('contractorsAdmin.detail.proposals.modal.created')}</span>
                            <span>{formatDate(proposalDetails.data.createdAt)}</span>
                          </CListGroupItem>
                          <CListGroupItem className="d-flex justify-content-between align-items-center border-0 px-0">
                            <span className="text-muted">{t('contractorsAdmin.detail.proposals.modal.updated')}</span>
                            <span>{formatDate(proposalDetails.data.updatedAt)}</span>
                          </CListGroupItem>
                          {proposalDetails.data.sent_at && (
                            <CListGroupItem className="d-flex justify-content-between align-items-center border-0 px-0">
                              <span className="text-muted">{t('contractorsAdmin.detail.proposals.modal.sent')}</span>
                              <span className="text-info">{formatDate(proposalDetails.data.sent_at)}</span>
                            </CListGroupItem>
                          )}
                          <CListGroupItem className="d-flex justify-content-between align-items-center border-0 px-0">
                            <span className="text-muted">{t('contractorsAdmin.detail.proposals.modal.contractorGroup')}</span>
                            <span>{contractor?.name || 'N/A'}</span>
                          </CListGroupItem>
                          {proposalDetails.data.accepted_at && (
                            <CListGroupItem className="d-flex justify-content-between align-items-center border-0 px-0">
                              <span className="text-muted">{t('contractorsAdmin.detail.proposals.modal.accepted')}</span>
                              <span className="text-success">{formatDate(proposalDetails.data.accepted_at)}</span>
                            </CListGroupItem>
                          )}
                        </CListGroup>
                      </CCol>
                    </CRow>
                    
                    {proposalDetails.data.description && (
                      <div className="mt-3">
                        <h6 className="text-muted mb-2">{t('proposals.labels.description')}</h6>
                        <div className="bg-light p-3 rounded">
                          <p className="mb-0">{proposalDetails.data.description}</p>
                        </div>
                      </div>
                    )}
                  </CAccordionBody>
                </CAccordionItem>

                {/* Status Timeline */}
                <CAccordionItem itemKey="2">
                  <CAccordionHeader>
                    <CIcon icon={cilHistory} className="me-2" />
                    {t('contractorsAdmin.detail.proposals.timeline.title')}
                  </CAccordionHeader>
                  <CAccordionBody>
                    <div className="timeline">
                      {getStatusTimeline(proposalDetails.data).map((item, index) => (
                        <div key={index} className="d-flex align-items-center mb-3">
                          <div className={`timeline-icon bg-${item.color} text-white rounded-circle d-flex align-items-center justify-content-center me-3`} 
                               style={{ width: '40px', height: '40px', minWidth: '40px' }}>
                            <CIcon icon={item.icon} size="sm" />
                          </div>
                          <div className="flex-grow-1">
                            <div className="d-flex justify-content-between align-items-center">
                              <strong>{item.label}</strong>
                              <small className="text-muted">{formatDate(item.date)}</small>
                            </div>
                            {item.status === 'created' && (
                              <small className="text-muted">{t('contractorsAdmin.detail.proposals.timeline.created')}</small>
                            )}
                            {item.status === 'sent' && (
                              <small className="text-info">{t('contractorsAdmin.detail.proposals.timeline.sent')}</small>
                            )}
                            {item.status === 'accepted' && (
                              <small className="text-success">{t('contractorsAdmin.detail.proposals.timeline.accepted')}</small>
                            )}
                            {item.status === 'approved' && (
                              <small className="text-success">{t('contractorsAdmin.detail.proposals.timeline.approved')}</small>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  </CAccordionBody>
                </CAccordionItem>

                {/* Proposal Items */}
                {proposalDetails.data.items && proposalDetails.data.items.length > 0 && (
                  <CAccordionItem itemKey="3">
                    <CAccordionHeader>
                      <CIcon icon={cilClipboard} className="me-2" />
                      {t('contractorsAdmin.detail.proposals.itemsTitle', { count: proposalDetails.data.items.length })}
                    </CAccordionHeader>
                    <CAccordionBody>
                      <div className="table-responsive">
                        <CTable hover striped>
                          <CTableHead>
                            <CTableRow>
                              <CTableHeaderCell>{t('proposalColumns.item')}</CTableHeaderCell>
                              <CTableHeaderCell>{t('proposals.labels.description')}</CTableHeaderCell>
                              <CTableHeaderCell className="text-end">{t('proposalColumns.qty')}</CTableHeaderCell>
                              <CTableHeaderCell className="text-end">{t('proposalDoc.catalog.unitPrice')}</CTableHeaderCell>
                              <CTableHeaderCell className="text-end">{t('proposalColumns.total')}</CTableHeaderCell>
                            </CTableRow>
                          </CTableHead>
                          <CTableBody>
                            {proposalDetails.data.items.map((item, index) => (
                              <CTableRow key={index}>
                                <CTableDataCell>
                                  <strong>{item.name || `Item ${index + 1}`}</strong>
                                </CTableDataCell>
                                <CTableDataCell>{item.description || 'N/A'}</CTableDataCell>
                                <CTableDataCell className="text-end">{item.quantity || 1}</CTableDataCell>
                                <CTableDataCell className="text-end">{formatCurrency(item.unit_price)}</CTableDataCell>
                                <CTableDataCell className="text-end">
                                  <strong>{formatCurrency((item.quantity || 1) * (item.unit_price || 0))}</strong>
                                </CTableDataCell>
                              </CTableRow>
                            ))}
                          </CTableBody>
                        </CTable>
                      </div>
                      
                      <div className="border-top pt-3 mt-3">
                        <CRow>
                          <CCol md={6}></CCol>
                          <CCol md={6}>
                            <div className="d-flex justify-content-between mb-2">
                              <span>{t('contractorsAdmin.detail.proposals.totals.subtotal')}:</span>
                              <span>{formatCurrency(proposalDetails.data.subtotal_amount || proposalDetails.data.total_amount)}</span>
                            </div>
                            {proposalDetails.data.tax_amount > 0 && (
                              <div className="d-flex justify-content-between mb-2">
                                <span>{t('contractorsAdmin.detail.proposals.totals.tax')}:</span>
                                <span>{formatCurrency(proposalDetails.data.tax_amount)}</span>
                              </div>
                            )}
                            <div className="d-flex justify-content-between border-top pt-2">
                              <strong>{t('contractorsAdmin.detail.proposals.totals.total')}:</strong>
                              <strong className="text-success">{formatCurrency(proposalDetails.data.total_amount)}</strong>
                            </div>
                          </CCol>
                        </CRow>
                      </div>
                    </CAccordionBody>
                  </CAccordionItem>
                )}
              </CAccordion>
            </div>
          ) : (
            <CAlert color="warning" className="mb-0">
              <CIcon icon={cilInfo} className="me-2" />
              {t('contractorsAdmin.detail.proposals.modal.failed')}
            </CAlert>
          )}
        </CModalBody>
        <CModalFooter className="d-flex justify-content-between">
          <div>
            {selectedProposal && (
              <CButton
                color="primary"
                variant="outline"
                onClick={() => handleGoToProposal(selectedProposal.id)}
              >
                <CIcon icon={cilExternalLink} className="me-1" />
                {t('contractorsAdmin.detail.proposals.modal.openFull')}
              </CButton>
            )}
          </div>
          <CButton color="secondary" onClick={handleCloseModal}>
            {t('common.cancel')}
          </CButton>
        </CModalFooter>
      </CModal>
    </>
  );
};

export default ProposalsTab;
