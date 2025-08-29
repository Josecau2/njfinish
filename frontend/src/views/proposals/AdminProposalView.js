import React, { useState, useEffect } from 'react';
import axiosInstance from '../../helpers/axiosInstance';
import { useParams, useNavigate } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import {
  CContainer,
  CCard,
  CCardBody,
  CCardHeader,
  CRow,
  CCol,
  CBadge,
  CButton,
  CSpinner,
  CAlert,
  CListGroup,
  CListGroupItem,
  CTable,
  CTableBody,
  CTableDataCell,
  CTableHead,
  CTableHeaderCell,
  CTableRow,
  CAccordion,
  CAccordionItem,
  CAccordionHeader,
  CAccordionBody,
  CButtonGroup
} from '@coreui/react';
import CIcon from '@coreui/icons-react';
import {
  cilArrowLeft,
  cilBriefcase,
  cilUser,
  cilCalendar,
  cilLocationPin,
  cilDollar,
  cilClipboard,
  cilHistory,
  cilInfo,
  cilCheckCircle,
  cilXCircle,
  cilClock,
  cilPrint,
  cilPaperPlane,
  cilCloudDownload
} from '@coreui/icons';

const AdminProposalView = () => {
  const api_url = import.meta.env.VITE_API_URL;
  const { proposalId } = useParams();
  const navigate = useNavigate();
  const dispatch = useDispatch();
  
  const [proposal, setProposal] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Status definitions
  const statusDefinitions = {
    draft: { label: 'Draft', color: 'secondary', icon: cilClipboard },
    sent: { label: 'Sent', color: 'info', icon: cilPaperPlane },
    pending: { label: 'Pending', color: 'warning', icon: cilClock },
    approved: { label: 'Approved', color: 'success', icon: cilCheckCircle },
    accepted: { label: 'Accepted', color: 'success', icon: cilCheckCircle },
    rejected: { label: 'Rejected', color: 'danger', icon: cilXCircle },
    expired: { label: 'Expired', color: 'dark', icon: cilClock },
    in_progress: { label: 'In Progress', color: 'info', icon: cilClock },
    completed: { label: 'Completed', color: 'success', icon: cilCheckCircle }
  };

  useEffect(() => {
    if (proposalId) {
      fetchProposalDetails();
    }
  }, [proposalId]);

  const fetchProposalDetails = async () => {
    try {
      setLoading(true);
      if (!proposalId) {
        throw new Error('No proposal ID provided');
      }
  const { data } = await axiosInstance.get(`/api/proposals/proposalByID/${proposalId}`);
      setProposal(data);
      setError(null);
    } catch (err) {
      console.error('Error fetching proposal:', err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
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

  // Parse manufacturer data to extract items and totals
  const parseProposalData = (proposal) => {
    if (!proposal || !proposal.manufacturersData) {
      return { items: [], totalAmount: 0, summary: {} };
    }

    try {
      const manufacturersData = JSON.parse(proposal.manufacturersData);
      let allItems = [];
      let totalAmount = 0;
      let combinedSummary = {
        cabinets: 0,
        assemblyFee: 0,
        modificationsCost: 0,
        styleTotal: 0,
        discountAmount: 0,
        taxAmount: 0,
        grandTotal: 0
      };

      manufacturersData.forEach(manufacturer => {
        if (manufacturer.items) {
          allItems = allItems.concat(manufacturer.items);
        }
        if (manufacturer.summary) {
          combinedSummary.cabinets += manufacturer.summary.cabinets || 0;
          combinedSummary.assemblyFee += manufacturer.summary.assemblyFee || 0;
          combinedSummary.modificationsCost += manufacturer.summary.modificationsCost || 0;
          combinedSummary.styleTotal += manufacturer.summary.styleTotal || 0;
          combinedSummary.discountAmount += manufacturer.summary.discountAmount || 0;
          combinedSummary.taxAmount += manufacturer.summary.taxAmount || 0;
          combinedSummary.grandTotal += manufacturer.summary.grandTotal || 0;
        }
      });

      return {
        items: allItems,
        totalAmount: combinedSummary.grandTotal,
        summary: combinedSummary
      };
    } catch (error) {
      console.error('Error parsing manufacturer data:', error);
      return { items: [], totalAmount: 0, summary: {} };
    }
  };

  // Get parsed proposal data
  const parsedData = proposal ? parseProposalData(proposal) : { items: [], totalAmount: 0, summary: {} };

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
        month: 'long',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      });
    } catch (error) {
      console.error('Error formatting date:', error);
      return 'N/A';
    }
  };

  const getStatusTimeline = (proposal) => {
    const timeline = [];
    
    timeline.push({
      status: 'created',
      label: 'Created',
      date: proposal.created_at,
      icon: cilClipboard,
      color: 'secondary',
      description: 'Proposal was created and added to the system'
    });

    // Add sent status if it exists
    if (proposal.sent_at) {
      timeline.push({
        status: 'sent',
        label: 'Sent to Customer',
        date: proposal.sent_at,
        icon: cilPaperPlane,
        color: 'info',
        description: 'Proposal was sent to the customer for review'
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
        description: 'Proposal was formally accepted'
      });
    }

    // Add other status changes if they're different from sent/accepted
    if (proposal.status && !['draft', 'sent', 'accepted'].includes(proposal.status)) {
      timeline.push({
        status: proposal.status,
        label: statusDefinitions[proposal.status]?.label || proposal.status,
        date: proposal.updated_at,
        icon: getStatusIcon(proposal.status),
        color: getStatusColor(proposal.status),
        description: proposal.status === 'rejected' ? 'Proposal was rejected' :
                    proposal.status === 'expired' ? 'Proposal has expired' :
                    `Proposal status changed to ${proposal.status}`
      });
    }

    return timeline;
  };

  const handlePrint = () => {
    window.print();
  };

  const handleDownload = () => {
    // TODO: Implement PDF download functionality
  };

  if (loading) {
    return (
      <CContainer className="py-4">
        <div className="d-flex justify-content-center align-items-center" style={{ minHeight: '400px' }}>
          <CSpinner color="primary" size="lg" />
          <span className="ms-3">Loading proposal details...</span>
        </div>
      </CContainer>
    );
  }

  if (error) {
    return (
      <CContainer className="py-4">
        <CAlert color="danger">
          <CIcon icon={cilInfo} className="me-2" />
          {error}
        </CAlert>
        <CButton color="secondary" onClick={() => navigate(-1)}>
          <CIcon icon={cilArrowLeft} className="me-1" />
          Go Back
        </CButton>
      </CContainer>
    );
  }

  if (!proposal) {
    return (
      <CContainer className="py-4">
        <CAlert color="warning">
          <CIcon icon={cilInfo} className="me-2" />
          Proposal not found.
        </CAlert>
        <CButton color="secondary" onClick={() => navigate(-1)}>
          <CIcon icon={cilArrowLeft} className="me-1" />
          Go Back
        </CButton>
      </CContainer>
    );
  }

  return (
    <CContainer fluid className="py-4">
      {/* Header */}
      <CRow className="mb-4">
        <CCol>
          <div className="d-flex justify-content-between align-items-center">
            <div className="d-flex align-items-center">
              <CButton
                color="ghost"
                size="sm"
                onClick={() => navigate(-1)}
                className="me-3"
              >
                <CIcon icon={cilArrowLeft} />
              </CButton>
              <div>
                <h3 className="mb-1">
                  <CIcon icon={cilBriefcase} className="me-2" />
                  {proposal.title || `Proposal #${proposal.id}`}
                </h3>
                <div className="d-flex align-items-center gap-3 text-muted">
                  <span>
                    <CIcon icon={cilUser} className="me-1" />
                    {proposal.customer?.name || 'N/A'}
                  </span>
                  <span>
                    <CIcon icon={cilLocationPin} className="me-1" />
                    {proposal.UserGroup?.name || 'N/A'}
                  </span>
                  <CBadge color={getStatusColor(proposal.status)} size="lg">
                    <CIcon icon={getStatusIcon(proposal.status)} className="me-1" />
                    {statusDefinitions[proposal.status]?.label || proposal.status || 'Draft'}
                  </CBadge>
                </div>
              </div>
            </div>
            <div className="d-flex gap-2">
              <CButton color="outline-secondary" size="sm" onClick={handlePrint}>
                <CIcon icon={cilPrint} className="me-1" />
                Print
              </CButton>
              <CButton color="outline-primary" size="sm" onClick={handleDownload}>
                <CIcon icon={cilCloudDownload} className="me-1" />
                Download PDF
              </CButton>
            </div>
          </div>
        </CCol>
      </CRow>

      <CRow>
        <CCol lg={8}>
          {/* Main Content */}
          <CCard className="mb-4">
            <CCardHeader>
              <strong>Proposal Overview</strong>
            </CCardHeader>
            <CCardBody>
              <CRow className="mb-4">
                <CCol md={6}>
                  <h4 className="text-success mb-3">{formatCurrency(parsedData.totalAmount)}</h4>
                  
                  <CListGroup flush>
                    <CListGroupItem className="d-flex justify-content-between align-items-center border-0 px-0">
                      <span className="text-muted">Proposal ID</span>
                      <strong>#{proposal.id}</strong>
                    </CListGroupItem>
                    <CListGroupItem className="d-flex justify-content-between align-items-center border-0 px-0">
                      <span className="text-muted">Customer</span>
                      <span>{proposal.customer?.name || 'N/A'}</span>
                    </CListGroupItem>
                    <CListGroupItem className="d-flex justify-content-between align-items-center border-0 px-0">
                      <span className="text-muted">Contractor Group</span>
                      <span>{proposal.UserGroup?.name || 'N/A'}</span>
                    </CListGroupItem>
                  </CListGroup>
                </CCol>
                <CCol md={6}>
                  <CListGroup flush>
                    <CListGroupItem className="d-flex justify-content-between align-items-center border-0 px-0">
                      <span className="text-muted">Created Date</span>
                      <span>{formatDate(proposal.created_at)}</span>
                    </CListGroupItem>
                    <CListGroupItem className="d-flex justify-content-between align-items-center border-0 px-0">
                      <span className="text-muted">Last Updated</span>
                      <span>{formatDate(proposal.updated_at)}</span>
                    </CListGroupItem>
                    {proposal.sent_at && (
                      <CListGroupItem className="d-flex justify-content-between align-items-center border-0 px-0">
                        <span className="text-muted">Sent Date</span>
                        <span className="text-info">{formatDate(proposal.sent_at)}</span>
                      </CListGroupItem>
                    )}
                    {proposal.accepted_at && (
                      <CListGroupItem className="d-flex justify-content-between align-items-center border-0 px-0">
                        <span className="text-muted">Accepted Date</span>
                        <span className="text-success">{formatDate(proposal.accepted_at)}</span>
                      </CListGroupItem>
                    )}
                  </CListGroup>
                </CCol>
              </CRow>

              {proposal.description && (
                <div className="mt-4">
                  <h6 className="text-muted mb-2">Description</h6>
                  <div className="bg-light p-3 rounded">
                    <p className="mb-0">{proposal.description}</p>
                  </div>
                </div>
              )}
            </CCardBody>
          </CCard>

          {/* Proposal Items */}
          {parsedData.items && parsedData.items.length > 0 && (
            <CCard className="mb-4">
              <CCardHeader>
                <strong>
                  <CIcon icon={cilClipboard} className="me-2" />
                  Proposal Items ({parsedData.items.length})
                </strong>
              </CCardHeader>
              <CCardBody>
                <div className="table-responsive">
                  <CTable hover>
                    <CTableHead>
                      <CTableRow>
                        <CTableHeaderCell>Item</CTableHeaderCell>
                        <CTableHeaderCell>Description</CTableHeaderCell>
                        <CTableHeaderCell className="text-center">Qty</CTableHeaderCell>
                        <CTableHeaderCell className="text-end">Unit Price</CTableHeaderCell>
                        <CTableHeaderCell className="text-end">Total</CTableHeaderCell>
                      </CTableRow>
                    </CTableHead>
                    <CTableBody>
                      {parsedData.items.map((item, index) => (
                        <CTableRow key={index}>
                          <CTableDataCell>
                            <strong>{item.code || `Item ${index + 1}`}</strong>
                          </CTableDataCell>
                          <CTableDataCell>{item.description || 'N/A'}</CTableDataCell>
                          <CTableDataCell className="text-center">{item.qty || 1}</CTableDataCell>
                          <CTableDataCell className="text-end">{formatCurrency(parseFloat(item.price) || 0)}</CTableDataCell>
                          <CTableDataCell className="text-end">
                            <strong>{formatCurrency(parseFloat(item.total) || 0)}</strong>
                          </CTableDataCell>
                        </CTableRow>
                      ))}
                    </CTableBody>
                  </CTable>
                </div>
                
                {/* Totals */}
                <div className="border-top pt-3 mt-3">
                  <CRow>
                    <CCol md={6}></CCol>
                    <CCol md={6}>
                      <div className="d-flex justify-content-between mb-2">
                        <span>Cabinets:</span>
                        <span>{formatCurrency(parsedData.summary.cabinets || 0)}</span>
                      </div>
                      {parsedData.summary.assemblyFee > 0 && (
                        <div className="d-flex justify-content-between mb-2">
                          <span>Assembly Fee:</span>
                          <span>{formatCurrency(parsedData.summary.assemblyFee)}</span>
                        </div>
                      )}
                      {parsedData.summary.modificationsCost > 0 && (
                        <div className="d-flex justify-content-between mb-2">
                          <span>Modifications:</span>
                          <span>{formatCurrency(parsedData.summary.modificationsCost)}</span>
                        </div>
                      )}
                      {parsedData.summary.discountAmount > 0 && (
                        <div className="d-flex justify-content-between mb-2 text-danger">
                          <span>Discount:</span>
                          <span>-{formatCurrency(parsedData.summary.discountAmount)}</span>
                        </div>
                      )}
                      {parsedData.summary.taxAmount > 0 && (
                        <div className="d-flex justify-content-between mb-2">
                          <span>Tax:</span>
                          <span>{formatCurrency(parsedData.summary.taxAmount)}</span>
                        </div>
                      )}
                      <div className="d-flex justify-content-between border-top pt-2">
                        <strong>Total:</strong>
                        <strong className="text-success fs-5">{formatCurrency(parsedData.summary.grandTotal || parsedData.totalAmount)}</strong>
                      </div>
                    </CCol>
                  </CRow>
                </div>
              </CCardBody>
            </CCard>
          )}
        </CCol>

        <CCol lg={4}>
          {/* Status Timeline */}
          <CCard>
            <CCardHeader>
              <strong>
                <CIcon icon={cilHistory} className="me-2" />
                Status Timeline
              </strong>
            </CCardHeader>
            <CCardBody>
              <div className="timeline">
                {getStatusTimeline(proposal).map((item, index) => (
                  <div key={index} className="d-flex mb-4">
                    <div className={`timeline-icon bg-${item.color} text-white rounded-circle d-flex align-items-center justify-content-center me-3`} 
                         style={{ width: '40px', height: '40px', minWidth: '40px' }}>
                      <CIcon icon={item.icon} size="sm" />
                    </div>
                    <div className="flex-grow-1">
                      <div className="d-flex justify-content-between align-items-start mb-1">
                        <strong>{item.label}</strong>
                        <small className="text-muted">{formatDate(item.date)}</small>
                      </div>
                      <small className="text-muted">{item.description}</small>
                    </div>
                  </div>
                ))}
              </div>
            </CCardBody>
          </CCard>
        </CCol>
      </CRow>
    </CContainer>
  );
};

export default AdminProposalView;
