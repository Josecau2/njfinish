import { CUSTOMIZATION_CONFIG } from '../config/customization'
import { LOGIN_CUSTOMIZATION } from '../config/loginCustomization'

const DEFAULT_BRAND = {
  version: 0,
  logoAlt: '',
  logoDataURI: '',
  colors: {},
  login: {},
  app: {},
}

function normaliseColors(source = {}) {
  return {
    headerBg: source.headerBg || 'slate.900',
    headerText: source.headerFontColor || 'white',
    sidebarBg: source.sidebarBg || 'gray.900',
    sidebarText: source.sidebarFontColor || 'white',
    text: 'slate.900',
    accent: 'brand.500',
    surface: 'slate.50',
    logoBg: source.logoBg || 'black',
  }
}

function buildBrandFromStatic() {
  const appCfg = CUSTOMIZATION_CONFIG || {}
  const loginCfg = LOGIN_CUSTOMIZATION || {}

  if (!Object.keys(appCfg || {}).length && !Object.keys(loginCfg || {}).length) {
    return null
  }

  const colors = normaliseColors(appCfg)

  let logoDataURI = ''
  if (loginCfg && typeof loginCfg.logoDataURI === 'string' && loginCfg.logoDataURI) {
    logoDataURI = loginCfg.logoDataURI
  } else if (loginCfg && typeof loginCfg.logo === 'string' && loginCfg.logo) {
    logoDataURI = loginCfg.logo
  } else if (appCfg && typeof appCfg.logoImage === 'string' && appCfg.logoImage) {
    logoDataURI = appCfg.logoImage
  }

  return {
    version: Date.now(),
    logoAlt: appCfg.logoText || 'Logo',
    logoDataURI,
    colors,
    login: {
      ...(loginCfg || {}),
      showForgotPassword:
        typeof loginCfg?.showForgotPassword === 'boolean' ? loginCfg.showForgotPassword : true,
      showKeepLoggedIn:
        typeof loginCfg?.showKeepLoggedIn === 'boolean' ? loginCfg.showKeepLoggedIn : true,
    },
    app: {
      logoText: appCfg.logoText,
      logoImage: appCfg.logoImage,
      logoBg: appCfg.logoBg,
      companyName: appCfg.companyName,
    },
  }
}

function buildBrandFromLegacy() {
  try {
    if (typeof window === 'undefined') return null
    const appCfg = window.__APP_CUSTOMIZATION__ || {}
    const loginCfg = window.__LOGIN_CUSTOMIZATION__ || {}
    if (!appCfg && !loginCfg) return null

    const colors = normaliseColors(appCfg)
    let logoDataURI = ''
    if (typeof loginCfg.logoDataURI === 'string' && loginCfg.logoDataURI) {
      logoDataURI = loginCfg.logoDataURI
    } else if (typeof loginCfg.logo === 'string' && loginCfg.logo) {
      logoDataURI = loginCfg.logo
    } else if (typeof appCfg.logoImage === 'string' && appCfg.logoImage) {
      logoDataURI = appCfg.logoImage
    }

    return {
      version: Date.now(),
      logoAlt: appCfg.logoText || 'Logo',
      logoDataURI,
      colors,
      login: {
        ...(loginCfg || {}),
        showForgotPassword:
          typeof loginCfg.showForgotPassword === 'boolean' ? loginCfg.showForgotPassword : true,
        showKeepLoggedIn:
          typeof loginCfg.showKeepLoggedIn === 'boolean' ? loginCfg.showKeepLoggedIn : true,
      },
      app: {
        logoText: appCfg.logoText,
        logoImage: appCfg.logoImage,
        logoBg: appCfg.logoBg,
        companyName: appCfg.companyName,
      },
    }
  } catch (_) {
    return null
  }
}

export function getBrand() {
  if (typeof window !== 'undefined' && window.__BRAND__) {
    return window.__BRAND__
  }

  const staticBrand = buildBrandFromStatic()
  if (staticBrand) return staticBrand

  const synthesized = buildBrandFromLegacy()
  if (synthesized) return synthesized

  return DEFAULT_BRAND
}

export function useBrand() {
  return getBrand()
}

export function getBrandColors() {
  const brand = getBrand()
  if (brand.colors && Object.keys(brand.colors).length) {
    return brand.colors
  }

  const staticColors = normaliseColors(CUSTOMIZATION_CONFIG)
  if (Object.keys(staticColors).length) return staticColors

  try {
    if (typeof window !== 'undefined') {
      return normaliseColors(window.__APP_CUSTOMIZATION__)
    }
  } catch {}
  return {}
}

export function getLoginBrand() {
  const brand = getBrand()
  if (brand.login && Object.keys(brand.login).length) {
    return brand.login
  }

  if (LOGIN_CUSTOMIZATION && Object.keys(LOGIN_CUSTOMIZATION).length) {
    return {
      ...LOGIN_CUSTOMIZATION,
      showForgotPassword:
        typeof LOGIN_CUSTOMIZATION.showForgotPassword === 'boolean'
          ? LOGIN_CUSTOMIZATION.showForgotPassword
          : true,
      showKeepLoggedIn:
        typeof LOGIN_CUSTOMIZATION.showKeepLoggedIn === 'boolean'
          ? LOGIN_CUSTOMIZATION.showKeepLoggedIn
          : true,
    }
  }

  try {
    if (typeof window !== 'undefined' && window.__LOGIN_CUSTOMIZATION__) {
      return window.__LOGIN_CUSTOMIZATION__
    }
  } catch {}

  return {}
}
