import React, { useEffect, useRef } from 'react'
import { useSelector, useDispatch } from 'react-redux'
import {
  CCloseButton,
  CSidebar,
  CSidebarBrand,
  CSidebarFooter,
  CSidebarHeader,
  CSidebarToggler,
  CSpinner,
} from '@coreui/react'
import CIcon from '@coreui/icons-react'
import { AppSidebarNav } from './AppSidebarNav'
import { logo } from 'src/assets/brand/logo'
import { sygnet } from 'src/assets/brand/sygnet'
// sidebar nav config
import useNavItems from '../_nav'
import { setSidebarShow, setSidebarUnfoldable } from '../store/slices/sidebarSlice'
import { BsTypeH6 } from 'react-icons/bs'

const AppSidebar = () => {
  const dispatch = useDispatch()
  const sidebarShow = useSelector((state) => state.sidebar.sidebarShow)
  const unfoldable = useSelector((state) => state.sidebar.sidebarUnfoldable)
  const navItems = useNavItems()
  const customization = useSelector((state) => state.customization)
  const api_url = import.meta.env.VITE_API_URL;
  const sidebarRef = useRef(null)

  // Close sidebar on outside click for mobile screens
  useEffect(() => {
    if (!sidebarShow) return
    const isMobile = () => (typeof window !== 'undefined' && window.innerWidth < 768)
    if (!isMobile()) return
    const handleOutside = (e) => {
      const el = sidebarRef.current
      if (!el) return
      if (!el.contains(e.target)) {
        dispatch(setSidebarShow(false))
      }
    }
    document.addEventListener('mousedown', handleOutside, true)
    document.addEventListener('touchstart', handleOutside, true)
    return () => {
      document.removeEventListener('mousedown', handleOutside, true)
      document.removeEventListener('touchstart', handleOutside, true)
    }
  }, [sidebarShow, dispatch])
  return (
    <CSidebar
      ref={sidebarRef}
      className={`border-end ${sidebarShow ? 'show' : ''}`}
      colorScheme="dark"
      position="fixed"
      unfoldable={unfoldable}
      visible={sidebarShow}
      onVisibleChange={(visible) => {
        dispatch(setSidebarShow(visible))
      }}
      style={{
        backgroundColor: customization.sidebarBg,
        color: customization.sidebarFontColor,
      }}
    >
      <CSidebarHeader
        className="border-bottom"
        style={{
          backgroundColor: customization.logoBg,
        }}
      >
        <CSidebarBrand to="/" className="d-flex align-items-center justify-content-center w-100 text-decoration-none"
          onClick={() => {
            if (window.innerWidth < 768) {
              dispatch(setSidebarShow(false))
            }
          }}
        >
          {customization.logoImage ? (
            <>
              {/* Full sidebar logo - visible when expanded */}
              <img
                src={`${api_url}${customization.logoImage}`}
                alt="Logo"
                className="sidebar-brand-full"
                style={{
                  maxHeight: 60,
                  maxWidth: 120,
                  objectFit: 'contain',
                }}
              />
              {/* Collapsed sidebar logo - visible when collapsed */}
              <img
                src={`${api_url}${customization.logoImage}`}
                alt="Logo"
                className="sidebar-brand-narrow"
                style={{
                  maxHeight: 32,
                  maxWidth: 32,
                  objectFit: 'contain',
                }}
              />
            </>
          ) : (
            <>
              <div className="sidebar-brand-full fw-bold fs-5" style={{ color: '#fff', cursor: 'pointer' }}>
                {customization.logoText}
              </div>
              <CIcon icon={sygnet} height={32} className="sidebar-brand-narrow" />
            </>
          )}
        </CSidebarBrand>
        <CCloseButton
          className="d-lg-none"
          dark
          onClick={() => dispatch(setSidebarShow(false))}
          style={{padding:'0 0 0 50px'}}
        />
      </CSidebarHeader>

      {navItems.length > 0 ? (
        <div style={{ color: customization.sidebarFontColor }}>
          <AppSidebarNav items={navItems} fontColor={customization.sidebarFontColor} />
        </div>
      ) : (
        <div className="text-white text-center py-4 d-flex justify-content-center">
          <CSpinner color="light" />
        </div>
      )}

      <CSidebarFooter className="border-top d-none d-lg-flex">
        <CSidebarToggler
          onClick={() => dispatch(setSidebarUnfoldable(!unfoldable))}
        />
      </CSidebarFooter>
    </CSidebar>
  )
}

export default React.memo(AppSidebar)
