import { useEffect, useState } from 'react'
import { useDispatch, useSelector } from 'react-redux'
import axiosInstance from '../helpers/axiosInstance'
import { setCustomization } from '../store/slices/customizationSlice'
import { syncSidebarWithScreenSize } from '../store/slices/sidebarSlice'
import { CSpinner } from '@coreui/react'
// Use index fallback wrapper so build succeeds even if customization.js is git-ignored
import { EMBEDDED_CUSTOMIZATION } from '../config'
import { getLogoUrl } from '../utils/logoUtils'
import { getCacheBustingUrl, preloadLogo, clearLogoCache } from '../utils/cacheUtils'

const AppInitializer = ({ children }) => {
  const dispatch = useDispatch()
  const [loading, setLoading] = useState(false) // Start with false since embedded config loads instantly
  const customization = useSelector((state) => state.customization)
  const api_url = import.meta.env.VITE_API_URL

  // Load embedded customization immediately on mount
  useEffect(() => {
    // 🚀 INSTANT LOAD: Load embedded customization synchronously
    dispatch(setCustomization(EMBEDDED_CUSTOMIZATION))
    console.log('✅ Embedded customization loaded instantly:', EMBEDDED_CUSTOMIZATION)
  }, [dispatch])

  // Ensure sidebar state is correct when app initializes after login
  useEffect(() => {
    dispatch(syncSidebarWithScreenSize())
  }, [dispatch])

  // Update document title and favicon when customization changes
  useEffect(() => {
    if (customization.logoText) {
      document.title = customization.logoText

      // Update meta tags for better SEO
      const metaTitle = document.querySelector('meta[property="og:title"]')
      if (metaTitle) {
        metaTitle.content = customization.logoText
      }

      const metaSiteName = document.querySelector('meta[property="og:site_name"]')
      if (metaSiteName) {
        metaSiteName.content = customization.logoText
      }
    }

    // 🗑️ CLEAN SLATE: Remove all existing favicon links first
    const existingFavicons = document.querySelectorAll('link[rel="icon"], link[rel="shortcut icon"], link[rel="apple-touch-icon"]')
    existingFavicons.forEach(link => link.remove())

    const setFaviconHref = (href) => {
      const create = (rel) => { const l = document.createElement('link'); l.rel = rel; l.type = 'image/png'; l.href = href; document.head.appendChild(l); };
      create('icon');
      create('shortcut icon');
    };

    // Data URI fallback (simple house icon SVG -> PNG-like via svg data). Lightweight.
    const FALLBACK_FAVICON = 'data:image/svg+xml;utf8,' + encodeURIComponent(`<?xml version="1.0"?><svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 64 64"><rect width="64" height="64" rx="12" fill="#1f2937"/><path d="M12 30L32 14l20 16v22a2 2 0 0 1-2 2H14a2 2 0 0 1-2-2V30Z" fill="#ffffff" stroke="#ffffff" stroke-width="2"/><path d="M26 54V36h12v18" fill="#ffffff"/></svg>`);

    // Update favicon if logo image is available
    if (customization.logoImage) {
      const logoUrl = getLogoUrl(customization.logoImage, api_url)

      // Clear any cached logo data first
      clearLogoCache()

      // Add cache-busting parameter to ensure fresh load
      const cacheBustUrl = getCacheBustingUrl(logoUrl)

      console.log('🔄 Setting custom favicon:', cacheBustUrl)

      // Preload the logo to avoid flickering, then set favicon
      preloadLogo(logoUrl).then(() => {
        setFaviconHref(cacheBustUrl)
        console.log('✅ Custom logo set as favicon after preload')
      }).catch(() => {
        console.warn('⚠️ Logo preload failed, using fallback house icon')
        setFaviconHref(FALLBACK_FAVICON)
      })
    } else {
      console.log('ℹ️ No custom logo - applying fallback favicon')
      setFaviconHref(FALLBACK_FAVICON)
    }
  }, [customization.logoText, customization.logoImage, api_url])

  // Apply density token on small screens and update on resize
  useEffect(() => {
    const applyDensity = () => {
      const isCompact = window.matchMedia('(max-width: 576px)').matches
      document.documentElement.setAttribute('data-density', isCompact ? 'compact' : 'comfortable')
    }
    applyDensity()
    window.addEventListener('resize', applyDensity)
    return () => window.removeEventListener('resize', applyDensity)
  }, [])

  // Expose customization colors as CSS variables for theming
  useEffect(() => {
    const root = document.documentElement
    if (customization?.headerBg) root.style.setProperty('--header-bg', customization.headerBg)
    if (customization?.headerFontColor) root.style.setProperty('--header-fg', customization.headerFontColor)
    if (customization?.sidebarBg) root.style.setProperty('--sidebar-bg', customization.sidebarBg)
    if (customization?.sidebarFontColor) root.style.setProperty('--sidebar-fg', customization.sidebarFontColor)
  }, [customization?.headerBg, customization?.headerFontColor, customization?.sidebarBg, customization?.sidebarFontColor])



  // Optional: Background sync with server for development validation
  useEffect(() => {
    const backgroundSync = async () => {
      if (process.env.NODE_ENV === 'development') {
        try {
          const res = await axiosInstance.get('/api/settings/customization')
          const serverLastUpdated = res.data?.updatedAt
          const embeddedLastUpdated = EMBEDDED_CUSTOMIZATION.lastUpdated

          if (serverLastUpdated && embeddedLastUpdated &&
              new Date(serverLastUpdated) > new Date(embeddedLastUpdated)) {
            console.warn('⚠️  Server customization is newer than embedded config. Consider rebuilding frontend.')
          }
        } catch (syncError) {
          console.log('ℹ️  Background sync failed (this is normal):', syncError.message)
        }
      }
    }

    // Run background sync after a delay to not block initial render
    setTimeout(backgroundSync, 1000)
  }, [dispatch])

  if (loading) {
    return (
      <div className="text-center pt-5" role="status" aria-live="polite">
        <CSpinner color="primary" aria-label="Loading application" />
      </div>
    )
  }

  return children
}

export default AppInitializer
