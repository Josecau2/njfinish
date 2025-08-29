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
import PageHeader from '../PageHeader';

const EmailContractModal = ({ show, onClose }) => {
    const { t } = useTranslation();
    return (
        <CModal visible={show} onClose={onClose} alignment="center" size="lg" scrollable>
            <PageHeader 
                title={t('contracts.sendTitle', 'Send contract')} 
                onClose={onClose}
            />
            <CModalBody>
                <p className="text-center">{t('contracts.noContractsMsg', 'No contracts available for selection. Please go to contract settings to add one.')}</p>
            </CModalBody>
            {/* <CModalFooter>
                <CButton color="secondary" onClick={onClose}>{t('common.cancel')}</CButton>
                <CButton color="warning">{t('contracts.sendCta', 'Send Contract')}</CButton>
            </CModalFooter> */}
        </CModal>
    );
};

export default EmailContractModal;
