import StandardCard from '../StandardCard'
import React, { useState } from 'react'
import { CardBody, FormControl, FormLabel, Input, Textarea, Button } from '@chakra-ui/react'
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
    try {
      await onSend({ subject: subject.trim(), message: message.trim() })
      setSubject('')
      setMessage('')
    } finally {
      setSending(false)
    }
  }

  return (
    <StandardCard>
      <CardBody>
        <PageHeader
          title={t('contact.compose.title')}
          subtitle={t('contact.compose.subtitle')}
          mobileLayout="compact"
        />
        <form onSubmit={submit}>
          <FormControl mb={2}>
            <FormLabel>{t('contact.compose.subject')}</FormLabel>
            <Input
              value={subject}
              onChange={(e) => setSubject(e.target.value)}
              placeholder={t('contact.compose.subjectPh')}
            />
          </FormControl>
          <FormControl mb={2}>
            <FormLabel>{t('contact.compose.message')}</FormLabel>
            <Textarea
              rows={5}
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              placeholder={t('contact.compose.messagePh')}
            />
          </FormControl>
          <Button type="submit" colorScheme="brand" isLoading={sending}>
            {sending ? t('contact.compose.sending') : t('contact.compose.send')}
          </Button>
        </form>
      </CardBody>
  </StandardCard>
  )
}

export default MessageComposer
