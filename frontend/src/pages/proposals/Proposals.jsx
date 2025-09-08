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
import { buildEncodedPath, genNoise } from '../../utils/obfuscate';
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
import PageHeader from '../../components/PageHeader';
import { FaBriefcase } from 'react-icons/fa';

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
    // By default, hide accepted/locked items from the All tab so accepted quotes "disappear" from quotes
    const normalized = (item.status || '').toLowerCase();
    const isAcceptedLike = normalized === 'accepted' || item.status === 'Proposal accepted' || item.is_locked;
    if (activeTab === 'All' && isAcceptedLike) return false;

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
    navigate('/quotes/create');
  };

  const handleCreateQuickProposal = () => {
    navigate('/quotes/create?quick=yes');
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
    console.log('🎯 [DEBUG] handleAcceptProposal called from Proposals.jsx:', {
      proposalId: proposal?.id,
      proposalStatus: proposal?.status,
      isLocked: proposal?.is_locked,
      timestamp: new Date().toISOString()
    });
    setSelectedProposalForAcceptance(proposal);
    setShowAcceptanceModal(true);
  };

  const handleAcceptanceComplete = () => {
    console.log('🔄 [DEBUG] handleAcceptanceComplete called:', {
      isContractor,
      contractorGroupId,
      timestamp: new Date().toISOString()
    });
    // Refresh proposals list (for counts) and redirect to Orders so users immediately see the new order
    const groupId = isContractor ? contractorGroupId : null;
    dispatch(getProposal(groupId));
    setSelectedProposalForAcceptance(null);
    const ordersPath = isContractor ? '/my-orders' : '/orders';
    console.log('🔀 [DEBUG] Redirecting to:', ordersPath);
    navigate(ordersPath);
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
              Swal.fire(t('common.deleted') || 'Deleted', t('proposals.toast.deleted') || 'Your quote has been deleted.', 'success');
              const groupId = isContractor ? contractorGroupId : null;
              dispatch(getProposal(groupId));
            } else {
              Swal.fire(t('common.error'), t('proposals.toast.deleteFailed') || 'Failed to delete the quote.', 'error');
            }
          });
      }
    });
  };

  const handleCreateShareLink = async (proposal) => {
  // Defense-in-depth: contractors should not create share links
  if (isContractor) return;
    try {
      const res = await axiosInstance.post(`/api/quotes/${proposal.id}/sessions`);
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
  const noisy = `/${genNoise(6)}/${genNoise(8)}` + buildEncodedPath('/quotes/edit/:id', { id });
  navigate(noisy);
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
      {/* Scoped mobile layout improvements for Quotes */}
      <style>{`
        /* Visibility helpers hook into our global _responsive.scss classes */
        .q-toolbar { position: sticky; top: 0; z-index: 1030; background: var(--surface, #fff); padding: .5rem; border-bottom: 1px solid var(--border, #e5e7eb); }
        .q-chips { display: grid; grid-auto-flow: column; grid-auto-columns: max-content; gap: .5rem; overflow-x: auto; -webkit-overflow-scrolling: touch; padding: .25rem .125rem; }
        .q-search .form-control { min-height: 44px; }
        .q-list { display: grid; gap: .5rem; content-visibility: auto; contain-intrinsic-size: 300px; }
        .q-list .card--compact { border-radius: 12px; border: 1px solid var(--border, #e5e7eb); }
        .q-list .card__head { display: grid; grid-template-columns: 1fr auto; align-items: center; gap: .5rem; }
        .q-list .status-pill { justify-self: end; }
        .q-actions { display: flex; gap: .375rem; align-items: center; margin-top: .5rem; }
        .q-actions .icon-btn, .q-actions .btn-icon { min-width: 44px; min-height: 44px; }
        .bottom-bar { position: sticky; bottom: 0; z-index: 1030; display: grid; grid-template-columns: 1fr 1fr; gap: .5rem; padding: .5rem; background: color-mix(in oklch, var(--surface, #fff) 90%, #fff); border-top: 1px solid var(--border, #e5e7eb); }
        .clamp-2 { display: -webkit-box; -webkit-line-clamp: 2; -webkit-box-orient: vertical; overflow: hidden; }
        /* Desktop table wrapper */
        .table-wrap { overflow-x: auto; -webkit-overflow-scrolling: touch; }
      `}</style>
      {/* Header Section */}
      <PageHeader
        title={t('proposals.header')}
        subtitle={t('proposals.subtitle')}
        icon={FaBriefcase}
      >
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
      </PageHeader>

  {/* Status Tabs (desktop only) */}
  <div className="segmented u-desktop" role="tablist" aria-label={t('proposals.tabs.ariaLabel', 'Quote status tabs')}>
        {tabs.map((tab, idx) => {
          const isActive = activeTab === tab;
          const count = tabCounts[tab] || 0;
          if (count === 0 && tab !== 'All' && !tabs.slice(0, 6).includes(tab)) return null; // Hide unused legacy tabs
          return (
            <label key={idx} className={isActive ? 'selected' : ''}>
              <input
                type="radio"
                name="proposalTab"
                value={tab}
                checked={isActive}
                onChange={() => {
                  setActiveTab(tab);
                  setCurrentPage(1);
                }}
              />
              {getTabLabel(tab)}
              <CBadge
                color={isActive ? 'light' : 'secondary'}
                shape="rounded-pill"
                className="ms-2"
              >
                {count}
              </CBadge>
            </label>
          );
        })}
      </div>

  {/* Search and Filters (desktop only) */}
  <div className="toolbar u-desktop" role="search">
        <CInputGroup>
          <CInputGroupText>
            <CIcon icon={cilSearch} />
          </CInputGroupText>
          <CFormInput
            type="text"
            className="search"
            placeholder={t('proposals.searchPlaceholder')}
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </CInputGroup>
        <small className="text-muted">
          {t('proposals.showingCount', { count: filteredProposals?.length || 0, total: proposal?.length || 0 })}
        </small>
      </div>

  {/* Desktop Table */}
      <div className="u-desktop">
        <div className="table-wrap">
        <CCard className="data-table-card">
          <CTable hover className="table-modern" role="table">
            <CTableHead>
              <CTableRow>
                <CTableHeaderCell scope="col" className="sticky-col">{t('proposals.headers.date')}</CTableHeaderCell>
                <CTableHeaderCell scope="col">{t('proposals.headers.customer')}</CTableHeaderCell>
                <CTableHeaderCell scope="col">{t('proposals.headers.description')}</CTableHeaderCell>
                {canAssignDesigner && <CTableHeaderCell scope="col">{t('proposals.headers.designer')}</CTableHeaderCell>}
                <CTableHeaderCell scope="col">{t('proposals.headers.status')}</CTableHeaderCell>
                <CTableHeaderCell scope="col" className="text-center">{t('proposals.headers.actions')}</CTableHeaderCell>
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
                          <button
                            className="icon-btn"
                            aria-label={t('common.edit')}
                            onClick={() => handleNavigate(item.id)}
                          >
                            <CIcon icon={cilPencil} />
                          </button>
                        </PermissionGate>
                        {!item.is_locked && (
                          <PermissionGate action="delete" resource="proposal" item={item}>
                            <button
                              className="icon-btn"
                              aria-label={t('common.delete')}
                              onClick={() => handleDelete(item.id)}
                            >
                              <CIcon icon={cilTrash} />
                            </button>
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
      </div>

      {/* Mobile Compact UI */}
      {(() => {
        // Mobile-only helpers
        const mobilePageSize = 10;
        const [mobileCount, setMobileCount] = useState(mobilePageSize);
        const mobileItems = (filteredProposals || []).slice(0, mobileCount);

        return (
          <>
            {/* Sticky toolbar */}
            <div className="q-toolbar u-mobile" role="region" aria-label={t('proposals.mobile.toolbar', 'Filters and search')}>
              <div className="q-chips">
                {tabs.slice(0, 6).map((tab, idx) => {
                  const count = tabCounts[tab] || 0;
                  if (count === 0 && tab !== 'All') return null;
                  const isActive = activeTab === tab;
                  return (
                    <button
                      key={`chip-${idx}`}
                      type="button"
                      className={`btn btn-sm ${isActive ? 'btn-dark' : 'btn-light'}`}
                      style={{ borderRadius: '999px' }}
                      onClick={() => { setActiveTab(tab); setCurrentPage(1); setMobileCount(mobilePageSize); }}
                      aria-pressed={isActive}
                      aria-label={`${getTabLabel(tab)} (${count})`}
                    >
                      {getTabLabel(tab)} <span className="ms-1 badge text-bg-secondary">{count}</span>
                    </button>
                  );
                })}
              </div>
              <div className="mt-2">
                <CInputGroup className="q-search">
                  <CInputGroupText><CIcon icon={cilSearch} /></CInputGroupText>
                  <CFormInput
                    type="text"
                    placeholder={t('proposals.searchPlaceholder')}
                    value={searchTerm}
                    onChange={(e) => { setSearchTerm(e.target.value); setMobileCount(mobilePageSize); }}
                    aria-label={t('proposals.searchAria', 'Search quotes by customer')}
                  />
                </CInputGroup>
              </div>
            </div>

            {/* Compact card list */}
            <div className="q-list u-mobile">
              {mobileItems.length === 0 ? (
                <div className="card--compact text-center">
                  <CIcon icon={cilSearch} size="xl" className="text-muted mb-2" />
                  <div>{t('proposals.empty.title')}</div>
                  <div className="text-muted" style={{ fontSize: 'var(--fs-sub)' }}>{t('proposals.empty.subtitle')}</div>
                </div>
              ) : (
                mobileItems.map((item) => (
                  <div key={item.id} className="card--compact">
                    <div className="card__head">
                      <h3 className="card__title">{item.customer?.name || t('common.na')}</h3>
                      <CBadge color={getStatusColor(item.status || 'Draft')} className="status-pill">
                        {getTabLabel(item.status || 'Draft')}
                      </CBadge>
                    </div>
                    <div className="card__meta">
                      <span>{new Date(item.date || item.createdAt).toLocaleDateString()}</span>
                      {canAssignDesigner && (
                        <span>{t('proposals.headers.designer')}: {item.designerData?.name || t('common.na')}</span>
                      )}
                      {item.manufacturer?.name && (
                        <span>{item.manufacturer.name}</span>
                      )}
                    </div>
                    {item.description && (
                      <p className="clamp-2">{item.description}</p>
                    )}
                    <div className="q-actions">
                      {/* Primary visible actions */}
                      {!item.is_locked && (
                        <button
                          type="button"
                          className="icon-btn"
                          aria-label={t('proposals.actions.send')}
                          onClick={() => handleSendProposal(item.id)}
                        >
                          <CIcon icon={cilPaperPlane} />
                        </button>
                      )}
                      <button
                        type="button"
                        className="icon-btn"
                        onClick={() => handleNavigate(item.id)}
                        aria-label={t('common.edit')}
                      >
                        <CIcon icon={cilPencil} />
                      </button>
                      {/* Overflow menu for secondary actions (e.g., Delete) */}
                      <CDropdown alignment="end">
                        <CDropdownToggle color="light" size="sm" className="btn-icon" aria-label={t('common.moreActions', 'More actions')}>
                          ⋮
                        </CDropdownToggle>
                        <CDropdownMenu>
                          {!item.is_locked && (
                            <CDropdownItem onClick={() => handleDelete(item.id)}>
                              <CIcon icon={cilTrash} className="me-2" /> {t('common.delete')}
                            </CDropdownItem>
                          )}
                          <CDropdownItem onClick={() => handleCreateShareLink(item)}>
                            <CIcon icon={cilSend} className="me-2" /> {t('proposals.actions.share')}
                          </CDropdownItem>
                        </CDropdownMenu>
                      </CDropdown>
                    </div>
                  </div>
                ))
              )}
              {filteredProposals && mobileCount < filteredProposals.length && (
                <div className="text-center mt-2">
                  <button type="button" className="btn btn-light" onClick={() => setMobileCount((c) => c + mobilePageSize)}>
                    {t('common.loadMore', 'Load more')}
                  </button>
                </div>
              )}
            </div>

            {/* Bottom bar with primary action */}
            <div className="bottom-bar u-mobile" role="region" aria-label={t('proposals.mobile.primaryActions', 'Primary quote actions')}>
              <PermissionGate permission="proposals:create">
                <CButton color="success" className="flex-fill" onClick={handleCreateQuickProposal}>
                  {t('proposals.quick')}
                </CButton>
              </PermissionGate>
              <PermissionGate permission="proposals:create">
                <CButton color="light" className="flex-fill" onClick={handleCreateProposal}>
                  {t('proposals.new')}
                </CButton>
              </PermissionGate>
            </div>
          </>
        );
      })()}

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