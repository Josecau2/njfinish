import React, { useEffect, useMemo, useState } from 'react'
import { useSelector } from 'react-redux'
import { CCard, CCardBody, CRow, CCol, CForm, CFormTextarea, CButton, CTable, CTableHead, CTableRow, CTableHeaderCell, CTableBody, CTableDataCell, CBadge } from '@coreui/react'
import PageHeader from '../../../components/PageHeader'
import { useTranslation } from 'react-i18next'
import { getLatestTerms, saveTerms, getAcceptance } from '../../../helpers/termsApi'
import { isAdmin as isAdminCheck } from '../../../helpers/permissions'

const TermsPage = () => {
  const { t } = useTranslation()
  const user = useSelector((s) => s.auth.user)
  const isAdmin = useMemo(() => isAdminCheck(user), [user])
  const [content, setContent] = useState('')
  const [version, setVersion] = useState(null)
  const [saving, setSaving] = useState(false)
  const [acceptance, setAcceptance] = useState({ version: null, users: [] })

  const load = async () => {
    try {
      const res = await getLatestTerms()
      const terms = res?.data?.data
      if (terms) { setContent(terms.content || ''); setVersion(terms.version) } else { setContent(''); setVersion(null) }
      if (isAdmin) {
        const acc = await getAcceptance()
        setAcceptance(acc?.data?.data || { version: null, users: [] })
      }
    } catch (e) {
      setContent('')
      setVersion(null)
    }
  }

  useEffect(() => { load() }, [])

  const onSave = async (bumpVersion) => {
    if (!isAdmin) return
    setSaving(true)
    try {
      await saveTerms({ content, bumpVersion: bumpVersion ? true : false })
      await load()
    } catch (error) {
      console.error('Save terms error:', error)
    } finally { setSaving(false) }
  }

  if (!isAdmin) return null

  return (
    <>
      <PageHeader title={t('settings.terms.title', 'Terms & Conditions')} subtitle={t('settings.terms.subtitle','Edit terms and track acceptance')} />
      <CRow className="g-3">
        <CCol lg={6}>
          <CCard className="border-0 shadow-sm">
            <CCardBody>
              <h6 className="mb-3">{t('settings.terms.editor', 'Editor')}</h6>
              <CForm>
                <CFormTextarea rows={16} value={content} onChange={(e) => setContent(e.target.value)} placeholder={t('settings.terms.placeholder','Enter terms and conditions...')} />
                <div className="mt-3 d-flex gap-2">
                  <CButton color="primary" disabled={saving} onClick={() => onSave(false)}>{saving ? t('common.saving','Saving...') : t('common.save','Save')}</CButton>
                  <CButton color="warning" variant="outline" disabled={saving} onClick={() => onSave(true)}>{t('settings.terms.publishNew','Publish as new version')}</CButton>
                </div>
                {version && <div className="text-muted mt-2 small">{t('settings.terms.currentVersion','Current version')}: {version}</div>}
              </CForm>
            </CCardBody>
          </CCard>
        </CCol>
        <CCol lg={6}>
          <CCard className="border-0 shadow-sm">
            <CCardBody>
              <h6 className="mb-3">{t('settings.terms.acceptance','Acceptance')}</h6>
              <div className="text-muted small mb-2">{t('settings.terms.version','Version')}: {acceptance?.version ?? '-'}</div>
              <CTable hover responsive>
                <CTableHead>
                  <CTableRow>
                    <CTableHeaderCell>{t('common.user','User')}</CTableHeaderCell>
                    <CTableHeaderCell>{t('common.email','Email')}</CTableHeaderCell>
                    <CTableHeaderCell className="text-end">{t('settings.terms.status','Status')}</CTableHeaderCell>
                  </CTableRow>
                </CTableHead>
                <CTableBody>
                  {(acceptance.users || []).map(u => (
                    <CTableRow key={u.id}>
                      <CTableDataCell>{u.name || '-'}</CTableDataCell>
                      <CTableDataCell>{u.email || '-'}</CTableDataCell>
                      <CTableDataCell className="text-end">
                        {u.accepted ? <CBadge color="success">{t('settings.terms.accepted','Accepted')}</CBadge> : <CBadge color="secondary">{t('settings.terms.pending','Pending')}</CBadge>}
                      </CTableDataCell>
                    </CTableRow>
                  ))}
                </CTableBody>
              </CTable>
            </CCardBody>
          </CCard>
        </CCol>
      </CRow>
    </>
  )
}

export default TermsPage
