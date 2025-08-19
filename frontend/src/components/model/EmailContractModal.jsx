import React from 'react';
import {
    CModal,
    CModalHeader,
    CModalTitle,
    CModalBody,
    CModalFooter,
    CButton,
} from '@coreui/react';

const EmailContractModal = ({ show, onClose }) => {
    return (
        <CModal visible={show} onClose={onClose} alignment="center" size="lg" scrollable>
            <CModalHeader closeButton>
                <CModalTitle>Send contract</CModalTitle>
            </CModalHeader>
            <CModalBody>
                <p className="text-center">No contracts available for selection. Please go to contract settings to add one.</p>
            </CModalBody>
            {/* <CModalFooter>
                <CButton color="secondary" onClick={onClose}>Close</CButton>
                <CButton color="warning">Send Contract</CButton>
            </CModalFooter> */}
        </CModal>
    );
};

export default EmailContractModal;
