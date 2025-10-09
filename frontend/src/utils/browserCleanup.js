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

    // Clear only non-httpOnly auth cookies (authToken is httpOnly and managed by backend)
    if (typeof document !== 'undefined') {
      // Note: httpOnly cookies like 'authToken' cannot be cleared from frontend
      // They can only be cleared by backend via /api/auth/logout endpoint
      const authCookiesToClear = ['authSession', 'token', 'auth'] // Only non-httpOnly cookies

      authCookiesToClear.forEach((name) => {
        const domains = [window.location.hostname, `.${window.location.hostname}`]
        const paths = ['/', '/login', '/dashboard']

        domains.forEach((domain) => {
          paths.forEach((path) => {
            try {
              document.cookie = `${name}=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=${path}; domain=${domain}`
              document.cookie = `${name}=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=${path}`
            } catch {}
          })
        })
      })
    }

    // Clear only auth-related browser cache (if supported)
    if ('caches' in window) {
      caches.keys().then((names) => {
        names.forEach((name) => {
          // Only clear auth-related caches
          if (name.toLowerCase().includes('auth') || name.toLowerCase().includes('session')) {
            caches.delete(name)
          }
        })
      })
    }

    // Clear service worker cache if available (configurable)
    const CLEANUP_SERVICE_WORKERS = false // Set to true if needed
    if (CLEANUP_SERVICE_WORKERS && 'serviceWorker' in navigator) {
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
