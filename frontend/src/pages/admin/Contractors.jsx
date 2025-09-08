import React, { useState, useEffect, useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { useDispatch, useSelector } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import { buildEncodedPath, genNoise } from '../../utils/obfuscate';
import {
  CContainer,
  CCard,
  CCardBody,
  CCardHeader,
  CRow,
  CCol,
  CInputGroup,
  CInputGroupText,
  CFormInput,
  CTable,
  CTableBody,
  CTableDataCell,
  CTableHead,
  CTableHeaderCell,
  CTableRow,
  CBadge,
  CSpinner,
  CAlert,
  CButton,
  CButtonGroup
} from '@coreui/react';
import CIcon from '@coreui/icons-react';
import { Search, Users, User, List as ViewModule, BriefcaseBusiness as Briefcase, BarChart3 as ChartBar, Settings } from '@/icons-lucide';
import { fetchContractors } from '../../store/slices/contractorSlice';
import PaginationComponent from '../../components/common/PaginationComponent';

const Contractors = () => {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const { t } = useTranslation();

  const { list: contractors, loading, error, pagination } = useSelector(state => state.contractors);

  const [searchTerm, setSearchTerm] = useState('');
  const [sortConfig, setSortConfig] = useState({ key: null, direction: 'asc' });
  const [itemsPerPage, setItemsPerPage] = useState(10);
  const [currentPage, setCurrentPage] = useState(1);

  useEffect(() => {
    dispatch(fetchContractors({ page: currentPage, limit: itemsPerPage }));
  }, [dispatch, currentPage, itemsPerPage]);

  const handleSort = (key) => {
    setSortConfig((prev) => {
      const direction = prev.key === key && prev.direction === 'asc' ? 'desc' : 'asc';
      return { key, direction };
    });
  };

  const handlePageChange = (page) => {
    setCurrentPage(page);
  };

  const handleView = (contractor) => {
  const noisy = `/${genNoise(6)}/${genNoise(8)}` + buildEncodedPath('/admin/contractors/:id', { id: contractor.id });
  navigate(noisy);
  };

  const sortedFilteredContractors = useMemo(() => {
    // Safety check for undefined contractors
    if (!contractors || !Array.isArray(contractors)) {
      return [];
    }

    let filtered = contractors.filter(
      (contractor) =>
        contractor.name?.toLowerCase().includes(searchTerm.toLowerCase())
    );

    if (sortConfig.key) {
      filtered.sort((a, b) => {
        let aVal = a[sortConfig.key];
        let bVal = b[sortConfig.key];

        if (sortConfig.key === 'user_count' || sortConfig.key === 'customer_count' || sortConfig.key === 'proposal_count') {
          aVal = parseInt(aVal) || 0;
          bVal = parseInt(bVal) || 0;
        }

        if (aVal < bVal) return sortConfig.direction === 'asc' ? -1 : 1;
        if (aVal > bVal) return sortConfig.direction === 'asc' ? 1 : -1;
        return 0;
      });
    }

    return filtered;
  }, [contractors, searchTerm, sortConfig]);

  const getModuleBadges = (modules) => {
    if (!modules) return null;

    const moduleLabels = {
      dashboard: t('contractorsAdmin.modules.dashboard'),
      proposals: t('contractorsAdmin.modules.proposals'),
      customers: t('contractorsAdmin.modules.customers'),
      resources: t('contractorsAdmin.modules.resources')
    };

    return Object.entries(modules)
      .filter(([key, value]) => value === true)
      .map(([key]) => (
        <CBadge key={key} color="info" className="me-1">
          {moduleLabels[key] || key}
        </CBadge>
      ));
  };

  const formatDate = (dateString) => {
    if (!dateString) return 'N/A';

    try {
      const date = new Date(dateString);
      // Check if the date is valid
      if (isNaN(date.getTime())) {
        return 'N/A';
      }
      return date.toLocaleDateString();
    } catch (error) {
      console.error('Error formatting date:', error);
      return 'N/A';
    }
  };

  const totalPages = pagination?.totalPages || 1;

  if (loading && contractors.length === 0) {
    return (
      <CContainer>
        <div className="d-flex justify-content-center align-items-center" style={{ minHeight: '200px' }}>
          <CSpinner color="primary" />
        </div>
      </CContainer>
    );
  }

  return (
    <CContainer className="px-4">
      <CRow>
        <CCol xs={12}>
          <CCard className="mb-4">
            <CCardHeader>
              <strong>
                <Users className="me-2" size={18} aria-hidden="true" />
                {t('contractorsAdmin.header')}
              </strong>
            </CCardHeader>

            <CCardBody>
              {error && (
                <CAlert color="danger" className="mb-3">
                  {error}
                </CAlert>
              )}

              {/* Search and Stats */}
              <CRow className="mb-4">
                <CCol md={6}>
                  <CInputGroup>
                    <CInputGroupText aria-hidden="true">
                      <Search size={16} />
                    </CInputGroupText>
                    <CFormInput
                      type="text"
                      placeholder={t('contractorsAdmin.searchPlaceholder')}
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                    />
                  </CInputGroup>
                </CCol>
                <CCol md={6} className="d-flex justify-content-end align-items-center">
                  <div className="text-muted">
                    <small>
                      {t('contractorsAdmin.showing', { count: sortedFilteredContractors?.length || 0, total: pagination?.total || 0 })}
                    </small>
                  </div>
                </CCol>
              </CRow>

              {/* Stats Cards */}
              <CRow className="mb-4">
                <CCol sm={6} lg={3}>
                  <div className="border-start border-start-4 border-start-info py-1 px-3">
                    <div className="text-muted small">{t('contractorsAdmin.stats.totalContractors')}</div>
                    <div className="fs-5 fw-semibold">{pagination?.total || 0}</div>
                  </div>
                </CCol>
                <CCol sm={6} lg={3}>
                  <div className="border-start border-start-4 border-start-success py-1 px-3">
                    <div className="text-muted small">{t('contractorsAdmin.stats.totalUsers')}</div>
                    <div className="fs-5 fw-semibold">
                      {(contractors || []).reduce((sum, c) => sum + (parseInt(c.user_count) || 0), 0)}
                    </div>
                  </div>
                </CCol>
                <CCol sm={6} lg={3}>
                  <div className="border-start border-start-4 border-start-warning py-1 px-3">
                    <div className="text-muted small">{t('contractorsAdmin.stats.totalCustomers')}</div>
                    <div className="fs-5 fw-semibold">
                      {(contractors || []).reduce((sum, c) => sum + (parseInt(c.customer_count) || 0), 0)}
                    </div>
                  </div>
                </CCol>
                <CCol sm={6} lg={3}>
                  <div className="border-start border-start-4 border-start-danger py-1 px-3">
                    <div className="text-muted small">{t('contractorsAdmin.stats.totalProposals')}</div>
                    <div className="fs-5 fw-semibold">
                      {(contractors || []).reduce((sum, c) => sum + (parseInt(c.proposal_count) || 0), 0)}
                    </div>
                  </div>
                </CCol>
              </CRow>

              {/* Desktop Table */}
              <div className="table-wrap d-none d-md-block">
                <CTable hover className="table-modern">
                  <CTableHead>
                    <CTableRow>
                      <CTableHeaderCell
                        scope="col"
                        className="cursor-pointer"
                        onClick={() => handleSort('name')}
                      >
                        {t('contractorsAdmin.table.contractorName')}
                        {/* sort caret is visual only here; screen readers rely on column header click */}
                      </CTableHeaderCell>
                      <CTableHeaderCell
                        scope="col"
                        className="cursor-pointer text-center"
                        onClick={() => handleSort('user_count')}
                      >
                        {t('contractorsAdmin.table.users')}

                      </CTableHeaderCell>
                      <CTableHeaderCell
                        scope="col"
                        className="cursor-pointer text-center"
                        onClick={() => handleSort('customer_count')}
                      >
                        {t('contractorsAdmin.table.customers')}

                      </CTableHeaderCell>
                      <CTableHeaderCell
                        scope="col"
                        className="cursor-pointer text-center"
                        onClick={() => handleSort('proposal_count')}
                      >
                        {t('contractorsAdmin.table.proposals')}

                      </CTableHeaderCell>
                      <CTableHeaderCell scope="col">
                        {t('contractorsAdmin.table.modules')}
                      </CTableHeaderCell>
                      <CTableHeaderCell
                        scope="col"
                        className="cursor-pointer"
                        onClick={() => handleSort('created_at')}
                      >
                        {t('contractorsAdmin.table.created')}

                      </CTableHeaderCell>
                      <CTableHeaderCell scope="col" className="text-center">
                        {t('contractorsAdmin.table.actions')}
                      </CTableHeaderCell>
                    </CTableRow>
                  </CTableHead>
                  <CTableBody>
                    {sortedFilteredContractors?.length === 0 ? (
                      <CTableRow>
                        <CTableDataCell colSpan="7" className="text-center py-4">
              <Search size={28} className="mb-3 opacity-50" aria-hidden="true" />
                          <p className="text-muted mb-0">{t('contractorsAdmin.empty.title')}</p>
                          <small>{t('contractorsAdmin.empty.tryAdjusting')}</small>
                        </CTableDataCell>
                      </CTableRow>
                    ) : (
                      sortedFilteredContractors?.map((contractor) => (
                        <CTableRow key={contractor.id} className="align-middle">
                          <CTableDataCell>
                            <div className="d-flex align-items-center">
                <Users className="me-2 text-muted" size={18} aria-hidden="true" />
                              <div>
                                <div className="fw-semibold">{contractor.name}</div>
                                <small className="text-muted">ID: {contractor.id}</small>
                              </div>
                            </div>
                          </CTableDataCell>
                          <CTableDataCell className="text-center">
                            <CBadge color="primary">
                              {contractor.user_count || 0}
                            </CBadge>
                          </CTableDataCell>
                          <CTableDataCell className="text-center">
                            <CBadge color="warning">
                              {contractor.customer_count || 0}
                            </CBadge>
                          </CTableDataCell>
                          <CTableDataCell className="text-center">
                            <CBadge color="success">
                              {contractor.proposal_count || 0}
                            </CBadge>
                          </CTableDataCell>
                          <CTableDataCell>
                            <div className="d-flex flex-wrap gap-1">
                              {getModuleBadges(contractor.modules) || (
                                <small className="text-muted">{t('contractorsAdmin.noModules')}</small>
                              )}
                            </div>
                          </CTableDataCell>
                          <CTableDataCell>
                            <small className="text-muted">
                              {formatDate(contractor.created_at)}
                            </small>
                          </CTableDataCell>
                          <CTableDataCell className="text-center">
                            <CButton
                              color="outline-primary"
                              size="sm"
                              onClick={() => handleView(contractor)}
                              className="icon-btn"
                              aria-label={t('contractorsAdmin.actions.viewDetails')}
                              title={t('contractorsAdmin.actions.viewDetails')}
                            >
                              <ChartBar size={16} aria-hidden="true" />
                            </CButton>
                          </CTableDataCell>
                        </CTableRow>
                      ))
                    )}
                  </CTableBody>
                </CTable>
              </div>

              {/* Mobile Card Layout */}
              <div className="d-md-none">
                {sortedFilteredContractors?.length === 0 ? (
                  <CCard>
                    <CCardBody className="text-center py-4">
                      <Search size={28} className="mb-3 opacity-50" aria-hidden="true" />
                      <p className="text-muted mb-0">{t('contractorsAdmin.empty.title')}</p>
                      <small>{t('contractorsAdmin.empty.tryAdjusting')}</small>
                    </CCardBody>
                  </CCard>
                ) : (
                  <div className="mobile-contractor-cards">
                    {sortedFilteredContractors?.map((contractor) => (
                      <CCard key={contractor.id} className="mb-3 contractor-mobile-card">
                        <CCardBody className="p-3">
                          {/* Header with name and action */}
                          <div className="d-flex justify-content-between align-items-start mb-3">
                            <div className="d-flex align-items-center flex-grow-1">
                              <Users className="me-2 text-muted" size={18} aria-hidden="true" />
                              <div className="flex-grow-1 min-width-0">
                                <div className="fw-semibold text-truncate" title={contractor.name}>
                                  {contractor.name}
                                </div>
                                <small className="text-muted">ID: {contractor.id}</small>
                              </div>
                            </div>
                            <CButton
                              color="outline-primary"
                              size="sm"
                              onClick={() => handleView(contractor)}
                              title={t('contractorsAdmin.actions.viewDetails')}
                              aria-label={t('contractorsAdmin.actions.viewDetails')}
                              className="ms-2 contractor-action-btn icon-btn"
                            >
                              <ChartBar size={16} aria-hidden="true" />
                            </CButton>
                          </div>

                          {/* Stats row */}
                          <div className="row g-2 mb-3">
                            <div className="col-4 text-center">
                              <div className="small text-muted">{t('contractorsAdmin.table.users')}</div>
                              <CBadge color="primary" className="w-100">
                                {contractor.user_count || 0}
                              </CBadge>
                            </div>
                            <div className="col-4 text-center">
                              <div className="small text-muted">{t('contractorsAdmin.table.customers')}</div>
                              <CBadge color="warning" className="w-100">
                                {contractor.customer_count || 0}
                              </CBadge>
                            </div>
                            <div className="col-4 text-center">
                              <div className="small text-muted">{t('contractorsAdmin.table.proposals')}</div>
                              <CBadge color="success" className="w-100">
                                {contractor.proposal_count || 0}
                              </CBadge>
                            </div>
                          </div>

                          {/* Modules */}
                          <div className="mb-2">
                            <div className="small text-muted mb-1">{t('contractorsAdmin.table.modules')}</div>
                            <div className="d-flex flex-wrap gap-1">
                              {getModuleBadges(contractor.modules) || (
                                <small className="text-muted">{t('contractorsAdmin.noModules')}</small>
                              )}
                            </div>
                          </div>

                          {/* Created date */}
                          <div className="text-end">
                            <small className="text-muted">
                              {t('contractorsAdmin.table.created')}: {formatDate(contractor.created_at)}
                            </small>
                          </div>
                        </CCardBody>
                      </CCard>
                    ))}
                  </div>
                )}
              </div>

              {/* Pagination */}
              {totalPages > 1 && (
                <div className="p-3 border-top border-light">
                  <PaginationComponent
                    currentPage={currentPage}
                    totalPages={totalPages}
                    onPageChange={handlePageChange}
                    itemsPerPage={itemsPerPage}
                  />
                </div>
              )}
            </CCardBody>
          </CCard>
        </CCol>
      </CRow>
    </CContainer>
  );
};

export default Contractors;
