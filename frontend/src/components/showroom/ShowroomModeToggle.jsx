import React, { useState, useEffect } from 'react';
import { useSelector } from 'react-redux';
import { useTranslation } from 'react-i18next';
import {
  CButton,
  CModal,
  CModalBody,
  CModalFooter,
  CForm,
  CFormLabel,
  CFormInput,
  CFormText,
  CAlert,
  CTooltip
} from '@coreui/react';
import CIcon from '@coreui/icons-react';
import { cilSettings, cilEyedropper, cilX } from '@coreui/icons';
import { isAdmin } from '../../helpers/permissions';
import PageHeader from '../PageHeader';

const ShowroomModeToggle = ({ compact = false, collapsed = false }) => {
  const { t } = useTranslation();
  const authUser = useSelector((state) => state.auth?.user);
  const user = authUser || JSON.parse(localStorage.getItem('user') || '{}');

  // State management
  const [showroomMode, setShowroomMode] = useState(false);
  const [showroomMultiplier, setShowroomMultiplier] = useState(1.0);
  const [showModal, setShowModal] = useState(false);
  const [tempMultiplier, setTempMultiplier] = useState(1.0);
  const [validationError, setValidationError] = useState('');

  // Only render for admin users
  if (!isAdmin(user)) {
    return null;
  }

  // Load showroom settings from localStorage on mount
  useEffect(() => {
    try {
      const savedMode = localStorage.getItem('showroomMode') === 'true';
      const savedMultiplier = parseFloat(localStorage.getItem('showroomMultiplier')) || 1.0;

      setShowroomMode(savedMode);
      setShowroomMultiplier(savedMultiplier);
      setTempMultiplier(savedMultiplier);
    } catch (error) {
      console.warn('Failed to load showroom settings:', error);
    }
  }, []);

  // Save settings to localStorage whenever they change
  const saveShowroomSettings = (mode, multiplier) => {
    try {
      localStorage.setItem('showroomMode', mode.toString());
      localStorage.setItem('showroomMultiplier', multiplier.toString());

      // Dispatch custom event to notify other components
      window.dispatchEvent(new CustomEvent('showroomSettingsChanged', {
        detail: { mode, multiplier }
      }));
    } catch (error) {
      console.error('Failed to save showroom settings:', error);
    }
  };

  const handleToggle = () => {
    const newMode = !showroomMode;
    setShowroomMode(newMode);
    saveShowroomSettings(newMode, showroomMultiplier);
  };

  const handleOpenModal = () => {
    setTempMultiplier(showroomMultiplier);
    setValidationError('');
    setShowModal(true);
  };

  const validateMultiplier = (value) => {
    const num = parseFloat(value);
    if (isNaN(num)) {
      return 'Multiplier must be a valid number';
    }
    if (num <= 0) {
      return 'Multiplier must be greater than 0';
    }
    if (num > 10) {
      return 'Multiplier cannot exceed 10.0 for safety';
    }
    return '';
  };

  const handleSaveMultiplier = () => {
    const error = validateMultiplier(tempMultiplier);
    if (error) {
      setValidationError(error);
      return;
    }

    setShowroomMultiplier(tempMultiplier);
    saveShowroomSettings(showroomMode, tempMultiplier);
    setShowModal(false);
    setValidationError('');
  };

  const handleMultiplierChange = (e) => {
    const value = e.target.value;
    setTempMultiplier(value);

    if (value) {
      const error = validateMultiplier(value);
      setValidationError(error);
    } else {
      setValidationError('');
    }
  };

  const getToggleVariant = () => showroomMode ? 'success' : 'outline-secondary';
  const getToggleText = () => showroomMode ? 'ON' : 'OFF';

  // Compact mode for sidebar footer
  if (compact) {
    // Hide entire component when sidebar is collapsed
    if (collapsed) {
      return null;
    }

    return (
      <>
        <div className="d-flex align-items-center w-100 px-2">
          <CTooltip
            content={showroomMode
              ? `Showroom Mode Active (${showroomMultiplier}x multiplier) - Click to configure`
              : 'Showroom Mode Inactive - Click to configure'
            }
            placement="right"
          >
            <button
              type="button"
              className={`btn btn-sm ms-auto sidebar-footer-pin-btn ${showroomMode ? 'btn-outline-success' : 'btn-outline-light'}`}
              onClick={handleOpenModal}
              title={showroomMode ? `Showroom Mode: ${showroomMultiplier}x` : 'Configure Showroom Mode'}
              aria-label="Configure Showroom Mode"
            >
              <CIcon
                icon={cilEyedropper}
                className={showroomMode ? 'text-success' : ''}
              />
              <span className="pin-label">
                {showroomMode ? `${showroomMultiplier}x` : 'Show'}
              </span>
            </button>
          </CTooltip>
        </div>

        {/* Configuration Modal */}
        <CModal
          visible={showModal}
          onClose={() => setShowModal(false)}
          size="sm"
          alignment="center"
        >
          <PageHeader
            title="Showroom Mode Configuration"
            mobileLayout="inline"
            rightContent={
              <CButton
                color="light"
                size="sm"
                onClick={() => setShowModal(false)}
                aria-label="Close"
                title="Close"
                style={{ minHeight: '44px' }}
              >
                <CIcon icon={cilX} />
              </CButton>
            }
          />
          <CModalBody>
            <CAlert color="info" className="small">
              <strong>Showroom Mode</strong> applies a pricing multiplier to all proposal calculations,
              PDF generation, and order snapshots. This is useful for displaying adjusted pricing to customers.
            </CAlert>

            <CForm>
              <div className="mb-3">
                <CFormLabel htmlFor="showroomMultiplier">
                  Pricing Multiplier
                </CFormLabel>
                <CFormInput
                  type="number"
                  id="showroomMultiplier"
                  value={tempMultiplier}
                  onChange={handleMultiplierChange}
                  step="0.01"
                  min="0.01"
                  max="10.0"
                  placeholder="1.00"
                  invalid={!!validationError}
                />
                {validationError && (
                  <CFormText className="text-danger">
                    {validationError}
                  </CFormText>
                )}
                <CFormText>
                  Enter a multiplier (e.g., 1.25 for 25% markup, 0.8 for 20% discount)
                </CFormText>
              </div>

              <div className="mb-3">
                <div className="d-flex align-items-center gap-2">
                  <strong>Status:</strong>
                  <CButton
                    size="sm"
                    variant={getToggleVariant()}
                    onClick={handleToggle}
                    className="px-3"
                  >
                    {getToggleText()}
                  </CButton>
                </div>
                <CFormText>
                  {showroomMode
                    ? `Showroom mode is active with ${showroomMultiplier}x multiplier`
                    : 'Showroom mode is inactive'
                  }
                </CFormText>
              </div>
            </CForm>
          </CModalBody>
          <CModalFooter>
            <CButton color="secondary" onClick={() => setShowModal(false)}>
              Cancel
            </CButton>
            <CButton color="primary" onClick={handleSaveMultiplier}>
              Save Changes
            </CButton>
          </CModalFooter>
        </CModal>
      </>
    );
  }

  return (
    <>
      {/* Showroom Mode Toggle Button */}
      <div className="d-flex align-items-center gap-2 mb-3 px-3">
        <CTooltip
          content={showroomMode
            ? `Showroom Mode Active (${showroomMultiplier}x multiplier)`
            : 'Click to activate Showroom Mode'
          }
          placement="right"
        >
          <div className="d-flex align-items-center gap-2 w-100">
            <CIcon
              icon={cilEyedropper}
              size="sm"
              className={showroomMode ? 'text-success' : 'text-muted'}
            />
            <div className="flex-grow-1">
              <small className={`d-block ${showroomMode ? 'text-success fw-bold' : 'text-muted'}`}>
                Showroom Mode
              </small>
              {showroomMode && (
                <small className="text-success">
                  {showroomMultiplier}x multiplier
                </small>
              )}
            </div>
            <div className="d-flex gap-1">
              <CButton
                size="sm"
                variant={getToggleVariant()}
                onClick={handleToggle}
                className="px-2"
              >
                {getToggleText()}
              </CButton>
              <CButton
                size="sm"
                variant="outline-secondary"
                onClick={handleOpenModal}
                title="Configure Multiplier"
              >
                <CIcon icon={cilSettings} size="sm" />
              </CButton>
            </div>
          </div>
        </CTooltip>
      </div>

      {/* Configuration Modal */}
      <CModal
        visible={showModal}
        onClose={() => setShowModal(false)}
        size="sm"
        alignment="center"
      >
        <PageHeader
          title="Showroom Mode Configuration"
          mobileLayout="inline"
          rightContent={
            <CButton
              color="light"
              size="sm"
              onClick={() => setShowModal(false)}
              aria-label="Close"
              title="Close"
              style={{ minHeight: '44px' }}
            >
              <CIcon icon={cilX} />
            </CButton>
          }
        />
        <CModalBody>
          <CAlert color="info" className="small">
            <strong>Showroom Mode</strong> applies a pricing multiplier to all proposal calculations,
            PDF generation, and order snapshots. This is useful for displaying adjusted pricing to customers.
          </CAlert>

          <CForm>
            <div className="mb-3">
              <CFormLabel htmlFor="showroomMultiplier">
                Pricing Multiplier
              </CFormLabel>
              <CFormInput
                type="number"
                id="showroomMultiplier"
                value={tempMultiplier}
                onChange={handleMultiplierChange}
                step="0.01"
                min="0.01"
                max="10.0"
                placeholder="1.00"
                invalid={!!validationError}
              />
              <CFormText>
                Enter a multiplier value (e.g., 1.2 for 20% markup, 0.8 for 20% discount)
              </CFormText>
              {validationError && (
                <div className="invalid-feedback d-block">
                  {validationError}
                </div>
              )}
            </div>

            <div className="mb-3">
              <CFormText className="text-muted">
                <strong>Current Status:</strong> {showroomMode ? 'Active' : 'Inactive'}<br />
                <strong>Current Multiplier:</strong> {showroomMultiplier}x<br />
                <strong>Example:</strong> $1,000 → ${(1000 * parseFloat(tempMultiplier || 1)).toFixed(2)}
              </CFormText>
            </div>
          </CForm>
        </CModalBody>
        <CModalFooter>
          <CButton
            color="secondary"
            onClick={() => setShowModal(false)}
          >
            Cancel
          </CButton>
          <CButton
            color="primary"
            onClick={handleSaveMultiplier}
            disabled={!!validationError || !tempMultiplier}
          >
            Save Changes
          </CButton>
        </CModalFooter>
      </CModal>
    </>
  );
};

export default ShowroomModeToggle;
