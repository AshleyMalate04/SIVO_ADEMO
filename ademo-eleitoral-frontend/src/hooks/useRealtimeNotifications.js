import { useEffect } from 'react'
import echo from '../lib/echo'

export function useRealtimeNotifications({ onNotification, onRefresh } = {}) {
  useEffect(() => {
    const handleNotification = (event) => {
      onNotification?.(event.detail)
      onRefresh?.()
    }
    const handleRefresh = (event) => {
      onRefresh?.(event.detail)
    }

    window.addEventListener('ademo:notification', handleNotification)
    window.addEventListener('ademo:results-updated', handleRefresh)
    window.addEventListener('ademo:election-status', handleRefresh)

    if (!echo) {
      return () => {
        window.removeEventListener('ademo:notification', handleNotification)
        window.removeEventListener('ademo:results-updated', handleRefresh)
        window.removeEventListener('ademo:election-status', handleRefresh)
      }
    }

    const userChannel = echo.channel('ademo.notifications')
    const resultsChannel = echo.channel('ademo.results')
    const electionsChannel = echo.channel('ademo.elections')

    userChannel.listen('.notificacao.criada', (payload) => {
      onNotification?.(payload)
      onRefresh?.(payload)
    })
    resultsChannel.listen('.resultado.actualizado', (payload) => onRefresh?.(payload))
    resultsChannel.listen('.resultado.publicado', (payload) => onRefresh?.(payload))
    electionsChannel.listen('.eleicao.estado.actualizado', (payload) => onRefresh?.(payload))

    return () => {
      userChannel.stopListening('.notificacao.criada')
      resultsChannel.stopListening('.resultado.actualizado')
      resultsChannel.stopListening('.resultado.publicado')
      electionsChannel.stopListening('.eleicao.estado.actualizado')
      window.removeEventListener('ademo:notification', handleNotification)
      window.removeEventListener('ademo:results-updated', handleRefresh)
      window.removeEventListener('ademo:election-status', handleRefresh)
    }
  }, [onNotification, onRefresh])
}
