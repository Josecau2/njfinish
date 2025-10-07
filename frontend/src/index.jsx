import React from 'react'
import { createRoot } from 'react-dom/client'
import { Provider } from 'react-redux'
import { ChakraProvider } from '@chakra-ui/react'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import 'core-js'
// CSS Load Order - All styles loaded before React tree to prevent FOUC
import './styles/reset.css'        // 1. Reset - box-sizing, overflow guards
import './styles/utilities.css'    // 2. Utilities - spacing scale, helpers
import './styles/fixes.css'         // 3. Fixes - overflow guards, iOS safe area
import './styles/base.css'          // 4. Base - typography, accessibility
import './main.css'                 // 5. Main - login, PDF, modals
import './responsive.css'           // 6. Responsive - overrides (must be last)
import './i18n'

import App from './App.jsx'
import ErrorBoundary from './components/ErrorBoundary.jsx'
import { getBrand } from './brand/useBrand'
// Prefer pre-injected globals (set in index.html) to prevent flicker
import { detoxAuthStorage, getFreshestToken, debugAuthSnapshot } from './utils/authToken'
import i18n from './i18n'
import store from './store'
import { logout } from './store/slices/authSlice'
import { enableProtectedAssetInterceptor } from './utils/protectedAssets'
import { createThemeWithBrand } from './theme'
import performanceMonitor from './utils/performanceMonitor'

async function hydrateCustomizationGlobals() {
  if (typeof window === 'undefined') return;

  const loadJson = async (url) => {
    try {
      const res = await fetch(url, { cache: 'no-store' });
      if (!res.ok) return null;
      return await res.json();
    } catch (error) {
      console.warn('[customization] fetch failed', url, error?.message);
      return null;
    }
  };

  if (typeof window.__APP_CUSTOMIZATION__ === 'undefined') {
    const data = await loadJson(`/assets/customization/app-customization.json?_=${Date.now()}`);
    if (data) window.__APP_CUSTOMIZATION__ = data;
  }

  if (typeof window.__LOGIN_CUSTOMIZATION__ === 'undefined') {
    const data = await loadJson(`/assets/customization/login-customization.json?_=${Date.now()}`);
    if (data) window.__LOGIN_CUSTOMIZATION__ = data;
  }

  if (typeof window.__BRAND__ === 'undefined') {
    const { buildBrandFromGlobals } = await import('./brand/useBrandLegacy.mjs');
    const brand = buildBrandFromGlobals();
    if (brand) {
      window.__BRAND__ = brand;
    }
  }

  if (typeof document !== 'undefined') {
    const root = document.documentElement;
    const appCfg = window.__APP_CUSTOMIZATION__ || {};
    if (appCfg.headerBg) root.style.setProperty('--header-bg', appCfg.headerBg);
    if (appCfg.headerFontColor) root.style.setProperty('--header-fg', appCfg.headerFontColor);
    if (appCfg.sidebarBg) root.style.setProperty('--sidebar-bg', appCfg.sidebarBg);
    if (appCfg.sidebarFontColor) root.style.setProperty('--sidebar-fg', appCfg.sidebarFontColor);
    if (appCfg.logoBg) root.style.setProperty('--brand-logo-bg', appCfg.logoBg);

    const loginCfg = window.__LOGIN_CUSTOMIZATION__ || {};
    if (loginCfg.backgroundColor) {
      root.style.setProperty('--login-bg', loginCfg.backgroundColor);
    }
  }
}

async function bootstrap() {
  await hydrateCustomizationGlobals();

  // Early detox: unify to a single freshest token & clear stale persisted shards
  try {
    detoxAuthStorage()
  } catch {}

  try {
    enableProtectedAssetInterceptor()
  } catch {}

  // On boot hygiene: remove legacy auth cookies and validate token freshness before components mount
  try {
    try {
      if (typeof document !== 'undefined') {
        document.cookie = 'token=; Max-Age=0; path=/'
        document.cookie = 'auth=; Max-Age=0; path=/'
      }
    } catch {}
    const tok = typeof window !== 'undefined' ? getFreshestToken() : null
    // Expose a quick debug helper
    try {
      window.debugAuth = debugAuthSnapshot
    } catch {}
    try {
      console.info('[AUTH] Tip: run window.debugAuth() to inspect token tails and expirations')
    } catch {}
    if (tok) {
      const [, p] = tok.split('.')
      if (p) {
        try {
          const pad = '='.repeat((4 - (p.length % 4)) % 4)
          const b64 = p.replace(/-/g, '+').replace(/_/g, '/') + pad
          const payload = JSON.parse(atob(b64))
          const now = Math.floor(Date.now() / 1000)
          if (payload?.exp && payload.exp <= now && !window.__SESSION_EXPIRY_HANDLED__) {
            window.__SESSION_EXPIRY_HANDLED__ = true
            store.dispatch(logout())
            // Session expiry notification will be handled by App component with Chakra toast
            if (window.location.pathname !== '/login') {
              window.location.replace('/login')
            } else {
              try {
                delete window.__SESSION_EXPIRY_HANDLED__
              } catch {}
            }
          }
        } catch {}
      }
    } else {
      // No token at boot: ensure no stale cookie interferes then optionally redirect if on protected page
      try {
        if (window.location.pathname !== '/login' && window.location.pathname !== '/reset-password') {
          // Let route guards handle it or redirect to login depending on app flow
        }
      } catch {}
    }
  } catch {}

  // Removed proactive /api/me keep-alive pings to avoid token refresh gymnastics

  const brand = (() => {
    try {
      return getBrand() || {}
    } catch {
      return {}
    }
  })()

  const theme = createThemeWithBrand(brand)

  const queryClient = new QueryClient({
    defaultOptions: {
      queries: {
        staleTime: 60_000,
        cacheTime: 300_000,
        refetchOnWindowFocus: false,
        retry: 1,
      },
      mutations: {
        retry: 1,
      },
    },
  })

  // Initialize performance monitoring for PHASE HADES (Performance Underworld)
  performanceMonitor.init()

  createRoot(document.getElementById('root')).render(
    <ErrorBoundary>
      <Provider store={store}>
        <QueryClientProvider client={queryClient}>
          <ChakraProvider theme={theme}>
            <App />
          </ChakraProvider>
        </QueryClientProvider>
      </Provider>
    </ErrorBoundary>,
  )
}

bootstrap().catch((error) => {
  console.error('[boot] Failed to initialize application', error)
})
