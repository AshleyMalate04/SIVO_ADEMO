import { useEffect } from 'react'
import echo from '../lib/echo'

export function useElectionRealtime(electionId, { onResultUpdated, onStatusUpdated, onAnyUpdate } = {}) {
  useEffect(() => {
    if (!echo) return undefined

    const handleResult = (payload) => {
      onResultUpdated?.(payload)
      onAnyUpdate?.(payload)
    }
    const handleStatus = (payload) => {
      onStatusUpdated?.(payload)
      onAnyUpdate?.(payload)
    }

    const resultsChannel = echo.channel('ademo.results')
    const electionsChannel = echo.channel('ademo.elections')

    resultsChannel.listen('.resultado.actualizado', handleResult)
    resultsChannel.listen('.resultado.publicado', handleResult)
    electionsChannel.listen('.eleicao.estado.actualizado', handleStatus)

    let electionChannel = null
    if (electionId) {
      electionChannel = echo.channel(`election.${electionId}`)
      electionChannel.listen('.resultado.actualizado', handleResult)
      electionChannel.listen('.resultado.publicado', handleResult)
      electionChannel.listen('.eleicao.estado.actualizado', handleStatus)
    }

    return () => {
      resultsChannel.stopListening('.resultado.actualizado')
      resultsChannel.stopListening('.resultado.publicado')
      electionsChannel.stopListening('.eleicao.estado.actualizado')
      if (electionChannel) {
        electionChannel.stopListening('.resultado.actualizado')
        electionChannel.stopListening('.resultado.publicado')
        electionChannel.stopListening('.eleicao.estado.actualizado')
      }
    }
  }, [electionId, onResultUpdated, onStatusUpdated, onAnyUpdate])
}
