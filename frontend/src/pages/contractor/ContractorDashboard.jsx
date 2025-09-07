import React, { useEffect, useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router-dom';
import {
  CCard,
  CCardBody,
  CCardHeader,
  CCol,
  CRow,
  CSpinner,
  CAlert,
  CContainer,
  CButton
} from '@coreui/react';
import CIcon from '@coreui/icons-react';
import { cilDescription, cilUser } from '@coreui/icons';
import axiosInstance from '../../helpers/axiosInstance';

const ContractorDashboard = () => {
  const navigate = useNavigate();
  const { t } = useTranslation();
  const [stats, setStats] = useState({
    proposals: 0,
    customers: 0
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Stabilize user object to prevent re-renders
  const user = useMemo(() => {
    return JSON.parse(localStorage.getItem('user') || '{}');
  }, []);

  const groupName = user.group?.name || 'Unknown Group';

  // Stabilize groupId to prevent re-renders
  const groupId = useMemo(() => {
    return user.group?.id ?? user.group_id ?? user.groupId ?? user.group?.group_id ?? null;
  }, [user.group?.id, user.group_id, user.groupId, user.group?.group_id]);

  const modulesList = useMemo(() => {
    const raw = user.group?.modules;
    try {
      if (Array.isArray(raw)) return raw;
      if (typeof raw === 'string' && raw.trim()) {
        const parsed = JSON.parse(raw);
        // Re-run normalization on parsed value
        if (Array.isArray(parsed)) return parsed;
        if (parsed && typeof parsed === 'object') {
          return Object.entries(parsed)
            .filter(([, v]) => !!v)
            .map(([k]) => k);
        }
        return [];
      }
      if (raw && typeof raw === 'object') {
        return Object.entries(raw)
          .filter(([, v]) => !!v)
          .map(([k]) => k);
      }
      return [];
    } catch (e) {
      console.warn('Failed to parse modules JSON; defaulting to []', e);
      return [];
    }
  }, [JSON.stringify(user.group?.modules)]);

  useEffect(() => {
    const fetchStats = async () => {
      try {
        setLoading(true);

        // Fetch real stats from APIs
  // axiosInstance includes base URL and auth by default

        let proposalsCount = 0;
        let customersCount = 0;
  // Removed users/team members count for contractor dashboard

        // Fetch proposals count if module is enabled
        if (modulesList.includes('proposals')) {
          try {
            const proposalsResponse = await axiosInstance.get('/api/quotes');
            const proposalsData = proposalsResponse.data;
            const allProposals = Array.isArray(proposalsData)
              ? proposalsData
              : (proposalsData?.proposals || proposalsData?.data || proposalsData?.items || []);

            // Filter to contractor's own group if groupId present
            const ownProposals = groupId
              ? allProposals.filter(p => {
                  const og = p?.owner_group_id ?? p?.ownerGroupId ?? p?.group_id ?? p?.groupId;
                  return og === groupId;
                })
              : allProposals;

            proposalsCount = ownProposals.length;
          } catch (err) {
            console.warn('Failed to fetch proposals count:', err);
          }
        }

        // Fetch customers count if module is enabled
        if (modulesList.includes('customers')) {
          try {
            const customersResponse = await axiosInstance.get('/api/customers');
            const customersData = customersResponse.data;
            const allCustomers = Array.isArray(customersData)
              ? customersData
              : (customersData?.customers || customersData?.data || customersData?.items || []);

            const ownCustomers = groupId
              ? allCustomers.filter(c => {
                  const cg = c?.owner_group_id ?? c?.ownerGroupId ?? c?.group_id ?? c?.groupId;
                  return cg === groupId;
                })
              : allCustomers;

            customersCount = ownCustomers.length;
          } catch (err) {
            console.warn('Failed to fetch customers count:', err);
          }
        }

        setStats({
          proposals: proposalsCount,
          customers: customersCount
        });
      } catch (err) {
  setError(t('dashboard.loadError'));
        console.error('Dashboard error:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchStats();
  }, [groupId]); // Simplified dependencies - removed modulesList since it's used inside the effect

  if (loading) {
    return (
      <CContainer className="d-flex justify-content-center align-items-center" style={{ minHeight: '200px' }}>
  <CSpinner />
      </CContainer>
    );
  }

  return (
    <CContainer fluid>
      <CRow>
        <CCol xs={12}>
          <CCard className="mb-4">
            <CCardHeader>
              <h4 className="mb-0">{t('dashboard.welcome', { group: groupName })}</h4>
              <p className="text-muted mb-0">{t('dashboard.portal')}</p>
            </CCardHeader>
            <CCardBody>
              {error && (
                <CAlert color="danger" className="mb-3">
                  {error}
                </CAlert>
              )}

              {/* Removed verbose Enabled Modules badges section for a cleaner dashboard */}

              <CRow>
                {modulesList.includes('proposals') && (
                  <CCol sm={6} lg={4} className="mb-3">
                    <CCard className="text-white bg-primary">
                      <CCardBody className="pb-0 d-flex justify-content-between align-items-start">
                        <div>
                          <div className="fs-4 fw-semibold">{stats.proposals}</div>
                          <div>{t('nav.proposals')}</div>
                        </div>
                        <div className="bg-body-secondary bg-opacity-25 rounded p-2">
                          <CIcon icon={cilDescription} size="lg" />
                        </div>
                      </CCardBody>
                    </CCard>
                  </CCol>
                )}

                {modulesList.includes('customers') && (
                  <CCol sm={6} lg={4} className="mb-3">
                    <CCard className="text-white bg-success">
                      <CCardBody className="pb-0 d-flex justify-content-between align-items-start">
                        <div>
                          <div className="fs-4 fw-semibold">{stats.customers}</div>
                          <div>{t('nav.customers')}</div>
                        </div>
                        <div className="bg-body-secondary bg-opacity-25 rounded p-2">
                          <CIcon icon={cilUser} size="lg" />
                        </div>
                      </CCardBody>
                    </CCard>
                  </CCol>
                )}

                {/* Team Members card removed for contractor dashboard */}
              </CRow>

              <CRow>
                <CCol xs={12}>
                  <CCard>
                    <CCardHeader>
                      <h6 className="mb-0">{t('dashboard.quickActions')}</h6>
                    </CCardHeader>
                    <CCardBody>
                      <div className="d-flex flex-wrap gap-2">
                        {modulesList.includes('proposals') && (
                          <CButton
                            color="primary"
                            variant="outline"
                            onClick={() => navigate('/quotes/create')}
                          >
                            {t('dashboard.createProposal')}
                          </CButton>
                        )}
                        {modulesList.includes('customers') && (
                          <CButton
                            color="success"
                            variant="outline"
                            onClick={() => navigate('/customers/add')}
                          >
                            {t('nav.addCustomer')}
                          </CButton>
                        )}
                        <CButton
                          color="info"
                          variant="outline"
                          onClick={() => navigate('/profile')}
                        >
                          {t('dashboard.viewProfile')}
                        </CButton>
                      </div>
                    </CCardBody>
                  </CCard>
                </CCol>
              </CRow>
            </CCardBody>
          </CCard>
        </CCol>
      </CRow>
    </CContainer>
  );
};

export default ContractorDashboard;
