import StandardCard from '../../components/StandardCard'

import React, { useEffect, useMemo, useState } from 'react'
import { Badge, Box, Button, CardBody, CardHeader, Container, Flex, FormControl, FormLabel, HStack, Icon, IconButton, Input, InputGroup, InputLeftElement, InputRightAddon, Modal, ModalBody, ModalCloseButton, ModalContent, ModalHeader, ModalOverlay, Select, SimpleGrid, Spinner, Stack, Table, TableContainer, Tbody, Td, Text, Textarea, Th, Thead, Tr, VStack, useToast, useColorModeValue } from '@chakra-ui/react'
import PageContainer from '../../components/PageContainer'
import { RefreshCw, Send, FileText, X, HelpCircle, Percent, Search } from 'lucide-react'
import axiosInstance from '../../helpers/axiosInstance'
import PageHeader from '../../components/PageHeader'
import Swal from 'sweetalert2'
import { useTranslation } from 'react-i18next'
import { ICON_SIZE_MD, ICON_BOX_MD } from '../../constants/iconSizes'

const STATUS_VALUES = ['all', 'new', 'reviewing', 'contacted', 'closed']
const statusBadgeColor = {
  new: 'blue',
  reviewing: 'teal',
  contacted: 'green',
  closed: 'gray',
}

const formatSubmittedDate = (value) => {
  if (!value) return null
  try {
    const date = new Date(value)
    if (Number.isNaN(date.getTime())) return null
    return date.toLocaleString()
  } catch {
    return null
  }
}

const safeParseJson = (value) => {
  if (!value) return null
  if (typeof value === 'object') return value
  try {
    return JSON.parse(value)
  } catch {
    return null
  }
}

const normalizeMetadata = (metadata) => {
  const m = safeParseJson(metadata) || {}
  if (!Array.isArray(m.notes)) m.notes = []
  return m
}

const normalizeLead = (lead) => {
  if (!lead) return lead
  return {
    ...lead,
    metadata: normalizeMetadata(lead.metadata),
  }
}

const getLeadValue = (lead, key) => {
  if (!lead) return ''
  if (lead[key]) return lead[key]
  const contact = lead.metadata?.contact
  if (contact && contact[key]) return contact[key]
  return ''
}

const getLeadFullName = (lead) => {
  if (!lead) return ''
  const first = getLeadValue(lead, 'firstName')
  const last = getLeadValue(lead, 'lastName')
  const combined = [first, last].filter(Boolean).join(' ').trim()
  return combined || lead.name || ''
}

const getLeadLocation = (lead) => {
  const city = getLeadValue(lead, 'city')
  const state = getLeadValue(lead, 'state')
  const zip = getLeadValue(lead, 'zip')
  return [city, state, zip].filter(Boolean).join(', ')
}

const LeadsPage = () => {
  const { t } = useTranslation()
  const [leads, setLeads] = useState([])
  const [loading, setLoading] = useState(true)
  const [statusFilter, setStatusFilter] = useState('all')
  const [searchTerm, setSearchTerm] = useState('')
  const [selectedLead, setSelectedLead] = useState(null)
  const [noteText, setNoteText] = useState('')
  const [savingNote, setSavingNote] = useState(false)
  const [updatingStatusId, setUpdatingStatusId] = useState(null)

  const statusOptions = useMemo(
    () =>
      STATUS_VALUES.map((value) => ({
        value,
        label:
          value === 'all'
            ? t('leadsPage.filters.status.options.all')
            : t(`leadsPage.status.${value}`),
      })),
    [t],
  )

  const statusLabelMap = useMemo(() => {
    const map = Object.fromEntries(statusOptions.map((option) => [option.value, option.label]))
    map.unknown = t('leadsPage.status.unknown')
    return map
  }, [statusOptions, t])

  const statusUpdateOptions = useMemo(
    () => statusOptions.filter((option) => option.value !== 'all'),
    [statusOptions],
  )

  const selectedLeadSubmittedAt = selectedLead ? formatSubmittedDate(selectedLead.createdAt) : null
  const selectedLeadStatusText = selectedLead
    ? statusLabelMap[selectedLead.status] ?? statusLabelMap.unknown
    : statusLabelMap.unknown
  const selectedLeadStatusBadge = selectedLead
    ? {
        text: selectedLeadStatusText,
        colorScheme: statusBadgeColor[selectedLead.status] || 'gray',
      }
    : null
  const selectedLeadSubmittedText = selectedLeadSubmittedAt
    ? t('leadsPage.modal.status.submittedAt', { date: selectedLeadSubmittedAt })
    : t('leadsPage.modal.status.submittedUnknown')

  const selectedLeadFullName = selectedLead ? getLeadFullName(selectedLead) : ''
  const selectedLeadPhone = selectedLead ? getLeadValue(selectedLead, 'phone') : ''
  const selectedLeadCity = selectedLead ? getLeadValue(selectedLead, 'city') : ''
  const selectedLeadState = selectedLead ? getLeadValue(selectedLead, 'state') : ''
  const selectedLeadZip = selectedLead ? getLeadValue(selectedLead, 'zip') : ''
  const selectedLeadDisplayName = selectedLeadFullName || (selectedLead ? selectedLead.name : '')

  const fetchLeads = async (opts = {}) => {
    const { status = statusFilter, search = searchTerm } = opts
    setLoading(true)
    try {
      const params = {}
      if (status && status !== 'all') params.status = status
      if (search) params.search = search
      const res = await axiosInstance.get('/api/admin/leads', { params })
      const incoming = Array.isArray(res.data?.leads) ? res.data.leads : []
      setLeads(incoming.map(normalizeLead))
    } catch (err) {
      console.error('Failed to fetch leads:', err)
      Swal.fire(t('common.error'), t('leadsPage.alerts.fetchError'), 'error')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchLeads()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  useEffect(() => {
    fetchLeads({ status: statusFilter, search: searchTerm })
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [statusFilter])

  const filteredLeads = useMemo(() => {
    if (!searchTerm) return leads
    const term = searchTerm.toLowerCase()
    return leads.filter((lead) => {
      const haystack = [
        getLeadFullName(lead),
        lead.name,
        lead.email,
        lead.company,
        getLeadValue(lead, 'phone'),
        getLeadValue(lead, 'city'),
        getLeadValue(lead, 'state'),
        getLeadValue(lead, 'zip'),
      ]
      return haystack.filter(Boolean).some((value) => String(value).toLowerCase().includes(term))
    })
  }, [leads, searchTerm])

  const handleStatusChange = async (lead, nextStatus) => {
    setUpdatingStatusId(lead.id)
    try {
      await axiosInstance.patch(`/api/admin/leads/${lead.id}`, { status: nextStatus })
      await fetchLeads()
      Swal.fire(t('common.success'), t('leadsPage.alerts.statusUpdated'), 'success')
    } catch (err) {
      console.error('Failed to update lead status:', err)
      Swal.fire(t('common.error'), t('leadsPage.alerts.statusUpdateFailed'), 'error')
    } finally {
      setUpdatingStatusId(null)
    }
  }

  const handleNoteSubmit = async () => {
    if (!selectedLead) return
    const note = noteText.trim()
    if (!note) return
    setSavingNote(true)
    try {
      let patchResponse
      try {
        patchResponse = await axiosInstance.put(`/api/admin/leads/${selectedLead.id}`, {
          adminNote: note,
        })
      } catch (putErr) {
        const status = putErr?.response?.status
        if (status === 404 || status === 405) {
          patchResponse = await axiosInstance.patch(`/api/admin/leads/${selectedLead.id}`, {
            adminNote: note,
          })
        } else {
          throw putErr
        }
      }
      let updatedLeadFromServer = normalizeLead(patchResponse.data.lead)
      if (updatedLeadFromServer && updatedLeadFromServer.id === selectedLead.id) {
        const now = new Date().toISOString()
        const ensuredMeta = normalizeMetadata(updatedLeadFromServer.metadata)
        const hasNewNote =
          ensuredMeta.notes && ensuredMeta.notes.length > 0 && ensuredMeta.notes[0]?.note === note
        if (!hasNewNote) {
          ensuredMeta.notes = [
            { note, at: now, byName: selectedLead?.currentUserName || 'Admin' },
            ...ensuredMeta.notes,
          ]
        }
        updatedLeadFromServer = { ...updatedLeadFromServer, metadata: ensuredMeta }
      }

      setLeads((prevLeads) =>
        prevLeads.map((lead) => (lead.id === selectedLead.id ? updatedLeadFromServer : lead)),
      )
      setSelectedLead(updatedLeadFromServer)
      setNoteText('')
      Swal.fire({
        title: t('common.success'),
        text: t('leadsPage.alerts.noteSaved'),
        icon: 'success',
        zIndex: 9999,
      })
    } catch (err) {
      console.error('Failed to add note:', err)
      Swal.fire({
        title: t('common.error'),
        text: t('leadsPage.alerts.noteSaveFailed'),
        icon: 'error',
        zIndex: 9999,
      })
    } finally {
      setSavingNote(false)
    }
  }

  const closeModal = () => {
    setSelectedLead(null)
    setNoteText('')
  }

  const refreshButton = (
    <Button
      key="refresh"
      leftIcon={<Icon as={RefreshCw} boxSize={ICON_BOX_MD} aria-hidden="true" />}
      variant="outline"
      onClick={() => fetchLeads({ status: statusFilter, search: searchTerm })}
      isDisabled={loading}
      minH="44px"
    >
      {t('common.refresh')}
    </Button>
  )

  return (
    <PageContainer maxW="full">
      <Stack spacing={6}>
        <PageHeader
          title={t('leadsPage.title')}
          subtitle={t('leadsPage.description', 'Manage incoming customer inquiries and statuses')}
          icon={FileText}
          actions={[refreshButton]}
          maxW="full"
          containerProps={{ px: { base: 4, md: 6, xl: 8, "2xl": 10 } }}
        />

        <StandardCard variant="outline">
          <CardBody>
            <SimpleGrid columns={{ base: 1, md: 3 }} spacing={{ base: 3, md: 4 }}>
              <FormControl>
                <FormLabel fontSize="sm" color={useColorModeValue("gray.600", "gray.400")}>
                  {t('leadsPage.filters.status.label')}
                </FormLabel>
                <Select value={statusFilter} onChange={(event) => setStatusFilter(event.target.value)}>
                  {statusOptions.map((option) => (
                    <option key={option.value} value={option.value}>
                      {option.label}
                    </option>
                  ))}
                </Select>
              </FormControl>

              <FormControl>
                <FormLabel fontSize="sm" color={useColorModeValue("gray.600", "gray.400")}>
                  {t('leadsPage.filters.searchLabel', 'Search')}
                </FormLabel>
                <InputGroup>
                  <InputLeftElement pointerEvents="none">
                    <Icon as={Search} boxSize={ICON_BOX_MD} color={useColorModeValue("gray.500", "gray.400")} />
                  </InputLeftElement>
                  <Input
                    type="search"
                    placeholder={t('leadsPage.filters.searchPlaceholder')}
                    value={searchTerm}
                    onChange={(event) => setSearchTerm(event.target.value)}
                    aria-label={t('leadsPage.filters.searchPlaceholder')}
                  />
                </InputGroup>
              </FormControl>

              <FormControl>
                <FormLabel fontSize="sm" color={useColorModeValue("gray.600", "gray.400")}>
                  {t('leadsPage.filters.help', 'Need help?')}
                </FormLabel>
                <Flex align="center" gap={4} color={useColorModeValue("gray.500", "gray.400")}>
                  <Icon as={HelpCircle} boxSize={ICON_BOX_MD} aria-hidden="true" />
                  <Text fontSize="sm">{t('leadsPage.helpText', 'Use filters to narrow down leads.')}</Text>
                </Flex>
              </FormControl>
            </SimpleGrid>
          </CardBody>
        </StandardCard>

        <StandardCard variant="outline">
          <CardHeader borderBottomWidth="1px">
            <Text fontWeight="semibold">{t('leadsPage.table.title', 'Leads')}</Text>
          </CardHeader>
          <CardBody p={0}>
            {loading ? (
              <Flex justify="center" py={12}>
                <Spinner size="lg" color="brand.500" />
              </Flex>
            ) : filteredLeads.length === 0 ? (
              <Text color={useColorModeValue("gray.500", "gray.400")} py={6} px={6}>{t('leadsPage.table.noResults')}</Text>
            ) : (
              <>
                {/* Desktop table view */}
                <TableContainer display={{ base: 'none', xl: 'block' }}>
                  <Table variant="simple" size="md">

                    <Thead>
                      <Tr>
                        <Th>{t('leadsPage.table.columns.name')}</Th>
                        <Th>{t('leadsPage.table.columns.email')}</Th>
                        <Th>{t('leadsPage.table.columns.phone')}</Th>
                        <Th>{t('leadsPage.table.columns.location')}</Th>
                        <Th>{t('leadsPage.table.columns.company')}</Th>
                        <Th>{t('leadsPage.table.columns.submitted')}</Th>
                        <Th>{t('leadsPage.table.columns.status')}</Th>
                        <Th textAlign="right">{t('leadsPage.table.columns.actions')}</Th>
                      </Tr>
                    </Thead>
                    <Tbody>
                      {filteredLeads.map((lead) => {
                        const displayName = getLeadFullName(lead) || lead.name || '�'
                        const phone = getLeadValue(lead, 'phone') || '�'
                        const location = getLeadLocation(lead) || '�'
                        const company = lead.company || '�'
                        const submittedAt = lead.createdAt
                          ? new Date(lead.createdAt).toLocaleString()
                          : '�'
                        return (
                          <Tr key={lead.id}>
                            <Td>
                              {displayName}
                            </Td>
                            <Td>
                              {lead.email || '?'}
                            </Td>
                            <Td>
                              {phone}
                            </Td>
                            <Td>
                              {location}
                            </Td>
                            <Td>
                              {company}
                            </Td>
                            <Td>
                              {submittedAt}
                            </Td>
                            <Td>
                              <Select
                                size="sm"
                                value={lead.status}
                                onChange={(event) => handleStatusChange(lead, event.target.value)}
                                isDisabled={updatingStatusId === lead.id}
                              >
                                {statusUpdateOptions.map((option) => (
                                  <option key={option.value} value={option.value}>
                                    {option.label}
                                  </option>
                                ))}
                              </Select>
                            </Td>
                            <Td textAlign="right">
                              <Button
                                size="sm"
                                variant="outline"
                                leftIcon={<Icon as={FileText} boxSize={ICON_BOX_MD} aria-hidden="true" />}
                                onClick={() => setSelectedLead(normalizeLead(lead))}
                              >
                                {t('leadsPage.table.actions.details')}
                              </Button>
                            </Td>
                          </Tr>
                        )
                      })}
                    </Tbody>
                  </Table>
                </TableContainer>

                {/* Mobile card view */}
                <VStack spacing={4} display={{ base: 'flex', xl: 'none' }} px={{ base: 4, md: 6 }} py={{ base: 4, md: 6 }}>
                  {filteredLeads.map((lead) => {
                    const displayName = getLeadFullName(lead) || lead.name || '�'
                    const phone = getLeadValue(lead, 'phone') || '�'
                    const location = getLeadLocation(lead) || '�'
                    const company = lead.company || '�'
                    const submittedAt = lead.createdAt
                      ? new Date(lead.createdAt).toLocaleString()
                      : '�'
                    return (
                      <StandardCard key={lead.id} w="100%" variant="outline">
                        <CardBody>
                          <VStack align="stretch" spacing={4}>
                            <Flex justify="space-between" align="start">
                              <Box>
                                <Text fontWeight="600" fontSize="md">
                                  {displayName}
                                </Text>
                                <Text fontSize="sm" color={useColorModeValue("gray.600", "gray.400")}>
                                  {lead.email}
                                </Text>
                              </Box>
                              <Badge colorScheme={statusBadgeColor[lead.status] || 'gray'}>
                                {lead.status}
                              </Badge>
                            </Flex>

                            <Box fontSize="sm">
                              {phone !== '�' && (
                                <Text>
                                  <Text as="span" fontWeight="500">
                                    {t('leadsPage.table.columns.phone')}:
                                  </Text>{' '}
                                  {phone}
                                </Text>
                              )}
                              {location !== '�' && (
                                <Text>
                                  <Text as="span" fontWeight="500">
                                    {t('leadsPage.table.columns.location')}:
                                  </Text>{' '}
                                  {location}
                                </Text>
                              )}
                              {company !== '�' && (
                                <Text>
                                  <Text as="span" fontWeight="500">
                                    {t('leadsPage.table.columns.company')}:
                                  </Text>{' '}
                                  {company}
                                </Text>
                              )}
                              <Text color={useColorModeValue("gray.500", "gray.400")} fontSize="xs" mt={1}>
                                {t('leadsPage.table.columns.submitted')}: {submittedAt}
                              </Text>
                            </Box>

                            <Flex gap={4} wrap="wrap">
                              <Select
                                size="sm"
                                flex="1"
                                minW="150px"
                                value={lead.status}
                                onChange={(event) => handleStatusChange(lead, event.target.value)}
                                isDisabled={updatingStatusId === lead.id}
                              >
                                {statusUpdateOptions.map((option) => (
                                  <option key={option.value} value={option.value}>
                                    {option.label}
                                  </option>
                                ))}
                              </Select>
                              <Button
                                size="sm"
                                variant="outline"
                                leftIcon={<Icon as={FileText} boxSize={ICON_BOX_MD} aria-hidden="true" />}
                                onClick={() => setSelectedLead(normalizeLead(lead))}
                                minH="44px"
                              >
                                {t('leadsPage.table.actions.details')}
                              </Button>
                            </Flex>
                          </VStack>
                        </CardBody>
                      </StandardCard>
                    )
                  })}
                </VStack>
              </>
            )}
          </CardBody>
        </StandardCard>

        <Modal isOpen={!!selectedLead} onClose={closeModal} size={{ base: "full", lg: "5xl" }} scrollBehavior="inside">
          <ModalOverlay />
          <ModalContent>
            <ModalHeader>
              <Flex justify="space-between" align="center" gap={4} wrap="wrap">
                <Box>
                  <Text fontWeight="semibold" fontSize="lg">
                    {t('leadsPage.modal.title')}
                  </Text>
                  <Text fontSize="sm" color={useColorModeValue("gray.500", "gray.400")}>
                    {selectedLeadSubmittedText}
                  </Text>
                </Box>
                <HStack spacing={4}>
                  {selectedLeadStatusBadge && (
                    <Badge colorScheme={selectedLeadStatusBadge.colorScheme} variant="subtle" px={3} py={1} borderRadius="full">
                      {selectedLeadStatusBadge.text}
                    </Badge>
                  )}
                  <IconButton size="lg" aria-label={t('common.close', 'Close')}
                    icon={<Icon as={X} boxSize={ICON_BOX_MD} aria-hidden="true" />}
                    variant="ghost"
                    onClick={closeModal}
                  />
                </HStack>
              </Flex>
            </ModalHeader>
            <ModalCloseButton />
            <ModalBody>
              {selectedLead && (
                <Stack spacing={6} pb={4}>
                  <StandardCard variant="outline">
                    <CardBody>
                      <SimpleGrid columns={{ base: 1, md: 2 }} spacing={4}>
                        <Box>
                          <Text fontWeight="semibold" fontSize="md">
                            {selectedLeadDisplayName || t('leadsPage.modal.status.unknownLead')}
                          </Text>
                          <Text fontSize="sm" color={useColorModeValue("gray.500", "gray.400")}>
                            {selectedLead.email || t('common.na')}
                          </Text>
                        </Box>
                        <Stack spacing={4}>
                          <Text fontSize="sm" color={useColorModeValue("gray.500", "gray.400")}>
                            {t('leadsPage.modal.contact.phone')}
                          </Text>
                          <Text fontWeight="medium">{selectedLeadPhone || t('common.na')}</Text>
                          <Text fontSize="sm" color={useColorModeValue("gray.500", "gray.400")}>
                            {t('leadsPage.modal.contact.location')}
                          </Text>
                          <Text fontWeight="medium">
                            {selectedLeadCity || selectedLeadState || selectedLeadZip
                              ? [selectedLeadCity, selectedLeadState, selectedLeadZip].filter(Boolean).join(', ')
                              : t('common.na')}
                          </Text>
                        </Stack>
                      </SimpleGrid>
                    </CardBody>
                  </StandardCard>

                  <StandardCard variant="outline">
                    <CardHeader pb={0}>
                      <HStack spacing={4} color={useColorModeValue("blue.500", "blue.300")}>
                        <Icon as={Send} boxSize={ICON_BOX_MD} aria-hidden="true" />
                        <Text fontWeight="semibold">{t('leadsPage.modal.message.heading')}</Text>
                      </HStack>
                    </CardHeader>
                    <CardBody pt={3}>
                      <Box bg={useColorModeValue("gray.50", "gray.800")} borderRadius="md" borderLeftWidth="4px" borderColor="blue.500" p={4}>
                        <Text fontSize="sm" lineHeight="1.6">
                          {selectedLead.message
                            ? selectedLead.message
                            : t('leadsPage.modal.message.empty')}
                        </Text>
                      </Box>
                    </CardBody>
                  </StandardCard>

                  <StandardCard variant="outline">
                    <CardHeader pb={0}>
                      <HStack spacing={4} color={useColorModeValue("blue.500", "blue.300")}>
                        <Icon as={FileText} boxSize={ICON_BOX_MD} aria-hidden="true" />
                        <Text fontWeight="semibold">{t('leadsPage.modal.notes.heading')}</Text>
                      </HStack>
                    </CardHeader>
                    <CardBody pt={3}>
                      {Array.isArray(selectedLead.metadata?.notes) && selectedLead.metadata.notes.length > 0 ? (
                        <Stack spacing={4}>
                          {selectedLead.metadata.notes.map((item, index) => (
                            <Box key={index} borderBottomWidth={index === selectedLead.metadata.notes.length - 1 ? '0' : '1px'} borderColor="gray.100" pb={3}>
                              <Flex justify="space-between" align="flex-start" mb={2}>
                                <Text fontWeight="semibold">
                                  {item.byName || t('leadsPage.modal.notes.defaultAuthor')}
                                </Text>
                                <Text fontSize="xs" color={useColorModeValue("gray.500", "gray.400")}>
                                  {item.at ? new Date(item.at).toLocaleString() : ''}
                                </Text>
                              </Flex>
                              <Text fontSize="sm" lineHeight="1.6">
                                {item.note}
                              </Text>
                            </Box>
                          ))}
                        </Stack>
                      ) : (
                        <Box bg={useColorModeValue("gray.50", "gray.800")} borderRadius="md" p={4} textAlign="center">
                          <Text fontSize="sm" color={useColorModeValue("gray.500", "gray.400")}>
                            {t('leadsPage.modal.notes.empty')}
                          </Text>
                        </Box>
                      )}
                    </CardBody>
                  </StandardCard>

                  <StandardCard variant="outline">
                    <CardHeader pb={0}>
                      <HStack spacing={4} color={useColorModeValue("blue.500", "blue.300")}>
                        <Icon as={Send} boxSize={ICON_BOX_MD} aria-hidden="true" />
                        <Text fontWeight="semibold">{t('leadsPage.modal.addNote.heading')}</Text>
                      </HStack>
                    </CardHeader>
                    <CardBody pt={3}>
                      <Stack spacing={4}>
                        <Textarea
                          rows={4}
                          placeholder={t('leadsPage.modal.addNote.placeholder')}
                          value={noteText}
                          onChange={(event) => setNoteText(event.target.value)}
                        />
                        <Flex justify="flex-end">
                          <Button
                            colorScheme="brand"
                            leftIcon={savingNote ? undefined : <Icon as={Send} boxSize={ICON_BOX_MD} aria-hidden="true" />}
                            onClick={handleNoteSubmit}
                            isLoading={savingNote}
                            loadingText={t('leadsPage.modal.addNote.saving', 'Saving...')}
                            isDisabled={!noteText.trim()}
                          >
                            {t('leadsPage.modal.addNote.submit')}
                          </Button>
                        </Flex>
                      </Stack>
                    </CardBody>
                  </StandardCard>
                </Stack>
              )}
            </ModalBody>
          </ModalContent>
        </Modal>
      </Stack>
    </PageContainer>
  )
}

export default LeadsPage
