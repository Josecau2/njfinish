// Browser cleanup utilities for forcing fresh sessions

export function forceBrowserCleanup() {
  try {
    // Define auth-related keys to clear
    const authKeys = [
      'user',
      'token',
      'session_active',
      '__auth_logout__',
      '__auth_changed__',
      'auth_redirect_count',
      'return_to',
      'logout_reason',
    ]

    // Clear only auth-related localStorage keys
    if (typeof localStorage !== 'undefined') {
      authKeys.forEach((key) => {
        try {
          localStorage.removeItem(key)
        } catch {}
      })
    }

    // Clear only auth-related sessionStorage keys
    if (typeof sessionStorage !== 'undefined') {
      authKeys.forEach((key) => {
        try {
          sessionStorage.removeItem(key)
        } catch {}
      })
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
    // Use BroadcastChannel API if available (modern browsers)
    if ('BroadcastChannel' in window) {
      const logoutChannel = new BroadcastChannel('auth_logout_channel')

      logoutChannel.onmessage = (event) => {
        if (event.data.type === 'LOGOUT') {
          // Another tab logged out, force cleanup
          forceBrowserCleanup()
          // Avoid reload loop if already on login page
          if (window.location.pathname !== '/login') {
            forcePageReload()
          }
        }
      }

      // Cleanup on window unload
      const handleBeforeUnload = () => {
        logoutChannel.close()
      }
      window.addEventListener('beforeunload', handleBeforeUnload)

      // Return cleanup function
      return () => {
        logoutChannel.close()
        window.removeEventListener('beforeunload', handleBeforeUnload)
      }
    } else {
      // Fallback to localStorage events for older browsers
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
  }

  return () => {}
}
