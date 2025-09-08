import React from 'react'
import { CCard, CCardBody, CCardHeader, CContainer } from '@coreui/react'
import PageHeader from '../../components/PageHeader'

const StyleMergerDemo = () => {
	return (
		<CContainer fluid className="p-3">
			<PageHeader title="Style Merger Demo" subtitle="Visual-only demo of the style merger UI" />
			<CCard className="shadow-sm">
				<CCardHeader>
					<strong>Demo</strong>
				</CCardHeader>
				<CCardBody>
					<p className="text-body-secondary mb-0">
						This is a placeholder demo page. No business logic. Use it to validate responsive
						patterns, spacing, and a11y.
					</p>
				</CCardBody>
			</CCard>
		</CContainer>
	)
}

export default StyleMergerDemo
