import React from 'react'
import { CFormSelect } from '@coreui/react'
import { useTranslation } from 'react-i18next'

const LanguageSwitcher = () => {
  // useTranslation subscribes this component to language changes so it re-renders
  const { i18n } = useTranslation()
  const current = i18n.resolvedLanguage || i18n.language || 'en'
  const onChange = (e) => {
    const lng = e.target.value
    i18n.changeLanguage(lng)
    localStorage.setItem('lang', lng)
  }
  return (
    <CFormSelect
      size="sm"
      value={current}
      onChange={onChange}
      className="w-auto"
      aria-label="Select language"
      style={{ minHeight: 44 }}
    >
      <option value="en">English</option>
      <option value="es">Español</option>
    </CFormSelect>
  )
}

export default LanguageSwitcher
