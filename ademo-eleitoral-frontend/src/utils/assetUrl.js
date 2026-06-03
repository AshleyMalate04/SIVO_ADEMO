import { api } from '../lib/api'

const apiBaseUrl = String(api.defaults.baseURL || '').replace(/\/+$/, '')

const publicBaseUrl = (() => {
  if (!apiBaseUrl || apiBaseUrl === '/api') return ''

  try {
    const url = new URL(apiBaseUrl, window.location.origin)
    url.pathname = url.pathname.replace(/\/api\/?$/, '')
    return url.origin + url.pathname.replace(/\/+$/, '')
  } catch {
    return apiBaseUrl.replace(/\/api\/?$/, '')
  }
})()

const publicAssetPrefixes = ['/storage/', '/candidate-photos/', '/candidate-documents/']

export function resolveAssetUrl(path) {
  if (!path) return ''

  const value = String(path).trim()
  if (!value) return ''

  if (/^(data:|blob:)/i.test(value)) return value

  if (/^https?:/i.test(value)) {
    try {
      const url = new URL(value)
      const apiUrl = new URL(apiBaseUrl || window.location.origin, window.location.origin)
      const pointsToLocalhostWithoutPort = ['localhost', '127.0.0.1'].includes(url.hostname) && !url.port

      if (pointsToLocalhostWithoutPort && publicAssetPrefixes.some((prefix) => url.pathname.startsWith(prefix))) {
        return `${apiUrl.origin}${url.pathname}`
      }

      return value
    } catch {
      return value
    }
  }

  if (publicAssetPrefixes.some((prefix) => value.startsWith(prefix))) {
    return `${publicBaseUrl}${value}`
  }

  if (value.startsWith('storage/')) {
    return `${publicBaseUrl}/${value}`
  }

  return `${publicBaseUrl}/storage/${value.replace(/^\/+/, '')}`
}
