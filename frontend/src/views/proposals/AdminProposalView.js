import React, { useState, useEffect, useCallback } from 'react'
import { useTranslation } from 'react-i18next'
import axiosInstance from '../../helpers/axiosInstance'
import { useParams, useNavigate } from 'react-router-dom'
import { decodeParam } from '../../utils/obfuscate'
import { Container, Card, CardBody, CardHeader, Flex, Box, Badge, Spinner, Alert, Icon } from '@chakra-ui/react'
import { ArrowLeft, User, Calendar, CheckCircle, Clock, Download } from 'lucide-react'

const AdminProposalView = () => {
  const { proposalId: rawProposalId } = useParams()
  const proposalId = decodeParam(rawProposalId)
  const navigate = useNavigate()

  const [proposal, setProposal] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const { t } = useTranslation()

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
    completed: { label: 'Completed', color: 'success', icon: cilCheckCircle },
  }

  const getStatusLabel = (status) => {
    const map = {
      draft: t('proposals.status.draft', 'Draft'),
      sent: t('proposals.status.sent', 'Sent'),
      pending: t('adminQuote.status.pending', 'Pending'),
      approved: t('adminQuote.status.approved', 'Approved'),
      accepted: t('proposals.status.accepted', 'Accepted'),
      rejected: t('proposals.status.rejected', 'Rejected'),
      expired: t('proposals.status.expired', 'Expired'),
      in_progress: t('adminQuote.status.in_progress', 'In Progress'),
      completed: t('adminQuote.status.completed', 'Completed'),
    }
    return map[status] || status || t('proposals.status.draft', 'Draft')
  }

  const fetchProposalDetails = useCallback(async () => {
    try {
      setLoading(true)
      if (!proposalId) {
        throw new Error(t('adminQuote.noId', 'No quote ID provided'))
      }
      const { data } = await axiosInstance.get(`/api/quotes/proposalByID/${proposalId}`)
      setProposal(data)
      setError(null)
    } catch (err) {
      console.error('Error fetching proposal:', err)
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }, [proposalId, t])

  useEffect(() => {
    if (proposalId) {
      fetchProposalDetails()
    }
  }, [proposalId, fetchProposalDetails])

  const getStatusColor = (status) => {
    return statusDefinitions[status]?.color || 'secondary'
  }

  const getStatusIcon = (status) => {
    return statusDefinitions[status]?.icon || cilClipboard
  }

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
    }).format(amount || 0)
  }

  // Parse manufacturer data to extract items and totals
  const parseProposalData = (proposal) => {
    if (!proposal || !proposal.manufacturersData) {
      return { items: [], totalAmount: 0, summary: {} }
    }

    try {
      const manufacturersData = JSON.parse(proposal.manufacturersData)
      let allItems = []
      let totalAmount = 0
      let combinedSummary = {
        cabinets: 0,
        assemblyFee: 0,
        modificationsCost: 0,
        styleTotal: 0,
        discountAmount: 0,
        taxAmount: 0,
        grandTotal: 0,
      }

      manufacturersData.forEach((manufacturer) => {
        if (manufacturer.items) {
          allItems = allItems.concat(manufacturer.items)
        }
        if (manufacturer.summary) {
          combinedSummary.cabinets += manufacturer.summary.cabinets || 0
          combinedSummary.assemblyFee += manufacturer.summary.assemblyFee || 0
          combinedSummary.modificationsCost += manufacturer.summary.modificationsCost || 0
          combinedSummary.styleTotal += manufacturer.summary.styleTotal || 0
          combinedSummary.discountAmount += manufacturer.summary.discountAmount || 0
          combinedSummary.taxAmount += manufacturer.summary.taxAmount || 0
          combinedSummary.grandTotal += manufacturer.summary.grandTotal || 0
        }
      })

      return {
        items: allItems,
        totalAmount: combinedSummary.grandTotal,
        summary: combinedSummary,
      }
    } catch (error) {
      console.error('Error parsing manufacturer data:', error)
      return { items: [], totalAmount: 0, summary: {} }
    }
  }

  // Get parsed proposal data
  const parsedData = proposal
    ? parseProposalData(proposal)
    : { items: [], totalAmount: 0, summary: {} }

  const formatDate = (dateString) => {
    if (!dateString) return t('common.na', 'N/A')

    try {
      const date = new Date(dateString)
      // Check if the date is valid
      if (isNaN(date.getTime())) {
        return t('common.na', 'N/A')
      }
      return date.toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
      })
    } catch (error) {
      console.error('Error formatting date:', error)
      return t('common.na', 'N/A')
    }
  }

  const getStatusTimeline = (proposal) => {
    const timeline = []

    timeline.push({
      status: 'created',
      label: t('adminQuote.labels.created', 'Created'),
      date: proposal.created_at,
      icon: cilClipboard,
      color: 'secondary',
      description: t('adminQuote.timeline.created', 'Quote was created and added to the system'),
    })

    // Add sent status if it exists
    if (proposal.sent_at) {
      timeline.push({
        status: 'sent',
        label: t('adminQuote.labels.sentToCustomer', 'Sent to Customer'),
        date: proposal.sent_at,
        icon: cilPaperPlane,
        color: 'info',
        description: t('adminQuote.timeline.sent', 'Quote was sent to the customer for review'),
      })
    }

    // Add accepted status if it exists
    if (proposal.accepted_at) {
      timeline.push({
        status: 'accepted',
        label: t('adminQuote.labels.accepted', 'Accepted'),
        date: proposal.accepted_at,
        icon: cilCheckCircle,
        color: 'success',
        description: t('adminQuote.timeline.accepted', 'Quote was formally accepted'),
      })
    }

    // Add other status changes if they're different from sent/accepted
    if (proposal.status && !['draft', 'sent', 'accepted'].includes(proposal.status)) {
      timeline.push({
        status: proposal.status,
        label: getStatusLabel(proposal.status),
        date: proposal.updated_at,
        icon: getStatusIcon(proposal.status),
        color: getStatusColor(proposal.status),
        description:
          proposal.status === 'rejected'
            ? t('adminQuote.timeline.rejected', 'Quote was rejected')
            : proposal.status === 'expired'
              ? t('adminQuote.timeline.expired', 'Quote has expired')
              : t('adminQuote.timeline.changed', 'Proposal status changed to {{status}}', {
                  status: proposal.status,
                }),
      })
    }

    return timeline
  }

  const handlePrint = () => {
    window.print()
  }

  const handleDownload = () => {
    // TODO: Implement PDF download functionality
  }

  if (loading) {
    return (
      <Container className="py-4">
        <div
          className="d-flex justify-content-center align-items-center"
          style={{ minHeight: '400px' }}
        >
          <Spinner colorScheme="blue" size="lg" />
          <span className="ms-3">{t('adminQuote.loading', 'Loading proposal details...')}</span>
        </div>
      </Container>
    )
  }

  if (error) {
    return (
      <Container className="py-4">
        <Alert status="error">
          <CIcon icon={cilInfo} className="me-2" />
          {error}
        </Alert>
        <CButton colorScheme="gray" onClick={() => navigate(-1)}>
          <Icon as={ArrowLeft} className="me-1" />
          {t('common.back', 'Back')}
        </CButton>
      </Container>
    )
  }

  if (!proposal) {
    return (
      <Container className="py-4">
        <Alert status="warning">
          <CIcon icon={cilInfo} className="me-2" />
          {t('adminQuote.ui.notFound', 'Proposal not found.')}
        </Alert>
        <CButton colorScheme="gray" onClick={() => navigate(-1)}>
          <Icon as={ArrowLeft} className="me-1" />
          {t('common.back', 'Back')}
        </CButton>
      </Container>
    )
  }

  return (
    <Container fluid className="py-4">
      {/* Header */}
      <Flex className="mb-4">
        <Box>
          <div className="d-flex justify-content-between align-items-center">
            <div className="d-flex align-items-center">
              <CButton color="ghost" size="sm" onClick={() => navigate(-1)} className="me-3">
                <Icon as={ArrowLeft} />
              </CButton>
              <div>
                <h3 className="mb-1">
                  <CIcon icon={cilBriefcase} className="me-2" />
                  {proposal.title || t('publicQuote.titleNumber', { id: proposal.id })}
                </h3>
                <div className="d-flex align-items-center gap-3 text-muted">
                  <span>
                    <Icon as={User} className="me-1" />
                    {proposal.customer?.name || 'N/A'}
                  </span>
                  <span>
                    <CIcon icon={cilLocationPin} className="me-1" />
                    {proposal.UserGroup?.name || 'N/A'}
                  </span>
                  <Badge color={getStatusColor(proposal.status)} size="lg">
                    <CIcon icon={getStatusIcon(proposal.status)} className="me-1" />
                    {getStatusLabel(proposal.status)}
                  </Badge>
                </div>
            </div>
            <div className="d-flex gap-2">
              <CButton color="outline-secondary" size="sm" onClick={handlePrint}>
                <CIcon icon={cilPrint} className="me-1" />
                {t('adminQuote.ui.print', 'Print')}
              </CButton>
              <CButton color="outline-primary" size="sm" onClick={handleDownload}>
                <Icon as={Download} className="me-1" />
                {t('proposalCommon.downloadPdf', 'Download PDF')}
              </CButton>
            </div>
        </Box>
      </Flex>

      <Flex>
        <Box lg={8}>
          {/* Main Content */}
          <Card className="mb-4">
            <CardHeader>
              <strong>{t('adminQuote.ui.overview', 'Quote Overview')}</strong>
            </CardHeader>
            <CardBody>
              <Flex className="mb-4">
                <Box md={6}>
                  <h4 className="text-success mb-3">{formatCurrency(parsedData.totalAmount)}</h4>

                  <CListGroup flush>
                    <CListGroupItem className="d-flex justify-content-between align-items-center border-0 px-0">
                      <span className="text-muted">
                        {t('adminQuote.ui.proposalId', 'Quote ID')}
                      </span>
                      <strong>#{proposal.id}</strong>
                    </CListGroupItem>
                    <CListGroupItem className="d-flex justify-content-between align-items-center border-0 px-0">
                      <span className="text-muted">{t('adminQuote.ui.customer', 'Customer')}</span>
                      <span>{proposal.customer?.name || t('common.na', 'N/A')}</span>
                    </CListGroupItem>
                    <CListGroupItem className="d-flex justify-content-between align-items-center border-0 px-0">
                      <span className="text-muted">
                        {t('adminQuote.ui.contractorGroup', 'Contractor Group')}
                      </span>
                      <span>{proposal.UserGroup?.name || t('common.na', 'N/A')}</span>
                    </CListGroupItem>
                  </CListGroup>
                </Box>
                <Box md={6}>
                  <CListGroup flush>
                    <CListGroupItem className="d-flex justify-content-between align-items-center border-0 px-0">
                      <span className="text-muted">
                        {t('adminQuote.ui.createdDate', 'Created Date')}
                      </span>
                      <span>{formatDate(proposal.created_at)}</span>
                    </CListGroupItem>
                    <CListGroupItem className="d-flex justify-content-between align-items-center border-0 px-0">
                      <span className="text-muted">
                        {t('adminQuote.ui.updatedDate', 'Last Updated')}
                      </span>
                      <span>{formatDate(proposal.updated_at)}</span>
                    </CListGroupItem>
                    {proposal.sent_at && (
                      <CListGroupItem className="d-flex justify-content-between align-items-center border-0 px-0">
                        <span className="text-muted">
                          {t('adminQuote.ui.sentDate', 'Sent Date')}
                        </span>
                        <span className="text-info">{formatDate(proposal.sent_at)}</span>
                      </CListGroupItem>
                    )}
                    {proposal.accepted_at && (
                      <CListGroupItem className="d-flex justify-content-between align-items-center border-0 px-0">
                        <span className="text-muted">
                          {t('adminQuote.ui.acceptedDate', 'Accepted Date')}
                        </span>
                        <span className="text-success">{formatDate(proposal.accepted_at)}</span>
                      </CListGroupItem>
                    )}
                  </CListGroup>
                </Box>
              </Flex>

              {proposal.description && (
                <div className="mt-4">
                  <h6 className="text-muted mb-2">{t('common.description', 'Description')}</h6>
                  <div className="bg-light p-3 rounded">
                    <p className="mb-0">{proposal.description}</p>
                  </div>
              )}
            </CardBody>
          </Card>

          {/* Proposal Items */}
          {parsedData.items && parsedData.items.length > 0 && (
            <Card className="mb-4">
              <CardHeader>
                <strong>
                  <CIcon icon={cilClipboard} className="me-2" />
                  {t('adminQuote.ui.itemsHeader', 'Quote Items ({{count}})', {
                    count: parsedData.items.length,
                  })}
                </strong>
              </CardHeader>
              <CardBody>
                <div className="table-responsive">
                  <CTable hover>
                    <CTableHead>
                      <CTableRow>
                        <CTableHeaderCell>{t('proposalColumns.item', 'Item')}</CTableHeaderCell>
                        <CTableHeaderCell>
                          {t('common.description', 'Description')}
                        </CTableHeaderCell>
                        <CTableHeaderCell className="text-center">
                          {t('proposalColumns.qty', 'Qty')}
                        </CTableHeaderCell>
                        <CTableHeaderCell className="text-end">
                          {t('proposalDoc.catalog.unitPrice', 'Unit Price')}
                        </CTableHeaderCell>
                        <CTableHeaderCell className="text-end">
                          {t('proposalColumns.total', 'Total')}
                        </CTableHeaderCell>
                      </CTableRow>
                    </CTableHead>
                    <CTableBody>
                      {parsedData.items.map((item, index) => (
                        <CTableRow key={index}>
                          <CTableDataCell>
                            <strong>
                              {item.code ||
                                t('adminQuote.ui.itemNumber', 'Item {{n}}', { n: index + 1 })}
                            </strong>
                          </CTableDataCell>
                          <CTableDataCell>
                            {item.description || t('common.na', 'N/A')}
                          </CTableDataCell>
                          <CTableDataCell className="text-center">{item.qty || 1}</CTableDataCell>
                          <CTableDataCell className="text-end">
                            {formatCurrency(parseFloat(item.price) || 0)}
                          </CTableDataCell>
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
                  <Flex>
                    <Box md={6}></Box>
                    <Box md={6}>
                      <div className="d-flex justify-content-between mb-2">
                        <span>{t('proposalDoc.priceSummary.cabinets', 'Cabinets & Parts:')}</span>
                        <span>{formatCurrency(parsedData.summary.cabinets || 0)}</span>
                      </div>
                      {parsedData.summary.assemblyFee > 0 && (
                        <div className="d-flex justify-content-between mb-2">
                          <span>{t('proposalDoc.priceSummary.assembly', 'Assembly fee:')}</span>
                          <span>{formatCurrency(parsedData.summary.assemblyFee)}</span>
                        </div>
                      )}
                      {parsedData.summary.modificationsCost > 0 && (
                        <div className="d-flex justify-content-between mb-2">
                          <span>
                            {t('proposalDoc.priceSummary.modifications', 'Modifications:')}
                          </span>
                          <span>{formatCurrency(parsedData.summary.modificationsCost)}</span>
                        </div>
                      )}
                      {parsedData.summary.discountAmount > 0 && (
                        <div className="d-flex justify-content-between mb-2 text-danger">
                          <span>{t('orders.details.discount', 'Discount')}</span>
                          <span>-{formatCurrency(parsedData.summary.discountAmount)}</span>
                        </div>
                      )}
                      {parsedData.summary.taxAmount > 0 && (
                        <div className="d-flex justify-content-between mb-2">
                          <span>{t('proposalDoc.priceSummary.tax', 'Tax:')}</span>
                          <span>{formatCurrency(parsedData.summary.taxAmount)}</span>
                        </div>
                      )}
                      <div className="d-flex justify-content-between border-top pt-2">
                        <strong>{t('proposalDoc.priceSummary.total', 'Total:')}</strong>
                        <strong className="text-success fs-5">
                          {formatCurrency(parsedData.summary.grandTotal || parsedData.totalAmount)}
                        </strong>
                      </div>
                    </Box>
                  </Flex>
                </div>
              </CardBody>
            </Card>
          )}
        </Box>

        <Box lg={4}>
          {/* Status Timeline */}
          <Card>
            <CardHeader>
              <strong>
                <CIcon icon={cilHistory} className="me-2" />
                {t('adminQuote.ui.statusTimeline', 'Status Timeline')}
              </strong>
            </CardHeader>
            <CardBody>
              <div className="timeline">
                {getStatusTimeline(proposal).map((item, index) => (
                  <div key={index} className="d-flex mb-4">
                    <div
                      className={`timeline-icon bg-${item.color} text-white rounded-circle d-flex align-items-center justify-content-center me-3`}
                      style={{ width: '40px', height: '40px', minWidth: '40px' }}
                    >
                      <CIcon icon={item.icon} size="sm" />
                    </div>
                    <div className="flex-grow-1">
                      <div className="d-flex justify-content-between align-items-start mb-1">
                        <strong>{item.label}</strong>
                        <small className="text-muted">{formatDate(item.date)}</small>
                      </div>
                      <small className="text-muted">{item.description}</small>
                    </div>
                ))}
              </div>
            </CardBody>
          </Card>
        </Box>
      </Flex>
    </Container>
  )
}

export default AdminProposalView
