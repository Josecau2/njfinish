import React from 'react'
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
  return (
    <CSidebar
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
        <CSidebarBrand to="/" className="d-flex flex-column align-items-center justify-content-center w-100 text-decoration-none">
          {/* Full sidebar logo */}
          <div className="sidebar-brand-full fw-bold fs-5" style={{ color: '#fff', cursor: 'pointer' }}>
            {customization.logoImage ? (
              <img
                src={`${api_url}${customization.logoImage}`}
                alt="Logo"
                style={{
                  maxHeight: 60,
                  maxWidth: 120,
                  objectFit: 'contain',
                  marginBottom: 5,
                }}
              />
            ) : (
              customization.logoText
            )}
          </div>
          
          {/* Collapsed sidebar logo */}
          {customization.logoImage ? (
            <img
              src={`${api_url}${customization.logoImage}`}
              alt="Logo"
              className="sidebar-brand-narrow"
              style={{
                maxHeight: 32,
                maxWidth: 32,
                objectFit: 'contain',
                marginTop: 4,
              }}
            />
          ) : (
            <CIcon icon={sygnet} height={32} className="sidebar-brand-narrow mt-1" />
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
