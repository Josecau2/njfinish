import React, { useState } from 'react'
import { CCard, CCardBody, CButton, CFormTextarea, CBadge } from '@coreui/react'
import { useTranslation } from 'react-i18next'
import PageHeader from '../PageHeader'

const Bubble = ({ mine, author, text, time }) => (
  <div className={`d-flex ${mine ? 'justify-content-end' : 'justify-content-start'} mb-2`}>
    <div className="p-2 rounded" style={{ maxWidth: '85%', background: mine ? '#e9f5ff' : '#f8f9fa', border: '1px solid #e3e6f0' }}>
      <div className="small text-muted mb-1">{author} • {new Date(time).toLocaleString()}</div>
      <div className="fw-semibold" style={{ whiteSpace: 'pre-wrap' }}>{text}</div>
    </div>
  </div>
)

const ThreadView = ({ loading, thread, onReply, onClose, isAdmin }) => {
  const { t } = useTranslation()
  const [body, setBody] = useState('')
  if (!thread) return (
    <CCard className="border-0 shadow-sm">
      <CCardBody>
        <PageHeader title={t('contact.thread.title')} subtitle={t('contact.thread.empty')} mobileLayout="compact" />
      </CCardBody>
    </CCard>
  )
  const send = async () => { if (body.trim()) { await onReply(thread.id, body.trim()); setBody('') } }
  return (
    <CCard className="border-0 shadow-sm">
      <CCardBody>
        <PageHeader title={thread.subject} subtitle={t('contact.thread.subtitle')} mobileLayout="compact" rightContent={
          <div className="d-flex gap-2">
            {thread.status === 'open' && (
              <CButton size="sm" color="secondary" onClick={() => onClose && onClose(thread.id)}>{t('contact.thread.close')}</CButton>
            )}
          </div>
        } leftContent={
          isAdmin && thread.owner?.name ? (
            <div className="d-flex align-items-center gap-2">
              <CBadge color="secondary">{thread.owner.name}</CBadge>
            </div>
          ) : null
        } />
        {loading ? (
          <div className="py-4 text-center text-muted">{t('common.loading')}</div>
        ) : (
          <>
            <div className="mb-3" style={{ minHeight: 140 }}>
              {(thread.messages || []).map((m) => (
                <Bubble key={m.id} mine={m.is_admin === !!isAdmin} author={m.author?.name || (m.is_admin ? t('contact.thread.admin') : t('contact.thread.user'))} text={m.body} time={m.createdAt} />
              ))}
              {thread.messages?.length === 0 && (
                <div className="text-center text-muted py-4">{t('contact.thread.noMessages')}</div>
              )}
            </div>
            {thread.status === 'open' && (
              <div className="d-flex gap-2 align-items-start">
                <div className="flex-grow-1">
                  <CFormTextarea rows={3} value={body} onChange={(e) => setBody(e.target.value)} placeholder={t('contact.compose.messagePh')} />
                  {Array.isArray(thread.messages) && thread.messages.some(m => !m.read_by_recipient && (!!isAdmin ? !m.is_admin : m.is_admin)) && (
                    <div className="mt-1"><CBadge color="danger">{t('common.new') || 'New'}</CBadge></div>
                  )}
                </div>
                <CButton color="primary" onClick={send}>{t('contact.thread.reply')}</CButton>
              </div>
            )}
          </>
        )}
      </CCardBody>
    </CCard>
  )
}

export default ThreadView
