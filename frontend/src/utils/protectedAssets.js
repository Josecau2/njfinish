import { buildUploadUrl, withAuthToken, getUploadApiBase } from './uploads'

function shouldSecure(url) {
  if (!url || typeof url !== 'string') return false
  if (!url.includes('/uploads/')) return false
  if (url.startsWith('data:') || url.startsWith('blob:')) return false
  return true
}

function resolveRelativePart(url, base) {
  if (!base || !url.startsWith(base)) {
    return null
  }
  const slice = url.slice(base.length)
  if (!slice.startsWith('/')) {
    return `/${slice}`
  }
  return slice
}

function secureUrl(url) {
  const cleanedUrl = withAuthToken(url)

  if (!shouldSecure(cleanedUrl)) {
    return cleanedUrl
  }

  try {
    const apiBase = getUploadApiBase()
    if (apiBase) {
      const relative = resolveRelativePart(cleanedUrl, apiBase)
      if (relative) {
        return buildUploadUrl(relative)
      }
    }

    if (typeof window !== 'undefined') {
      const origin = window.location?.origin
      if (origin) {
        const relative = resolveRelativePart(cleanedUrl, origin)
        if (relative) {
          return buildUploadUrl(relative)
        }
      }
    }

    if (cleanedUrl.startsWith('/')) {
      return buildUploadUrl(cleanedUrl)
    }

    return cleanedUrl
  } catch (error) {
    return cleanedUrl
  }
}

function patchDescriptor(proto, key) {
  if (!proto) return
  const descriptor = Object.getOwnPropertyDescriptor(proto, key)
  if (!descriptor || typeof descriptor.set !== 'function') {
    return
  }

  Object.defineProperty(proto, key, {
    configurable: true,
    enumerable: descriptor.enumerable,
    get: descriptor.get,
    set(value) {
      const secured = secureUrl(value)
      return descriptor.set.call(this, secured)
    },
  })
}

function patchSetAttribute() {
  const originalSetAttribute = Element.prototype.setAttribute
  Element.prototype.setAttribute = function patchedSetAttribute(name, value) {
    if (name === 'src' || name === 'href') {
      return originalSetAttribute.call(this, name, secureUrl(value))
    }
    return originalSetAttribute.call(this, name, value)
  }
}

let enabled = false

export function enableProtectedAssetInterceptor() {
  if (enabled) return
  enabled = true

  try {
    patchDescriptor(HTMLImageElement.prototype, 'src')
  } catch {}
  try {
    patchDescriptor(HTMLImageElement.prototype, 'srcset')
  } catch {}
  try {
    patchDescriptor(HTMLAnchorElement.prototype, 'href')
  } catch {}
  try {
    patchSetAttribute()
  } catch {}
}
