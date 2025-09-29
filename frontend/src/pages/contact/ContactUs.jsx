import React, { useEffect, useMemo, useState } from 'react'
import { useSelector } from 'react-redux'
import { Card, CardBody, Box, Flex, Link, Badge } from '@chakra-ui/react'
import PageHeader from '../../components/PageHeader'
import { useTranslation } from 'react-i18next'
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

const ContactUs = () => {
  const { t } = useTranslation()
  const user = useSelector((s) => s.auth.user)
  const isAdmin = useMemo(() => isAdminCheck(user), [user])
  // Default value will be corrected below once user loads
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

    // Load both contact info and configuration data in parallel
    Promise.all([
      getContactInfo().catch((err) => {
        return { data: { data: null } }
      }),
      getConfigurationInfo().catch((err) => {
        return { data: null }
      }),
    ])
      .then(([contactRes, configRes]) => {
        if (!mounted) return

        // Contact API returns { success: true, data: info }
        const contactData = contactRes?.data?.data || {}
        // PDF Customization API returns data directly
        const configData = configRes?.data || {}

        // Merge configuration data with contact-specific data
        // Contact-specific data takes precedence over configuration defaults
        const mergedInfo = {
          companyName: contactData.companyName || configData.companyName || '',
          email: contactData.email || configData.companyEmail || '',
          phone: contactData.phone || configData.companyPhone || '',
          website: contactData.website || configData.companyWebsite || '',
          address: contactData.address || configData.companyAddress || '',
          hours: contactData.hours || '',
          notes: contactData.notes || '',

          // Visibility settings - default to true if not set
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

  // If user becomes admin after initial render, ensure the correct default tab
  useEffect(() => {
    if (isAdmin && activeTab !== 'inbox' && activeTab !== 'info') {
      setActiveTab('inbox')
    }
  }, [isAdmin])

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
        // Optimistically clear unread on the list right away
        setThreads((prev) =>
          Array.isArray(prev)
            ? prev.map((t) => (t.id === id ? { ...t, unreadCount: 0 } : t))
            : prev,
        )
        // Admins auto-mark as read on open; contractors should not update read state
        if (isAdmin) {
          markRead(id)
            .then(() => {
              setSelectedThread((prev) => {
                if (!prev || prev.id !== id) return prev
                const otherSide = (m) => !m.is_admin // from admin perspective, other side is user
                return {
                  ...prev,
                  messages: (prev.messages || []).map((m) =>
                    otherSide(m)
                      ? {
                          ...m,
                          read_by_recipient: true,
                          read_at: m.read_at || new Date().toISOString(),
                        }
                      : m,
                  ),
                }
              })
            })
            .catch(() => {}) // Silent fail for mark read
        }
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
      // Refresh personal list even if not admin
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
      loadThreads(pagination.page)
      setSelectedThread((prev) => (prev && prev.id === id ? { ...prev, status: 'closed' } : prev))
    } catch (err) {
      console.warn('Failed to close thread:', err)
    }
  }

  return (
    <>
      <PageHeader
        title={t('contact.header')}
        subtitle={t('contact.subtitle')}
        mobileLayout="stack"
        badge={{
          text: isAdmin ? t('contact.adminView') : t('contact.userView'),
          variant: 'secondary',
        }}
      />

      <Flex>
        <Box xs={12}>
          {isAdmin ? (
            <Card className="border-0 shadow-sm">
              <CardBody>
                <Flex variant="tabs" role="tablist" className="mb-3 flex-nowrap overflow-auto">
                  <Box>
                    <Link active={activeTab === 'inbox'} onClick={() => setActiveTab('inbox')}>
                      {t('contact.inbox')}
                    </Link>
                  </Box>
                  <Box>
                    <Link active={activeTab === 'info'} onClick={() => setActiveTab('info')}>
                      {t('contact.infoTab')}
                    </Link>
                  </Box>
                </Flex>
                <Box>
                  <Box visible={activeTab === 'inbox'}>
                    <Flex className="g-3">
                      <Box md={4}>
                        <MessageHistory
                          loading={inboxLoading}
                          threads={threads}
                          page={pagination.page}
                          totalPages={pagination.totalPages}
                          onPageChange={(p) => loadThreads(p, selectedUserId)}
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
                      <Box md={8}>
                        <ThreadView
                          loading={threadLoading}
                          thread={selectedThread}
                          onReply={onReply}
                          onClose={onCloseThread}
                          isAdmin
                        />
                      </Box>
                    </Flex>
                  </Box>
                  <Box visible={activeTab === 'info'}>
                    <Flex className="g-3">
                      <Box lg={6}>
                        <ContactInfoCard loading={infoLoading} info={info} />
                      </Box>
                      <Box lg={6}>
                        <ContactInfoEditor
                          info={info}
                          onSave={async (data) => {
                            try {
                              const res = await saveContactInfo(data)
                              // Reload both contact and configuration data after save
                              const [contactRes, configRes] = await Promise.all([
                                getContactInfo().catch((err) => {
                                  return { data: { data: null } }
                                }),
                                getConfigurationInfo().catch((err) => {
                                  return { data: null }
                                }),
                              ])

                              // Contact API returns { success: true, data: info }
                              const contactData = contactRes?.data?.data || {}
                              // PDF Customization API returns data directly
                              const configData = configRes?.data || {}

                              // Merge updated data
                              const mergedInfo = {
                                companyName:
                                  contactData.companyName || configData.companyName || '',
                                email: contactData.email || configData.companyEmail || '',
                                phone: contactData.phone || configData.companyPhone || '',
                                website: contactData.website || configData.companyWebsite || '',
                                address: contactData.address || configData.companyAddress || '',
                                hours: contactData.hours || '',
                                notes: contactData.notes || '',

                                // Visibility settings - default to true if not set
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
                  </Box>
              </CardBody>
            </Card>
          ) : (
            <Flex className="g-3">
              <Box lg={5}>
                <ContactInfoCard loading={infoLoading} info={info} />
              </Box>
              <Box lg={7}>
                <MessageComposer onSend={onSendNew} />
                <div className="mt-3">
                  <MessageHistory
                    loading={inboxLoading}
                    threads={threads}
                    page={pagination.page}
                    totalPages={pagination.totalPages}
                    onPageChange={(p) => loadThreads(p)}
                    onSelect={openThread}
                    isAdmin={false}
                  />
                </div>
                <div className="mt-3">
                  <ThreadView loading={threadLoading} thread={selectedThread} onReply={onReply} />
                </div>
              </Box>
            </Flex>
          )}
        </Box>
      </Flex>
    </>
  )
}

export default ContactUs
