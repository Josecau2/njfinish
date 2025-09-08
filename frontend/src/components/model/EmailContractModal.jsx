import React from 'react';
import { useTranslation } from 'react-i18next';
import {
        CModal,
        CModalHeader,
        CModalTitle,
        CModalBody,
        CModalFooter,
        CButton,
} from '@coreui/react';

const EmailContractModal = ({ show, onClose }) => {
        const { t } = useTranslation();
        return (
                <CModal visible={show} onClose={onClose} alignment="center" size="lg" scrollable>
                        {/* Scoped a11y/touch-target styles */}
                        <style>{`
                            .email-contract-modal .btn { min-height: 44px; }
                        `}</style>
                        <div className="email-contract-modal">
                            <CModalHeader>
                                <CModalTitle>{t('contracts.sendTitle', 'Send contract')}</CModalTitle>
                            </CModalHeader>
                            <CModalBody>
                                <p className="text-center">
                                    {t('contracts.noContractsMsg', 'No contracts available for selection. Please go to contract settings to add one.')}
                                </p>
                            </CModalBody>
                            <CModalFooter>
                                <CButton color="secondary" onClick={onClose} aria-label={t('common.close','Close')}>
                                    {t('common.close','Close')}
                                </CButton>
                            </CModalFooter>
                        </div>
                </CModal>
        );
};

export default EmailContractModal;
