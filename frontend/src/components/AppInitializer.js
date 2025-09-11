import { useEffect, useState } from 'react'
import { useDispatch, useSelector } from 'react-redux'
import axiosInstance from '../helpers/axiosInstance'
import { setCustomization } from '../store/slices/customizationSlice'
import { syncSidebarWithScreenSize } from '../store/slices/sidebarSlice'
import { CSpinner } from '@coreui/react'
import { EMBEDDED_CUSTOMIZATION } from '../config/customization'
import { getLogoUrl } from '../utils/logoUtils'

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

    // Update favicon if logo image is available
    if (customization.logoImage) {
      const logoUrl = getLogoUrl(customization.logoImage, api_url)

      const favicon = document.querySelector('link[rel="shortcut icon"]') || document.querySelector('link[rel="icon"]')
      if (favicon) {
        favicon.href = logoUrl
      } else {
        // Create favicon if it doesn't exist
        const newFavicon = document.createElement('link')
        newFavicon.rel = 'shortcut icon'
        newFavicon.href = logoUrl
        document.head.appendChild(newFavicon)
      }

      // Also create/update standard icon link
      let iconLink = document.querySelector('link[rel="icon"]')
      if (!iconLink) {
        iconLink = document.createElement('link')
        iconLink.rel = 'icon'
        document.head.appendChild(iconLink)
      }
      iconLink.href = logoUrl
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
