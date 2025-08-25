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
import { isAdmin } from '../helpers/permissions'
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
  const customization = useSelector((state) => state.customization)

  useEffect(() => {
    document.addEventListener('scroll', () => {
      headerRef.current &&
        headerRef.current.classList.toggle('shadow-sm', document.documentElement.scrollTop > 0)
    })
  }, [])

  return (
    <CHeader
      position="sticky"
      className="header"
      ref={headerRef}
      style={{
        backgroundColor: customization.headerBg,
        color: customization.headerFontColor,
      }}
    >
      <CContainer fluid className="d-flex align-items-center">
        {/* Desktop Only: setSidebarUnfoldable */}
        <CHeaderToggler
          onClick={() => dispatch(setSidebarUnfoldable(!unfoldable))}
          className="d-none d-lg-flex align-items-center header-toggler"
          style={{
            gap: '12px',
            border: 'none',
            background: 'transparent',
            padding: '8px 12px',
            marginLeft: '-12px',
          }}
        >
          <CIcon icon={cilMenu} size="lg" />
          <div style={{ height: '20px', width: '1px', backgroundColor: 'rgba(204, 204, 204, 0.6)' }} />
          <span
            style={{
              fontSize: '1.1rem',
              fontWeight: '600',
              color: customization.headerFontColor,
              whiteSpace: 'nowrap',
            }}
          >
            {loggedInUserName}
          </span>
        </CHeaderToggler>

        {/* Mobile Only: setSidebarShow */}
        <CHeaderToggler
          onClick={() => dispatch(setSidebarShow(!sidebarShow))}
          className="d-flex d-lg-none align-items-center header-toggler"
          style={{
            gap: '12px',
            border: 'none',
            background: 'transparent',
            padding: '8px 12px',
            marginLeft: '-12px',
          }}
        >
          <CIcon icon={cilMenu} size="lg" />
          <div style={{ height: '20px', width: '1px', backgroundColor: 'rgba(204, 204, 204, 0.6)' }} />
          <span
            style={{
              fontSize: '1.1rem',
              fontWeight: '600',
              color: customization.headerFontColor,
              whiteSpace: 'nowrap',
            }}
          >
            {loggedInUserName}
          </span>
        </CHeaderToggler>

  <CHeaderNav className="ms-auto d-flex align-items-center" style={{ height: '100%' }}>
          <CNavItem>
            <div className="vr mx-3 text-body text-opacity-50" style={{ height: '20px' }}></div>
          </CNavItem>
          <CDropdown variant="nav-item" placement="bottom-end" className="d-flex align-items-center" style={{ height: '100%' }}>
            <CDropdownToggle 
              caret={false}
              className="nav-link border-0 bg-transparent d-flex align-items-center"
              style={{ padding: '8px 12px', height: '100%' }}
            >
              {colorMode === 'dark' ? (
                <CIcon icon={cilMoon} size="lg" />
              ) : colorMode === 'auto' ? (
                <CIcon icon={cilContrast} size="lg" />
              ) : (
                <CIcon icon={cilSun} size="lg" />
              )}
            </CDropdownToggle>
            <CDropdownMenu>
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
          <CNavItem>
            <div className="vr mx-3 text-body text-opacity-50" style={{ height: '20px' }}></div>
          </CNavItem>
          <CNavItem className="d-flex align-items-center" style={{ height: '100%' }}>
            <LanguageSwitcher />
          </CNavItem>
          {isAdmin(loggedInUser) && (
            // NotificationBell renders a <li> via CDropdown variant="nav-item"; do not wrap in CNavItem
            <NotificationBell />
          )}
          <CNavItem>
            <div className="vr mx-3 text-body text-opacity-50" style={{ height: '20px' }}></div>
          </CNavItem>
          {/* AppHeaderDropdown renders a <li> via CDropdown variant="nav-item"; don't wrap it in another <li> */}
          <AppHeaderDropdown />
        </CHeaderNav>
      </CContainer>
      {/* <CContainer className="px-4" fluid>
        <AppBreadcrumb />
      </CContainer> */}
    </CHeader>
  )
}

export default AppHeader
