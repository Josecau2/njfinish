import React, { useEffect, useRef } from 'react'
import { NavLink } from 'react-router-dom'
import { useSelector, useDispatch } from 'react-redux'
import { useTranslation } from 'react-i18next'
import {
  CContainer,
  CDropdown,
  CDropdownItem,
  CDropdownMenu,
  CDropdownToggle,
  CHeader,
  CHeaderNav,
  CHeaderToggler,
  CNavLink,
  CNavItem,
  useColorModes,
} from '@coreui/react'
import CIcon from '@coreui/icons-react'
import {
  cilBell,
  cilContrast,
  cilEnvelopeOpen,
  cilList,
  cilMenu,
  cilMoon,
  cilSun,
} from '@coreui/icons'
import { AppBreadcrumb } from './index'
import { AppHeaderDropdown } from './header/index'
import NotificationBell from './NotificationBell'
import { setSidebarShow } from '../store/slices/sidebarSlice'
import { setSidebarUnfoldable } from '../store/slices/sidebarSlice'
import LanguageSwitcher from './LanguageSwitcher'

const AppHeader = () => {
  const headerRef = useRef()
  const { colorMode, setColorMode } = useColorModes('coreui-free-react-admin-template-theme')
  const { t } = useTranslation()
  const dispatch = useDispatch()
  const sidebarShow = useSelector((state) => state.sidebar.sidebarShow)
  const unfoldable = useSelector((state) => state.sidebar.sidebarUnfoldable)
  const loggedInUser = JSON.parse(localStorage.getItem('user'));
  const loggedInUserName = loggedInUser?.name;

  // Get first name for mobile display
  const getDisplayName = (fullName, isMobile = false) => {
    if (!fullName) return '';
    if (!isMobile) return fullName;
    // For mobile, show only first name or first 12 characters
    const firstName = fullName.split(' ')[0];
    return firstName.length > 12 ? firstName.substring(0, 12) + '...' : firstName;
  };

  const customization = useSelector((state) => state.customization)

  // Function to calculate luminance and determine contrast color
  const getContrastColor = (backgroundColor) => {
    // Convert hex to RGB
    const hex = backgroundColor.replace('#', '');
    const r = parseInt(hex.substr(0, 2), 16);
    const g = parseInt(hex.substr(2, 2), 16);
    const b = parseInt(hex.substr(4, 2), 16);

    // Calculate luminance
    const luminance = (0.299 * r + 0.587 * g + 0.114 * b) / 255;

    // Return dark color for light backgrounds, light color for dark backgrounds
    return luminance > 0.5 ? '#2d3748' : '#ffffff';
  };

  // Get the optimal text color for contrast
  const optimalTextColor = getContrastColor(customization.headerBg || '#ffffff');

  useEffect(() => {
    document.addEventListener('scroll', () => {
      headerRef.current &&
        headerRef.current.classList.toggle('shadow-sm', document.documentElement.scrollTop > 0)
    })
  }, [])

  return (
    <>
      {/* Mobile-optimized header CSS */}
      <style>{`
        .modern-header {
          position: sticky;
          top: 0;
          z-index: 1030;
          backdrop-filter: blur(8px);
          border-bottom: 1px solid rgba(0, 0, 0, 0.1);
          min-height: 60px;
        }

        .modern-header__container {
          display: flex;
          align-items: center;
          min-height: 60px;
          padding: 0 1rem;
        }

        .modern-header__toggler {
          display: flex;
          align-items: center;
          gap: 0.75rem;
          border: none;
          background: transparent;
          padding: 0.5rem 0.75rem;
          margin-left: -0.75rem;
          border-radius: 6px;
          transition: all 0.15s ease-in-out;
          min-height: 44px;
          cursor: pointer;
        }

        .modern-header__toggler:hover {
          background: rgba(0, 0, 0, 0.05);
        }

        .modern-header__divider {
          height: 20px;
          width: 1px;
          background: rgba(0, 0, 0, 0.2);
          margin: 0 0.5rem;
        }

        .modern-header__name {
          font-weight: 600;
          white-space: nowrap;
          overflow: hidden;
          text-overflow: ellipsis;
          max-width: 200px;
        }

        .modern-header__nav {
          margin-left: auto;
          display: flex;
          align-items: center;
          height: 60px;
        }

        .modern-header__nav-item {
          display: flex;
          align-items: center;
          height: 100%;
        }

        .modern-header__dropdown-toggle {
          display: flex;
          align-items: center;
          padding: 0.5rem 0.75rem;
          height: 100%;
          border: none;
          background: transparent;
          border-radius: 6px;
          transition: all 0.15s ease-in-out;
          min-height: 44px;
          min-width: 44px;
          justify-content: center;
        }

        .modern-header__dropdown-toggle:hover {
          background: rgba(0, 0, 0, 0.05);
        }

        .modern-header__vr {
          height: 20px;
          width: 1px;
          background: rgba(0, 0, 0, 0.2);
          margin: 0 0.75rem;
        }

        /* Mobile optimizations */
        @media (max-width: 575.98px) {
          .modern-header__container {
            padding: 0 0.75rem;
          }

          .modern-header__name {
            font-size: 0.9rem;
            max-width: 120px;
          }

          .modern-header__vr {
            margin: 0 0.5rem;
          }

          .modern-header__dropdown-toggle {
            padding: 0.4rem 0.6rem;
          }
        }

        /* Tablet optimizations */
        @media (min-width: 576px) and (max-width: 767.98px) {
          .modern-header__name {
            max-width: 150px;
          }
        }

        /* Desktop optimizations */
        @media (min-width: 768px) {
          .modern-header__container {
            padding: 0 1.5rem;
          }

          .modern-header__name {
            max-width: 250px;
            font-size: 1.1rem;
          }
        }

        /* Dark mode adjustments */
        [data-coreui-theme="dark"] .modern-header__toggler:hover {
          background: rgba(255, 255, 255, 0.1);
        }

        [data-coreui-theme="dark"] .modern-header__dropdown-toggle:hover {
          background: rgba(255, 255, 255, 0.1);
        }

        [data-coreui-theme="dark"] .modern-header__divider,
        [data-coreui-theme="dark"] .modern-header__vr {
          background: rgba(255, 255, 255, 0.2);
        }
      `}</style>

      <CHeader
        position="sticky"
        className="modern-header header toolbar toolbar--sticky"
        ref={headerRef}
        style={{
          backgroundColor: customization.headerBg,
          color: optimalTextColor,
        }}
      >
        <CContainer fluid className="modern-header__container">
          {/* Desktop Only: setSidebarUnfoldable */}
          <CHeaderToggler
            onClick={() => dispatch(setSidebarUnfoldable(!unfoldable))}
            className="modern-header__toggler d-none d-lg-flex"
            style={{ color: optimalTextColor }}
          >
            <CIcon icon={cilMenu} size="lg" style={{ color: optimalTextColor }} />
            <div className="modern-header__divider" style={{ background: `${optimalTextColor}33` }} />
            <span className="modern-header__name" style={{ color: optimalTextColor }}>
              {getDisplayName(loggedInUserName, false)}
            </span>
          </CHeaderToggler>

          {/* Mobile Only: setSidebarShow */}
          <CHeaderToggler
            onClick={() => dispatch(setSidebarShow(!sidebarShow))}
            className="modern-header__toggler d-flex d-lg-none"
            style={{ color: optimalTextColor }}
          >
            <CIcon icon={cilMenu} size="lg" style={{ color: optimalTextColor }} />
            <div className="modern-header__divider" style={{ background: `${optimalTextColor}33` }} />
            <span className="modern-header__name" style={{ color: optimalTextColor }}>
              {getDisplayName(loggedInUserName, true)}
            </span>
          </CHeaderToggler>

          <CHeaderNav className="modern-header__nav">
            <CNavItem className="modern-header__nav-item">
              <div className="modern-header__vr" style={{ background: `${optimalTextColor}33` }}></div>
            </CNavItem>

            <CDropdown
              variant="nav-item"
              placement="bottom-end"
              className="modern-header__nav-item header-dropdown"
              offset={[0, 12]}
              portal
            >
              <CDropdownToggle
                caret={false}
                className="modern-header__dropdown-toggle nav-link border-0 bg-transparent"
                style={{ color: optimalTextColor }}
              >
                {colorMode === 'dark' ? (
                  <CIcon icon={cilMoon} size="lg" style={{ color: optimalTextColor }} />
                ) : colorMode === 'auto' ? (
                  <CIcon icon={cilContrast} size="lg" style={{ color: optimalTextColor }} />
                ) : (
                  <CIcon icon={cilSun} size="lg" style={{ color: optimalTextColor }} />
                )}
              </CDropdownToggle>
              <CDropdownMenu
                className="header-dropdown__menu theme-dropdown__menu"
                style={{ minWidth: '200px' }}
              >
                <CDropdownItem
                  active={colorMode === 'light'}
                  className="d-flex align-items-center"
                  as="button"
                  type="button"
                  onClick={() => setColorMode('light')}
                >
                  <CIcon className="me-2" icon={cilSun} size="lg" /> {t('common.light')}
                </CDropdownItem>
                <CDropdownItem
                  active={colorMode === 'dark'}
                  className="d-flex align-items-center"
                  as="button"
                  type="button"
                  onClick={() => setColorMode('dark')}
                >
                  <CIcon className="me-2" icon={cilMoon} size="lg" /> {t('common.dark')}
                </CDropdownItem>
                <CDropdownItem
                  active={colorMode === 'auto'}
                  className="d-flex align-items-center"
                  as="button"
                  type="button"
                  onClick={() => setColorMode('auto')}
                >
                  <CIcon className="me-2" icon={cilContrast} size="lg" /> {t('common.auto')}
                </CDropdownItem>
              </CDropdownMenu>
            </CDropdown>

            <CNavItem className="modern-header__nav-item">
              <div className="modern-header__vr" style={{ background: `${optimalTextColor}33` }}></div>
            </CNavItem>

            <CNavItem className="modern-header__nav-item">
              <LanguageSwitcher />
            </CNavItem>

            <NotificationBell />

            <CNavItem className="modern-header__nav-item">
              <div className="modern-header__vr" style={{ background: `${optimalTextColor}33` }}></div>
            </CNavItem>

            <AppHeaderDropdown />
          </CHeaderNav>
        </CContainer>
      </CHeader>
    </>
  )
}

export default AppHeader
