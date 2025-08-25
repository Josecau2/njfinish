import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import {
  CContainer,
  CRow,
  CCol,
  CButton,
  CTable,
  CTableHead,
  CTableBody,
  CTableRow,
  CTableHeaderCell,
  CTableDataCell,
  CPagination,
  CPaginationItem,
  CDropdown,
  CDropdownToggle,
  CDropdownMenu,
  CDropdownItem,
  CFormInput,
  CButtonGroup,
  CCard,
  CCardBody,
  CBadge,
  CInputGroup,
  CInputGroupText,
} from '@coreui/react';
import { useNavigate } from 'react-router-dom';
import { deleteFormData, getProposal, updateProposalStatus, acceptProposal } from '../../store/slices/proposalSlice';
import axiosInstance from '../../helpers/axiosInstance';
import { hasPermission } from '../../helpers/permissions';
import { useDispatch, useSelector } from 'react-redux';
import Swal from 'sweetalert2';
import withContractorScope from '../../components/withContractorScope';
import ProposalAcceptanceModal from '../../components/ProposalAcceptanceModal';
import PermissionGate from '../../components/PermissionGate';
import CIcon from '@coreui/icons-react';
import { cilPencil, cilTrash, cilSearch, cilPlus, cilPaperPlane, cilCheck, cilX, cilLockLocked, cilChart, cilBriefcase, cilSend, cilCheckCircle } from '@coreui/icons';
import PaginationComponent from '../../components/common/PaginationComponent';

const Proposals = ({ isContractor, contractorGroupId, contractorModules, contractorGroupName }) => {
  const { t } = useTranslation();
  const dispatch = useDispatch();
  const [searchTerm, setSearchTerm] = useState('');
  const [activeTab, setActiveTab] = useState('All');
  const [currentPage, setCurrentPage] = useState(1);
  const [showAcceptanceModal, setShowAcceptanceModal] = useState(false);
  const [selectedProposalForAcceptance, setSelectedProposalForAcceptance] = useState(null);
  const itemsPerPage = 10;
  const navigate = useNavigate();
  const { data, loading, error } = useSelector((state) => state.proposal);
  const proposal = Array.isArray(data) ? data : [];
  
  // Get user data for permission checks
  const loggedInUser = JSON.parse(localStorage.getItem('user'));
  const canAssignDesigner = hasPermission(loggedInUser, 'admin:users');

  const tabs = [
    'All', 'draft', 'sent', 'accepted', 'rejected', 'expired',
    // Legacy statuses for backward compatibility
    'Draft', 'Measurement Scheduled', 'Measurement done',
    'Design done', 'Follow up 1', 'Follow up 2', 'Follow up 3',
    'Proposal accepted', 'Proposal rejected'
  ];

  const getTabLabel = (tab) => {
    switch (tab) {
      case 'All': return t('proposals.tabs.all');
      case 'draft': return t('proposals.status.draft');
      case 'sent': return t('proposals.status.sent');
      case 'accepted': return t('proposals.status.accepted');
      case 'rejected': return t('proposals.status.rejected');
      case 'expired': return t('proposals.status.expired');
      case 'Draft': return t('proposals.status.draft');
      case 'Measurement Scheduled': return t('proposals.status.measurementScheduled');
      case 'Measurement done': return t('proposals.status.measurementDone');
      case 'Design done': return t('proposals.status.designDone');
      case 'Follow up 1': return t('proposals.status.followUp1');
      case 'Follow up 2': return t('proposals.status.followUp2');
      case 'Follow up 3': return t('proposals.status.followUp3');
      case 'Proposal accepted': return t('proposals.status.proposalAccepted');
      case 'Proposal rejected': return t('proposals.status.proposalRejected');
      default: return tab;
    }
  };

  useEffect(() => {
    // For contractor users, filter by their group ID
    const groupId = isContractor ? contractorGroupId : null;
    dispatch(getProposal(groupId));
  }, [dispatch, isContractor, contractorGroupId]);

  const getTabCounts = () => {
    const counts = {
      All: proposal?.length,
      'draft': 0,
      'sent': 0,
      'accepted': 0,
      'rejected': 0,
      'expired': 0,
      // Legacy statuses
      'Draft': 0,
      'Measurement Scheduled': 0,
      'Measurement done': 0,
      'Design done': 0,
      'Follow up 1': 0,
      'Follow up 2': 0,
      'Follow up 3': 0,
      'Proposal accepted': 0,
      'Proposal rejected': 0
    };

    proposal?.forEach((item) => {
      const status = item.status || 'draft';
      if (counts[status] !== undefined) {
        counts[status]++;
      }
    });

    return counts;
  };

  const tabCounts = getTabCounts();

  const filteredProposals = proposal?.filter((item) => {
    const matchStatus = activeTab === 'All' || item.status === activeTab;
    const customerName = item.customer?.name || '';
    const matchSearch = searchTerm === '' || customerName.toLowerCase().includes(searchTerm.toLowerCase());

    return matchStatus && matchSearch;
  });

  const paginatedItems = filteredProposals?.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  const totalPages = Math.ceil((filteredProposals?.length || 0) / itemsPerPage);

  const handlePageChange = (number) => {
    setCurrentPage(number);
  };

  const handleCreateProposal = () => {
    navigate('/proposals/create');
  };

  const handleCreateQuickProposal = () => {
    navigate('/proposals/create?quick=yes');
  };

  const getAvailableActions = (proposal) => {
    const status = proposal.status?.toLowerCase() || 'draft';
    const isLocked = proposal.is_locked;
    
    if (isLocked) {
      return []; // No actions available for locked proposals
    }

    const actions = [];
    
    switch (status) {
      case 'draft':
        actions.push({ type: 'send', label: t('proposals.actions.send'), icon: cilPaperPlane, color: 'info' });
        actions.push({ type: 'share', label: t('proposals.actions.share'), icon: cilSend, color: 'primary' });
        break;
      case 'sent':
        actions.push({ type: 'accept', label: t('proposals.actions.accept'), icon: cilCheck, color: 'success' });
        actions.push({ type: 'reject', label: t('proposals.actions.reject'), icon: cilX, color: 'danger' });
        actions.push({ type: 'share', label: t('proposals.actions.share'), icon: cilSend, color: 'primary' });
        break;
      case 'rejected':
      case 'expired':
        actions.push({ type: 'send', label: t('proposals.actions.resend'), icon: cilPaperPlane, color: 'info' });
        actions.push({ type: 'share', label: t('proposals.actions.share'), icon: cilSend, color: 'primary' });
        break;
      default:
        break;
    }
    // Hide internal-only actions for contractors until fully implemented
    if (isContractor) {
      return actions.filter(a => a.type !== 'send' && a.type !== 'share');
    }

    return actions;
  };

  const renderStatusActions = (proposal) => {
    const availableActions = getAvailableActions(proposal);
    
    return availableActions.map((action) => (
      <CButton
        key={action.type}
        color="light"
        size="sm"
        className="p-2 me-1"
        onClick={() => {
          if (action.type === 'send') {
            handleSendProposal(proposal.id);
          } else if (action.type === 'accept') {
            handleAcceptProposal(proposal);
          } else if (action.type === 'reject') {
            handleRejectProposal(proposal.id);
          } else if (action.type === 'share') {
            handleCreateShareLink(proposal);
          }
        }}
        style={{
          borderRadius: '8px',
          border: `1px solid ${action.color === 'info' ? '#0dcaf0' : action.color === 'success' ? '#198754' : action.color === 'danger' ? '#dc3545' : '#0d6efd'}`,
          transition: 'all 0.2s ease'
        }}
        title={action.label}
      >
        <CIcon
          icon={action.icon}
          size="sm"
          style={{ color: action.color === 'info' ? '#0dcaf0' : action.color === 'success' ? '#198754' : action.color === 'danger' ? '#dc3545' : '#0d6efd' }}
        />
      </CButton>
    ));
  };

  const handleStatusAction = async (proposalId, action, newStatus) => {
    try {
      await dispatch(updateProposalStatus({ id: proposalId, action, status: newStatus })).unwrap();
      const successMap = {
        send: t('proposals.toast.successSend'),
        accept: t('proposals.toast.successAccept'),
        reject: t('proposals.toast.successReject')
      };
      Swal.fire(t('common.success') || 'Success', successMap[action] || t('proposals.toast.successSend'), 'success');
      const groupId = isContractor ? contractorGroupId : null;
      dispatch(getProposal(groupId));
    } catch (error) {
      console.error('Status update error:', error);
      Swal.fire(t('common.error'), error.message || t('proposals.toast.errorGeneric'), 'error');
    }
  };

  const handleSendProposal = (proposalId) => {
  // Defense-in-depth: contractors should not trigger send
  if (isContractor) return;
    Swal.fire({
      title: t('proposals.confirm.sendTitle'),
      text: t('proposals.confirm.sendText'),
      icon: 'question',
      showCancelButton: true,
      confirmButtonText: t('proposals.confirm.sendConfirm'),
      cancelButtonText: t('proposals.confirm.cancel'),
    }).then((result) => {
      if (result.isConfirmed) {
        handleStatusAction(proposalId, 'send', 'sent');
      }
    });
  };

  const handleAcceptProposal = (proposal) => {
    setSelectedProposalForAcceptance(proposal);
    setShowAcceptanceModal(true);
  };

  const handleAcceptanceComplete = () => {
    const groupId = isContractor ? contractorGroupId : null;
    dispatch(getProposal(groupId));
    setSelectedProposalForAcceptance(null);
  };

  const handleRejectProposal = (proposalId) => {
    Swal.fire({
      title: t('proposals.confirm.rejectTitle'),
      text: t('proposals.confirm.rejectText'),
      icon: 'warning',
      showCancelButton: true,
      confirmButtonText: t('proposals.confirm.rejectConfirm'),
      cancelButtonText: t('proposals.confirm.cancel'),
    }).then((result) => {
      if (result.isConfirmed) {
        handleStatusAction(proposalId, 'reject', 'rejected');
      }
    });
  };

  const handleDelete = (id) => {
    Swal.fire({
      title: t('proposals.confirm.deleteTitle'),
      text: t('proposals.confirm.deleteText'),
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#d33',
      cancelButtonColor: '#3085d6',
      confirmButtonText: t('proposals.confirm.deleteConfirm'),
    }).then((result) => {
      if (result.isConfirmed) {
        dispatch(deleteFormData(id))
          .then((res) => {
            if (res.meta.requestStatus === 'fulfilled') {
              Swal.fire(t('common.deleted') || 'Deleted', t('proposals.toast.deleted') || 'Your proposal has been deleted.', 'success');
              const groupId = isContractor ? contractorGroupId : null;
              dispatch(getProposal(groupId));
            } else {
              Swal.fire(t('common.error'), t('proposals.toast.deleteFailed') || 'Failed to delete the proposal.', 'error');
            }
          });
      }
    });
  };

  const handleCreateShareLink = async (proposal) => {
  // Defense-in-depth: contractors should not create share links
  if (isContractor) return;
    try {
      const res = await axiosInstance.post(`/api/proposals/${proposal.id}/sessions`);
      const payload = res.data;
      if (!payload?.success) throw new Error(payload?.message || 'Failed to create share link');
      const { token, expires_at } = payload.data || {};
      if (!token) throw new Error('Session token missing in response');
      const link = `${window.location.origin}/p/${encodeURIComponent(token)}`;
      const expiryStr = expires_at ? new Date(expires_at).toLocaleString() : t('common.na');

      await Swal.fire({
        title: t('proposals.share.createdTitle'),
        html: `
          <div class="mb-2">${t('proposals.share.expires')} <b>${expiryStr}</b></div>
          <input id="share-link" class="swal2-input" value="${link}" readonly />
        `,
        showCancelButton: true,
        confirmButtonText: t('proposals.share.copy'),
        didOpen: () => {
          const el = document.getElementById('share-link');
          if (el) { el.focus(); el.select(); }
        },
        preConfirm: async () => {
          try { await navigator.clipboard.writeText(link); } catch (e) { /* ignore */ }
        }
      });

      // Refresh list to reflect possible sent_at/status updates
      const groupId = isContractor ? contractorGroupId : null;
      dispatch(getProposal(groupId));
    } catch (err) {
      console.error('Create share link error:', err);
  Swal.fire(t('common.error'), err.message || t('proposals.share.error'), 'error');
    }
  };

  const handleNavigate = (id) => {
    navigate(`/proposals/edit/${id}`);
  };

  const getStatusColor = (status) => {
    const statusColors = {
      // New standardized statuses
      'draft': 'secondary',
      'sent': 'info',
      'accepted': 'success',
      'rejected': 'danger',
      'expired': 'warning',
      // Legacy statuses (for backward compatibility)
      'Draft': 'secondary',
      'Measurement Scheduled': 'info',
      'Measurement done': 'primary',
      'Design done': 'success',
      'Follow up 1': 'warning',
      'Follow up 2': 'warning',
      'Follow up 3': 'warning',
      'Proposal accepted': 'success',
      'Proposal rejected': 'danger'
    };
    return statusColors[status] || 'secondary';
  };

  return (
    <CContainer fluid className="dashboard-container">
      {/* Header Section */}
      <div className="page-header">
        <CRow className="align-items-center">
          <CCol>
            <h3 className="page-header-title">{t('proposals.header')}</h3>
            <p className="page-header-subtitle">{t('proposals.subtitle')}</p>
          </CCol>
          <CCol xs="auto">
            <div className="d-flex gap-2">
              <PermissionGate permission="proposals:create">
                <CButton
                  color="light"
                  onClick={handleCreateProposal}
                >
                  <CIcon icon={cilPlus} className="me-2" />
                  {t('proposals.new')}
                </CButton>
              </PermissionGate>
              <PermissionGate permission="proposals:create">
                <CButton
                  color="success"
                  className="btn-gradient-green"
                  onClick={handleCreateQuickProposal}
                >
                  {t('proposals.quick')}
                </CButton>
              </PermissionGate>
            </div>
          </CCol>
        </CRow>
      </div>

      {/* Status Tabs */}
      <div className="tabs-container">
        {tabs.map((tab, idx) => {
          const isActive = activeTab === tab;
          const count = tabCounts[tab] || 0;
          if (count === 0 && tab !== 'All' && !tabs.slice(0, 6).includes(tab)) return null; // Hide unused legacy tabs
          return (
            <CButton
              key={idx}
              color="light"
              className={`tab-button ${isActive ? 'active' : ''}`}
              onClick={() => {
                setActiveTab(tab);
                setCurrentPage(1);
              }}
            >
              {getTabLabel(tab)}
              <CBadge
                color={isActive ? 'light' : 'secondary'}
                shape="rounded-pill"
                className="ms-2"
              >
                {count}
              </CBadge>
            </CButton>
          );
        })}
      </div>

      {/* Search and Filters */}
      <CCard className="filter-card">
        <CCardBody>
          <CRow className="align-items-center g-3">
            <CCol md={8}>
              <CInputGroup>
                <CInputGroupText>
                  <CIcon icon={cilSearch} />
                </CInputGroupText>
                <CFormInput
                  type="text"
                  placeholder={t('proposals.searchPlaceholder')}
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
              </CInputGroup>
            </CCol>
            <CCol md={4} className="text-md-end">
              <small className="text-muted">
                {t('proposals.showingCount', { count: filteredProposals?.length || 0, total: proposal?.length || 0 })}
              </small>
            </CCol>
          </CRow>
        </CCardBody>
      </CCard>

      {/* Desktop Table */}
      <div className="table-responsive-md">
        <CCard className="data-table-card">
          <CTable hover>
            <CTableHead>
              <CTableRow>
                <CTableHeaderCell>{t('proposals.headers.date')}</CTableHeaderCell>
                <CTableHeaderCell>{t('proposals.headers.customer')}</CTableHeaderCell>
                <CTableHeaderCell>{t('proposals.headers.description')}</CTableHeaderCell>
                {canAssignDesigner && <CTableHeaderCell>{t('proposals.headers.designer')}</CTableHeaderCell>}
                <CTableHeaderCell>{t('proposals.headers.status')}</CTableHeaderCell>
                <CTableHeaderCell className="text-center">{t('proposals.headers.actions')}</CTableHeaderCell>
              </CTableRow>
            </CTableHead>
            <CTableBody>
              {paginatedItems?.length === 0 ? (
                <CTableRow>
                  <CTableDataCell colSpan={canAssignDesigner ? 6 : 5} className="text-center py-5">
                    <CIcon icon={cilSearch} size="3xl" className="text-muted mb-3" />
                    <p className="mb-0">{t('proposals.empty.title')}</p>
                    <small className="text-muted">{t('proposals.empty.subtitle')}</small>
                  </CTableDataCell>
                </CTableRow>
              ) : (
                paginatedItems?.map((item) => (
                  <CTableRow key={item.id}>
                    <CTableDataCell>
                      {new Date(item.date || item.createdAt).toLocaleDateString()}
                    </CTableDataCell>
                    <CTableDataCell
                      className="fw-medium"
                      style={{ cursor: 'pointer', color: 'var(--cui-primary)' }}
                      onClick={() => item.customer?.id && navigate(`/customers/edit/${item.customer.id}`)}
                    >
                      {item.customer?.name || t('common.na')}
                    </CTableDataCell>
                    <CTableDataCell className="text-muted">{item.description || t('common.na')}</CTableDataCell>
                    {canAssignDesigner && <CTableDataCell>{item.designerData?.name || t('common.na')}</CTableDataCell>}
                    <CTableDataCell>
                      <CBadge color={getStatusColor(item.status || 'Draft')} shape="rounded-pill">
                        {getTabLabel(item.status || 'Draft')}
                      </CBadge>
                    </CTableDataCell>
                    <CTableDataCell className="text-center">
                      <div className="d-flex justify-content-center gap-2">
                        {renderStatusActions(item)}
                        <PermissionGate action="update" resource="proposal" item={item}>
                          <CButton
                            color="primary"
                            variant="outline"
                            size="sm"
                            onClick={() => handleNavigate(item.id)}
                          >
                            <CIcon icon={cilPencil} />
                          </CButton>
                        </PermissionGate>
                        {!item.is_locked && (
                          <PermissionGate action="delete" resource="proposal" item={item}>
                            <CButton
                              color="danger"
                              variant="outline"
                              size="sm"
                              onClick={() => handleDelete(item.id)}
                            >
                              <CIcon icon={cilTrash} />
                            </CButton>
                          </PermissionGate>
                        )}
                      </div>
                    </CTableDataCell>
                  </CTableRow>
                ))
              )}
            </CTableBody>
          </CTable>
        </CCard>
      </div>

      {/* Mobile Card Layout */}
      <div className="mobile-card-view">
        {paginatedItems?.length === 0 ? (
          <CCard>
            <CCardBody className="text-center py-5">
              <CIcon icon={cilSearch} size="3xl" className="text-muted mb-3" />
              <p className="mb-0">{t('proposals.empty.title')}</p>
              <small className="text-muted">{t('proposals.empty.subtitle')}</small>
            </CCardBody>
          </CCard>
        ) : (
          paginatedItems?.map((item) => (
            <CCard key={item.id} className="proposal-mobile-card">
              <CCardBody>
                <div className="d-flex justify-content-between align-items-start">
                  <div className="customer-name">{item.customer?.name || t('common.na')}</div>
                  <CBadge color={getStatusColor(item.status || 'Draft')} shape="rounded-pill">
                    {getTabLabel(item.status || 'Draft')}
                  </CBadge>
                </div>
                <div className="proposal-details">
                  <div className="detail-item">
                    <span>{new Date(item.date || item.createdAt).toLocaleDateString()}</span>
                  </div>
                  <div className="detail-item">
                    <span>{item.description || t('common.na')}</span>
                  </div>
                  {canAssignDesigner && (
                    <div className="detail-item">
                      <strong>{t('proposals.headers.designer')}:</strong>
                      <span>{item.designerData?.name || t('common.na')}</span>
                    </div>
                  )}
                </div>
                <div className="actions">
                  {renderStatusActions(item)}
                  <PermissionGate action="update" resource="proposal" item={item}>
                    <CButton
                      color="primary"
                      variant="outline"
                      size="sm"
                      onClick={() => handleNavigate(item.id)}
                    >
                      <CIcon icon={cilPencil} className="me-1" />
                      {t('common.edit')}
                    </CButton>
                  </PermissionGate>
                  {!item.is_locked && (
                    <PermissionGate action="delete" resource="proposal" item={item}>
                      <CButton
                        color="danger"
                        variant="outline"
                        size="sm"
                        onClick={() => handleDelete(item.id)}
                      >
                        <CIcon icon={cilTrash} className="me-1" />
                        {t('common.delete')}
                      </CButton>
                    </PermissionGate>
                  )}
                </div>
              </CCardBody>
            </CCard>
          ))
        )}
      </div>

      {/* Pagination */}
      <CCard className="data-table-card mt-4">
        <CCardBody>
          <PaginationComponent
            currentPage={currentPage}
            totalPages={totalPages}
            onPageChange={handlePageChange}
            itemsPerPage={itemsPerPage}
          />
        </CCardBody>
      </CCard>

      {/* Proposal Acceptance Modal */}
      <ProposalAcceptanceModal
        show={showAcceptanceModal}
        onClose={() => setShowAcceptanceModal(false)}
        proposal={selectedProposalForAcceptance}
        onAcceptanceComplete={handleAcceptanceComplete}
        isContractor={isContractor}
      />
    </CContainer>
  );
};

export default withContractorScope(Proposals, 'proposals');