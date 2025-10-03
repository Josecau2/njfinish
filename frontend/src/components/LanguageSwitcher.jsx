import React from 'react'
import { Select } from '@chakra-ui/react'
import { useTranslation } from 'react-i18next'

const LanguageSwitcher = ({ compact = false }) => {
  const { i18n, t } = useTranslation()
  const current = i18n.resolvedLanguage || i18n.language || 'en'

  const handleChange = (event) => {
    const nextLanguage = event.target.value
    i18n.changeLanguage(nextLanguage)
    try {
      localStorage.setItem('lang', nextLanguage)
    } catch (_) {
      // ignore persistence failures
    }
  }

  const minWidth = compact ? 'auto' : '140px'

  return (
    <Select
      size='sm'
      value={current}
      onChange={handleChange}
      w='auto'
      aria-label='Select language'
      minH='44px'
      minW={minWidth}
    >
      <option value='en'>{t('languages.english')}</option>
      <option value='es'>{t('languages.spanish')}</option>
    </Select>
  )
}

export default LanguageSwitcher
