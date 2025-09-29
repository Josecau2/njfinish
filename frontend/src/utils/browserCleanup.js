// Browser cleanup utilities for forcing fresh sessions

export function forceBrowserCleanup() {
  try {
    // Clear all storage
    if (typeof localStorage !== 'undefined') {
      localStorage.clear()
    }
    if (typeof sessionStorage !== 'undefined') {
      sessionStorage.clear()
    }

    // Clear all cookies by setting them to expire
    if (typeof document !== 'undefined') {
      // Get all cookies
      const cookies = document.cookie.split(';')

      cookies.forEach((cookie) => {
        const eqPos = cookie.indexOf('=')
        const name = eqPos > -1 ? cookie.substr(0, eqPos).trim() : cookie.trim()

        if (name) {
          // Clear cookie for all possible domain/path combinations
          const domains = [
            window.location.hostname,
            `.${window.location.hostname}`,
            window.location.hostname.split('.').slice(-2).join('.'),
            `.${window.location.hostname.split('.').slice(-2).join('.')}`,
          ]

          const paths = ['/', '/login', '/dashboard']

          domains.forEach((domain) => {
            paths.forEach((path) => {
              try {
                document.cookie = `${name}=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=${path}; domain=${domain}`
                document.cookie = `${name}=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=${path}`
              } catch {}
            })
          })
        }
      })
    }

    // Clear browser cache (if supported)
    if ('caches' in window) {
      caches.keys().then((names) => {
        names.forEach((name) => {
          caches.delete(name)
        })
      })
    }

    // Clear service worker cache if available
    if ('serviceWorker' in navigator) {
      navigator.serviceWorker.getRegistrations().then((registrations) => {
        registrations.forEach((registration) => {
          registration.unregister()
        })
      })
    }

    console.log('[BROWSER_CLEANUP] Complete browser cleanup performed')
  } catch (error) {
    console.warn('[BROWSER_CLEANUP] Error during cleanup:', error)
  }
}

export function forcePageReload() {
  try {
    // Add cache-busting parameter
    const url = new URL(window.location)
    url.searchParams.set('_t', Date.now())
    url.searchParams.set('_logout', '1')

    // Force hard reload
    window.location.href = url.toString()
  } catch {
    // Fallback
    window.location.reload(true)
  }
}

export function addLogoutListener() {
  // Listen for logout events from other tabs
  if (typeof window !== 'undefined') {
    const handleStorageChange = (e) => {
      if (e.key === '__auth_logout__' && e.newValue) {
        // Another tab logged out, force cleanup
        forceBrowserCleanup()
        // Avoid reload loop if already on login page
        if (window.location.pathname !== '/login') {
          forcePageReload()
        }
      }
    }

    window.addEventListener('storage', handleStorageChange)

    // Return cleanup function
    return () => {
      window.removeEventListener('storage', handleStorageChange)
    }
  }

  return () => {}
}
