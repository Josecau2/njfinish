import React from 'react'
import { Select } from '@chakra-ui/react'
import { useTranslation } from 'react-i18next'

const LanguageSwitcher = ({ compact = false }) => {
  const { i18n } = useTranslation()
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
      <option value='en'>English</option>
      <option value='es'>Español</option>
    </Select>
  )
}

export default LanguageSwitcher
