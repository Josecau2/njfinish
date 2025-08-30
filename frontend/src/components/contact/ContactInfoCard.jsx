import React from 'react'
import { CCard, CCardBody, CBadge } from '@coreui/react'
import { useTranslation } from 'react-i18next'
import PageHeader from '../PageHeader'

const Line = ({ label, value, visible = true }) => (
  visible && value ? (
    <div className="d-flex justify-content-between align-items-center py-2 border-bottom">
      <span className="text-muted small">{label}</span>
      <span className="fw-semibold">{value}</span>
    </div>
  ) : null
)

const ContactInfoCard = ({ loading, info }) => {
  const { t } = useTranslation()
  return (
    <CCard className="border-0 shadow-sm">
      <CCardBody>
        <PageHeader title={t('contact.info.title')} subtitle={t('contact.info.subtitle')} mobileLayout="compact" cardClassName="mb-3" />
        {loading ? (
          <div className="py-4 text-center text-muted">{t('common.loading')}</div>
        ) : (
          <>
            <Line label={t('contact.info.companyName')} value={info?.companyName} visible={info?.showCompanyName} />
            <Line label={t('contact.info.email')} value={info?.email} visible={info?.showEmail} />
            <Line label={t('contact.info.phone')} value={info?.phone} visible={info?.showPhone} />
            <Line label={t('contact.info.address')} value={info?.address} visible={info?.showAddress} />
            <Line label={t('contact.info.website')} value={info?.website} visible={info?.showWebsite} />
            <Line label={t('contact.info.hours')} value={info?.hours} visible={info?.showHours} />
            {info?.notes && info?.showNotes && (
              <div className="mt-3">
                <div className="text-muted small mb-1">{t('contact.info.notes')}</div>
                <div className="fw-semibold">{info?.notes}</div>
              </div>
            )}
          </>
        )}
      </CCardBody>
    </CCard>
  )
}

export default ContactInfoCard
