import { CUSTOMIZATION_CONFIG } from '../config/customization.js'
import { LOGIN_CUSTOMIZATION } from '../config/loginCustomization.js'

export function buildBrandFromGlobals() {
  try {
    const appCfg = typeof window !== 'undefined' ? window.__APP_CUSTOMIZATION__ || {} : {}
    const loginCfg = typeof window !== 'undefined' ? window.__LOGIN_CUSTOMIZATION__ || {} : {}

    const colors = {
      headerBg: appCfg.headerBg || CUSTOMIZATION_CONFIG.headerBg || 'slate.900',
      headerText: appCfg.headerFontColor || CUSTOMIZATION_CONFIG.headerFontColor || 'white',
      sidebarBg: appCfg.sidebarBg || CUSTOMIZATION_CONFIG.sidebarBg || 'gray.900',
      sidebarText: appCfg.sidebarFontColor || CUSTOMIZATION_CONFIG.sidebarFontColor || 'white',
      text: 'slate.900',
      accent: 'brand.500',
      surface: CUSTOMIZATION_CONFIG.surface || 'slate.50',
      logoBg: appCfg.logoBg || CUSTOMIZATION_CONFIG.logoBg || 'black',
    }

    const logoDataURI =
      (typeof loginCfg.logo === 'string' && loginCfg.logo) || CUSTOMIZATION_CONFIG.logoImage || ''

    const login =
      (loginCfg && Object.keys(loginCfg).length > 0 ? loginCfg : LOGIN_CUSTOMIZATION) || {}

    return {
      version: Date.now(),
      logoAlt: appCfg.logoText || CUSTOMIZATION_CONFIG.logoText || 'Logo',
      logoDataURI,
      colors,
      login,
      app: Object.keys(appCfg).length > 0 ? appCfg : CUSTOMIZATION_CONFIG,
    }
  } catch (error) {
    console.warn('[brand] Failed building brand from globals', error?.message)
    return null
  }
}

