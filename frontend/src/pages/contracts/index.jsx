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
  CFormInput,
  CFormSelect,
  CButtonGroup,
  CCard,
  CCardBody,
  CCardHeader,
  CCardTitle,
  CCardText,
  CBadge,
  CDropdown,
  CDropdownToggle,
  CDropdownMenu,
  CDropdownItem,
  CModal,
  CModalHeader,
  CModalTitle,
  CModalBody,
  CModalFooter,
  CInputGroup,
  CInputGroupText,
} from '@coreui/react';
import CIcon from '@coreui/icons-react';
import { 
  cilSearch, 
  cilFilter, 
  cilPlus, 
  cilCalendar, 
  cilUser, 
  cilDescription, 
  cilBriefcase, 
  cilOptions, 
  cilPencil, 
  cilTrash,
} from '@coreui/icons';
import { getContracts } from '../../store/slices/proposalSlice';
import { useDispatch, useSelector } from 'react-redux';
import axiosInstance from '../../helpers/axiosInstance';
import PaginationComponent from '../../components/common/PaginationComponent';

const Contracts = () => {
  const dispatch = useDispatch();
  const [searchTerm, setSearchTerm] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [viewMode, setViewMode] = useState('card');
  const [itemsPerPage, setItemsPerPage] = useState(10);
  const [showModal, setShowModal] = useState(false);
  const [selectedContract, setSelectedContract] = useState(null);
  const contractsState = useSelector((state) => state.contracts);
  const { data: contracts = [], loading, error } = contractsState;

  const contractsdata = Array.isArray(contracts) ? contracts : [];

  const defaultFormData = {
    manufacturersData: [],
    designer: '',
    description: '',
    date: null,
    designDate: null,
    measurementDate: null,
    followUp1Date: null,
    followUp2Date: null,
    followUp3Date: null,
    status: 'Draft',
    files: [],
    customerName: '',
  };

  const [loadings, setLoadings] = useState(true);
  const [formData, setFormData] = useState(defaultFormData);

  useEffect(() => {
    dispatch(getContracts());
  }, [dispatch]);

  const handleItemsPerPageChange = (newItemsPerPage) => {
    setItemsPerPage(newItemsPerPage);
    setCurrentPage(1);
    localStorage.setItem('contractsItemsPerPage', newItemsPerPage.toString());
  };

  const getStatusColor = (status) => {
    const colors = {
      'Draft': 'secondary',
      'Measurement Scheduled': 'info',
      'Measurement done': 'primary',
      'Design done': 'success',
      'Follow up 1': 'warning',
      'Follow up 2': 'warning',
      'Follow up 3': 'danger',
      'Proposal accepted': 'success'
    };
    return colors[status] || 'secondary';
  };

  const filteredProposals = contractsdata?.filter((item) => {
    const matchSearch = item.customer?.name?.toLowerCase().includes(searchTerm.toLowerCase());
    return matchSearch;
  });

  const paginatedItems = filteredProposals?.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  const totalPages = Math.ceil((filteredProposals?.length || 0) / itemsPerPage);

  const handlePageChange = (number) => {
    setCurrentPage(number);
  };

  const handleNavigate = (id) => {
    axiosInstance
      .get(`/api/proposals/proposalByID/${id}`)
      .then((res) => {
        setFormData(res.data || defaultFormData);
        setLoadings(false);
      })
      .catch((err) => {
        console.error('Error fetching proposal:', err);
        setLoadings(false);
      });
    setShowModal(true);
  };

  const handleEdit = (id) => {
    console.log('Edit contract:', id);
  };

  const handleDelete = (id) => {
    console.log('Delete contract:', id);
  };

  const generateHTMLTemplate = (formData) => {
    const headerColor = "#FFFFFF";
    const headerTxtColor = "#000000";
    const items = formData?.manufacturersData?.[0]?.items || [];
    
    const proposalItems = items.map((item) => ({
      qty: item.qty || 0,
      code: item.code || '',
      assembled: item.isRowAssembled ? 'Yes' : 'No',
      hingeSide: item.hingeSide || 'N/A',
      exposedSide: item.exposedSide || 'N/A',
      price: parseFloat(item.price) || 0,
      assemblyCost: item.includeAssemblyFee ? parseFloat(item.assemblyFee) || 0 : 0,
      total: item.includeAssemblyFee ? parseFloat(item.total) || 0 : parseFloat(item.price) || 0,
      modifications: item.modifications || {}
    }));

    const summary = formData?.manufacturersData?.[0]?.summary || {};
    const priceSummary = formData?.manufacturersData?.[0]?.items?.length
      ? {
          cabinets: summary.cabinets || 0,
          assemblyFee: summary.assemblyFee || 0,
          modifications: summary.modificationsCost || 0,
          styleTotal: summary.styleTotal || 0,
          total: summary.total || 0,
          tax: summary.taxAmount || 0,
          grandTotal: summary.grandTotal || 0,
        }
      : {
          cabinets: 0,
          assemblyFee: 0,
          modifications: 0,
          styleTotal: 0,
          total: 0,
          tax: 0,
          grandTotal: 0,
        };

    return `
      <!DOCTYPE html>
      <html>
      <head>
          <meta charset="utf-8">
          <title>Contract</title>
          <style>
              @page { margin: 20mm; size: A4; }
              * { margin: 0; padding: 0; box-sizing: border-box; }
              body { font-family: 'Arial', sans-serif; font-size: 12px; line-height: 1.4; color: #333; }
              .header { display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 30px; padding: 20px; border-bottom: 2px solid ${headerColor}; background-color: ${headerColor}; }
              .logo { max-width: 120px; max-height: 80px; }
              .company-name { font-size: 24px; font-weight: bold; color: white; }
              .company-info { text-align: right; line-height: 1.6; color: ${headerTxtColor}; }
              .section-header { font-size: 16px; font-weight: bold; margin: 25px 0 15px 0; text-transform: uppercase; letter-spacing: 0.5px; }
              .items-table { width: 100%; border-collapse: collapse; margin-bottom: 20px; }
              .items-table th { background-color: #f8f9fa; padding: 10px 8px; border: 1px solid #dee2e6; font-weight: bold; text-align: left; font-size: 11px; }
              .items-table td { padding: 8px; border: 1px solid #dee2e6; font-size: 10px; }
              .items-table tr:nth-child(even) { background-color: #f9f9f9; }
              .category-row { background-color: #e6e6e6 !important; font-weight: bold; }   
              .text-right { text-align: right; }
              .text-left { text-align: left; }
              .price-summary { background-color: #f8f9fa; border: 1px solid #dee2e6; border-radius: 0.5rem; padding: 1rem; margin-top: 1rem; font-family: 'Arial', sans-serif; font-size: 0.95rem; }
              .price-summary table { width: 100%; border-collapse: collapse; }
              .price-summary td { padding: 0.25rem 0; }
              .price-summary .text-left { text-align: left; color: #212529; font-weight: 500; }
              .price-summary .text-right { text-align: right; color: #212529; font-weight: 500; }
              .price-summary .total-row { font-weight: bold; border-bottom: 1px solid #ced4da; padding-top: 0.25rem; }
              .price-summary .grand-total { font-weight: bold; font-size: 1.05rem; color: #1a1a1a; padding-top: 0.75rem; }
          </style>
      </head>
      <body>
          ${proposalItems && proposalItems.length > 0 ? `
          <div class="section-header">Contract Items Details</div>
          <table class="items-table">
              <thead>
                  <tr style="background-color: #f0f0f0;">
                      <th style="border: 1px solid #ccc; padding: 5px;">No.</th>
                      <th style="border: 1px solid #ccc; padding: 5px;">Qty</th>
                      <th style="border: 1px solid #ccc; padding: 5px;">Item</th>
                      <th style="border: 1px solid #ccc; padding: 5px;">Assembled</th>
                      <th style="border: 1px solid #ccc; padding: 5px;">Hinge Side</th>
                      <th style="border: 1px solid #ccc; padding: 5px;">Exposed Side</th>
                      <th style="border: 1px solid #ccc; padding: 5px;">Price</th>
                      <th style="border: 1px solid #ccc; padding: 5px;">Assembly Fee</th>
                      <th style="border: 1px solid #ccc; padding: 5px;">Total</th>
                  </tr>
              </thead>
              <tbody>
                  <tr class="category-row">
                      <td colspan="9" style="padding: 6px;"><strong>Items</strong></td>
                  </tr>
                  ${proposalItems.map((item, index) => `
                      <tr>
                          <td style="border: 1px solid #ccc; padding: 5px;">${index + 1}</td>
                          <td style="border: 1px solid #ccc; padding: 5px;">${item.qty}</td>
                          <td style="border: 1px solid #ccc; padding: 5px;">${item.code || ''}</td>
                          <td style="border: 1px solid #ccc; padding: 5px;">${item.assembled ? 'Yes' : 'No'}</td>
                          <td style="border: 1px solid #ccc; padding: 5px;">${item.hingeSide || 'N/A'}</td>
                          <td style="border: 1px solid #ccc; padding: 5px;">${item.exposedSide || 'N/A'}</td>
                          <td style="border: 1px solid #ccc; padding: 5px;">$${parseFloat(item.price).toFixed(2)}</td>
                          <td style="border: 1px solid #ccc; padding: 5px;">$${item.includeAssemblyFee ? parseFloat(item.assemblyFee).toFixed(2) : '0.00'}</td>
                          <td style="border: 1px solid #ccc; padding: 5px;">$${parseFloat(item.total).toFixed(2)}</td>
                      </tr>
                  `).join('')}
              </tbody>
          </table>
          <div class="price-summary">
              <table>
                  <tr>
                      <td class="text-left">Cabinets & Parts:</td>
                      <td class="text-right">$${priceSummary.cabinets.toFixed(2)}</td>
                  </tr>
                  <tr>
                      <td class="text-left">Assembly fee:</td>
                      <td class="text-right">$${priceSummary.assemblyFee.toFixed(2)}</td>
                  </tr>
                  <tr class="total-row">
                      <td class="text-left">Modifications:</td>
                      <td class="text-right">$${priceSummary.modifications.toFixed(2)}</td>
                  </tr>
                  <tr>
                      <td class="text-left">Style Total:</td>
                      <td class="text-right">$${priceSummary.styleTotal.toFixed(2)}</td>
                  </tr>
                  <tr>
                      <td class="text-left">Total:</td>
                      <td class="text-right">$${priceSummary.total.toFixed(2)}</td>
                  </tr>
                  <tr class="total-row">
                      <td class="text-left">Tax:</td>
                      <td class="text-right">$${priceSummary.tax.toFixed(2)}</td>
                  </tr>
                  <tr class="grand-total">
                      <td class="text-left">Grand Total:</td>
                      <td class="text-right">$${priceSummary.grandTotal.toFixed(2)}</td>
                  </tr>
              </table>
          </div>
          ` : ''}
      </body>
      </html>
    `;
  };

  const htmlContent = generateHTMLTemplate(formData);

  return (
    <CContainer fluid className="p-2 m-2" style={{ backgroundColor: '#f8fafc', minHeight: '100vh' }}>
      {/* Header Section */}
      <CCard className="border-0 shadow-sm mb-1" style={{ background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)' }}>
        <CCardBody className="py-4">
          <CRow className="align-items-center">
            <CCol>
              <h3 className="text-white mb-1 fw-bold">Contracts</h3>
              <p className="text-white-50 mb-0">Manage and track all your contracts</p>
            </CCol>
            {/* <CCol xs="auto">
              <div className="d-flex gap-2">
                <CButton
                  color="light"
                  className="shadow-sm px-4 fw-semibold"
                  style={{
                    borderRadius: '5px',
                    border: 'none',
                    transition: 'all 0.3s ease'
                  }}
                >
                  <CIcon icon={cilPlus} className="me-2" />
                  New Contract
                </CButton>
                <CButton
                  color="success"
                  className="shadow-sm px-4 fw-semibold"
                  style={{
                    borderRadius: '5px',
                    border: 'none',
                    background: 'linear-gradient(45deg, #28a745, #20c997)',
                    transition: 'all 0.3s ease'
                  }}
                >
                  Contract Template
                </CButton>
              </div>
            </CCol> */}
          </CRow>
        </CCardBody>
      </CCard>

      {/* Search and Controls */}
      <CCard className="border-0 shadow-sm mb-1">
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
            
            <CCol xs="auto" className="ms-auto">
              <div className="d-flex align-items-center gap-3">
                <div className="d-flex align-items-center gap-2">
                  <small className="text-muted">Show:</small>
                  <CFormSelect
                    size="sm"
                    value={itemsPerPage}
                    onChange={(e) => handleItemsPerPageChange(Number(e.target.value))}
                    style={{ width: '80px', borderRadius: '8px' }}
                  >
                    <option value={10}>10</option>
                    <option value={20}>20</option>
                    <option value={30}>30</option>
                  </CFormSelect>
                </div>
                
                <CButtonGroup size="sm">
                  <CButton
                    color={viewMode === 'card' ? 'primary' : 'light'}
                    onClick={() => setViewMode('card')}
                    style={{ borderRadius: '8px 0 0 8px' }}
                  >
                    Cards
                  </CButton>
                  <CButton
                    color={viewMode === 'table' ? 'primary' : 'light'}
                    onClick={() => setViewMode('table')}
                    style={{ borderRadius: '0 8px 8px 0' }}
                  >
                    Table
                  </CButton>
                </CButtonGroup>
              </div>
            </CCol>
            
            {/* <CCol xs={12} className="mt-3">
              <span className="text-muted small">
                Showing {filteredProposals?.length || 0} of {contractsdata?.length || 0} contracts
              </span>
            </CCol> */}
          </CRow>
        </CCardBody>
      </CCard>

      {/* Content */}
      {viewMode === 'card' ? (
        /* Card View */
        <CRow className="g-3 mb-1">
          {paginatedItems?.length === 0 ? (
            <CCol xs={12}>
              <CCard className="text-center py-5 border-0 shadow-sm">
                <CCardBody>
                  <h5 className="text-muted mb-2">No contracts found</h5>
                  <p className="text-muted mb-0">Try adjusting your search criteria or create a new contract</p>
                </CCardBody>
              </CCard>
            </CCol>
          ) : (
            paginatedItems?.map((item) => (
              <CCol key={item.id} xs={12} sm={6} lg={4} xl={3}>
                <CCard 
                  className="h-100 border-0 shadow-sm" 
                  style={{ 
                    transition: 'all 0.3s ease',
                    cursor: 'pointer'
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.transform = 'translateY(-4px)';
                    e.currentTarget.style.boxShadow = '0 8px 25px rgba(0,0,0,0.15)';
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.transform = 'translateY(0)';
                    e.currentTarget.style.boxShadow = '';
                  }}
                >
                  <CCardHeader className="border-0 bg-white py-3">
                    <div className="d-flex justify-content-between align-items-center">
                      <div className="d-flex align-items-center gap-2">
                        <CIcon 
                          icon={cilCalendar} 
                          size="sm" 
                          className="text-primary"
                          style={{ backgroundColor: '#e7f3ff', padding: '6px', borderRadius: '6px' }}
                        />
                        <small className="text-muted fw-medium">
                          {new Date(item.date || item.createdAt).toLocaleDateString()}
                        </small>
                      </div>
                      {/* <CDropdown>
                        <CDropdownToggle
                          color="ghost"
                          size="sm"
                          className="p-2 border-0"
                          caret={false}
                          style={{ borderRadius: '8px' }}
                        >
                          <CIcon icon={cilOptions} />
                        </CDropdownToggle>
                        <CDropdownMenu>
                          <CDropdownItem onClick={() => handleNavigate(item.id)}>
                            <CIcon icon={cilDescription} className="me-2" />
                            View Details
                          </CDropdownItem>
                          <CDropdownItem onClick={() => handleEdit(item.id)}>
                            <CIcon icon={cilPencil} className="me-2" />
                            Edit
                          </CDropdownItem>
                          <CDropdownItem
                            onClick={() => handleDelete(item.id)}
                            className="text-danger"
                          >
                            <CIcon icon={cilTrash} className="me-2" />
                            Delete
                          </CDropdownItem>
                        </CDropdownMenu>
                      </CDropdown> */}
                    </div>
                  </CCardHeader>
                  
                  <CCardBody className="pt-0">
                    <CCardTitle className="h6 mb-3 d-flex align-items-center gap-2">
                      <div 
                        className="d-flex align-items-center justify-content-center"
                        style={{
                          width: '32px',
                          height: '32px',
                          backgroundColor: '#0d6efd',
                          borderRadius: '8px',
                          fontSize: '14px',
                          fontWeight: 'bold',
                          color: 'white'
                        }}
                      >
                        {(item.customer?.name || 'N').charAt(0).toUpperCase()}
                      </div>
                      <span 
                        className="text-primary fw-semibold"
                        style={{ cursor: 'pointer' }}
                      >
                        {item.customer?.name || 'N/A'}
                      </span>
                    </CCardTitle>
                    
                    <CCardText 
                      className="text-muted small mb-3" 
                      style={{
                        display: '-webkit-box',
                        WebkitLineClamp: 2,
                        WebkitBoxOrient: 'vertical',
                        overflow: 'hidden',
                        minHeight: '40px'
                      }}
                    >
                      {item.description || 'No description available'}
                    </CCardText>
                    
                    <div className="d-flex align-items-center gap-2 mb-3">
                      <CIcon 
                        icon={cilBriefcase} 
                        size="sm" 
                        className="text-success"
                        style={{ backgroundColor: '#e6f7e6', padding: '4px', borderRadius: '4px' }}
                      />
                      <small className="text-muted fw-medium">
                        {item.designerData?.name || 'No designer assigned'}
                      </small>
                    </div>
                    
                    <div className="d-flex justify-content-between align-items-center">
                      <CBadge
                        color={getStatusColor(item.status || 'Draft')}
                        className="px-3 py-2"
                        style={{
                          borderRadius: '20px',
                          fontSize: '11px',
                          fontWeight: '500'
                        }}
                      >
                        {item.status || 'Draft'}
                      </CBadge>
                      
                      <CButton
                        color="primary"
                        variant="ghost"
                        size="sm"
                        onClick={() => handleNavigate(item.id)}
                        className="px-3"
                        style={{
                          borderRadius: '20px',
                          fontSize: '12px',
                          fontWeight: '500'
                        }}
                      >
                        View Details
                      </CButton>
                    </div>
                  </CCardBody>
                </CCard>
              </CCol>
            ))
          )}
        </CRow>
      ) : (
        /* Table View */
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
                          <p className="mb-0">No contracts found</p>
                          <small>Try adjusting your search or create a new contract</small>
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
                                style={{ color: '#28a745' }}
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
      )}

      {/* Contract Details Modal */}
      <CModal 
        visible={showModal} 
        onClose={() => setShowModal(false)} 
        size="xl"
        className="contract-modal"
      >
        <CModalHeader 
          onClose={() => setShowModal(false)}
          className="border-0"
          style={{ 
            background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
            color: 'white'
          }}
        >
          <CModalTitle className="fw-bold">
            Contract Details
          </CModalTitle>
        </CModalHeader>
        <CModalBody className="p-4">
          {loadings ? (
            <div className="text-center py-5">
              <div className="spinner-border text-primary" role="status">
                <span className="visually-hidden">Loading...</span>
              </div>
              <p className="mt-3 text-muted">Loading contract details...</p>
            </div>
          ) : htmlContent ? (
            <div 
              className="contract-content"
              style={{
                maxHeight: '70vh',
                overflowY: 'auto',
                border: '1px solid #e3e6f0',
                borderRadius: '8px',
                padding: '20px',
                backgroundColor: '#fefefe'
              }}
              dangerouslySetInnerHTML={{ __html: htmlContent }}
            />
          ) : (
            <div className="text-center py-5">
              <p className="text-muted mb-0">No contract data available</p>
            </div>
          )}
        </CModalBody>
        <CModalFooter className="border-0 bg-light">
          <div className="d-flex gap-2 w-100 justify-content-end">
            <CButton 
              color="secondary" 
              onClick={() => setShowModal(false)}
              className="px-4"
              style={{ borderRadius: '8px' }}
            >
              Close
            </CButton>
            {/* <CButton 
              color="primary"
              className="px-4"
              style={{ borderRadius: '8px' }}
            >
              <CIcon icon={cilPencil} className="me-2" />
              Edit Contract
            </CButton>
            <CButton 
              color="success"
              className="px-4"
              style={{ 
                borderRadius: '8px',
                background: 'linear-gradient(45deg, #28a745, #20c997)'
              }}
            >
              Download PDF
            </CButton> */}
          </div>
        </CModalFooter>
      </CModal>

      <style jsx>{`
        .contract-modal .modal-dialog {
          max-width: 95%;
        }
        
        .contract-content::-webkit-scrollbar {
          width: 8px;
        }
        
        .contract-content::-webkit-scrollbar-track {
          background: #f1f1f1;
          border-radius: 4px;
        }
        
        .contract-content::-webkit-scrollbar-thumb {
          background: #c1c1c1;
          border-radius: 4px;
        }
        
        .contract-content::-webkit-scrollbar-thumb:hover {
          background: #a1a1a1;
        }
      `}</style>
    </CContainer>
  );
};

export default Contracts;