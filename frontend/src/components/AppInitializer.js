import { useEffect } from 'react'
import { useDispatch, useSelector } from 'react-redux'
import axiosInstance from '../helpers/axiosInstance'
import { getBrand } from '../brand/useBrand'
import { setCustomization } from '../store/slices/customizationSlice'
import { syncSidebarWithScreenSize } from '../store/slices/sidebarSlice'

const AppInitializer = ({ children }) => {
  const dispatch = useDispatch()
  const customization = useSelector((state) => state.customization)
  const api_url = import.meta.env.VITE_API_URL

  // Ensure sidebar state is correct when app initializes after login
  useEffect(() => {
    dispatch(syncSidebarWithScreenSize())
  }, [dispatch])

  // Update document title and favicon when customization changes
  useEffect(() => {
    const brand = getBrand()

    const titleText = customization.logoText || brand.logoAlt
    if (titleText) {
      document.title = titleText

      const metaTitle = document.querySelector("meta[property='og:title']")
      if (metaTitle) {
        metaTitle.content = titleText
      }

      const metaSiteName = document.querySelector("meta[property='og:site_name']")
      if (metaSiteName) {
        metaSiteName.content = titleText
      }
    }

    const faviconHref = (() => {
      const image = customization.logoImage
      if (image) {
        if (image.startsWith('data:') || image.startsWith('http')) {
          return image
        }
        return `${api_url}${image}`
      }
      if (brand.logoDataURI) {
        return brand.logoDataURI
      }
      return null
    })()

    if (faviconHref) {
      const favicon = document.querySelector("link[rel='shortcut icon']") || document.querySelector("link[rel='icon']")

      if (favicon) {
        favicon.href = faviconHref
      } else {
        const newFavicon = document.createElement("link")
        newFavicon.rel = "shortcut icon"
        newFavicon.href = faviconHref
        document.head.appendChild(newFavicon)
      }

      let iconLink = document.querySelector("link[rel='icon']")
      if (!iconLink) {
        iconLink = document.createElement("link")
        iconLink.rel = "icon"
        document.head.appendChild(iconLink)
      }
      iconLink.href = faviconHref
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

  // Expose brand colors as CSS variables for theming
  useEffect(() => {
    const root = document.documentElement
    if (customization?.headerBg) {
      root.style.setProperty('--brand-header-bg', customization.headerBg)
      root.style.setProperty('--header-bg', customization.headerBg)
    }
    if (customization?.headerFontColor) {
      root.style.setProperty('--brand-header-text', customization.headerFontColor)
      root.style.setProperty('--header-fg', customization.headerFontColor)
    }
    if (customization?.sidebarBg) {
      root.style.setProperty('--brand-sidebar-bg', customization.sidebarBg)
      root.style.setProperty('--sidebar-bg', customization.sidebarBg)
    }
    if (customization?.sidebarFontColor) {
      root.style.setProperty('--brand-sidebar-text', customization.sidebarFontColor)
      root.style.setProperty('--sidebar-fg', customization.sidebarFontColor)
    }
  }, [customization?.headerBg, customization?.headerFontColor, customization?.sidebarBg, customization?.sidebarFontColor])



  useEffect(() => {
    // Fire and forget refresh – does not block initial render.
    const refresh = async () => {
      try {
        const res = await axiosInstance.get('/api/settings/customization')
        if (res.data && Object.keys(res.data).length > 0) {
          dispatch(setCustomization(res.data))
        }
      } catch (e) {
        // Silent fail – we already have static config
        console.warn('Non-blocking customization refresh failed:', e?.message)
      }
    }
    refresh()
  }, [dispatch])

  return children
}

export default AppInitializer
