import React from 'react'
import { CCard, CCardBody, CCardHeader, CContainer } from '@coreui/react'
import PageHeader from '../../components/PageHeader'
import { useTranslation } from 'react-i18next'

const StyleMergerDemo = () => {
	const { t } = useTranslation()
	return (
		<CContainer fluid className="p-3">
			<PageHeader
				title={t('demo.styleMerger.title', 'Style Merger Demo')}
				subtitle={t('demo.styleMerger.subtitle', 'Visual-only demo of the style merger UI')}
			/>
			<CCard className="shadow-sm">
				<CCardHeader>
					<strong>{t('demo.styleMerger.header', 'Demo')}</strong>
				</CCardHeader>
				<CCardBody>
					<p className="text-body-secondary mb-0">
						{t(
							'demo.styleMerger.description',
							'This is a placeholder demo page. No business logic. Use it to validate responsive patterns, spacing, and a11y.'
						)}
					</p>
				</CCardBody>
			</CCard>
		</CContainer>
	)
}

export default StyleMergerDemo
