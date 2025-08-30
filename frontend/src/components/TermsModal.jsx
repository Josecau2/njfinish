import React, { useEffect, useState, useRef } from 'react'
import { CModal, CModalBody, CModalHeader, CModalTitle, CModalFooter, CButton } from '@coreui/react'
import { useDispatch, useSelector } from 'react-redux'
import { getLatestTerms, acceptTerms } from '../helpers/termsApi'
import { logout } from '../store/slices/authSlice'

const TermsModal = ({ visible, onClose, onReject, requireScroll = true, isForced = false }) => {
  const [content, setContent] = useState('')
  const [canAccept, setCanAccept] = useState(!requireScroll)
  const dispatch = useDispatch()
  const modalBodyRef = useRef(null)
  const customization = useSelector((state) => state.customization)

  // Enhanced contrast calculation function (same as PageHeader)
  const getContrastColor = (backgroundColor) => {
    if (!backgroundColor) return '#ffffff';
    
    // Convert hex to RGB
    const hex = backgroundColor.replace('#', '');
    const r = parseInt(hex.substr(0, 2), 16);
    const g = parseInt(hex.substr(2, 2), 16);
    const b = parseInt(hex.substr(4, 2), 16);
    
    // Calculate luminance using WCAG formula
    const luminance = (0.299 * r + 0.587 * g + 0.114 * b) / 255;
    
    // Return high contrast colors
    return luminance > 0.5 ? '#2d3748' : '#ffffff';
  };

  // Get optimal colors for different elements (same as PageHeader)
  const getOptimalColors = (backgroundColor) => {
    const textColor = getContrastColor(backgroundColor);
    const isLight = textColor === '#2d3748';
    
    return {
      text: textColor,
      subtitle: isLight ? 'rgba(45, 55, 72, 0.6)' : 'rgba(255, 255, 255, 0.6)',
      button: {
        primary: {
          bg: isLight ? '#0d6efd' : '#ffffff',
          color: isLight ? '#ffffff' : backgroundColor,
          border: isLight ? '#0d6efd' : '#ffffff',
          hover: {
            bg: isLight ? '#0b5ed7' : 'rgba(255, 255, 255, 0.9)',
            color: isLight ? '#ffffff' : backgroundColor
          }
        },
        danger: {
          bg: isLight ? '#dc3545' : '#ef4444',
          color: '#ffffff',
          border: isLight ? '#dc3545' : '#ef4444',
          hover: {
            bg: isLight ? '#bb2d3b' : '#dc2626',
            color: '#ffffff'
          }
        }
      }
    };
  };

  // Normalize background color
  const resolveBackground = (value) => {
    try {
      if (typeof value === 'string') {
        const trimmed = value.trim();
        return trimmed || '#ffffff';
      }
      if (value && typeof value === 'object') {
        if (typeof value.hex === 'string' && value.hex.trim()) return value.hex.trim();
        if (typeof value.value === 'string' && value.value.trim()) return value.value.trim();
      }
    } catch (_) { /* ignore and fallback */ }
    return '#ffffff';
  };

  const backgroundColor = resolveBackground(customization?.headerBg);
  const optimalColors = getOptimalColors(backgroundColor);

  useEffect(() => {
    if (!visible) return
    (async () => {
      try {
        const res = await getLatestTerms()
        setContent(res?.data?.data?.content || '')
      } catch { setContent('') }
    })()
  }, [visible])

  // Check if scrolling is actually needed after content loads
  useEffect(() => {
    if (!requireScroll || !visible || !content) return
    
    const checkScrollNeeded = () => {
      const element = modalBodyRef.current
      if (element) {
        const isScrollable = element.scrollHeight > element.clientHeight
        if (!isScrollable) {
          // Content fits without scrolling, enable accept immediately
          setCanAccept(true)
        }
      }
    }
    
    // Small delay to ensure content is rendered
    const timer = setTimeout(checkScrollNeeded, 100)
    return () => clearTimeout(timer)
  }, [content, visible, requireScroll])

  const handleScroll = (e) => {
    if (!requireScroll) return
    const el = e.target
    if (el.scrollTop + el.clientHeight >= el.scrollHeight - 8) {
      setCanAccept(true)
    }
  }

  const onAccept = async () => {
    try {
      await acceptTerms()
      onClose?.()
    } catch (error) {
      console.error('Failed to accept terms:', error)
    }
  }

  const onRejectTerms = () => {
    if (onReject) {
      onReject()
    } else {
      // Default behavior: logout user
      dispatch(logout())
    }
  }

  return (
    <>
      <style>
        {`
          .modal .modal-header.terms-modal-header,
          .modal .modal-header.terms-modal-header::before,
          .modal .modal-header.terms-modal-header::after {
            background: ${backgroundColor} !important;
            background-image: none !important;
            color: ${optimalColors.text} !important;
            border-bottom: 1px solid rgba(0,0,0,0.125) !important;
          }
          
          .modal .modal-header.terms-modal-header .modal-title {
            color: ${optimalColors.text} !important;
            font-weight: 600 !important;
          }
          
          .modal .modal-header.terms-modal-header .btn-close {
            filter: ${optimalColors.text === '#ffffff' ? 'invert(1) grayscale(100%) brightness(200%)' : 'none'} !important;
          }
          
          .terms-modal-primary-btn {
            background-color: ${optimalColors.button.primary.bg} !important;
            border-color: ${optimalColors.button.primary.border} !important;
            color: ${optimalColors.button.primary.color} !important;
          }
          
          .terms-modal-primary-btn:hover,
          .terms-modal-primary-btn:focus,
          .terms-modal-primary-btn:active {
            background-color: ${optimalColors.button.primary.hover.bg} !important;
            border-color: ${optimalColors.button.primary.border} !important;
            color: ${optimalColors.button.primary.hover.color} !important;
          }
          
          .terms-modal-danger-btn {
            background-color: ${optimalColors.button.danger.bg} !important;
            border-color: ${optimalColors.button.danger.border} !important;
            color: ${optimalColors.button.danger.color} !important;
          }
          
          .terms-modal-danger-btn:hover,
          .terms-modal-danger-btn:focus,
          .terms-modal-danger-btn:active {
            background-color: ${optimalColors.button.danger.hover.bg} !important;
            border-color: ${optimalColors.button.danger.border} !important;
            color: ${optimalColors.button.danger.hover.color} !important;
          }
        `}
      </style>
      <CModal visible={visible} backdrop="static" keyboard={false} size="lg">
        <CModalHeader 
          closeButton={!isForced} 
          className="terms-modal-header"
          style={{ background: backgroundColor, backgroundImage: 'none' }}
        >
          <CModalTitle>Terms & Conditions</CModalTitle>
        </CModalHeader>
        <CModalBody 
          ref={modalBodyRef}
          style={{ maxHeight: 400, overflowY: 'auto', whiteSpace: 'pre-wrap' }} 
          onScroll={handleScroll}
        >
          {content || 'No terms available.'}
          {isForced && (
            <div className="mt-3 p-3 bg-warning text-dark rounded">
              <strong>Required:</strong> You must accept these terms to continue using the application.
            </div>
          )}
        </CModalBody>
        <CModalFooter>
          {!isForced && <CButton color="secondary" disabled>{requireScroll ? 'Scroll to enable Accept' : 'Review terms'}</CButton>}
          {isForced && <CButton className="terms-modal-danger-btn" onClick={onRejectTerms}>Reject & Logout</CButton>}
          <CButton className="terms-modal-primary-btn" disabled={!canAccept} onClick={onAccept}>Accept</CButton>
        </CModalFooter>
      </CModal>
    </>
  )
}

export default TermsModal
