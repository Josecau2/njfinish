import StandardCard from '../../components/StandardCard'

import React, { useEffect, useMemo, useState } from 'react'
import { useSelector } from 'react-redux'
import { Alert, AlertIcon, Badge, Box, Button, CardBody, Container, Flex, HStack, Icon, Spinner, Stack, Tab, TabList, TabPanel, TabPanels, Tabs, Text } from '@chakra-ui/react'
import PageContainer from '../../components/PageContainer'
import { useTranslation } from 'react-i18next'

import PageHeader from '../../components/PageHeader'
import {
  getContactInfo,
  saveContactInfo,
  listThreads,
  getThread,
  createThread,
  postMessage,
  markRead,
  closeThread,
  getConfigurationInfo,
} from '../../helpers/contactApi'
import { isAdmin as isAdminCheck } from '../../helpers/permissions'
import ContactInfoCard from '../../components/contact/ContactInfoCard'
import ContactInfoEditor from '../../components/contact/ContactInfoEditor'
import MessageComposer from '../../components/contact/MessageComposer'
import MessageHistory from '../../components/contact/MessageHistory'
import ThreadView from '../../components/contact/ThreadView'
import { Inbox, Info, Mail, MessageSquare } from 'lucide-react'
import { ICON_SIZE_MD, ICON_BOX_MD } from '../../constants/iconSizes'

const ContactUs = () => {
  const { t } = useTranslation()
  const user = useSelector((state) => state.auth.user)
  const isAdmin = useMemo(() => isAdminCheck(user), [user])

  const [activeTab, setActiveTab] = useState('contact')
  const [info, setInfo] = useState(null)
  const [infoLoading, setInfoLoading] = useState(true)
  const [threads, setThreads] = useState([])
  const [pagination, setPagination] = useState({ page: 1, totalPages: 1 })
  const [inboxLoading, setInboxLoading] = useState(false)
  const [selectedThread, setSelectedThread] = useState(null)
  const [threadLoading, setThreadLoading] = useState(false)
  const [selectedUserId, setSelectedUserId] = useState(null)

  useEffect(() => {
    let mounted = true
    setInfoLoading(true)

    Promise.all([
      getContactInfo().catch(() => ({ data: { data: null } })),
      getConfigurationInfo().catch(() => ({ data: null })),
    ])
      .then(([contactRes, configRes]) => {
        if (!mounted) return
        const contactData = contactRes?.data?.data || {}
        const configData = configRes?.data || {}
        const mergedInfo = {
          companyName: contactData.companyName || configData.companyName || '',
          email: contactData.email || configData.companyEmail || '',
          phone: contactData.phone || configData.companyPhone || '',
          website: contactData.website || configData.companyWebsite || '',
          address: contactData.address || configData.companyAddress || '',
          hours: contactData.hours || '',
          notes: contactData.notes || '',
          showCompanyName: contactData.showCompanyName !== false,
          showEmail: contactData.showEmail !== false,
          showPhone: contactData.showPhone !== false,
          showWebsite: contactData.showWebsite !== false,
          showAddress: contactData.showAddress !== false,
          showHours: contactData.showHours !== false,
          showNotes: contactData.showNotes !== false,
        }
        setInfo(mergedInfo)
      })
      .catch((err) => {
        console.warn('Failed to load contact info:', err)
        if (mounted) setInfo(null)
      })
      .finally(() => mounted && setInfoLoading(false))

    return () => {
      mounted = false
    }
  }, [])

  useEffect(() => {
    if (isAdmin && activeTab !== 'inbox' && activeTab !== 'info') {
      setActiveTab('inbox')
    }
  }, [isAdmin, activeTab])

  const loadThreads = (page = 1, userId = null) => {
    setInboxLoading(true)
    const params = { page }
    if (isAdmin && userId) params.userId = userId
    listThreads(params)
      .then((res) => {
        setThreads(res?.data?.data || [])
        setPagination(res?.data?.pagination || { page: 1, totalPages: 1 })
      })
      .catch((err) => {
        console.warn('Failed to load threads:', err)
        setThreads([])
        setPagination({ page: 1, totalPages: 1 })
      })
      .finally(() => setInboxLoading(false))
  }

  useEffect(() => {
    loadThreads(1, selectedUserId)
  }, [isAdmin, selectedUserId])

  const openThread = async (id) => {
    setThreadLoading(true)
    getThread(id)
      .then((res) => {
        setSelectedThread(res?.data?.data)
        markRead(id).catch((err) => console.warn('Failed to mark read:', err))
      })
      .catch((err) => {
        console.warn('Failed to load thread:', err)
        setSelectedThread(null)
      })
      .finally(() => setThreadLoading(false))
  }

  const onSendNew = async ({ subject, message }) => {
    try {
      const res = await createThread({ subject, message })
      loadThreads(1)
      if (res?.data?.data?.threadId) {
        openThread(res.data.data.threadId)
      }
    } catch (err) {
      console.warn('Failed to send message:', err)
    }
  }

  const onReply = async (id, body) => {
    try {
      await postMessage(id, body)
      openThread(id)
    } catch (err) {
      console.warn('Failed to send reply:', err)
    }
  }

  const onCloseThread = async (id) => {
    try {
      await closeThread(id)
      loadThreads(pagination.page, selectedUserId)
      setSelectedThread((prev) => (prev && prev.id === id ? { ...prev, status: 'closed' } : prev))
    } catch (err) {
      console.warn('Failed to close thread:', err)
    }
  }

  const adminTabs = ['inbox', 'info']
  const tabIndex = Math.max(adminTabs.indexOf(activeTab), 0)

  return (
    <PageContainer>
      <PageHeader
        title={t('contact.header')}
        subtitle={t('contact.subtitle')}
        icon={MessageSquare}
        actions={[
          <Badge key="role" colorScheme={isAdmin ? 'purple' : 'blue'}>{
            isAdmin ? t('contact.adminView') : t('contact.userView')
          }</Badge>,
        ]}
      />

      <Stack spacing={6}>
        {isAdmin ? (
          <StandardCard variant="outline" borderRadius="xl" shadow="sm">
            <CardBody>
              <Tabs
                index={tabIndex}
                onChange={(idx) => setActiveTab(adminTabs[idx])}
                colorScheme="brand"
              >
                <TabList overflowX="auto">
                  <Tab>
                    <Icon as={Inbox} boxSize={ICON_BOX_MD} mr={2} />
                    {t('contact.inbox')}
                  </Tab>
                  <Tab>
                    <Icon as={Info} boxSize={ICON_BOX_MD} mr={2} />
                    {t('contact.infoTab')}
                  </Tab>
                </TabList>
                <TabPanels mt={6}>
                  <TabPanel px={0}>
                    <Flex direction={{ base: 'column', lg: 'row' }} gap={6} align="stretch">
                      <Box flex={{ base: '1', lg: '0 0 320px' }}>
                        <MessageHistory
                          loading={inboxLoading}
                          threads={threads}
                          page={pagination.page}
                          totalPages={pagination.totalPages}
                          onPageChange={(page) => loadThreads(page, selectedUserId)}
                          onSelect={openThread}
                          isAdmin
                          groupByUser={!selectedUserId}
                          onSelectUser={(uid) => {
                            setSelectedUserId(uid)
                            setSelectedThread(null)
                            loadThreads(1, uid)
                          }}
                        />
                      </Box>
                      <Box flex="1">
                        <ThreadView
                          loading={threadLoading}
                          thread={selectedThread}
                          onReply={onReply}
                          onClose={onCloseThread}
                          isAdmin
                        />
                      </Box>
                    </Flex>
                  </TabPanel>
                  <TabPanel px={0}>
                    <Flex direction={{ base: 'column', lg: 'row' }} gap={6} align="stretch">
                      <Box flex={{ base: 1, lg: 1 }}>
                        <ContactInfoCard loading={infoLoading} info={info} />
                      </Box>
                      <Box flex={{ base: 1, lg: 1 }}>
                        <ContactInfoEditor
                          info={info}
                          onSave={async (data) => {
                            try {
                              await saveContactInfo(data)
                              const [contactRes, configRes] = await Promise.all([
                                getContactInfo().catch(() => ({ data: { data: null } })),
                                getConfigurationInfo().catch(() => ({ data: null })),
                              ])
                              const contactData = contactRes?.data?.data || {}
                              const configData = configRes?.data || {}
                              const mergedInfo = {
                                companyName: contactData.companyName || configData.companyName || '',
                                email: contactData.email || configData.companyEmail || '',
                                phone: contactData.phone || configData.companyPhone || '',
                                website: contactData.website || configData.companyWebsite || '',
                                address: contactData.address || configData.companyAddress || '',
                                hours: contactData.hours || '',
                                notes: contactData.notes || '',
                                showCompanyName: contactData.showCompanyName !== false,
                                showEmail: contactData.showEmail !== false,
                                showPhone: contactData.showPhone !== false,
                                showWebsite: contactData.showWebsite !== false,
                                showAddress: contactData.showAddress !== false,
                                showHours: contactData.showHours !== false,
                                showNotes: contactData.showNotes !== false,
                              }
                              setInfo(mergedInfo)
                            } catch (err) {
                              console.warn('Failed to save contact info:', err)
                            }
                          }}
                        />
                      </Box>
                    </Flex>
                  </TabPanel>
                </TabPanels>
              </Tabs>
            </CardBody>
          </StandardCard>
        ) : (
          <StandardCard variant="outline" borderRadius="xl" shadow="sm">
            <CardBody>
              <Stack spacing={6}>
                <ContactInfoCard loading={infoLoading} info={info} />
                <MessageComposer onSend={onSendNew} />
                <MessageHistory
                  loading={inboxLoading}
                  threads={threads}
                  page={pagination.page}
                  totalPages={pagination.totalPages}
                  onPageChange={(page) => loadThreads(page)}
                  onSelect={openThread}
                  isAdmin={false}
                />
                <ThreadView loading={threadLoading} thread={selectedThread} onReply={onReply} />
              </Stack>
            </CardBody>
          </StandardCard>
        )}
      </Stack>
    </PageContainer>
  )
}

export default ContactUs
