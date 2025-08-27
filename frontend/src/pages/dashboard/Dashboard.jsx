import { useState, useEffect, useMemo } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { fetchDashboardCounts, fetchLatestProposals } from '../../store/slices/dashboardSlice';
import { useTranslation } from 'react-i18next';
import {
  CContainer,
  CRow,
  CCol,
  CCard,
  CCardBody,
  CCardTitle,
  CButton,
  CNavbar,
  CNavbarNav,
  CNavItem,
  CNavLink,
  CBadge,
  CListGroup,
  CListGroupItem,
  CSpinner,
} from '@coreui/react';
import { useNavigate } from 'react-router-dom';
import axiosInstance from '../../helpers/axiosInstance';
import ContractorDashboard from '../contractor/ContractorDashboard';
import PageHeader from '../../components/PageHeader';

// Helper function to get auth headers
const getAuthHeaders = () => {
  const token = localStorage.getItem('token');
  return token ? { 'Authorization': `Bearer ${token}` } : {};
};


const modernCardStyle = {
  borderRadius: '16px',
  border: 'none',
  boxShadow: '0 4px 20px rgba(0, 0, 0, 0.08)',
  transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
  cursor: 'pointer',
  overflow: 'hidden',
  position: 'relative',
};

const hoverStyle = {
  transform: 'translateY(-4px)',
  boxShadow: '0 12px 40px rgba(0, 0, 0, 0.15)',
};

const gradientOverlay = {
  position: 'absolute',
  top: 0,
  left: 0,
  right: 0,
  bottom: 0,
  background: 'linear-gradient(135deg, rgba(255,255,255,0.1) 0%, rgba(255,255,255,0.05) 100%)',
  pointerEvents: 'none',
};

const Dashboard = () => {
  // Check if user is a contractor - stabilize user object
  const user = useMemo(() => {
    return JSON.parse(localStorage.getItem('user') || '{}');
  }, []);
  
  const isContractor = user.group && user.group.group_type === 'contractor';

  // If contractor, show contractor dashboard
  if (isContractor) {
    return <ContractorDashboard />;
  }

  // Regular admin/user dashboard
  const { t } = useTranslation();
  const activeProposals = useSelector(state => state.dashboard.activeProposals);
  const activeOrders = useSelector(state => state.dashboard.activeOrders);
  const latestProposals = useSelector(state => state.dashboard.latestProposals);
  const [displayedNumber, setDisplayedNumber] = useState(0);
  const [displayedOrders, setDisplayedOrders] = useState(0);
  const [hoveredCard, setHoveredCard] = useState(null);
  const [dummyLinks, setDummyLinks] = useState([]);
  const [dummyFiles, setDummyFiles] = useState([]);
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState('quick-access');

  const dispatch = useDispatch();

  const dummyProductUpdates = [
  ];




  useEffect(() => {
    dispatch(fetchDashboardCounts());
    dispatch(fetchLatestProposals());
  }, [dispatch]);



  useEffect(() => {
    fetchLinks();
    fetchFiles();
  }, []);

  const fetchLinks = async () => {
    try {

      const response = await axiosInstance.get('/api/resources/links', {
        headers: getAuthHeaders()
      });
      if (response.data.success) {
        setDummyLinks(response.data.data);
      }
    } catch (error) {
      // Error fetching links and files
    }
  }

  const fetchFiles = async () => {
    try {
            const response = await axiosInstance.get('/api/resources/files', {
              headers: getAuthHeaders()
            });
            if (response.data.success) {
                setDummyFiles(response.data.data);
            }

    } catch (error) {
      // Error fetching files
    }
  }


  useEffect(() => {
    let interval = null;
    if (activeProposals && activeProposals > 0) {
      interval = setInterval(() => {
        setDisplayedNumber(prev => {
          if (prev < activeProposals) {
            return prev + 1;
          } else {
            clearInterval(interval);
            return prev;
          }
        });
      }, 50);
    }
    return () => clearInterval(interval);
  }, [activeProposals]);

  useEffect(() => {
    let interval = null;
    if (activeOrders && activeOrders > 0) {
      interval = setInterval(() => {
        setDisplayedOrders(prev => {
          if (prev < activeOrders) {
            return prev + 1;
          } else {
            clearInterval(interval);
            return prev;
          }
        });
      }, 50);
    }
    return () => clearInterval(interval);
  }, [activeOrders]);

  const handleCreateProposal = () => {
    navigate('/proposals/create');
  };

  const handleCreateQuickProposal = () => {
    navigate('/proposals/create?quick=yes');
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'active': case 'approved': return 'success';
      case 'pending': case 'in-review': return 'warning';
      case 'draft': return 'info';
      case 'completed': return 'primary';
      default: return 'secondary';
    }
  };

  const translateStatus = (status) => {
    if (!status) return '';
    
    // Normalize the status string for mapping
    const normalizedStatus = status.toLowerCase().replace(/\s+/g, '');
    
    // Map specific status values to translation keys
    const statusMap = {
      'draft': 'draft',
      'sent': 'sent', 
      'accepted': 'accepted',
      'rejected': 'rejected',
      'expired': 'expired',
      'proposaldone': 'proposalDone',
      'measurementscheduled': 'measurementScheduled',
      'measurementdone': 'measurementDone',
      'designdone': 'designDone',
      'followup1': 'followUp1',
      'followup2': 'followUp2', 
      'followup3': 'followUp3',
      'proposalaccepted': 'proposalAccepted',
      'proposalrejected': 'proposalRejected'
    };
    
    const translationKey = statusMap[normalizedStatus] || normalizedStatus;
    return t(`status.${translationKey}`, status);
  };

  const getFileIcon = (type) => {
    switch (type) {
      case 'pdf': return '📄';
      case 'excel': return '📊';
      case 'video': return '🎥';
      case 'word': return '📝';
      default: return '📄';
    }
  };

  const getLinkIcon = (type) => {
    switch (type) {
      case 'external': return '🔗';
      case 'internal': return '🏠';
      case 'document': return '📚';
      case 'help': return '❓';
      default: return '🔗';
    }
  };

  const handleViewAllProposals = () => {
    navigate('/proposals');
  };


  return (
    <CContainer fluid className="dashboard-container">
      <PageHeader 
        title={t('dashboard.title', 'Dashboard')}
        rightContent={
          <div className="d-flex gap-2">
            <CButton
              color="primary"
              className="btn-gradient-cyan"
              onClick={handleCreateProposal}
            >
              {t('dashboard.newProposal')}
            </CButton>
            <CButton
              color="success"
              className="btn-gradient-green"
              onClick={handleCreateQuickProposal}
            >
              {t('dashboard.quickProposal')}
            </CButton>
          </div>
        }
      />

      {/* Stats Cards Row */}
      <CRow className="mb-4">
        <CCol lg={3} md={6} className="mb-4">
          <CCard className="stat-card stat-card-proposals">
            <CCardBody>
              <div className="d-flex align-items-center justify-content-center">
                <div className="stat-card-icon">📊</div>
                <div>
                  <h6 className="stat-card-title">{t('dashboard.activeProposals')}</h6>
                </div>
              </div>
              <h1 className="stat-card-number mt-3">
                {displayedNumber || <CSpinner size="sm" />}
              </h1>
            </CCardBody>
          </CCard>
        </CCol>

        <CCol lg={3} md={6} className="mb-4">
          <CCard className="stat-card stat-card-orders">
            <CCardBody>
              <div className="d-flex align-items-center justify-content-center">
                <div className="stat-card-icon">📦</div>
                <div>
                  <h6 className="stat-card-title">{t('dashboard.activeOrders')}</h6>
                </div>
              </div>
              <h1 className="stat-card-number mt-3">
                {displayedOrders || <CSpinner size="sm" />}
              </h1>
            </CCardBody>
          </CCard>
        </CCol>

        <CCol lg={6} className="mb-4">
          <CCard className="dashboard-card">
            <CCardBody>
              <CCardTitle>
                <span style={{ fontSize: '1.5rem' }}>📈</span>
                {t('dashboard.latestProductUpdates')}
              </CCardTitle>
              <CListGroup flush>
                {dummyProductUpdates.length > 0 ? (
                  dummyProductUpdates.map((update) => (
                    <CListGroupItem key={update.id}>
                      <div className="d-flex justify-content-between align-items-center">
                        <div>
                          <div className="fw-semibold">{update.title}</div>
                          <small className="text-muted">{update.date}</small>
                        </div>
                        <CBadge color={getStatusColor(update.status)} shape="rounded-pill">
                          {translateStatus(update.status)}
                        </CBadge>
                      </div>
                    </CListGroupItem>
                  ))
                ) : (
                  <div className="text-muted text-center py-5">{t('dashboard.noProductUpdates')}</div>
                )}
              </CListGroup>
            </CCardBody>
          </CCard>
        </CCol>
      </CRow>

      {/* Content Cards Row */}
      <CRow>
        <CCol lg={4} className="mb-4">
          <CCard className="dashboard-card">
            <CCardBody>
              <CCardTitle>
                <span style={{ fontSize: '1.5rem' }}>🔗</span>
                {t('dashboard.quickLinks')}
              </CCardTitle>
              <CListGroup flush>
                {dummyLinks.map((link) => (
                  <CListGroupItem key={link.id}>
                    <div className="d-flex align-items-start">
                      <span className="me-3 fs-5">{getLinkIcon(link.type)}</span>
                      <div>
                        <div className="fw-semibold">{link.title}</div>
                        <a
                          href={link.url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-decoration-none text-primary small"
                          style={{ wordBreak: 'break-all' }}
                        >
                          {link.url}
                        </a>
                      </div>
                    </div>
                  </CListGroupItem>
                ))}
              </CListGroup>
            </CCardBody>
          </CCard>
        </CCol>

        <CCol lg={4} className="mb-4">
          <CCard className="dashboard-card">
            <CCardBody>
              <CCardTitle>
                <span style={{ fontSize: '1.5rem' }}>📁</span>
                {t('dashboard.recentFiles')}
              </CCardTitle>
              <CListGroup flush>
                {dummyFiles.map((file) => (
                  <CListGroupItem key={file.id} style={{ cursor: 'pointer' }}>
                    <div className="d-flex align-items-center">
                      <span className="me-2">{getFileIcon(file.type)}</span>
                      <div>
                        <div className="fw-semibold text-dark small" style={{ wordBreak: 'break-all' }}>{file.name}</div>
                        <small className="text-muted">{file.size} • {file.date}</small>
                      </div>
                    </div>
                  </CListGroupItem>
                ))}
              </CListGroup>
            </CCardBody>
          </CCard>
        </CCol>

        <CCol lg={4} className="mb-4">
          <CCard className="dashboard-card">
            <CCardBody>
              <CCardTitle>
                <span style={{ fontSize: '1.5rem' }}>📝</span>
                {t('dashboard.myLatestProposals')}
              </CCardTitle>
              <CListGroup flush>
                {latestProposals.slice(0, 5).map((proposal) => (
                  <CListGroupItem key={proposal.id} style={{ cursor: 'pointer' }}>
                    <div className="d-flex justify-content-between align-items-start">
                      <div className="flex-grow-1">
                        <div className="fw-semibold text-dark small" style={{ wordBreak: 'break-all' }}>{proposal.description || 'No Description'}</div>
                        <small className="text-muted">{new Date(proposal.createdAt).toLocaleDateString()}</small>
                      </div>
                      <CBadge color={getStatusColor(proposal.status)} shape="rounded-pill" className="ms-2">
                        {translateStatus(proposal.status)}
                      </CBadge>
                    </div>
                  </CListGroupItem>
                ))}
              </CListGroup>
              <div className="text-center mt-3">
                <CButton
                  variant="outline"
                  color="secondary"
                  size="sm"
                  className="btn-view-all"
                  onClick={handleViewAllProposals}
                >
                  {t('dashboard.viewAllProposals')}
                </CButton>
              </div>
            </CCardBody>
          </CCard>
        </CCol>
      </CRow>
    </CContainer>
  );
};

export default Dashboard;