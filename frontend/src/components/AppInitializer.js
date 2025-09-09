import { useEffect, useState } from 'react'
import { useDispatch, useSelector } from 'react-redux'
import axiosInstance from '../helpers/axiosInstance'
import { setCustomization } from '../store/slices/customizationSlice'
import { syncSidebarWithScreenSize } from '../store/slices/sidebarSlice'
import { CSpinner } from '@coreui/react'

const AppInitializer = ({ children }) => {
  const dispatch = useDispatch()
  const [loading, setLoading] = useState(true)
  const customization = useSelector((state) => state.customization)
  const api_url = import.meta.env.VITE_API_URL

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
      const favicon = document.querySelector('link[rel="shortcut icon"]') || document.querySelector('link[rel="icon"]')
      if (favicon) {
        favicon.href = `${api_url}${customization.logoImage}`
      } else {
        // Create favicon if it doesn't exist
        const newFavicon = document.createElement('link')
        newFavicon.rel = 'shortcut icon'
        newFavicon.href = `${api_url}${customization.logoImage}`
        document.head.appendChild(newFavicon)
      }

      // Also create/update standard icon link
      let iconLink = document.querySelector('link[rel="icon"]')
      if (!iconLink) {
        iconLink = document.createElement('link')
        iconLink.rel = 'icon'
        document.head.appendChild(iconLink)
      }
      iconLink.href = `${api_url}${customization.logoImage}`
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



  useEffect(() => {
    const fetchCustomization = async () => {
      try {
        const res = await axiosInstance.get('/api/settings/customization')

        if (res.data && Object.keys(res.data).length > 0) {
          dispatch(setCustomization(res.data))
        } else {
          dispatch(setCustomization({
            headerBg: '#ffffff',
            headerFontColor: '#333333',
            sidebarBg: '#212631',
            sidebarFontColor: '#ffffff',
            logoText: 'NJ Cabinets',
            logoImage: null,
          }))
        }
      } catch (err) {
        console.error('Customization load error:', err)
        dispatch(setCustomization({
          headerBg: '#ffffff',
          headerFontColor: '#333333',
          sidebarBg: '#212631',
          sidebarFontColor: '#ffffff',
          logoText: 'NJ Cabinets',
          logoImage: null,
        }))
      } finally {
        setLoading(false)
      }
    }

    fetchCustomization()
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
