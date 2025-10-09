let cachedBase = null

function resolveApiBase() {
  if (cachedBase) {
    return cachedBase
  }

  let raw = import.meta.env.VITE_API_URL || ''

  try {
    if (!raw && typeof window !== 'undefined') {
      const { protocol, hostname, port } = window.location
      if (hostname && hostname !== 'localhost' && hostname !== '127.0.0.1') {
        raw = window.location.origin
      } else {
        const inferredPort = port || (protocol === 'https:' ? '443' : '80')
        if (inferredPort === '3000' || inferredPort === '5173') {
          raw = `${protocol}//${hostname || 'localhost'}:8080`
        } else if (port) {
          raw = `${protocol}//${hostname || 'localhost'}:${port}`
        } else {
          raw = `${protocol}//${hostname || 'localhost'}:8080`
        }
      }
    }
  } catch (error) {
    // noop
  }

  if (!raw) {
    cachedBase = ''
    return cachedBase
  }

  cachedBase = raw.replace(/\/api\/?$/, '').replace(/\/+$/, '')
  return cachedBase
}

function stripTokenQuery(url) {
  if (!url || typeof url !== 'string' || !url.includes('token=')) {
    return url || ''
  }

  try {
    const base = typeof window !== 'undefined' && window.location?.origin ? window.location.origin : 'http://localhost'
    const parsed = new URL(url, base)
    parsed.searchParams.delete('token')

    const search = parsed.searchParams.toString()
    const hash = parsed.hash || ''
    const pathWithQuery = `${parsed.pathname}${search ? `?${search}` : ''}${hash}`

    if (/^https?:\/\//i.test(url)) {
      return `${parsed.protocol}//${parsed.host}${pathWithQuery}`
    }
    if (url.startsWith('//')) {
      return `//${parsed.host}${pathWithQuery}`
    }
    if (url.startsWith('/')) {
      return pathWithQuery
    }
    return pathWithQuery.replace(/^\//, '')
  } catch (_) {
    return url
      .replace(/([?&])token=[^&#]*(#|$)/i, (_, prefix, suffix) => {
        if (prefix === '?' && suffix && suffix !== '#') {
          return `?${suffix}`
        }
        return suffix || ''
      })
      .replace(/\?&/, '?')
      .replace(/([?&])$/, '')
  }
}

export function withAuthToken(url) {
  return stripTokenQuery(url)
}

export function buildUploadUrl(inputPath) {
  if (!inputPath) {
    return ''
  }

  const raw = typeof inputPath === 'string' ? inputPath : String(inputPath || '')

  // Directly return data URIs or absolute URLs without modification
  if (/^(data:|https?:\/\/)/i.test(raw)) {
    return raw
  }

  const base = resolveApiBase()
  const normalised = raw.startsWith('/') ? raw : `/${raw}`

  if (!normalised.startsWith('/uploads')) {
    return base ? `${base}${normalised}` : normalised
  }

  const target = base ? `${base}${normalised}` : normalised
  return withAuthToken(target)
}

export function buildUploadDownloadUrl(inputPath) {
  return buildUploadUrl(inputPath)
}

export function getUploadApiBase() {
  return resolveApiBase()
}
