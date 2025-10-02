import React, { useMemo, useState } from 'react'
import PropTypes from 'prop-types'
import { useLocation, useNavigate } from 'react-router-dom'
import { useDispatch, useSelector } from 'react-redux'
import SimpleBar from 'simplebar-react'
import 'simplebar-react/dist/simplebar.min.css'
import { Menu, MenuButton, MenuItem, MenuList } from '@chakra-ui/react'
import { ChevronDown } from 'lucide-react'
import { setSidebarShow, setSidebarUnfoldable } from '../store/slices/sidebarSlice'
import { ICON_SIZE_MD, ICON_SIZE_SM } from '../constants/iconSizes'

const isActivePath = (pathname, target) => {
  if (!target) return false
  if (pathname === target) return true
  return pathname.startsWith(`${target}/`)
}

const buildColors = (fontColor) => {
  const base = fontColor && fontColor.trim() ? fontColor : 'rgba(226, 232, 240, 0.87)'
  // For icons, use currentColor to inherit from parent or a visible color
  const icon = 'currentColor'
  return {
    fontColor: base,
    iconColor: icon,
    accentColor: 'white',
    hoverBg: 'whiteAlpha.100',
    activeBg: 'whiteAlpha.200',
    borderColor: 'whiteAlpha.200',
  }
}

const hasActiveChild = (children, pathname) => {
  return children?.some((child) => {
    if (!child) return false
    if (child.type === 'group') {
      return hasActiveChild(child.children, pathname)
    }
    return isActivePath(pathname, child.to)
  })
}

const getIconElement = (IconComponent, colors) => {
  if (!IconComponent) {
    return (
      <span className="nav-icon nav-icon-bullet" aria-hidden>
        <span />
      </span>
    )
  }
  return (
    <span className="nav-icon" aria-hidden>
      <IconComponent size={ICON_SIZE_MD} color={colors.iconColor} strokeWidth={1.75} />
    </span>
  )
}

const AppSidebarNav = ({ items, collapsed = false, onNavigate, fontColor }) => {
  const location = useLocation()
  const navigate = useNavigate()
  const dispatch = useDispatch()
  const sidebarPinned = useSelector((state) => state.sidebar.sidebarPinned)
  const colors = useMemo(() => buildColors(fontColor), [fontColor])

  const handleNavigate = (target, isExternal = false) => {
    if (!target) return
    const isMobile = typeof window !== 'undefined' && window.innerWidth < 768
    if (isExternal) {
      window.open(target, '_blank', 'noopener,noreferrer')
      return
    }
    if (isMobile) {
      dispatch(setSidebarShow(false))
    } else if (!sidebarPinned) {
      dispatch(setSidebarUnfoldable(true))
    }
    onNavigate?.(target)
    navigate(target)
  }

  const renderLink = (item, depth = 0, opts = {}) => {
    const collapsedOverride = opts.collapsed ?? collapsed
    const active = isActivePath(location.pathname, item.to)
    const classNames = ['nav-link']
    if (active) classNames.push('active')
    const sharedStyle = {
      color: active ? colors.accentColor : colors.fontColor,
      backgroundColor: active ? colors.activeBg : 'transparent',
      minHeight: '44px',
    }

    if (!collapsedOverride) {
      // No indentation - all items same padding regardless of depth
      sharedStyle.paddingLeft = '0.85rem'
      sharedStyle.paddingRight = '0.85rem'
    }

    const content = (
      <>
        {getIconElement(item.icon, colors)}
        {!collapsedOverride && (
          <span className="nav-label">
            {item.label}
          </span>
        )}
        {!collapsedOverride && item.badge && (
          <span className="nav-link-badge">{item.badge.text}</span>
        )}
      </>
    )

    const key = item.to || item.href || `${item.label}-${depth}`

    if (item.to) {
      return (
        <li key={key} className="nav-item">
          <button
            type="button"
            className={classNames.join(' ')}
            style={sharedStyle}
            title={collapsedOverride ? item.label : undefined}
            onClick={() => handleNavigate(item.to)}
            onKeyDown={(event) => {
              if (event.key === 'Enter' || event.key === ' ') {
                event.preventDefault()
                handleNavigate(item.to)
              }
            }}
            aria-current={active ? 'page' : undefined}
          >
            {content}
          </button>
        </li>
      )
    }

    if (item.href) {
      return (
        <li key={key} className="nav-item">
          <a
            className={classNames.join(' ')}
            style={sharedStyle}
            title={collapsedOverride ? item.label : undefined}
            href={item.href}
            target="_blank"
            rel="noopener noreferrer"
          >
            {content}
          </a>
        </li>
      )
    }

    return null
  }

  const renderCollapsedGroupMenuItems = (children, depth = 0) => {
    return children?.map((child) => {
      if (child.type === 'group') {
        const nested = renderCollapsedGroupMenuItems(child.children, depth + 1)
        if (!nested || nested.length === 0) return null
        return (
          <MenuItem key={`${child.label}-${depth}`} className="nav-group-menu-heading" isDisabled>
            {child.label}
          </MenuItem>
        )
      }

      const active = isActivePath(location.pathname, child.to)
      return (
        <MenuItem
          key={`${child.to || child.label}-${depth}`}
          className={`nav-group-menu-item ${active ? 'active' : ''}`}
          onClick={() => handleNavigate(child.to)}
        >
          <span className="nav-link nav-link--menu">
            {getIconElement(child.icon, colors)}
            <span className="nav-label">{child.label}</span>
          </span>
        </MenuItem>
      )
    })
  }

  const renderGroupCollapsed = (item, depth = 0) => {
    const active = hasActiveChild(item.children, location.pathname)
    const classNames = ['nav-link', 'nav-group-toggle']
    if (active) classNames.push('active')
    const key = `${item.label}-${depth}`

    return (
      <li key={key} className={`nav-group nav-group--compact ${active ? 'show' : ''}`}>
        <Menu placement="right-start" offset={[8, 12]} isLazy>
          <MenuButton
            as="button"
            type="button"
            className={classNames.join(' ')}
            title={item.label}
            style={{
              color: active ? colors.accentColor : colors.fontColor,
              backgroundColor: active ? colors.activeBg : 'transparent',
            }}
          >
            {getIconElement(item.icon, colors)}
          </MenuButton>
          <MenuList className="nav-group-popover">
            <div className="nav-group-menu-label">{item.label}</div>
            {renderCollapsedGroupMenuItems(item.children, depth + 1)}
          </MenuList>
        </Menu>
      </li>
    )
  }

  // Child component to safely use hooks per-group without violating parent hook order
  const NavGroupExpanded = React.memo(function NavGroupExpanded({ item, depth }) {
    const active = hasActiveChild(item.children, location.pathname)
    const [open, setOpen] = useState(active)

    const handleToggle = () => setOpen((prev) => !prev)

    return (
      <li className={`nav-group ${open ? 'show' : ''}`}>
        <button
          type="button"
          className={`nav-link nav-group-toggle ${open ? 'active' : ''}`}
          onClick={handleToggle}
          onKeyDown={(event) => {
            if (event.key === 'Enter' || event.key === ' ') {
              event.preventDefault()
              handleToggle()
            }
          }}
          aria-expanded={open}
          style={{
            color: open || active ? colors.accentColor : colors.fontColor,
            backgroundColor: open || active ? colors.activeBg : 'transparent',
            minHeight: '44px',
            paddingLeft: '0.85rem',
            paddingRight: '0.85rem',
          }}
        >
          {getIconElement(item.icon, colors)}
          <span className="nav-label">{item.label}</span>
          <span className="nav-caret" aria-hidden>
            <ChevronDown size={ICON_SIZE_SM} style={{ transform: open ? 'rotate(180deg)' : 'rotate(0deg)' }} />
          </span>
        </button>
        <ul className="nav-group-items" style={{ display: open ? 'block' : 'none' }}>
          {item.children?.map((child) => {
            if (child.type === 'group') {
              return (
                <NavGroupExpanded key={`${child.label}-${depth + 1}`} item={child} depth={depth + 1} />
              )
            }
            return (
              <React.Fragment key={child.to || child.label}>
                {renderLink(child, depth + 1, { collapsed: false })}
              </React.Fragment>
            )
          })}
        </ul>
      </li>
    )
  })

  const renderGroupExpanded = (item, depth = 0) => {
    return <NavGroupExpanded key={`${item.label}-${depth}`} item={item} depth={depth} />
  }

  const renderItem = (item, depth = 0) => {
    if (item.type === 'group') {
      return collapsed ? renderGroupCollapsed(item, depth) : renderGroupExpanded(item, depth)
    }
    return renderLink(item, depth)
  }

  return (
    <>
      <style>{`
        .c-sidebar-nav {
          height: 100%;
          width: 100%;
        }
        .c-sidebar-nav .simplebar-scrollbar:before {
          background: var(--chakra-colors-whiteAlpha-400);
        }
        .c-sidebar-nav[data-collapsed="true"] .simplebar-scrollbar:before {
          opacity: 0;
        }
        .c-sidebar-nav .simplebar-content {
          display: block;
          padding: 0 !important;
        }
        .c-sidebar-nav .nav {
          list-style: none;
          margin: 0;
          padding: 0.5rem 0;
        }
        .c-sidebar-nav .nav-item {
          position: relative;
          padding: 0;
        }
        .c-sidebar-nav .nav-link {
          width: 100%;
          border: none;
          background: transparent;
          display: flex;
          align-items: center;
          justify-content: flex-start;
          gap: 0.75rem;
          font-size: 0.95rem;
          font-weight: 500;
          padding: 0.75rem 1rem;
          min-height: 44px;
          border-radius: 8px;
          cursor: pointer;
          transition: background 0.15s ease, color 0.15s ease;
          text-decoration: none;
          text-align: left;
        }
        .c-sidebar-nav .nav-link:hover {
          background: var(--chakra-colors-whiteAlpha-100);
        }
        /* Mobile: tighter padding for better use of space */
        @media (max-width: 1023px) {
          .c-sidebar-nav .nav {
            padding: 0.25rem 0;
          }
          .c-sidebar-nav .nav-link {
            padding: 0.7rem 0.85rem;
            border-radius: 6px;
          }
        }
        .c-sidebar-nav[data-collapsed="true"] .nav-link {
          justify-content: center;
          padding: 0.75rem 0;
          min-height: 44px;
        }
        .c-sidebar-nav[data-collapsed="true"] .nav-link .nav-label,
        .c-sidebar-nav[data-collapsed="true"] .nav-link .nav-link-badge,
        .c-sidebar-nav[data-collapsed="true"] .nav-link .nav-caret {
          display: none;
        }
        .c-sidebar-nav .nav-link.active {
          font-weight: 600;
        }
        .c-sidebar-nav .nav-icon {
          width: 1.5rem;
          height: 1.5rem;
          min-width: 1.5rem;
          display: inline-flex;
          align-items: center;
          justify-content: center;
          flex-shrink: 0;
        }
        .c-sidebar-nav .nav-icon svg {
          width: 1.25rem;
          height: 1.25rem;
        }
        .c-sidebar-nav .nav-icon-bullet span {
          width: 6px;
          height: 6px;
          border-radius: 999px;
          background: currentColor;
        }
        .c-sidebar-nav .nav-label {
          flex: 1;
          min-width: 0;
          white-space: nowrap;
          text-align: left;
          line-height: 1.4;
        }
        .c-sidebar-nav .nav-link-badge {
          font-size: 0.65rem;
          font-weight: 600;
          padding: 0.1rem 0.45rem;
          border-radius: 999px;
          background: var(--chakra-colors-whiteAlpha-200);
        }
        .c-sidebar-nav .nav-group {
          position: relative;
        }
        .c-sidebar-nav .nav-group-toggle {
          width: 100%;
        }
        .c-sidebar-nav .nav-group-items {
          list-style: none;
          margin: 0;
          padding: 0.15rem 0 0.25rem 0;
        }
        .c-sidebar-nav .nav-group.show > .nav-group-items {
          display: block;
        }
        .c-sidebar-nav .nav-group-items .nav-item {
          padding-left: 0;
        }
        .c-sidebar-nav .nav-caret {
          margin-left: auto;
          display: inline-flex;
          align-items: center;
        }
        .nav-group-popover {
          min-width: 220px;
          background: var(--chakra-colors-slate-900);
          color: var(--chakra-colors-slate-50);
          border: 1px solid var(--chakra-colors-whiteAlpha-200);
          border-radius: 12px;
          padding: 0.35rem 0;
        }
        .nav-group-menu-label {
          font-size: 0.75rem;
          font-weight: 600;
          text-transform: uppercase;
          letter-spacing: 0.08em;
          opacity: 0.8;
          padding: 0.35rem 0.9rem 0.15rem;
        }
        .nav-group-menu-item {
          font-size: 0.9rem;
          display: flex;
          align-items: center;
          min-height: 44px;
          padding: 0.5rem 0.75rem;
        }
        .nav-group-menu-item .nav-link--menu {
          display: flex;
          align-items: center;
          gap: 0.75rem;
          width: 100%;
        }
        .nav-group-menu-item.active,
        .nav-group-menu-item:hover {
          background: var(--chakra-colors-blue-100);
        }
      `}</style>
      <nav className="c-sidebar-nav" data-collapsed={collapsed ? 'true' : 'false'}>
        <SimpleBar style={{ height: '100%' }}>
          <ul className="nav">
            {items?.map((item) => renderItem(item))}
          </ul>
        </SimpleBar>
      </nav>
    </>
  )
}

AppSidebarNav.propTypes = {
  items: PropTypes.arrayOf(
    PropTypes.shape({
      type: PropTypes.string.isRequired,
      label: PropTypes.string.isRequired,
      to: PropTypes.string,
      href: PropTypes.string,
      icon: PropTypes.oneOfType([PropTypes.func, PropTypes.object]),
      children: PropTypes.array,
      badge: PropTypes.shape({
        text: PropTypes.string,
        color: PropTypes.string,
      }),
    }),
  ).isRequired,
  collapsed: PropTypes.bool,
  onNavigate: PropTypes.func,
  fontColor: PropTypes.string,
}

export default AppSidebarNav
