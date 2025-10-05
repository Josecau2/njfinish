import React, { useEffect, useState, useMemo } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { Badge, Box, Container, Flex, Text, CardBody, CardHeader, Alert, AlertIcon, Spinner, Button, Heading, UnorderedList, ListItem } from '@chakra-ui/react'
import StandardCard from '../../components/StandardCard'
import { notifyError, notifySuccess } from '../../helpers/notify'
import { useTranslation } from 'react-i18next'

const API_URL = import.meta.env.VITE_API_URL || ''

export default function PublicProposalPage() {
  const { token } = useParams()
  const navigate = useNavigate()
  const { t } = useTranslation()
  const [loading, setLoading] = useState(true)
  const [proposal, setProposal] = useState(null)
  const [error, setError] = useState('')
  const [accepting, setAccepting] = useState(false)

  useEffect(() => {
    async function fetchProposal() {
      setLoading(true)
      try {
        const res = await fetch(
          `${API_URL}/api/public/proposals/by-token/${encodeURIComponent(token)}`,
        )
        const json = await res.json()
        if (!res.ok || !json.success) throw new Error(json.message || t('publicQuote.loadFailed'))
        setProposal(json.data)
      } catch (err) {
        setError(err.message || t('publicQuote.loadFailed'))
      } finally {
        setLoading(false)
      }
    }
    if (token) fetchProposal()
  }, [token])

  const isLocked = proposal?.is_locked || proposal?.status === 'accepted'
  const total = useMemo(
    () => proposal?.totals ?? proposal?.manufacturersData?.totalPrice ?? null,
    [proposal],
  )

  async function onAccept() {
    if (!proposal) return
    setAccepting(true)
    try {
      const res = await fetch(`${API_URL}/api/public/proposals/${proposal.id}/accept`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ session_token: token }),
      })
      const json = await res.json()
      if (!res.ok || !json.success) throw new Error(json.message || t('publicQuote.acceptFailed'))
      notifySuccess(t('publicQuote.acceptSuccess'))
      // Reload to reflect locked state
      setProposal((p) => ({
        ...p,
        status: 'accepted',
        is_locked: true,
        accepted_at: new Date().toISOString(),
      }))
    } catch (err) {
      notifyError(err.message || t('publicQuote.acceptFailed'))
    } finally {
      setAccepting(false)
    }
  }

  if (loading) {
    return (
      <Flex justify="center" p={5} role="status" aria-live="polite">
        <Spinner colorScheme="brand" />
      </Flex>

  )
  }

  if (error) {
    return (
      <Container py={5}>
        <Alert status="error">
          <AlertIcon />
          {error}
        </Alert>
      </Container>

  )
  }

  if (!proposal) {
    return (
      <Container py={5}>
        <Alert status="warning">{t('publicQuote.notFound')}</Alert>
      </Container>

  )
  }

  return (
    <Container py={4}>
      <StandardCard>
        <CardHeader>
          <Flex justify="space-between" align="center">
            <Box>
              <Heading as="h5" size="md">{t('publicQuote.titleNumber', { id: proposal.id })}</Heading>
              {proposal?.customer?.name && (
                <Text fontSize="sm">
                  {t('publicQuote.forCustomer', { name: proposal.customer.name })}
                </Text>
              )}
            </Box>
            {isLocked && <Badge colorScheme="green">{t('publicQuote.acceptedBadge')}</Badge>}
          </Flex>
        </CardHeader>
        <CardBody>
          {proposal.description && (
            <Box>
              <Heading as="h6" size="sm">{t('publicQuote.description')}</Heading>
              <Text>{proposal.description}</Text>
            </Box>
          )}

          {typeof total === 'number' && (
            <Box>
              <Heading as="h6" size="sm">{t('publicQuote.total')}</Heading>
              <Text fontSize="xl" fontWeight="bold">
                $
                {total.toLocaleString(undefined, {
                  minimumFractionDigits: 2,
                  maximumFractionDigits: 2,
                })}
              </Text>
            </Box>
          )}

          {/* Minimal summary of items if present */}
          {proposal.manufacturersData?.items?.length > 0 && (
            <Box>
              <Heading as="h6" size="sm">{t('publicQuote.summary')}</Heading>
              <UnorderedList>
                {proposal.manufacturersData.items.slice(0, 10).map((it, idx) => (
                  <ListItem key={idx}>
                    {it.description || it.code || 'Item'}
                    {it.qty ? ` × ${it.qty}` : ''}
                  </ListItem>
                ))}
                {proposal.manufacturersData.items.length > 10 && <ListItem>…</ListItem>}
              </UnorderedList>
            </Box>
          )}

          <Flex mt={4} gap={2}>
            <Button
              colorScheme="green"
              isDisabled={isLocked || accepting}
              onClick={onAccept}
              whileTap={{ scale: 0.98 }}
              minH="44px"
            >
              {accepting
                ? t('publicQuote.acceptButton.accepting')
                : isLocked
                  ? t('publicQuote.acceptButton.alreadyAccepted')
                  : t('publicQuote.acceptButton.accept')}
            </Button>
          </Flex>
        </CardBody>
      </StandardCard>
    </Container>

  )
}
