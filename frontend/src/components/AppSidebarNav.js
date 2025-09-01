import React from 'react'
import { NavLink, useLocation, useNavigate } from 'react-router-dom'
import PropTypes from 'prop-types'

import SimpleBar from 'simplebar-react'
import 'simplebar-react/dist/simplebar.min.css'
import { setSidebarShow, setSidebarUnfoldable } from '../store/slices/sidebarSlice'
import { useSelector, useDispatch } from 'react-redux'


import { CBadge, CNavLink, CSidebarNav } from '@coreui/react'


export const AppSidebarNav = ({ items, fontColor }) => {
  const dispatch = useDispatch()
  const sidebarShow = useSelector((state) => state.sidebar.sidebarShow)
  const unfoldable = useSelector((state) => state.sidebar.sidebarUnfoldable)
  const isMobile = () => window.innerWidth < 768
  const navigate = useNavigate()
  const location = useLocation()

  const navLink = (name, icon, badge, indent = false) => {
    return (
      <span
        style={{ color: fontColor, display: 'flex', alignItems: 'center', gap: '0.5rem' }}
        // Note: do not auto-close sidebar here; the wrapper CNavLink (actual link) will close on mobile.
      >

        {icon
          ? icon
          : indent && (
            <span className="nav-icon">
              <span className="nav-icon-bullet"></span>
            </span>
          )}
        {name && name}
        {badge && (
          <CBadge color={badge.color} className="ms-auto" size="sm">
            {badge.text}
          </CBadge>
        )}
      </span>
    )
  }


  const navItem = (item, index, indent = false) => {
    const { component, name, badge, icon, to, href, ...rest } = item
    const Component = component

    return (
      <Component as="div" key={index}>
        {to ? (
          // Internal navigation: render without href to avoid browser URL preview in the status bar
          <CNavLink
            as="div"
            role="button"
            tabIndex={0}
            className={
              location.pathname === to || location.pathname.startsWith(`${to}/`) ? 'active' : undefined
            }
            style={{ color: fontColor }}
            onClick={() => {
              navigate(to)
              if (window.innerWidth < 768) {
                dispatch(setSidebarShow(false))
              }
            }}
            onKeyDown={(e) => {
              if (e.key === 'Enter' || e.key === ' ') {
                e.preventDefault()
                navigate(to)
                if (window.innerWidth < 768) {
                  dispatch(setSidebarShow(false))
                }
              }
            }}
          >
            {navLink(name, icon, badge, indent)}
          </CNavLink>
        ) : href ? (
          // External links still use href
          <CNavLink
            href={href}
            target="_blank"
            rel="noopener noreferrer"
            style={{ color: fontColor }}
            {...rest}
          >
            {navLink(name, icon, badge, indent)}
          </CNavLink>
        ) : (
          navLink(name, icon, badge, indent)
        )}
      </Component>
    )
  }

  const navGroup = (item, index) => {
    const { component, name, icon, items, to, ...rest } = item
    const Component = component
    return (
      <Component 
        compact 
        as="div" 
        key={index} 
        toggler={navLink(name, icon)} 
        {...rest} 
        style={{ color: fontColor }}
        // Do not auto-close when expanding/collapsing groups; users may want to explore submenus.
      >
        {items?.map((item, index) =>
          item.items ? navGroup(item, index) : navItem(item, index, true),
        )}
      </Component>
    )
  }

  return (
    <CSidebarNav as={SimpleBar}>
      {items &&
        items.map((item, index) => (item.items ? navGroup(item, index) : navItem(item, index)))}
    </CSidebarNav>
  )
}

AppSidebarNav.propTypes = {
  items: PropTypes.arrayOf(PropTypes.any).isRequired,
}
