import StandardCard from '../StandardCard'
import React, { useEffect, useMemo } from 'react'
import { Badge, Box, Button, Flex, HStack, Icon, Spinner, Stack, Text } from '@chakra-ui/react'
import { ChevronLeft, ChevronRight, Mail } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import PageHeader from '../PageHeader'
import { ICON_SIZE_MD, ICON_BOX_MD } from '../../constants/iconSizes'

const MessageHistory = ({
  loading,
  threads,
  page,
  totalPages,
  onPageChange,
  onSelect,
  isAdmin,
  groupByUser = false,
  onSelectUser,
}) => {
  const { t } = useTranslation()

  const groupedThreads = useMemo(() => {
    if (!groupByUser || !isAdmin || !Array.isArray(threads)) return []

    const map = new Map()

    threads.forEach((thread) => {
      const userId = thread.owner?.id || 0
      const name = thread.owner?.name || t('contact.history.unknownUser')
      const unread = Number(thread.unreadCount) || 0
      const lastAt = new Date(thread.last_message_at || thread.updatedAt || 0).getTime()

      const entry = map.get(userId) || {
        userId,
        name,
        unread: 0,
        lastAt: 0,
        lastSubject: '',
      }

      entry.unread += unread
      if (lastAt > entry.lastAt) {
        entry.lastAt = lastAt
        entry.lastSubject = thread.subject
      }

      map.set(userId, entry)
    })

    return Array.from(map.values()).sort((a, b) => b.lastAt - a.lastAt)
  }, [groupByUser, isAdmin, threads, t])

  useEffect(() => {
    // hook available for parent driven side-effects if needed
  }, [])

  const renderEmptyState = () => (
    <Box py={3} textAlign="center">
      <Text fontSize="sm" color="gray.500">
        {t('contact.history.empty')}
      </Text>
    </Box>
  )

  const renderUserGroup = () => (
    <Stack spacing={4}>
      {groupedThreads.map((group) => (
        <Box
          key={group.userId}
          borderWidth="1px"
          borderRadius="md"
          px={4}
          py={3}
          cursor="pointer"
          _hover={{ bg: 'gray.50' }}
          onClick={() => onSelectUser && onSelectUser(group.userId)}
        >
          <Flex justify="space-between" align="center" gap={4}>
            <Box minW={0}>
              <Text fontWeight="semibold" noOfLines={1}>
                {group.name}
              </Text>
              {group.lastAt > 0 && (
                <Text fontSize="xs" color="gray.500" noOfLines={1}>
                  {new Date(group.lastAt).toLocaleString()} � {group.lastSubject}
                </Text>
              )}
            </Box>
            {Number(group.unread) > 0 && (
              <Badge colorScheme="red" borderRadius="full" px={2}>
                {group.unread}
              </Badge>
            )}
          </Flex>
        </Box>
      ))}
    </Stack>
  )

  const renderThreadList = () => (
    <Stack spacing={4}>
      {threads.map((thread) => (
        <Box
          key={thread.id}
          borderWidth="1px"
          borderRadius="md"
          px={4}
          py={3}
          cursor="pointer"
          _hover={{ bg: 'gray.50' }}
          onClick={() => onSelect(thread.id)}
        >
          <Flex direction={{ base: 'column', md: 'row' }} justify="space-between" gap={4}>
            <Box minW={0}>
              <HStack spacing={4} align="center" flexWrap="wrap">
                <Text fontWeight="semibold" noOfLines={1}>
                  {thread.subject}
                </Text>
                {isAdmin && (
                  <Badge colorScheme="gray" borderRadius="md">
                    {thread.owner?.name || t('contact.history.unknownUser')}
                  </Badge>
                )}
                <Text fontSize="xs" color="gray.500">
                  {new Date(thread.last_message_at || thread.updatedAt).toLocaleString()}
                </Text>
                {Number(thread.unreadCount) > 0 && (
                  <Badge colorScheme="red">{t('common.new') || 'New'}</Badge>
                )}
              </HStack>
            </Box>

            <HStack spacing={4} align="center" justify={{ base: 'flex-start', md: 'flex-end' }}>
              {Number(thread.unreadCount) > 0 && (
                <Badge colorScheme="red" borderRadius="full" px={2}>
                  {thread.unreadCount}
                </Badge>
              )}
              <Badge colorScheme={thread.status === 'open' ? 'green' : 'gray'}>
                {t(`contact.status.${thread.status}`)}
              </Badge>
            </HStack>
          </Flex>
        </Box>
      ))}
    </Stack>
  )

  const renderPagination = () => (
    <HStack spacing={4} justify="center" mt={3}>
      <Button
        size="sm"
        variant="ghost"
        leftIcon={<Icon as={ChevronLeft} boxSize={ICON_BOX_MD} />}
        onClick={() => onPageChange(page - 1)}
        isDisabled={page === 1}
      >
        {t('common.previous', 'Previous')}
      </Button>
      {Array.from({ length: totalPages }).map((_, index) => {
        const pageNumber = index + 1
        const isActive = pageNumber === page
        return (
          <Button
            key={pageNumber}
            size="sm"
            variant={isActive ? 'solid' : 'ghost'}
            colorScheme={isActive ? 'blue' : 'gray'}
            onClick={() => onPageChange(pageNumber)}
          >
            {pageNumber}
          </Button>
        )
      })}
      <Button
        size="sm"
        variant="ghost"
        rightIcon={<Icon as={ChevronRight} boxSize={ICON_BOX_MD} />}
        onClick={() => onPageChange(page + 1)}
        isDisabled={page === totalPages}
      >
        {t('common.next', 'Next')}
      </Button>
    </HStack>
  )

  const hasThreads = groupByUser ? groupedThreads.length > 0 : (threads?.length || 0) > 0

  return (
    <StandardCard borderRadius="lg" boxShadow="sm">
      <CardBody>
        <PageHeader
          title={t('contact.history.title')}
          subtitle={t('contact.history.subtitle')}
          mobileLayout="compact"
        />

        {loading ? (
          <Flex align="center" justify="center" py={6}>
            <Spinner size="md" color="blue.500" />
          </Flex>
        ) : (
          <Stack spacing={4}>
            {!hasThreads ? (
              renderEmptyState()
            ) : groupByUser ? (
              renderUserGroup()
            ) : (
              renderThreadList()
            )}

            {totalPages > 1 && renderPagination()}
          </Stack>
        )}
      </CardBody>
    </StandardCard>
  )
}

export default MessageHistory
