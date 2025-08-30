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
import PageHeader from '../../components/PageHeader';

const Contracts = () => {
  const { t } = useTranslation();
  const dispatch = useDispatch();
  const [searchTerm, setSearchTerm] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [viewMode, setViewMode] = useState('card');
  const [itemsPerPage, setItemsPerPage] = useState(10);
  const [showModal, setShowModal] = useState(false);
  const [selectedContract, setSelectedContract] = useState(null);
  const contractsState = useSelector((state) => state.contracts);
  const { data: contracts = [], loading, error } = contractsState;
  const customization = useSelector((state) => state.customization);

  // Function to get optimal text color for contrast
  const getContrastColor = (backgroundColor) => {
    if (!backgroundColor) return '#ffffff';
    // Convert hex to RGB
    const hex = backgroundColor.replace('#', '');
    const r = parseInt(hex.substr(0, 2), 16);
    const g = parseInt(hex.substr(2, 2), 16);
    const b = parseInt(hex.substr(4, 2), 16);
    
    // Calculate luminance
    const luminance = (0.299 * r + 0.587 * g + 0.114 * b) / 255;
    
    // Return dark color for light backgrounds, light color for dark backgrounds
    return luminance > 0.5 ? '#2d3748' : '#ffffff';
  };

  const contractsdata = Array.isArray(contracts) ? contracts : [];

  const defaultFormData = {
    manufacturersData: [],
    designer: '',
    description: '',
    date: null,
    designDate: null,
    measurementDate: null,
    // followUp1Date: null,
    // followUp2Date: null,
    // followUp3Date: null,
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
      .get(`/api/quotes/proposalByID/${id}`)
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
    // TODO: Implement edit functionality
  };

  const handleDelete = (id) => {
    // TODO: Implement delete functionality
  };

  const generateHTMLTemplate = (formData) => {
    const headerColor = "#FFFFFF";
    const headerTxtColor = "#000000";
    const items = formData?.manufacturersData?.[0]?.items || [];
    
    // Localized labels for the PDF/HTML template
    const pdf = {
      title: t('nav.contracts'),
      sectionHeader: t('contracts.pdf.sectionHeader'),
      columns: {
        no: t('contracts.pdf.columns.no'),
        qty: t('contracts.pdf.columns.qty'),
        item: t('contracts.pdf.columns.item'),
        assembled: t('contracts.pdf.columns.assembled'),
        hingeSide: t('contracts.pdf.columns.hingeSide'),
        exposedSide: t('contracts.pdf.columns.exposedSide'),
        price: t('contracts.pdf.columns.price'),
        assemblyFee: t('contracts.pdf.columns.assemblyFee'),
        total: t('contracts.pdf.columns.total'),
      },
      categories: {
        items: t('contracts.pdf.categories.items'),
      },
      summary: {
        cabinets: t('contracts.pdf.summary.cabinetsParts'),
        assemblyFee: t('contracts.pdf.summary.assemblyFee'),
        modifications: t('contracts.pdf.summary.modifications'),
        styleTotal: t('contracts.pdf.summary.styleTotal'),
        total: t('contracts.pdf.summary.total'),
        tax: t('contracts.pdf.summary.tax'),
        grandTotal: t('contracts.pdf.summary.grandTotal'),
      },
      yes: t('common.yes'),
      no: t('common.no'),
      na: t('common.na'),
    };

    const proposalItems = items.map((item) => ({
      qty: item.qty || 0,
      code: item.code || '',
      assembled: !!item.isRowAssembled,
      hingeSide: item.hingeSide || null,
      exposedSide: item.exposedSide || null,
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
      <title>${pdf.title}</title>
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
      <div class="section-header">${pdf.sectionHeader}</div>
          <table class="items-table">
              <thead>
                  <tr style="background-color: #f0f0f0;">
            <th style="border: 1px solid #ccc; padding: 5px;">${pdf.columns.no}</th>
            <th style="border: 1px solid #ccc; padding: 5px;">${pdf.columns.qty}</th>
            <th style="border: 1px solid #ccc; padding: 5px;">${pdf.columns.item}</th>
            <th style="border: 1px solid #ccc; padding: 5px;">${pdf.columns.assembled}</th>
            <th style="border: 1px solid #ccc; padding: 5px;">${pdf.columns.hingeSide}</th>
            <th style="border: 1px solid #ccc; padding: 5px;">${pdf.columns.exposedSide}</th>
            <th style="border: 1px solid #ccc; padding: 5px;">${pdf.columns.price}</th>
            <th style="border: 1px solid #ccc; padding: 5px;">${pdf.columns.assemblyFee}</th>
            <th style="border: 1px solid #ccc; padding: 5px;">${pdf.columns.total}</th>
                  </tr>
              </thead>
              <tbody>
                  <tr class="category-row">
            <td colspan="9" style="padding: 6px;"><strong>${pdf.categories.items}</strong></td>
                  </tr>
                  ${proposalItems.map((item, index) => `
                      <tr>
                          <td style="border: 1px solid #ccc; padding: 5px;">${index + 1}</td>
                          <td style="border: 1px solid #ccc; padding: 5px;">${item.qty}</td>
                          <td style="border: 1px solid #ccc; padding: 5px;">${item.code || ''}</td>
              <td style="border: 1px solid #ccc; padding: 5px;">${item.assembled ? pdf.yes : pdf.no}</td>
              <td style="border: 1px solid #ccc; padding: 5px;">${item.hingeSide || pdf.na}</td>
              <td style="border: 1px solid #ccc; padding: 5px;">${item.exposedSide || pdf.na}</td>
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
            <td class="text-left">${pdf.summary.cabinets}</td>
                      <td class="text-right">$${priceSummary.cabinets.toFixed(2)}</td>
                  </tr>
                  <tr>
            <td class="text-left">${pdf.summary.assemblyFee}</td>
                      <td class="text-right">$${priceSummary.assemblyFee.toFixed(2)}</td>
                  </tr>
                  <tr class="total-row">
            <td class="text-left">${pdf.summary.modifications}</td>
                      <td class="text-right">$${priceSummary.modifications.toFixed(2)}</td>
                  </tr>
                  <tr>
            <td class="text-left">${pdf.summary.styleTotal}</td>
                      <td class="text-right">$${priceSummary.styleTotal.toFixed(2)}</td>
                  </tr>
                  <tr>
            <td class="text-left">${pdf.summary.total}</td>
                      <td class="text-right">$${priceSummary.total.toFixed(2)}</td>
                  </tr>
                  <tr class="total-row">
            <td class="text-left">${pdf.summary.tax}</td>
                      <td class="text-right">$${priceSummary.tax.toFixed(2)}</td>
                  </tr>
                  <tr class="grand-total">
            <td class="text-left">${pdf.summary.grandTotal}</td>
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
    <CContainer fluid className="contracts-container">
      {/* Header Section */}
      <PageHeader
        title={
          <div className="d-flex align-items-center gap-3">
            <div 
              className="d-flex align-items-center justify-content-center"
              style={{
                width: '48px',
                height: '48px',
                backgroundColor: 'rgba(255, 255, 255, 0.2)',
                borderRadius: '12px'
              }}
            >
              <CIcon icon={cilBriefcase} style={{ fontSize: '24px', color: 'white' }} />
            </div>
            {t('nav.contracts')}
          </div>
        }
        subtitle={t('contracts.subtitle')}
      />

      {/* Search and Controls */}
      <CCard className="contracts-controls-card">
        <CCardBody>
          <CRow className="align-items-center">
            <CCol md={6} lg={4}>
              <CInputGroup>
                <CInputGroupText style={{ background: 'none', border: 'none' }}>
                  <CIcon icon={cilSearch} />
                </CInputGroupText>
                <CFormInput
                  type="text"
                  placeholder={t('contracts.searchPlaceholder')}
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="contracts-search-input"
                />
              </CInputGroup>
            </CCol>
            
            <CCol xs="auto" className="ms-auto">
              <div className="d-flex align-items-center gap-3">
                <div className="d-flex align-items-center gap-2">
                  <small className="text-muted">{t('common.itemsPerPage')}</small>
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
                    className="contracts-view-toggle"
                    style={{ borderRadius: '8px 0 0 8px' }}
                  >
                    {t('contracts.view.cards')}
                  </CButton>
                  <CButton
                    color={viewMode === 'table' ? 'primary' : 'light'}
                    onClick={() => setViewMode('table')}
                    className="contracts-view-toggle"
                    style={{ borderRadius: '0 8px 8px 0' }}
                  >
                    {t('contracts.view.table')}
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
              <CCard className="contracts-empty-state">
                <CCardBody>
                  <h5 className="text-muted mb-2">{t('contracts.empty.title')}</h5>
                  <p className="text-muted mb-0">{t('contracts.empty.subtitle')}</p>
                </CCardBody>
              </CCard>
            </CCol>
          ) : (
            paginatedItems?.map((item) => (
              <CCol key={item.id} xs={12} sm={6} lg={4} xl={3}>
                <CCard className="contracts-card">
                  <CCardHeader className="contracts-card-header">
                    <div className="d-flex justify-content-between align-items-center">
                      <div className="d-flex align-items-center gap-2">
                        <CIcon 
                          icon={cilCalendar} 
                          size="sm" 
                          className="contracts-card-date-icon"
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
                    <CCardTitle className="contracts-card-title d-flex align-items-center gap-2">
                      <div 
                        className="d-flex align-items-center justify-content-center"
                        style={{
                          width: '32px',
                          height: '32px',
                          backgroundColor: customization.headerBg || '#667eea',
                          borderRadius: '8px',
                          fontSize: '14px',
                          fontWeight: 'bold',
                          color: getContrastColor(customization.headerBg || '#667eea')
                        }}
                      >
                        {(item.customer?.name || 'N').charAt(0).toUpperCase()}
                      </div>
                      <span className="text-primary fw-semibold" style={{ cursor: 'pointer' }}>
                        {item.customer?.name || t('common.na')}
                      </span>
                    </CCardTitle>
                    
                    <CCardText className="contracts-card-customer">
                      {item.description || t('contracts.noDescription')}
                    </CCardText>
                    <CCardText className="contracts-card-customer">
                      {item.description || t('contracts.noDescription')}
                    </CCardText>
                    
                    <div className="d-flex align-items-center gap-2 mb-3">
                      <CIcon 
                        icon={cilBriefcase} 
                        size="sm" 
                        className="text-success"
                        style={{ backgroundColor: '#e6f7e6', padding: '4px', borderRadius: '4px' }}
                      />
                      <small className="text-muted fw-medium">
                        {item.designerData?.name || t('contracts.noDesigner')}
                      </small>
                    </div>
                    
                    <div className="d-flex justify-content-between align-items-center">
                      <CBadge
                        color={getStatusColor(item.status || 'Draft')}
                        className="contracts-card-status"
                      >
                        {(() => {
                          const map = {
                            'draft': 'draft',
                            'measurement scheduled': 'measurementScheduled',
                            'measurement done': 'measurementDone',
                            'design done': 'designDone',
                            'follow up 1': 'followUp1',
                            'follow up 2': 'followUp2',
                            'follow up 3': 'followUp3',
                            'proposal accepted': 'proposalAccepted',
                          };
                          const key = map[(item.status || 'Draft').toLowerCase()] || null;
                          return key ? t(`contracts.status.${key}`) : (item.status || t('contracts.status.draft'));
                        })()}
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
                        {t('contracts.viewDetails')}
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
        <CCard className="contracts-table-card">
          <CCardBody className="p-0">
            <div style={{ overflowX: 'auto' }}>
              <CTable hover responsive className="contracts-table">
                <CTableHead>
                  <CTableRow>
                    <CTableHeaderCell>{t('contracts.table.date')}</CTableHeaderCell>
                    <CTableHeaderCell>{t('contracts.table.customer')}</CTableHeaderCell>
                    <CTableHeaderCell>{t('contracts.table.description')}</CTableHeaderCell>
                    <CTableHeaderCell>{t('contracts.table.designer')}</CTableHeaderCell>
                    <CTableHeaderCell>{t('contracts.table.status')}</CTableHeaderCell>
                    <CTableHeaderCell className="text-center">{t('contracts.table.actions')}</CTableHeaderCell>
                  </CTableRow>
                </CTableHead>
                <CTableBody>
                  {paginatedItems?.length === 0 ? (
                    <CTableRow>
                      <CTableDataCell colSpan="6" className="text-center py-5">
                        <div className="text-muted">
                          <p className="mb-0">{t('contracts.empty.title')}</p>
                          <small>{t('contracts.empty.subtitle')}</small>
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
                            color: customization.headerBg || '#667eea',
                            cursor: 'pointer',
                            fontWeight: '500'
                          }}
                        >
                          {item.customer?.name || t('common.na')}
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
                            {item.description || t('common.na')}
                          </span>
                        </CTableDataCell>
                        <CTableDataCell className="py-3 border-0 border-bottom border-light">
                          <span className="fw-medium">
                            {item.designerData?.name || t('common.na')}
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
                            {(() => {
                              const map = {
                                'draft': 'draft',
                                'measurement scheduled': 'measurementScheduled',
                                'measurement done': 'measurementDone',
                                'design done': 'designDone',
                                'follow up 1': 'followUp1',
                                'follow up 2': 'followUp2',
                                'follow up 3': 'followUp3',
                                'proposal accepted': 'proposalAccepted',
                              };
                              const key = map[(item.status || 'Draft').toLowerCase()] || null;
                              return key ? t(`contracts.status.${key}`) : (item.status || t('contracts.status.draft'));
                            })()}
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
                                e.currentTarget.style.backgroundColor = `${customization.headerBg || '#667eea'}20`;
                                e.currentTarget.style.borderColor = customization.headerBg || '#667eea';
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
                              className="contracts-action-btn"
                              onClick={() => handleDelete(item.id)}
                            >
                              <CIcon icon={cilTrash} size="sm" style={{ color: '#dc3545' }} />
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
            <div className="contracts-pagination">
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
            background: customization.headerBg || '#667eea',
            color: getContrastColor(customization.headerBg || '#667eea')
          }}
        >
          <CModalTitle className="fw-bold">
            {t('contracts.modal.title')}
          </CModalTitle>
        </CModalHeader>
        <CModalBody className="p-4">
          {loadings ? (
            <div className="text-center py-5">
              <div className="spinner-border text-primary" role="status">
                <span className="visually-hidden">{t('common.loading')}</span>
              </div>
              <p className="mt-3 text-muted">{t('contracts.loadingDetails')}</p>
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
                backgroundColor: 'var(--cui-body-bg)'
              }}
              dangerouslySetInnerHTML={{ __html: htmlContent }}
            />
          ) : (
            <div className="text-center py-5">
              <p className="text-muted mb-0">{t('contracts.noData')}</p>
            </div>
          )}
        </CModalBody>
  <CModalFooter className="border-0 bg-body-secondary">
          <div className="d-flex gap-2 w-100 justify-content-end">
            <CButton 
              color="secondary" 
              onClick={() => setShowModal(false)}
              className="px-4"
              style={{ borderRadius: '8px' }}
            >
              {t('common.close')}
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

      <style>{`
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