import { resolveAssetUrl } from './assetUtils'

export function resolveBrandAssetUrl(value, fallback = true) {
  let resolved = resolveAssetUrl(value)
  if (resolved) {
    return resolved
  }

  if (!fallback) {
    return null
  }

  try {
    if (typeof window !== 'undefined' && window.__BRAND__?.logo?.dataURI) {
      return window.__BRAND__.logo.dataURI
    }
  } catch (error) {
    // ignore
  }

  return null
}
