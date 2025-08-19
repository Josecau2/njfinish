import React, { useEffect, useRef } from 'react'
import { NavLink } from 'react-router-dom'
import { useSelector, useDispatch } from 'react-redux'
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
import { setSidebarShow } from '../store/slices/sidebarSlice'
import { setSidebarUnfoldable } from '../store/slices/sidebarSlice'

const AppHeader = () => {
  const headerRef = useRef()
  const { colorMode, setColorMode } = useColorModes('coreui-free-react-admin-template-theme')
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
    <CHeader position="sticky"
      className="mb-1 p-0"
      ref={headerRef}
      style={{
        backgroundColor: customization.headerBg,
        color: customization.headerFontColor,
      }}>
      <CContainer className="border-bottom px-4" fluid>
        {/* Desktop Only: setSidebarUnfoldable */}
        <CHeaderToggler
          onClick={() => dispatch(setSidebarUnfoldable(!unfoldable))}
          className="d-none d-lg-flex"
          style={{
            marginInlineStart: '-14px',
            alignItems: 'center',
            gap: '10px',
          }}
        >
          <CIcon icon={cilMenu} size="lg" />
          <div style={{ height: '24px', width: '1px', backgroundColor: '#ccc' }} />
          <span
            style={{
              fontSize: '1.50rem',
              fontWeight: 'bold',
              color: customization.headerFontColor,
            }}
          >
            {loggedInUserName}
          </span>
        </CHeaderToggler>

        {/* Mobile Only: setSidebarShow */}
        <CHeaderToggler
          onClick={() => dispatch(setSidebarShow(!sidebarShow))}
          className="d-flex d-lg-none"
          style={{
            marginInlineStart: '-14px',
            alignItems: 'center',
            gap: '10px',
          }}
        >
          <CIcon icon={cilMenu} size="lg" />
          <div style={{ height: '24px', width: '1px', backgroundColor: '#ccc' }} />
          <span
            style={{
              fontSize: '1.50rem',
              fontWeight: 'bold',
              color: customization.headerFontColor,
            }}
          >
            {loggedInUserName}
          </span>
        </CHeaderToggler>



        <CHeaderNav className="ms-auto">
          <li className="nav-item py-1">
            <div className="vr h-100 mx-2 text-body text-opacity-75"></div>
          </li>
          <CDropdown variant="nav-item" placement="bottom-end">
            <CDropdownToggle caret={false}>
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
                <CIcon className="me-2" icon={cilSun} size="lg" /> Light
              </CDropdownItem>
              <CDropdownItem
                active={colorMode === 'dark'}
                className="d-flex align-items-center"
                as="button"
                type="button"
                onClick={() => setColorMode('dark')}
              >
                <CIcon className="me-2" icon={cilMoon} size="lg" /> Dark
              </CDropdownItem>
              <CDropdownItem
                active={colorMode === 'auto'}
                className="d-flex align-items-center"
                as="button"
                type="button"
                onClick={() => setColorMode('auto')}
              >
                <CIcon className="me-2" icon={cilContrast} size="lg" /> Auto
              </CDropdownItem>
            </CDropdownMenu>
          </CDropdown>
          <CNavItem>
            <CNavLink href="#">
              <CIcon icon={cilBell} size="lg" />
            </CNavLink>
          </CNavItem>

        </CHeaderNav>
        <CHeaderNav>
          <li className="nav-item py-1">
            <div className="vr h-100 mx-2 text-body text-opacity-75"></div>
          </li>

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
