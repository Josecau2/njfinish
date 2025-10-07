let cachedBase = null

function resolveApiBase() {
  if (cachedBase) {
    return cachedBase
  }

  let raw = import.meta.env.VITE_API_URL || ''

  try {
    if (!raw && typeof window !== 'undefined') {
      const host = window.location.hostname
      if (host && host !== 'localhost' && host !== '127.0.0.1') {
        raw = window.location.origin
      } else if (!raw) {
        raw = window.location.origin || ''
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

export function withAuthToken(url) {
  return url || ''
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
