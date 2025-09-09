import React from 'react'
import { useTranslation } from 'react-i18next'

const PaymentModal = () => {
	const { t } = useTranslation()
	return (
		<div className="container py-4" role="status" aria-live="polite">
			<div className="text-muted">{t('paymentModal.placeholder')}</div>
		</div>
	)
}

export default PaymentModal
