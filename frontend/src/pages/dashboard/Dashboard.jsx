import { useState, useEffect } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { fetchDashboardCounts, fetchLatestProposals } from '../../store/slices/dashboardSlice';
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

      const response = await axiosInstance.get('/api/resources/links');
      if (response.data.success) {
        setDummyLinks(response.data.data);
      }
    } catch (error) {

      console.log('error in fetchLinksandFiles', error)

    }
  }

  const fetchFiles = async () => {
    try {
            const response = await axiosInstance.get('/api/resources/files');
            if (response.data.success) {
                setDummyFiles(response.data.data);
            }

    } catch (error) {

      console.log('error in fetchLinksandFiles', error)

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
    <CContainer fluid className="p-2 m-2 main-dashboard" style={{ backgroundColor: '#f8fafc', minHeight: '100vh' }}>
      {/* Modern Navigation Header */}
      <CNavbar>
        <CNavbarNav className="me-auto d-flex flex-row">
        </CNavbarNav>
        <div className="d-flex gap-2">
          <CButton
            style={{
              background: 'linear-gradient(135deg, #06b6d4 0%, #0ea5e9 100%)',
              border: 'none',
              fontWeight: '600',
              padding: '10px 20px',
              boxShadow: '0 4px 15px rgba(6, 182, 212, 0.3)',
              transition: 'all 0.3s ease'
            }}
            className="text-white"
            onClick={handleCreateProposal}
            onMouseEnter={(e) => e.target.style.transform = 'translateY(-2px)'}
            onMouseLeave={(e) => e.target.style.transform = 'translateY(0px)'}
          >
            New Proposal
          </CButton>
          <CButton
            style={{
              background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)',
              border: 'none',
              fontWeight: '600',
              padding: '10px 20px',
              boxShadow: '0 4px 15px rgba(16, 185, 129, 0.3)',
              transition: 'all 0.3s ease'
            }}
            className="text-white"
            onClick={handleCreateQuickProposal}
            onMouseEnter={(e) => e.target.style.transform = 'translateY(-2px)'}
            onMouseLeave={(e) => e.target.style.transform = 'translateY(0px)'}
          >
            Quick Proposal
          </CButton>
        </div>
      </CNavbar>

      {activeTab === 'quick-access' && (
        <>
          {/* Stats Cards Row */}
          <CRow className="mb-4">
            <CCol lg={3} md={6} className="mb-4">
              <CCard
                style={{
                  ...modernCardStyle,
                  background: 'linear-gradient(135deg, #fbbf24 0%, #f59e0b 100%)',
                  color: 'white',
                  ...(hoveredCard === 'proposals' ? hoverStyle : {}),
                }}
                onMouseEnter={() => setHoveredCard('proposals')}
                onMouseLeave={() => setHoveredCard(null)}
              >
                <div style={gradientOverlay}></div>
                <CCardBody className="text-center position-relative" style={{ zIndex: 1 }}>
                  <div className="d-flex align-items-center justify-content-center mb-3">
                    <div style={{ fontSize: '2.5rem', marginRight: '12px' }}>📊</div>
                    <div>
                      <h6 className="mb-0 fw-bold opacity-90">Active Proposals</h6>
                    </div>
                  </div>
                  <h1 className="display-4 fw-bold mb-0" style={{ textShadow: '0 2px 10px rgba(0,0,0,0.1)' }}>
                    {displayedNumber || <CSpinner size="sm" />}
                  </h1>
                </CCardBody>
              </CCard>
            </CCol>

            <CCol lg={3} md={6} className="mb-4">
              <CCard
                style={{
                  ...modernCardStyle,
                  background: 'linear-gradient(135deg, #06b6d4 0%, #0891b2 100%)',
                  color: 'white',
                  ...(hoveredCard === 'orders' ? hoverStyle : {}),
                }}
                onMouseEnter={() => setHoveredCard('orders')}
                onMouseLeave={() => setHoveredCard(null)}
              >
                <div style={gradientOverlay}></div>
                <CCardBody className="text-center position-relative" style={{ zIndex: 1 }}>
                  <div className="d-flex align-items-center justify-content-center mb-3">
                    <div style={{ fontSize: '2.5rem', marginRight: '12px' }}>📦</div>
                    <div>
                      <h6 className="mb-0 fw-bold opacity-90">Active Orders</h6>
                    </div>
                  </div>
                  <h1 className="display-4 fw-bold mb-0" style={{ textShadow: '0 2px 10px rgba(0,0,0,0.1)' }}>
                    {displayedOrders || <CSpinner size="sm" />}
                  </h1>
                </CCardBody>
              </CCard>
            </CCol>

            <CCol lg={6} className="mb-4">
              <CCard style={modernCardStyle}>
                <CCardBody>
                  <div className="d-flex align-items-center mb-3">
                    <div style={{ fontSize: '1.5rem', marginRight: '12px' }}>📈</div>
                    <CCardTitle className="mb-0 fw-bold text-dark">Latest Product Updates</CCardTitle>
                  </div>
                  <CListGroup flush>
                    {dummyProductUpdates.length > 0 ? (
                      <CListGroup flush>
                        {dummyProductUpdates.map((update) => (
                          <CListGroupItem key={update.id} className="border-0 px-0 py-2">
                            <div className="d-flex justify-content-between align-items-center">
                              <div>
                                <div className="fw-semibold text-dark">{update.title}</div>
                                <small className="text-muted">{update.date}</small>
                              </div>
                              <CBadge color={getStatusColor(update.status)} shape="rounded-pill">
                                {update.status}
                              </CBadge>
                            </div>
                          </CListGroupItem>
                        ))}
                      </CListGroup>
                    ) : (
                      <div className="text-muted text-center py-3">No product updates available.</div>
                    )}

                  </CListGroup>
                </CCardBody>
              </CCard>
            </CCol>
          </CRow>

          {/* Content Cards Row */}
          <CRow>
            <CCol lg={4} className="mb-4">
              <CCard style={modernCardStyle}>
                <CCardBody>
                  <div className="d-flex align-items-center mb-3">
                    <div style={{ fontSize: '1.5rem', marginRight: '12px' }}>🔗</div>
                    <CCardTitle className="mb-0 fw-bold text-dark">Quick Links</CCardTitle>
                  </div>
                  <CListGroup flush>
                    {dummyLinks.map((link) => (
                      <CListGroupItem
                        key={link.id}
                        className="border-0 px-0 py-2"
                        style={{ transition: 'all 0.2s ease' }}
                      >
                        <div className="d-flex justify-content-between align-items-center">
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
                        </div>
                      </CListGroupItem>
                    ))}
                  </CListGroup>

                </CCardBody>
              </CCard>
            </CCol>

            <CCol lg={4} className="mb-4">
              <CCard style={modernCardStyle}>
                <CCardBody>
                  <div className="d-flex align-items-center mb-3">
                    <div style={{ fontSize: '1.5rem', marginRight: '12px' }}>📁</div>
                    <CCardTitle className="mb-0 fw-bold text-dark">Recent Files</CCardTitle>
                  </div>
                  <CListGroup flush>
                    {dummyFiles.map((file) => (
                      <CListGroupItem
                        key={file.id}
                        className="border-0 px-0 py-2 cursor-pointer"
                        style={{ cursor: 'pointer', transition: 'all 0.2s ease' }}
                      >
                        <div className="d-flex justify-content-between align-items-center">
                          <div className="d-flex align-items-center">
                            <span className="me-2">{getFileIcon(file.type)}</span>
                            <div>
                              <div className="fw-semibold text-dark small" style={{ wordBreak: 'break-all' }}>{file.name}</div>
                              <small className="text-muted">{file.size} • {file.date}</small>
                            </div>
                          </div>
                        </div>
                      </CListGroupItem>
                    ))}
                  </CListGroup>
                </CCardBody>
              </CCard>
            </CCol>

            <CCol lg={4} className="mb-4">
              <CCard style={modernCardStyle}>
                <CCardBody>
                  <div className="d-flex align-items-center mb-3">
                    <div style={{ fontSize: '1.5rem', marginRight: '12px' }}>📝</div>
                    <CCardTitle className="mb-0 fw-bold text-dark">My Lastest Proposals</CCardTitle>
                  </div>
                  <CListGroup flush>
                    {latestProposals.slice(0, 5).map((proposal) => (
                      <CListGroupItem
                        key={proposal.id}
                        className="border-0 px-0 py-2 cursor-pointer"
                        style={{ cursor: 'pointer', transition: 'all 0.2s ease' }}
                      >
                        <div className="d-flex justify-content-between align-items-start">
                          <div className="flex-grow-1">
                            <div className="fw-semibold text-dark small" style={{ wordBreak: 'break-all' }}>{proposal.description || 'No Description'}</div>
                            {/* <div className="text-muted small">{proposal.description}</div> */}
                            <small className="text-muted">{new Date(proposal.createdAt).toLocaleDateString()}</small>
                          </div>
                          <CBadge color={getStatusColor(proposal.status)} shape="rounded-pill" className="ms-2">
                            {proposal.status}
                          </CBadge>
                        </div>
                      </CListGroupItem>
                    ))}
                  </CListGroup>
                  <div className="text-center mt-3">
                    <CButton
                      variant="outline"
                      size="sm"
                      style={{
                        borderRadius: '8px',
                        borderColor: '#e2e8f0',
                        color: '#64748b'
                      }}
                      onClick={handleViewAllProposals}
                    >
                      View All Proposals
                    </CButton>
                  </div>
                </CCardBody>
              </CCard>
            </CCol>
          </CRow>
        </>
      )}

      {activeTab === 'history' && (
        <CCard style={modernCardStyle}>
          <CCardBody>
            <CCardTitle className="fw-bold text-dark">Activity History</CCardTitle>
            <p className="text-muted">Your recent activity and changes will be displayed here.</p>
          </CCardBody>
        </CCard>
      )}

      {activeTab === 'catch-up' && (
        <CCard style={modernCardStyle}>
          <CCardBody>
            <CCardTitle className="fw-bold text-dark">Catch Up</CCardTitle>
            <p className="text-muted">Recent updates and notifications you may have missed will appear here.</p>
          </CCardBody>
        </CCard>
      )}
    </CContainer>
  );
};

export default Dashboard;