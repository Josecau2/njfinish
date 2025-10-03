import StandardCard from '../StandardCard'
import React, { useState } from 'react'
import { Badge, Box, Button, CardBody, Flex, Stack, Text, Textarea, useColorModeValue } from '@chakra-ui/react'
import { useTranslation } from 'react-i18next'
import PageHeader from '../PageHeader'

const Bubble = ({ mine, author, text, time }) => (
  <Flex justify={mine ? 'flex-end' : 'flex-start'} mb={2}>
    <Box
      maxW="85%"
      px={3}
      py={2}
      borderWidth="1px"
      borderColor={useColorModeValue("gray.200","gray.600")}
      bg={mine ? 'blue.50' : 'gray.50'}
      borderRadius="md"
    >
      <Text fontSize="xs" color={useColorModeValue("gray.500","gray.400")} mb={1}>
        {author} � {new Date(time).toLocaleString()}
      </Text>
      <Text fontWeight="semibold" whiteSpace="pre-wrap">
        {text}
      </Text>
    </Box>
  </Flex>
)

const ThreadView = ({ loading, thread, onReply, onClose, isAdmin }) => {
  const { t } = useTranslation()
  const [body, setBody] = useState('')

  if (!thread) {
    return (
      <StandardCard borderRadius="lg" boxShadow="sm">
        <CardBody>
          <PageHeader
            title={t('contact.thread.title')}
            subtitle={t('contact.thread.empty')}
            mobileLayout="compact"
          />
        </CardBody>
      </StandardCard>
    )
  }

  const handleSend = async () => {
    if (!body.trim()) return
    await onReply(thread.id, body.trim())
    setBody('')
  }

  const hasUnreadForViewer = Array.isArray(thread.messages)
    ? thread.messages.some((message) => {
        const unreadByRecipient = !message.read_by_recipient
        if (!unreadByRecipient) return false
        const messageIsFromAdmin = !!message.is_admin
        return isAdmin ? !messageIsFromAdmin : messageIsFromAdmin
      })
    : false

  return (
    <StandardCard borderRadius="lg" boxShadow="sm">
      <CardBody>
        <PageHeader
          title={thread.subject}
          subtitle={t('contact.thread.subtitle')}
          mobileLayout="compact"
          rightContent={
            thread.status === 'open' ? (
              <Button size="sm" minH="44px" variant="outline" colorScheme="gray" onClick={() => onClose?.(thread.id)}>
                {t('contact.thread.close')}
              </Button>
            ) : null
          }
          leftContent={
            isAdmin && thread.owner?.name ? (
              <Badge colorScheme="gray" borderRadius="md">
                {thread.owner.name}
              </Badge>
            ) : null
          }
        />

        {loading ? (
          <Box py={4} textAlign="center">
            <Text fontSize="sm" color={useColorModeValue("gray.500","gray.400")}>
              {t('common.loading')}
            </Text>
          </Box>
        ) : (
          <Stack spacing={4}>
            <Box minH="140px">
              {(thread.messages || []).map((message) => (
                <Bubble
                  key={message.id}
                  mine={message.is_admin === !!isAdmin}
                  author={
                    message.author?.name ||
                    (message.is_admin ? t('contact.thread.admin') : t('contact.thread.user'))
                  }
                  text={message.body}
                  time={message.createdAt}
                />
              ))}

              {thread.messages?.length === 0 && (
                <Box textAlign="center" py={6}>
                  <Text fontSize="sm" color={useColorModeValue("gray.500","gray.400")}>
                    {t('contact.thread.noMessages')}
                  </Text>
                </Box>
              )}
            </Box>

            {thread.status === 'open' && (
              <Flex gap={4} align="flex-start" direction={{ base: 'column', md: 'row' }}>
                <Box flex="1">
                  <Textarea
                    rows={3}
                    value={body}
                    onChange={(event) => setBody(event.target.value)}
                    placeholder={t('contact.compose.messagePh')}
                  />
                  {hasUnreadForViewer && (
                    <Badge colorScheme="red" mt={2}>
                      {t('common.new') || 'New'}
                    </Badge>
                  )}
                </Box>
                <Button colorScheme="brand" onClick={handleSend} alignSelf={{ base: 'flex-end', md: 'center' }}>
                  {t('contact.thread.reply')}
                </Button>
              </Flex>
            )}
          </Stack>
        )}
      </CardBody>
    </StandardCard>
  )
}

export default ThreadView
