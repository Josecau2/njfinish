/**
 * Logo Cache Busting Utility
 *
 * Helps ensure browsers always load the latest version of uploaded logos
 * by adding timestamp parameters and managing cache headers.
 */

/**
 * Generate cache-busting URL for logo assets
 */
export const getCacheBustingUrl = (logoUrl) => {
  if (!logoUrl) return logoUrl

  const timestamp = Date.now()
  const separator = logoUrl.includes('?') ? '&' : '?'
  return `${logoUrl}${separator}v=${timestamp}`
}

/**
 * Preload logo image to avoid flickering
 */
export const preloadLogo = (logoUrl) => {
  return new Promise((resolve, reject) => {
    if (!logoUrl) {
      resolve(null)
      return
    }

    const img = new Image()
    img.onload = () => {
      console.log('✅ Logo preloaded successfully:', logoUrl)
      resolve(img)
    }
    img.onerror = (error) => {
      console.error('❌ Logo preload failed:', logoUrl, error)
      reject(error)
    }
    img.src = getCacheBustingUrl(logoUrl)
  })
}

/**
 * Clear browser cache for specific logo URLs
 */
export const clearLogoCache = () => {
  try {
    // Clear any cached logo images from browser cache
    if ('caches' in window) {
      caches.keys().then(names => {
        names.forEach(name => {
          if (name.includes('logo') || name.includes('customization')) {
            caches.delete(name)
            console.log('🗑️ Cleared logo cache:', name)
          }
        })
      })
    }
  } catch (error) {
    console.warn('⚠️ Could not clear logo cache:', error)
  }
}
