import Echo from 'laravel-echo'
import Pusher from 'pusher-js'

window.Pusher = Pusher

const key = import.meta.env.VITE_REVERB_APP_KEY || import.meta.env.VITE_PUSHER_APP_KEY || 'ademo_key'
const host = import.meta.env.VITE_REVERB_HOST || window.location.hostname || '127.0.0.1'
const port = Number(import.meta.env.VITE_REVERB_PORT || 8080)
const scheme = import.meta.env.VITE_REVERB_SCHEME || 'http'

export const echo = new Echo({
  broadcaster: 'reverb',
  key,
  wsHost: host,
  wsPort: port,
  wssPort: port,
  forceTLS: scheme === 'https',
  enabledTransports: scheme === 'https' ? ['wss'] : ['ws'],
  disableStats: true,
})

export default echo
