import React, { useEffect, useState, useMemo } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { Badge, Box, Container, Flex, Text, CardBody, CardHeader, Alert, AlertIcon, Spinner, Button, Heading, UnorderedList, ListItem, useColorModeValue, Divider } from '@chakra-ui/react'
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
      <Box bg={useColorModeValue('gray.50', 'gray.900')} minH="100vh" py={{ base: 8, md: 12 }}>
        <Flex
          justify="center"
          align="center"
          minH="60vh"
          role="status"
          aria-live="polite"
        >
          <Spinner
            size="xl"
            thickness="4px"
            speed="0.65s"
            color="brand.500"
            emptyColor={useColorModeValue('gray.200', 'gray.600')}
          />
        </Flex>
      </Box>
    )
  }

  if (error) {
    return (
      <Box bg={useColorModeValue('gray.50', 'gray.900')} minH="100vh" py={{ base: 8, md: 12 }}>
        <Container maxW="3xl">
          <Alert
            status="error"
            borderRadius="xl"
            boxShadow="sm"
            fontSize={{ base: 'sm', md: 'md' }}
            bg={useColorModeValue('red.50', 'red.900')}
            border="1px solid"
            borderColor={useColorModeValue('red.200', 'red.700')}
            p={{ base: 4, md: 6 }}
          >
            <AlertIcon />
            {error}
          </Alert>
        </Container>
      </Box>
    )
  }

  if (!proposal) {
    return (
      <Box bg={useColorModeValue('gray.50', 'gray.900')} minH="100vh" py={{ base: 8, md: 12 }}>
        <Container maxW="3xl">
          <Alert
            status="warning"
            borderRadius="xl"
            boxShadow="sm"
            fontSize={{ base: 'sm', md: 'md' }}
            bg={useColorModeValue('yellow.50', 'yellow.900')}
            border="1px solid"
            borderColor={useColorModeValue('yellow.200', 'yellow.700')}
            p={{ base: 4, md: 6 }}
          >
            <AlertIcon />
            {t('publicQuote.notFound')}
          </Alert>
        </Container>
      </Box>
    )
  }

  return (
    <Box bg={useColorModeValue('gray.50', 'gray.900')} minH="100vh" py={{ base: 8, md: 12 }}>
      <Container maxW="4xl">
        <Box
          position="relative"
          transition="all 0.3s ease-in-out"
          _hover={{
            transform: 'translateY(-4px)',
          }}
          _before={{
            content: '""',
            position: 'absolute',
            top: '-3px',
            left: '-3px',
            right: '-3px',
            bottom: '-3px',
            borderRadius: '2xl',
            background: useColorModeValue(
              'linear-gradient(135deg, rgba(66, 153, 225, 0.2) 0%, rgba(159, 122, 234, 0.2) 50%, rgba(237, 100, 166, 0.2) 100%)',
              'linear-gradient(135deg, rgba(66, 153, 225, 0.25) 0%, rgba(159, 122, 234, 0.25) 50%, rgba(237, 100, 166, 0.25) 100%)'
            ),
            zIndex: -1,
            opacity: 0.7,
            filter: 'blur(12px)',
          }}
        >
        <StandardCard
          boxShadow={useColorModeValue(
            '0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)',
            '0 20px 25px -5px rgba(0, 0, 0, 0.4), 0 10px 10px -5px rgba(0, 0, 0, 0.2)'
          )}
          borderRadius="2xl"
          border="2px solid"
          borderColor={useColorModeValue('gray.100', 'gray.600')}
          overflow="hidden"
          position="relative"
          bg={useColorModeValue('white', 'gray.800')}
          _after={{
            content: '""',
            position: 'absolute',
            inset: 0,
            borderRadius: '2xl',
            padding: '2px',
            background: useColorModeValue(
              'linear-gradient(135deg, rgba(66, 153, 225, 0.5), rgba(159, 122, 234, 0.5), rgba(237, 100, 166, 0.5))',
              'linear-gradient(135deg, rgba(66, 153, 225, 0.6), rgba(159, 122, 234, 0.6), rgba(237, 100, 166, 0.6))'
            ),
            WebkitMask: 'linear-gradient(#fff 0 0) content-box, linear-gradient(#fff 0 0)',
            WebkitMaskComposite: 'xor',
            maskComposite: 'exclude',
            pointerEvents: 'none',
            zIndex: 1,
          }}
        >
          <CardHeader
            bg={useColorModeValue(
              'linear-gradient(135deg, rgba(66, 153, 225, 0.05) 0%, rgba(159, 122, 234, 0.05) 100%)',
              'linear-gradient(135deg, rgba(66, 153, 225, 0.1) 0%, rgba(159, 122, 234, 0.1) 100%)'
            )}
            borderBottom="1px solid"
            borderColor={useColorModeValue('gray.200', 'gray.600')}
            p={{ base: 6, md: 8 }}
            position="relative"
            zIndex={2}
          >
          <Flex
            justify="space-between"
            align={{ base: 'flex-start', md: 'center' }}
            flexDirection={{ base: 'column', md: 'row' }}
            gap={{ base: 3, md: 0 }}
          >
            <Box>
              <Heading
                as="h1"
                size={{ base: 'lg', md: 'xl' }}
                fontWeight="700"
                letterSpacing="-0.02em"
                color={useColorModeValue('gray.900', 'white')}
                mb={2}
              >
                {t('publicQuote.titleNumber', { id: proposal.id })}
              </Heading>
              {proposal?.customer?.name && (
                <Text
                  fontSize={{ base: 'sm', md: 'md' }}
                  color={useColorModeValue('gray.600', 'gray.400')}
                  fontWeight="500"
                >
                  {t('publicQuote.forCustomer', { name: proposal.customer.name })}
                </Text>
              )}
            </Box>
            {isLocked && (
              <Badge
                colorScheme="green"
                fontSize={{ base: 'sm', md: 'md' }}
                px={4}
                py={2}
                borderRadius="full"
                fontWeight="600"
                textTransform="none"
              >
                {t('publicQuote.acceptedBadge')}
              </Badge>
            )}
          </Flex>
        </CardHeader>
        <CardBody p={{ base: 6, md: 8 }} position="relative" zIndex={2}>
          <Box display="flex" flexDirection="column" gap={{ base: 6, md: 8 }}>
            {proposal.description && (
              <Box>
                <Heading
                  as="h2"
                  size={{ base: 'sm', md: 'md' }}
                  mb={3}
                  fontWeight="600"
                  color={useColorModeValue('gray.800', 'gray.200')}
                  letterSpacing="tight"
                >
                  {t('publicQuote.description')}
                </Heading>
                <Text
                  fontSize={{ base: 'sm', md: 'md' }}
                  color={useColorModeValue('gray.600', 'gray.400')}
                  lineHeight="1.7"
                >
                  {proposal.description}
                </Text>
              </Box>
            )}

            {proposal.description && typeof total === 'number' && <Divider />}

            {typeof total === 'number' && (
              <Box>
                <Heading
                  as="h2"
                  size={{ base: 'sm', md: 'md' }}
                  mb={3}
                  fontWeight="600"
                  color={useColorModeValue('gray.800', 'gray.200')}
                  letterSpacing="tight"
                >
                  {t('publicQuote.total')}
                </Heading>
                <Text
                  fontSize={{ base: '2xl', md: '3xl' }}
                  fontWeight="700"
                  color={useColorModeValue('brand.600', 'brand.300')}
                  letterSpacing="tight"
                >
                  $
                  {total.toLocaleString(undefined, {
                    minimumFractionDigits: 2,
                    maximumFractionDigits: 2,
                  })}
                </Text>
              </Box>
            )}

            {typeof total === 'number' && proposal.manufacturersData?.items?.length > 0 && (
              <Divider />
            )}

            {/* Minimal summary of items if present */}
            {proposal.manufacturersData?.items?.length > 0 && (
              <Box>
                <Heading
                  as="h2"
                  size={{ base: 'sm', md: 'md' }}
                  mb={3}
                  fontWeight="600"
                  color={useColorModeValue('gray.800', 'gray.200')}
                  letterSpacing="tight"
                >
                  {t('publicQuote.summary')}
                </Heading>
                <UnorderedList
                  spacing={2}
                  fontSize={{ base: 'sm', md: 'md' }}
                  color={useColorModeValue('gray.600', 'gray.400')}
                  pl={{ base: 4, md: 6 }}
                >
                  {proposal.manufacturersData.items.slice(0, 10).map((it, idx) => (
                    <ListItem key={idx}>
                      {it.description || it.code || 'Item'}
                      {it.qty ? ` × ${it.qty}` : ''}
                    </ListItem>
                  ))}
                  {proposal.manufacturersData.items.length > 10 && (
                    <ListItem fontStyle="italic">…</ListItem>
                  )}
                </UnorderedList>
              </Box>
            )}

            <Divider />

            <Flex mt={2} gap={3} flexDirection={{ base: 'column', sm: 'row' }}>
              <Button
                colorScheme="green"
                size="lg"
                isDisabled={isLocked || accepting}
                onClick={onAccept}
                minH={{ base: '52px', md: '56px' }}
                fontSize={{ base: 'md', md: 'lg' }}
                fontWeight="700"
                borderRadius="xl"
                boxShadow="0 4px 12px rgba(0, 0, 0, 0.08)"
                _hover={{
                  transform: !isLocked && !accepting ? 'translateY(-2px)' : 'none',
                  boxShadow: !isLocked && !accepting ? '0 8px 20px rgba(0, 0, 0, 0.12)' : undefined,
                }}
                _active={{
                  transform: 'translateY(0)',
                  boxShadow: '0 2px 8px rgba(0, 0, 0, 0.08)',
                }}
                transition="all 0.2s cubic-bezier(0.4, 0, 0.2, 1)"
                flex={{ base: '1', sm: 'initial' }}
              >
                {accepting
                  ? t('publicQuote.acceptButton.accepting')
                  : isLocked
                    ? t('publicQuote.acceptButton.alreadyAccepted')
                    : t('publicQuote.acceptButton.accept')}
              </Button>
            </Flex>
          </Box>
        </CardBody>
      </StandardCard>
        </Box>
      </Container>
    </Box>
  )
}
