import React, { useEffect, useState, useMemo } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { CardBody, CardHeader, Alert, AlertIcon, Spinner, Button } from '@chakra-ui/react'
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
      <div className="d-flex justify-content-center p-5" role="status" aria-live="polite">
        <Spinner colorScheme="blue" />
      </div>
  
  )
  }

  if (error) {
    return (
      <div className="container py-5">
        <Alert status="error">
          <AlertIcon />
          {error}
        </Alert>
      </div>
  
  )
  }

  if (!proposal) {
    return (
      <div className="container py-5">
        <Alert status="warning">{t('publicQuote.notFound')}</Alert>
      </div>
  
  )
  }

  return (
    <div className="container py-4">
      <style>{`.container .btn{ min-height:44px; }`}</style>
      <StandardCard>
        <CardHeader>
          <div>
            <div>
              <h5>{t('publicQuote.titleNumber', { id: proposal.id })}</h5>
              {proposal?.customer?.name && (
                <small>
                  {t('publicQuote.forCustomer', { name: proposal.customer.name })}
                </small>
              )}
            </div>
            {isLocked && <span className="badge bg-success">{t('publicQuote.acceptedBadge')}</span>}
          </div>
        </CardHeader>
        <CardBody>
          {proposal.description && (
            <div>
              <h6>{t('publicQuote.description')}</h6>
              <p>{proposal.description}</p>
            </div>
          )}

          {typeof total === 'number' && (
            <div>
              <h6>{t('publicQuote.total')}</h6>
              <p className="fs-4 fw-bold">
                $
                {total.toLocaleString(undefined, {
                  minimumFractionDigits: 2,
                  maximumFractionDigits: 2,
                })}
              </p>
            </div>
          )}

          {/* Minimal summary of items if present */}
          {proposal.manufacturersData?.items?.length > 0 && (
            <div>
              <h6>{t('publicQuote.summary')}</h6>
              <ul>
                {proposal.manufacturersData.items.slice(0, 10).map((it, idx) => (
                  <li key={idx}>
                    {it.description || it.code || 'Item'}
                    {it.qty ? ` × ${it.qty}` : ''}
                  </li>
                ))}
                {proposal.manufacturersData.items.length > 10 && <li>…</li>}
              </ul>
            </div>
          )}

          <div className="mt-4 d-flex gap-2">
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
          </div>
        </CardBody>
      </StandardCard>
    </div>
  
  )
}
