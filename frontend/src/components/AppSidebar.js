import React, { useEffect, useRef, useCallback } from 'react'
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
import { setSidebarShow, setSidebarUnfoldable, setSidebarPinned } from '../store/slices/sidebarSlice'
import { BsPinAngle, BsPinAngleFill } from 'react-icons/bs'

const AppSidebar = () => {
  const dispatch = useDispatch()
  const sidebarShow = useSelector((state) => state.sidebar.sidebarShow)
  const unfoldable = useSelector((state) => state.sidebar.sidebarUnfoldable)
  const sidebarPinned = useSelector((state) => state.sidebar.sidebarPinned)
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
  // Hover handlers (desktop only). When collapsed (unfoldable=true) and NOT pinned, expand on hover.
  const handleMouseEnter = useCallback(() => {
    if (window.innerWidth < 992) return
    if (sidebarPinned) return
    // Only expand if currently narrow/collapsed
    if (unfoldable) {
      dispatch(setSidebarUnfoldable(false))
    }
  }, [dispatch, unfoldable, sidebarPinned])

  const handleMouseLeave = useCallback(() => {
    if (window.innerWidth < 992) return
    if (sidebarPinned) return
    // Collapse back after leaving if it was auto-expanded
    if (!unfoldable) {
      dispatch(setSidebarUnfoldable(true))
    }
  }, [dispatch, unfoldable, sidebarPinned])

  return (
    <>
      {/* Mobile-optimized sidebar CSS */}
      <style>{`
        .modern-sidebar {
          position: fixed;
          top: 0;
          left: 0;
          height: 100vh;
          width: 260px;
          z-index: 1040;
          transform: translateX(-100%);
          transition: transform 0.15s ease-in-out;
          border-right: 1px solid rgba(255, 255, 255, 0.1);
        }

        .modern-sidebar.show {
          transform: translateX(0);
        }

        .modern-sidebar__header {
          height: 60px;
          display: flex;
          align-items: center;
          justify-content: space-between;
          padding: 0 1rem;
          border-bottom: 1px solid rgba(255, 255, 255, 0.1);
        }

        .modern-sidebar__brand {
          display: flex;
          align-items: center;
          text-decoration: none;
          color: inherit;
          min-width: 0;
          flex: 1;
        }

        .modern-sidebar__close {
          display: none;
          background: transparent;
          border: none;
          color: rgba(255, 255, 255, 0.8);
          font-size: 1.25rem;
          padding: 0.5rem;
          cursor: pointer;
          border-radius: 4px;
          min-width: 44px;
          min-height: 44px;
          display: flex;
          align-items: center;
          justify-content: center;
        }

        .modern-sidebar__close:hover {
          background: rgba(255, 255, 255, 0.1);
          color: white;
        }

        .modern-sidebar__footer {
          position: absolute;
          bottom: 0;
          left: 0;
          right: 0;
          height: 56px;
          border-top: 1px solid rgba(255, 255, 255, 0.1);
          display: none;
        }

        /* Mobile styles */
        @media (max-width: 767.98px) {
          .modern-sidebar {
            width: 280px;
            max-width: 85vw;
          }

          .modern-sidebar__close {
            display: flex;
          }

          .modern-sidebar__footer {
            display: none !important;
          }
        }

        /* Tablet styles */
        @media (min-width: 768px) and (max-width: 991.98px) {
          .modern-sidebar {
            transform: translateX(0);
            position: relative;
            height: 100vh;
            overflow-y: auto;
          }

          .modern-sidebar__close {
            display: none;
          }

          .modern-sidebar__footer {
            display: flex;
          }
        }

    /* Desktop styles */
        @media (min-width: 992px) {
          .modern-sidebar {
            transform: translateX(0);
            position: fixed;
            height: 100vh;
      overflow-y: auto; /* allow scrolling when content exceeds viewport */
          }

          .modern-sidebar.sidebar-narrow {
            width: 56px;
          }

          .modern-sidebar__close {
            display: none;
          }

          .modern-sidebar__footer {
            display: flex;
            position: relative;
          }
          /* Smooth width transition for expand / collapse */
          .modern-sidebar { transition: width .18s ease, box-shadow .18s ease; }
          .modern-sidebar.sidebar-narrow { overflow: hidden; }
          .modern-sidebar.expanded-temp { box-shadow: 2px 0 8px rgba(0,0,0,.15); }
        }

        /* Fix for stuck sidebar issue - ensure proper initialization */
        .modern-sidebar {
          will-change: transform;
        }

        /* Ensure sidebar is properly shown/hidden based on state */
        @media (min-width: 992px) {
          .modern-sidebar:not(.show) {
            transform: translateX(0) !important; /* Always show on desktop */
          }
        }

        @media (max-width: 991.98px) {
          .modern-sidebar:not(.show) {
            transform: translateX(-100%) !important; /* Always hide on mobile when not shown */
          }
        }

        /* Logo optimizations */
        .sidebar-brand-full {
          display: block;
        }

        .sidebar-brand-narrow {
          display: none;
        }

        .modern-sidebar.sidebar-narrow .sidebar-brand-full {
          display: none;
        }

        .modern-sidebar.sidebar-narrow .sidebar-brand-narrow {
          display: block;
        }

        /* Navigation improvements */
        .modern-sidebar .sidebar-nav {
          padding: 0.5rem 0;
          height: calc(100vh - 60px - 56px);
          overflow-y: auto;
          overflow-x: hidden;
        }

        @media (max-width: 767.98px) {
          .modern-sidebar .sidebar-nav {
            height: calc(100vh - 60px);
            padding-bottom: 2rem;
          }
        }

        /* Pin button adaptive styles */
        .sidebar-footer-pin-btn { transition: all .18s ease; display:flex; align-items:center; gap:.35rem; }
        .sidebar-footer-pin-btn .pin-label { display:inline; }
        .modern-sidebar.sidebar-narrow .sidebar-footer-pin-btn {
          width:40px; min-width:40px; padding:.55rem .5rem; justify-content:center;
        }
        .modern-sidebar.sidebar-narrow .sidebar-footer-pin-btn .pin-label { display:none; }
        .modern-sidebar.sidebar-narrow .sidebar-footer-pin-btn { font-size:0; }
        .modern-sidebar.sidebar-narrow .sidebar-footer-pin-btn svg { font-size:16px; }
  /* Center pin button horizontally when collapsed */
  .modern-sidebar.sidebar-narrow .modern-sidebar__footer .d-flex { justify-content: center; }
  .modern-sidebar.sidebar-narrow .sidebar-footer-pin-btn { margin-left:0 !important; margin-right:0 !important; }
      `}</style>

      <CSidebar
        ref={sidebarRef}
        className={`modern-sidebar border-end ${sidebarShow ? 'show' : ''} ${unfoldable ? 'sidebar-narrow' : ''} ${(!unfoldable && !sidebarPinned) ? 'expanded-temp' : ''}`}
        colorScheme="dark"
        position="fixed"
        unfoldable={unfoldable}
        visible={sidebarShow}
        onVisibleChange={(visible) => {
          dispatch(setSidebarShow(visible))
        }}
        onMouseEnter={handleMouseEnter}
        onMouseLeave={handleMouseLeave}
        style={{
          backgroundColor: customization.sidebarBg,
          color: customization.sidebarFontColor,
        }}
      >
        <CSidebarHeader
          className="modern-sidebar__header border-bottom"
          style={{
            backgroundColor: customization.logoBg,
          }}
        >
          <CSidebarBrand
            to="/"
            className="modern-sidebar__brand d-flex align-items-center text-decoration-none"
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
                    maxHeight: 40,
                    maxWidth: 160,
                    objectFit: 'contain',
                  }}
                />
                {/* Collapsed sidebar logo - visible when collapsed */}
                <img
                  src={`${api_url}${customization.logoImage}`}
                  alt="Logo"
                  className="sidebar-brand-narrow"
                  style={{
                    maxHeight: 28,
                    maxWidth: 28,
                    objectFit: 'contain',
                  }}
                />
              </>
            ) : (
              <>
                <div className="sidebar-brand-full fw-bold fs-6" style={{ color: '#fff', cursor: 'pointer' }}>
                  {customization.logoText}
                </div>
                <CIcon icon={sygnet} height={28} className="sidebar-brand-narrow" />
              </>
            )}
          </CSidebarBrand>

          <button
            className="modern-sidebar__close d-lg-none"
            onClick={() => dispatch(setSidebarShow(false))}
            aria-label="Close sidebar"
          >
            ×
          </button>
        </CSidebarHeader>

        {navItems.length > 0 ? (
          <div className="sidebar-nav" style={{ color: customization.sidebarFontColor }}>
            <AppSidebarNav items={navItems} fontColor={customization.sidebarFontColor} />
          </div>
        ) : (
          <div className="text-white text-center py-4 d-flex justify-content-center">
            <CSpinner color="light" />
          </div>
        )}

        <CSidebarFooter className="modern-sidebar__footer border-top d-none d-lg-flex">
          {/* Single Pin / Unpin control replaces old toggler; when pinned, force expanded */}
          <div className="d-flex align-items-center w-100 px-2">
            <button
              type="button"
              className="btn btn-sm btn-outline-light ms-auto sidebar-footer-pin-btn"
              onClick={() => {
                const next = !sidebarPinned
                dispatch(setSidebarPinned(next))
                if (next) {
                  // Ensure expanded when pinning
                  if (unfoldable) dispatch(setSidebarUnfoldable(false))
                }
              }}
              title={sidebarPinned ? 'Unpin sidebar (enable hover collapse)' : 'Pin sidebar (keep expanded)'}
              aria-label={sidebarPinned ? 'Unpin sidebar' : 'Pin sidebar'}
            >
              {sidebarPinned ? <BsPinAngleFill /> : <BsPinAngle />}
              <span className="pin-label">{sidebarPinned ? 'Unpin' : 'Pin'}</span>
            </button>
          </div>
        </CSidebarFooter>
      </CSidebar>
    </>
  )
}

export default React.memo(AppSidebar)
