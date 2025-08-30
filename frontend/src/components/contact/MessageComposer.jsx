import React, { useState } from 'react'
import { CCard, CCardBody, CForm, CFormLabel, CFormInput, CFormTextarea, CButton } from '@coreui/react'
import { useTranslation } from 'react-i18next'
import PageHeader from '../PageHeader'

const MessageComposer = ({ onSend }) => {
  const { t } = useTranslation()
  const [subject, setSubject] = useState('')
  const [message, setMessage] = useState('')
  const [sending, setSending] = useState(false)

  const submit = async (e) => {
    e.preventDefault()
    if (!subject.trim() || !message.trim()) return
    setSending(true)
    try { await onSend({ subject: subject.trim(), message: message.trim() }); setSubject(''); setMessage('') } finally { setSending(false) }
  }

  return (
    <CCard className="border-0 shadow-sm">
      <CCardBody>
        <PageHeader title={t('contact.compose.title')} subtitle={t('contact.compose.subtitle')} mobileLayout="compact" />
        <CForm onSubmit={submit} className="mt-2">
          <div className="mb-2"><CFormLabel>{t('contact.compose.subject')}</CFormLabel><CFormInput value={subject} onChange={(e) => setSubject(e.target.value)} placeholder={t('contact.compose.subjectPh')} /></div>
          <div className="mb-2"><CFormLabel>{t('contact.compose.message')}</CFormLabel><CFormTextarea rows={5} value={message} onChange={(e) => setMessage(e.target.value)} placeholder={t('contact.compose.messagePh')} /></div>
          <CButton type="submit" color="primary">{sending ? t('contact.compose.sending') : t('contact.compose.send')}</CButton>
        </CForm>
      </CCardBody>
    </CCard>
  )
}

export default MessageComposer
