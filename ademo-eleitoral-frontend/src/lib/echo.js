import Echo from 'laravel-echo'
import Pusher from 'pusher-js'

window.Pusher = Pusher

const key = import.meta.env.VITE_REVERB_APP_KEY || import.meta.env.VITE_PUSHER_APP_KEY
// Em Docker, o navegador liga ao mesmo host publico que serviu a aplicacao.
const host = import.meta.env.VITE_REVERB_HOST || window.location.hostname
const port = Number(import.meta.env.VITE_REVERB_PORT || 8080)
const scheme = import.meta.env.VITE_REVERB_SCHEME || 'http'
const realtimeEnabled = String(import.meta.env.VITE_REALTIME_ENABLED || '').toLowerCase() === 'true'
const apiBaseUrl = (import.meta.env.VITE_API_URL || 'http://127.0.0.1:8000/api').replace(/\/$/, '')
const initialToken = localStorage.getItem('ademo_token')

export const echo = realtimeEnabled && key && host ? new Echo({
  broadcaster: 'reverb',
  key,
  wsHost: host,
  wsPort: port,
  wssPort: port,
  forceTLS: scheme === 'https',
  enabledTransports: scheme === 'https' ? ['wss'] : ['ws'],
  disableStats: true,
  authEndpoint: `${apiBaseUrl}/broadcasting/auth`,
  auth: {
    headers: initialToken ? { Authorization: `Bearer ${initialToken}` } : {},
  },
}) : null

export function setEchoAuthToken(token) {
  if (!echo) return

  const headers = token ? { Authorization: `Bearer ${token}` } : {}
  echo.options.auth.headers = headers

  if (echo.connector?.options?.auth) {
    echo.connector.options.auth.headers = headers
  }

  if (echo.connector?.pusher?.config?.auth) {
    echo.connector.pusher.config.auth.headers = headers
  }
}

export default echo
