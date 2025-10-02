import StandardCard from '../../components/StandardCard'
import React, { useState, useEffect, useMemo, useCallback } from 'react'
import { useTranslation } from 'react-i18next'
import axiosInstance from '../../helpers/axiosInstance'
import { useParams, useNavigate } from 'react-router-dom'
import { decodeParam } from '../../utils/obfuscate'
import { Container, Stack, Box, SimpleGrid, HStack, VStack, Text, Button, Icon, Badge, Table, Thead, Tbody, Tr, Th, Td, TableContainer, Spinner, Center, Alert, AlertIcon, Divider } from '@chakra-ui/react'
import {
  ArrowLeft,
  User,
  Calendar,
  MapPin,
  ClipboardList,
  Clock,
  CheckCircle2,
  XCircle,
  History,
  Printer,
  Download,
  FileText,
  Send,
} from 'lucide-react'
import PageHeader from '../../components/PageHeader'

const statusDefinitions = {
  draft: { color: 'gray', icon: ClipboardList },
  sent: { color: 'blue', icon: Send },
  pending: { color: 'yellow', icon: Clock },
  approved: { color: 'green', icon: CheckCircle2 },
  accepted: { color: 'green', icon: CheckCircle2 },
  rejected: { color: 'red', icon: XCircle },
  expired: { color: 'gray', icon: Clock },
  in_progress: { color: 'blue', icon: Clock },
  completed: { color: 'green', icon: CheckCircle2 },
}

const AdminProposalView = () => {
  const { proposalId: rawProposalId } = useParams()
  const proposalId = decodeParam(rawProposalId)
  const navigate = useNavigate()
  const { t } = useTranslation()

  const [proposal, setProposal] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  const getStatusLabel = useCallback(
    (status) => {
      const translations = {
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
      return translations[status] || status || t('proposals.status.draft', 'Draft')
    },
    [t],
  )

  const getStatusColor = useCallback((status) => statusDefinitions[status]?.color || 'gray', [])
  const getStatusIcon = useCallback((status) => statusDefinitions[status]?.icon || ClipboardList, [])

  const formatCurrency = (amount) =>
    new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(amount || 0)

  const parseProposalData = useCallback((currentProposal) => {
    if (!currentProposal || !currentProposal.manufacturersData) {
      return { items: [], totalAmount: 0, summary: {} }
    }

    try {
      const manufacturersData = JSON.parse(currentProposal.manufacturersData)
      let allItems = []
      const combinedSummary = {
        cabinets: 0,
        assemblyFee: 0,
        modificationsCost: 0,
        styleTotal: 0,
        discountAmount: 0,
        taxAmount: 0,
        grandTotal: 0,
      }

      manufacturersData.forEach((manufacturer) => {
        if (Array.isArray(manufacturer.items)) {
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
  }, [])

  const formatDate = useCallback(
    (dateString) => {
      if (!dateString) return t('common.na', 'N/A')
      try {
        return new Date(dateString).toLocaleString()
      } catch (error) {
        console.error('Error formatting date:', error)
        return t('common.na', 'N/A')
      }
    },
    [t],
  )

  const getStatusTimeline = useCallback(
    (currentProposal) => {
      if (!currentProposal) return []
      const timeline = []

      timeline.push({
        status: 'created',
        label: t('adminQuote.labels.created', 'Created'),
        date: currentProposal.created_at,
        icon: ClipboardList,
        color: 'gray',
        description: t('adminQuote.timeline.created', 'Quote was created and added to the system'),
      })

      if (currentProposal.sent_at) {
        timeline.push({
          status: 'sent',
          label: t('adminQuote.labels.sentToCustomer', 'Sent to Customer'),
          date: currentProposal.sent_at,
          icon: Send,
          color: 'blue',
          description: t('adminQuote.timeline.sent', 'Quote was sent to the customer for review'),
        })
      }

      if (currentProposal.accepted_at) {
        timeline.push({
          status: 'accepted',
          label: t('adminQuote.labels.accepted', 'Accepted'),
          date: currentProposal.accepted_at,
          icon: CheckCircle2,
          color: 'green',
          description: t('adminQuote.timeline.accepted', 'Quote was formally accepted'),
        })
      }

      if (currentProposal.status && !['draft', 'sent', 'accepted'].includes(currentProposal.status)) {
        timeline.push({
          status: currentProposal.status,
          label: getStatusLabel(currentProposal.status),
          date: currentProposal.updated_at,
          icon: getStatusIcon(currentProposal.status),
          color: getStatusColor(currentProposal.status),
          description:
            currentProposal.status === 'rejected'
              ? t('adminQuote.timeline.rejected', 'Quote was rejected')
              : currentProposal.status === 'expired'
                ? t('adminQuote.timeline.expired', 'Quote has expired')
                : t('adminQuote.timeline.changed', 'Proposal status changed to {{status}}', {
                    status: currentProposal.status,
                  }),
        })
      }

      return timeline
    },
    [getStatusColor, getStatusIcon, getStatusLabel, t],
  )

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

  const parsedData = useMemo(() => parseProposalData(proposal), [parseProposalData, proposal])
  const statusTimeline = useMemo(() => getStatusTimeline(proposal), [getStatusTimeline, proposal])

  const handlePrint = () => {
    window.print()
  }

  const handleDownload = () => {
    // TODO: Implement PDF download functionality once endpoint is available
    console.info('Download PDF requested')
  }

  if (loading) {
    return (
      <Center py={24} flexDirection="column" gap={3}>
        <Spinner size="lg" color="brand.500" />
        <Text color="gray.500">{t('common.loading', 'Loading...')}</Text>
      </Center>
    )
  }

  if (error) {
    return (
      <Container maxW="lg" py={10}>
        <Stack spacing={4}>
          <Alert status="error" borderRadius="md">
            <AlertIcon />
            {error}
          </Alert>
          <Button variant="outline" onClick={() => navigate(-1)} leftIcon={<Icon as={ArrowLeft} />}>
            {t('common.back', 'Back')}
          </Button>
        </Stack>
      </Container>
    )
  }

  if (!proposal) {
    return (
      <Container maxW="lg" py={10}>
        <Stack spacing={4}>
          <Alert status="warning" borderRadius="md">
            <AlertIcon />
            {t('adminQuote.ui.notFound', 'Proposal not found.')}
          </Alert>
          <Button variant="outline" onClick={() => navigate(-1)} leftIcon={<Icon as={ArrowLeft} />}>
            {t('common.back', 'Back')}
          </Button>
        </Stack>
      </Container>
    )
  }

  const headerSubtitleParts = []
  if (proposal.customer?.name) {
    headerSubtitleParts.push(
      `${t('adminQuote.ui.customer', 'Customer')}: ${proposal.customer.name}`,
    )
  }
  if (proposal.UserGroup?.name) {
    headerSubtitleParts.push(
      `${t('adminQuote.ui.contractorGroup', 'Contractor Group')}: ${proposal.UserGroup.name}`,
    )
  }
  const headerSubtitle =
    headerSubtitleParts.join(' � ') || t('adminQuote.ui.detailSubtitle', 'Proposal overview')

  const headerActions = [
    <Button
      key="print"
      variant="outline"
      colorScheme="brand"
      size="sm"
      leftIcon={<Icon as={Printer} boxSize={4} />}
      onClick={handlePrint}
    >
      {t('adminQuote.ui.print', 'Print')}
    </Button>,
    <Button
      key="download"
      variant="outline"
      colorScheme="brand"
      size="sm"
      leftIcon={<Icon as={Download} boxSize={4} />}
      onClick={handleDownload}
    >
      {t('proposalCommon.downloadPdf', 'Download PDF')}
    </Button>,
    <Button
      key="back"
      size="sm"
      variant="outline"
      colorScheme="gray"
      leftIcon={<Icon as={ArrowLeft} boxSize={4} />}
      onClick={() => navigate(-1)}
    >
      {t('common.back', 'Back')}
    </Button>,
  ]

  return (
    <Container maxW="7xl" py={6}>
      <Stack spacing={6}>
        <PageHeader
          title={proposal.title || t('publicQuote.titleNumber', { id: proposal.id })}
          subtitle={headerSubtitle}
          icon={FileText}
          actions={headerActions}
        >
          <Badge colorScheme={getStatusColor(proposal.status)} borderRadius="full" px={3} py={1}>
            <HStack spacing={2}>
              <Icon as={getStatusIcon(proposal.status)} boxSize={4} />
              <Text fontSize="sm">{getStatusLabel(proposal.status)}</Text>
            </HStack>
          </Badge>
        </PageHeader>

        <SimpleGrid columns={{ base: 1, lg: 3 }} spacing={6} alignItems="start">
          <Stack spacing={6} gridColumn={{ lg: 'span 2' }}>
            <StandardCard variant="outline">
              <CardHeader bg="gray.50" borderBottomWidth="1px">
                <Text fontWeight="semibold" color="gray.800">
                  {t('adminQuote.ui.overview', 'Quote Overview')}
                </Text>
              </CardHeader>
              <CardBody>
                <SimpleGrid columns={{ base: 1, md: 2 }} spacing={6}>
                  <Stack spacing={3}>
                    <Text fontSize="2xl" fontWeight="bold" color="green.600">
                      {formatCurrency(parsedData.totalAmount)}
                    </Text>
                    <Divider />
                    <Stack spacing={2} fontSize="sm" color="gray.700">
                      <HStack justify="space-between">
                        <Text color="gray.500">
                          {t('adminQuote.ui.proposalId', 'Quote ID')}
                        </Text>
                        <Text fontWeight="semibold">#{proposal.id}</Text>
                      </HStack>
                      <HStack justify="space-between">
                        <Text color="gray.500">{t('adminQuote.ui.customer', 'Customer')}</Text>
                        <Text>{proposal.customer?.name || t('common.na', 'N/A')}</Text>
                      </HStack>
                      <HStack justify="space-between">
                        <Text color="gray.500">
                          {t('adminQuote.ui.contractorGroup', 'Contractor Group')}
                        </Text>
                        <Text>{proposal.UserGroup?.name || t('common.na', 'N/A')}</Text>
                      </HStack>
                    </Stack>
                  </Stack>

                  <Stack spacing={2} fontSize="sm" color="gray.700">
                    <HStack justify="space-between">
                      <Text color="gray.500">
                        {t('adminQuote.ui.createdDate', 'Created Date')}
                      </Text>
                      <Text>{formatDate(proposal.created_at)}</Text>
                    </HStack>
                    <HStack justify="space-between">
                      <Text color="gray.500">
                        {t('adminQuote.ui.updatedDate', 'Last Updated')}
                      </Text>
                      <Text>{formatDate(proposal.updated_at)}</Text>
                    </HStack>
                    {proposal.sent_at && (
                      <HStack justify="space-between">
                        <Text color="gray.500">
                          {t('adminQuote.ui.sentDate', 'Sent Date')}
                        </Text>
                        <Text color="blue.500">{formatDate(proposal.sent_at)}</Text>
                      </HStack>
                    )}
                    {proposal.accepted_at && (
                      <HStack justify="space-between">
                        <Text color="gray.500">
                          {t('adminQuote.ui.acceptedDate', 'Accepted Date')}
                        </Text>
                        <Text color="green.500">{formatDate(proposal.accepted_at)}</Text>
                      </HStack>
                    )}
                  </Stack>
                </SimpleGrid>

                {proposal.description && (
                  <Stack spacing={2} mt={6}>
                    <Text fontWeight="semibold" color="gray.700">
                      {t('common.description', 'Description')}
                    </Text>
                    <Box bg="gray.50" borderRadius="md" borderWidth="1px" borderColor="gray.200" p={4}>
                      <Text color="gray.700">{proposal.description}</Text>
                    </Box>
                  </Stack>
                )}
              </CardBody>
            </StandardCard>

            {parsedData.items && parsedData.items.length > 0 && (
              <StandardCard variant="outline">
                <CardHeader bg="gray.50" borderBottomWidth="1px">
                  <HStack spacing={2}>
                    <Icon as={ClipboardList} />
                    <Text fontWeight="semibold" color="gray.800">
                      {t('adminQuote.ui.itemsHeader', 'Quote Items ({{count}})', {
                        count: parsedData.items.length,
                      })}
                    </Text>
                  </HStack>
                </CardHeader>
                <CardBody>
                  <TableContainer>
                    <Table variant="simple" size="sm">
                      <Thead bg="gray.50">
                        <Tr>
                          <Th>{t('proposalColumns.item', 'Item')}</Th>
                          <Th>{t('common.description', 'Description')}</Th>
                          <Th textAlign="center">{t('proposalColumns.qty', 'Qty')}</Th>
                          <Th isNumeric>{t('proposalDoc.catalog.unitPrice', 'Unit Price')}</Th>
                          <Th isNumeric>{t('proposalColumns.total', 'Total')}</Th>
                        </Tr>
                      </Thead>
                      <Tbody>
                        {parsedData.items.map((item, index) => (
                          <Tr key={index}>
                            <Td fontWeight="semibold">
                              {item.code || t('adminQuote.ui.itemNumber', 'Item {{n}}', { n: index + 1 })}
                            </Td>
                            <Td>{item.description || t('common.na', 'N/A')}</Td>
                            <Td textAlign="center">{item.qty || 1}</Td>
                            <Td isNumeric>{formatCurrency(parseFloat(item.price) || 0)}</Td>
                            <Td isNumeric fontWeight="semibold">
                              {formatCurrency(parseFloat(item.total) || 0)}
                            </Td>
                          </Tr>
                        ))}
                      </Tbody>
                    </Table>
                  </TableContainer>

                  <Stack spacing={2} mt={6} borderTopWidth="1px" borderColor="gray.200" pt={4}>
                    <HStack justify="space-between">
                      <Text>{t('proposalDoc.priceSummary.cabinets', 'Cabinets & Parts:')}</Text>
                      <Text>{formatCurrency(parsedData.summary.cabinets || 0)}</Text>
                    </HStack>
                    {parsedData.summary.assemblyFee > 0 && (
                      <HStack justify="space-between">
                        <Text>{t('proposalDoc.priceSummary.assembly', 'Assembly fee:')}</Text>
                        <Text>{formatCurrency(parsedData.summary.assemblyFee)}</Text>
                      </HStack>
                    )}
                    {parsedData.summary.modificationsCost > 0 && (
                      <HStack justify="space-between">
                        <Text>{t('proposalDoc.priceSummary.modifications', 'Modifications:')}</Text>
                        <Text>{formatCurrency(parsedData.summary.modificationsCost)}</Text>
                      </HStack>
                    )}
                    {parsedData.summary.discountAmount > 0 && (
                      <HStack justify="space-between" color="red.500">
                        <Text>{t('orders.details.discount', 'Discount')}</Text>
                        <Text>-{formatCurrency(parsedData.summary.discountAmount)}</Text>
                      </HStack>
                    )}
                    {parsedData.summary.taxAmount > 0 && (
                      <HStack justify="space-between">
                        <Text>{t('proposalDoc.priceSummary.tax', 'Tax:')}</Text>
                        <Text>{formatCurrency(parsedData.summary.taxAmount)}</Text>
                      </HStack>
                    )}
                    <Divider />
                    <HStack justify="space-between">
                      <Text fontWeight="semibold">
                        {t('proposalDoc.priceSummary.total', 'Total:')}
                      </Text>
                      <Text fontWeight="bold" fontSize="lg" color="green.600">
                        {formatCurrency(parsedData.summary.grandTotal || parsedData.totalAmount)}
                      </Text>
                    </HStack>
                  </Stack>
                </CardBody>
              </StandardCard>
            )}
          </Stack>

          <Stack spacing={6}>
            <StandardCard variant="outline">
              <CardHeader bg="gray.50" borderBottomWidth="1px">
                <HStack spacing={2}>
                  <Icon as={History} />
                  <Text fontWeight="semibold" color="gray.800">
                    {t('adminQuote.ui.statusTimeline', 'Status Timeline')}
                  </Text>
                </HStack>
              </CardHeader>
              <CardBody>
                {statusTimeline.length === 0 ? (
                  <Text color="gray.500">{t('adminQuote.timeline.empty', 'No status updates recorded yet.')}</Text>
                ) : (
                  <Stack spacing={5}>
                    {statusTimeline.map((item, index) => (
                      <HStack key={`${item.status}-${index}`} align="flex-start" spacing={4}>
                        <Center
                          w={10}
                          h={10}
                          borderRadius="full"
                          bg={`${item.color}.500`}
                          color="white"
                          flexShrink={0}
                        >
                          <Icon as={item.icon} boxSize={4} />
                        </Center>
                        <Stack spacing={1} flex="1">
                          <HStack justify="space-between" align="flex-start">
                            <Text fontWeight="semibold">{item.label}</Text>
                            <Text fontSize="sm" color="gray.500">
                              {formatDate(item.date)}
                            </Text>
                          </HStack>
                          <Text fontSize="sm" color="gray.600">
                            {item.description}
                          </Text>
                        </Stack>
                      </HStack>
                    ))}
                  </Stack>
                )}
              </CardBody>
            </StandardCard>
          </Stack>
        </SimpleGrid>
      </Stack>
    </Container>
  )
}

export default AdminProposalView
