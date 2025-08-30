import React, { useMemo, useState } from 'react'
import { CCard, CCardBody, CForm, CFormLabel, CFormInput, CFormTextarea, CButton, CFormCheck, CRow, CCol, CBadge } from '@coreui/react'
import { useSelector } from 'react-redux'
import { useTranslation } from 'react-i18next'
import PageHeader from '../PageHeader'
import { isAdmin as isAdminCheck } from '../../helpers/permissions'

const ContactInfoEditor = ({ info, onSave }) => {
  const { t } = useTranslation()
  const user = useSelector((s) => s.auth.user)
  const isAdmin = useMemo(() => isAdminCheck(user), [user])
  const [form, setForm] = useState({
    companyName: info?.companyName || '',
    email: info?.email || '',
    phone: info?.phone || '',
    address: info?.address || '',
    website: info?.website || '',
    hours: info?.hours || '',
    notes: info?.notes || '',
    showCompanyName: info?.showCompanyName !== false,
    showEmail: info?.showEmail !== false,
    showPhone: info?.showPhone !== false,
    showAddress: info?.showAddress !== false,
    showWebsite: info?.showWebsite !== false,
    showHours: info?.showHours !== false,
    showNotes: info?.showNotes !== false,
  })
  const [saving, setSaving] = useState(false)

  const onChange = (e) => {
    const { name, value, type, checked } = e.target
    setForm({ ...form, [name]: type === 'checkbox' ? checked : value })
  }
  const handleSave = async (e) => {
    e.preventDefault()
    if (!isAdmin) return
    setSaving(true)
    try { await onSave(form) } finally { setSaving(false) }
  }

  if (!isAdmin) return null
  return (
    <CCard className="border-0 shadow-sm">
      <CCardBody>
        <PageHeader title={t('contact.editor.title')} subtitle={t('contact.editor.subtitle')} mobileLayout="compact" />
        <CForm onSubmit={handleSave} className="mt-2">
          
          {/* Visibility Settings Section */}
          <div className="mb-4 p-3 bg-light rounded">
            <h6 className="mb-3 d-flex align-items-center">
              <CBadge color="info" className="me-2">Settings</CBadge>
              {t('contact.editor.visibilitySettings')}
            </h6>
            <CRow className="g-2">
              <CCol md={6}>
                <CFormCheck 
                  id="showCompanyName" 
                  name="showCompanyName" 
                  checked={form.showCompanyName} 
                  onChange={onChange} 
                  label={t('contact.info.companyName')} 
                />
              </CCol>
              <CCol md={6}>
                <CFormCheck 
                  id="showEmail" 
                  name="showEmail" 
                  checked={form.showEmail} 
                  onChange={onChange} 
                  label={t('contact.info.email')} 
                />
              </CCol>
              <CCol md={6}>
                <CFormCheck 
                  id="showPhone" 
                  name="showPhone" 
                  checked={form.showPhone} 
                  onChange={onChange} 
                  label={t('contact.info.phone')} 
                />
              </CCol>
              <CCol md={6}>
                <CFormCheck 
                  id="showWebsite" 
                  name="showWebsite" 
                  checked={form.showWebsite} 
                  onChange={onChange} 
                  label={t('contact.info.website')} 
                />
              </CCol>
              <CCol md={6}>
                <CFormCheck 
                  id="showAddress" 
                  name="showAddress" 
                  checked={form.showAddress} 
                  onChange={onChange} 
                  label={t('contact.info.address')} 
                />
              </CCol>
              <CCol md={6}>
                <CFormCheck 
                  id="showHours" 
                  name="showHours" 
                  checked={form.showHours} 
                  onChange={onChange} 
                  label={t('contact.info.hours')} 
                />
              </CCol>
              <CCol md={6}>
                <CFormCheck 
                  id="showNotes" 
                  name="showNotes" 
                  checked={form.showNotes} 
                  onChange={onChange} 
                  label={t('contact.info.notes')} 
                />
              </CCol>
            </CRow>
          </div>

          {/* Data Fields Section */}
          <h6 className="mb-3 d-flex align-items-center">
            <CBadge color="primary" className="me-2">Content</CBadge>
            {t('contact.editor.contentSettings')}
          </h6>
          
          <div className="mb-2">
            <CFormLabel>{t('contact.info.companyName')} {!form.showCompanyName && <CBadge color="secondary" className="ms-2">Hidden</CBadge>}</CFormLabel>
            <CFormInput name="companyName" value={form.companyName} onChange={onChange} disabled={!form.showCompanyName} />
          </div>
          <div className="mb-2">
            <CFormLabel>{t('contact.info.email')} {!form.showEmail && <CBadge color="secondary" className="ms-2">Hidden</CBadge>}</CFormLabel>
            <CFormInput type="email" name="email" value={form.email} onChange={onChange} disabled={!form.showEmail} />
          </div>
          <div className="mb-2">
            <CFormLabel>{t('contact.info.phone')} {!form.showPhone && <CBadge color="secondary" className="ms-2">Hidden</CBadge>}</CFormLabel>
            <CFormInput name="phone" value={form.phone} onChange={onChange} disabled={!form.showPhone} />
          </div>
          <div className="mb-2">
            <CFormLabel>{t('contact.info.address')} {!form.showAddress && <CBadge color="secondary" className="ms-2">Hidden</CBadge>}</CFormLabel>
            <CFormTextarea rows={3} name="address" value={form.address} onChange={onChange} disabled={!form.showAddress} />
          </div>
          <div className="mb-2">
            <CFormLabel>{t('contact.info.website')} {!form.showWebsite && <CBadge color="secondary" className="ms-2">Hidden</CBadge>}</CFormLabel>
            <CFormInput name="website" value={form.website} onChange={onChange} disabled={!form.showWebsite} />
          </div>
          <div className="mb-2">
            <CFormLabel>{t('contact.info.hours')} {!form.showHours && <CBadge color="secondary" className="ms-2">Hidden</CBadge>}</CFormLabel>
            <CFormInput name="hours" value={form.hours} onChange={onChange} disabled={!form.showHours} />
          </div>
          <div className="mb-2">
            <CFormLabel>{t('contact.info.notes')} {!form.showNotes && <CBadge color="secondary" className="ms-2">Hidden</CBadge>}</CFormLabel>
            <CFormTextarea rows={3} name="notes" value={form.notes} onChange={onChange} disabled={!form.showNotes} />
          </div>
          
          <CButton type="submit" color="primary" className="mt-2">{saving ? t('common.saving') : t('contact.editor.save')}</CButton>
        </CForm>
      </CCardBody>
    </CCard>
  )
}

export default ContactInfoEditor
