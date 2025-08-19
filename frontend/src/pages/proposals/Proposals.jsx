import { useEffect, useState } from 'react';
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
import { deleteFormData, getProposal } from '../../store/slices/proposalSlice';
import { useDispatch, useSelector } from 'react-redux';
import Swal from 'sweetalert2';
import CIcon from '@coreui/icons-react';
import { cilPencil, cilTrash, cilSearch, cilPlus } from '@coreui/icons';
import PaginationComponent from '../../components/common/PaginationComponent';

const Proposals = () => {
  const dispatch = useDispatch();
  const [searchTerm, setSearchTerm] = useState('');
  const [activeTab, setActiveTab] = useState('All');
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;
  const navigate = useNavigate();
  const { data, loading, error } = useSelector((state) => state.proposal);
  const proposal = Array.isArray(data) ? data : [];

  console.log('proposal', proposal);

  const tabs = [
    'All', 'Draft', 'Measurement Scheduled', 'Measurement done',
    'Design done', 'Follow up 1', 'Follow up 2', 'Follow up 3',
    'Proposal accepted'
  ];

  useEffect(() => {
    dispatch(getProposal());
  }, [dispatch]);

  const getTabCounts = () => {
    const counts = {
      All: proposal?.length,
      'Draft': 0,
      'Measurement Scheduled': 0,
      'Measurement done': 0,
      'Design done': 0,
      'Follow up 1': 0,
      'Follow up 2': 0,
      'Follow up 3': 0,
      'Proposal accepted': 0
    };

    proposal?.forEach((item) => {
      const status = item.status || 'Draft';
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

  const handleDelete = (id) => {
    Swal.fire({
      title: 'Are you sure?',
      text: "You won't be able to revert this!",
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#d33',
      cancelButtonColor: '#3085d6',
      confirmButtonText: 'Yes, delete it!',
    }).then((result) => {
      if (result.isConfirmed) {
        dispatch(deleteFormData(id))
          .then((res) => {
            if (res.meta.requestStatus === 'fulfilled') {
              Swal.fire('Deleted!', 'Your proposal has been deleted.', 'success');
              dispatch(getProposal());
            } else {
              Swal.fire('Error!', 'Failed to delete the proposal.', 'error');
            }
          });
      }
    });
  };

  const handleNavigate = (id) => {
    navigate(`/proposals/edit/${id}`);
  };

  const getStatusColor = (status) => {
    const statusColors = {
      'Draft': 'secondary',
      'Measurement Scheduled': 'info',
      'Measurement done': 'primary',
      'Design done': 'success',
      'Follow up 1': 'warning',
      'Follow up 2': 'warning',
      'Follow up 3': 'warning',
      'Proposal accepted': 'success'
    };
    return statusColors[status] || 'secondary';
  };

  return (
    <CContainer fluid className="p-2 m-2" style={{ backgroundColor: '#f8fafc', minHeight: '100vh' }}>
      {/* Header Section */}
      <CCard className="border-0 shadow-sm mb-4" style={{ background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)' }}>
        <CCardBody className="py-4">
          <CRow className="align-items-center">
            <CCol>
              <h3 className="text-white mb-1 fw-bold">Proposals</h3>
              <p className="text-white-50 mb-0">Manage and track all your proposals</p>
            </CCol>
            <CCol xs="auto">
              <div className="d-flex gap-2">
                <CButton
                  color="light"
                  className="shadow-sm px-4 fw-semibold"
                  onClick={handleCreateProposal}
                  style={{
                    borderRadius: '5px',
                    border: 'none',
                    transition: 'all 0.3s ease'
                  }}
                >
                  <CIcon icon={cilPlus} className="me-2" />
                  New Proposal
                </CButton>
                <CButton
                  color="success"
                  className="shadow-sm px-4 fw-semibold"
                  onClick={handleCreateQuickProposal}
                  style={{
                    borderRadius: '5px',
                    border: 'none',
                    background: 'linear-gradient(45deg, #28a745, #20c997)',
                    transition: 'all 0.3s ease'
                  }}
                >
                  Quick Proposal
                </CButton>
              </div>
            </CCol>
          </CRow>
        </CCardBody>
      </CCard>


      {/* Status Tabs */}
      <CCard className="border-0 shadow-sm mb-2">
        <CCardBody className="pb-2">
          <div className="d-flex flex-wrap gap-2">
            {tabs.map((tab, idx) => {
              const isActive = activeTab === tab;
              const count = tabCounts[tab] || 0;
              return (
                <CButton
                  key={idx}
                  color="light"
                  className={`position-relative fw-semibold ${isActive ? 'active' : ''}`}
                  onClick={() => {
                    setActiveTab(tab);
                    setCurrentPage(1);
                  }}
                  style={{
                    borderRadius: '25px',
                    padding: '8px 10px',
                    border: isActive ? '2px solid #0d6efd' : '1px solid #e3e6f0',
                    backgroundColor: isActive ? '#e7f3ff' : '#ffffff',
                    color: isActive ? '#0d6efd' : '#6c757d',
                    transition: 'all 0.3s ease',
                    transform: isActive ? 'translateY(-1px)' : 'none',
                    boxShadow: isActive ? '0 4px 8px rgba(13, 110, 253, 0.2)' : 'none',
                    fontSize: '10px'
                  }}
                >
                  {tab}
                  <CBadge
                    color={isActive ? 'primary' : 'secondary'}
                    className="ms-2"
                    style={{
                      fontSize: '10px',
                      borderRadius: '10px',
                      padding: '3px 8px'
                    }}
                  >
                    {count}
                  </CBadge>
                </CButton>
              );
            })}
          </div>
        </CCardBody>
      </CCard>
      {/* Search and Filters */}
      <CCard className="border-0 shadow-sm  mb-1">
        <CCardBody>
          <CRow className="align-items-center">
            <CCol md={6} lg={4}>
              <CInputGroup>
                <CInputGroupText style={{ background: 'none', border: 'none' }}>
                  <CIcon icon={cilSearch} />
                </CInputGroupText>
                <CFormInput
                  type="text"
                  placeholder="Search by customer name..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  style={{
                    border: '1px solid #e3e6f0',
                    borderRadius: '10px',
                    fontSize: '14px',
                    padding: '12px 16px'
                  }}
                />
              </CInputGroup>
            </CCol>
            <CCol md={6} lg={8} className="text-md-end mt-3 mt-md-0">
              <span className="text-muted small">
                Showing {filteredProposals?.length || 0} of {proposal?.length || 0} proposals
              </span>
            </CCol>
          </CRow>
        </CCardBody>
      </CCard>


      {/* Table */}
      <CCard className="border-0 shadow-sm">
        <CCardBody className="p-0">
          <div style={{ overflowX: 'auto' }}>
            <CTable hover responsive className="mb-0">
              <CTableHead style={{ backgroundColor: '#f8f9fa' }}>
                <CTableRow>
                  <CTableHeaderCell className="border-0 fw-semibold text-muted py-3">Date</CTableHeaderCell>
                  <CTableHeaderCell className="border-0 fw-semibold text-muted py-3">Customer</CTableHeaderCell>
                  <CTableHeaderCell className="border-0 fw-semibold text-muted py-3">Description</CTableHeaderCell>
                  <CTableHeaderCell className="border-0 fw-semibold text-muted py-3">Designer</CTableHeaderCell>
                  <CTableHeaderCell className="border-0 fw-semibold text-muted py-3">Status</CTableHeaderCell>
                  <CTableHeaderCell className="border-0 fw-semibold text-muted py-3 text-center">Actions</CTableHeaderCell>
                </CTableRow>
              </CTableHead>
              <CTableBody>
                {paginatedItems?.length === 0 ? (
                  <CTableRow>
                    <CTableDataCell colSpan="6" className="text-center py-5">
                      <div className="text-muted">
                        <CIcon icon={cilSearch} size="xl" className="mb-3 opacity-25" />
                        <p className="mb-0">No proposals found</p>
                        <small>Try adjusting your search or filters</small>
                      </div>
                    </CTableDataCell>
                  </CTableRow>
                ) : (
                  paginatedItems?.map((item, index) => (
                    <CTableRow key={index} style={{ transition: 'all 0.2s ease' }}>
                      <CTableDataCell className="py-3 border-0 border-bottom border-light">
                        <span className="fw-medium">
                          {new Date(item.date || item.createdAt).toLocaleDateString()}
                        </span>
                      </CTableDataCell>
                      <CTableDataCell
                        className="py-3 border-0 border-bottom border-light"
                        style={{
                          color: '#0d6efd',
                          cursor: 'pointer',
                          fontWeight: '500'
                        }}
                        onClick={() => {
                          if (item.customer?.id) {
                            navigate(`/customers/edit/${item.customer.id}`);
                          }
                        }}
                      >
                        {item.customer?.name || 'N/A'}
                      </CTableDataCell>
                      <CTableDataCell
                        className="py-3 border-0 border-bottom border-light"
                        style={{
                          whiteSpace: 'normal',
                          wordBreak: 'break-word',
                          maxWidth: '200px'
                        }}
                      >
                        <span className="text-muted">
                          {item.description || 'N/A'}
                        </span>
                      </CTableDataCell>
                      <CTableDataCell className="py-3 border-0 border-bottom border-light">
                        <span className="fw-medium">
                          {item.designerData?.name || 'N/A'}
                        </span>
                      </CTableDataCell>
                      <CTableDataCell className="py-3 border-0 border-bottom border-light">
                        <CBadge
                          color={getStatusColor(item.status || 'Draft')}
                          className="px-3 py-2"
                          style={{
                            borderRadius: '20px',
                            fontSize: '12px',
                            fontWeight: '500'
                          }}
                        >
                          {item.status || 'Draft'}
                        </CBadge>
                      </CTableDataCell>
                      <CTableDataCell className="py-3 border-0 border-bottom border-light text-center">
                        <div className="d-flex justify-content-center gap-2">
                          <CButton
                            color="light"
                            size="sm"
                            className="p-2"
                            onClick={() => handleNavigate(item.id)}
                            style={{
                              borderRadius: '8px',
                              border: '1px solid #e3e6f0',
                              transition: 'all 0.2s ease'
                            }}
                            onMouseEnter={(e) => {
                              e.currentTarget.style.backgroundColor = '#e7f3ff';
                              e.currentTarget.style.borderColor = '#0d6efd';
                            }}
                            onMouseLeave={(e) => {
                              e.currentTarget.style.backgroundColor = '';
                              e.currentTarget.style.borderColor = '#e3e6f0';
                            }}
                          >
                            <CIcon
                              icon={cilPencil}
                              size="sm"
                              style={{ color: '#0d6efd' }}
                            />
                          </CButton>

                          <CButton
                            color="light"
                            size="sm"
                            className="p-2"
                            onClick={() => handleDelete(item.id)}
                            style={{
                              borderRadius: '8px',
                              border: '1px solid #e3e6f0',
                              transition: 'all 0.2s ease'
                            }}
                            onMouseEnter={(e) => {
                              e.currentTarget.style.backgroundColor = '#ffe6e6';
                              e.currentTarget.style.borderColor = '#dc3545';
                            }}
                            onMouseLeave={(e) => {
                              e.currentTarget.style.backgroundColor = '';
                              e.currentTarget.style.borderColor = '#e3e6f0';
                            }}
                          >
                            <CIcon
                              icon={cilTrash}
                              size="sm"
                              style={{ color: '#dc3545' }}
                            />
                          </CButton>
                        </div>
                      </CTableDataCell>
                    </CTableRow>
                  ))
                )}
              </CTableBody>
            </CTable>
          </div>

          {/* Pagination */}
          <div className="p-3 border-top border-light">
            <PaginationComponent
              currentPage={currentPage}
              totalPages={totalPages}
              onPageChange={handlePageChange}
              itemsPerPage={itemsPerPage}
            />
          </div>
        </CCardBody>
      </CCard>
    </CContainer>
  );
};

export default Proposals;