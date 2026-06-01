import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { Link, useNavigate, useSearchParams } from 'react-router-dom'
import { BarChart3, CheckCircle2, Download, Eye, Send, Trophy } from 'lucide-react'
import Loading from '../../components/common/Loading'
import { getElectionStatusClass, getElectionStatusLabel } from '../../data/elections'
import { resultService } from '../../services/resultService'
import { useAuth } from '../../hooks/useAuth'
import { exportCsv } from '../../utils/exportFile'
import { notify } from '../../utils/notify'
import { formatDateTime } from '../../utils/localDateTime'
import { useElectionRealtime } from '../../hooks/useElectionRealtime'

const normaliseElection = (election) => ({
  id: election.id,
  title: election.title ?? 'Eleição sem título',
  organ: election.organ?.name ?? 'Sem órgão',
  position: election.position?.name ?? 'Sem cargo',
  delegation: election.delegation?.name ?? 'Geral',
  status: election.status,
  startsAt: formatDateTime(election.starts_at),
  endsAt: formatDateTime(election.ends_at),
})

export default function ResultsPage() {
  const [searchParams, setSearchParams] = useSearchParams()
  const navigate = useNavigate()
  const { role } = useAuth()
  const isVoter = ['VOTER', 'ELEITOR'].includes(role)
  const canPublish = ['ADMIN', 'COMISSAO', 'COMMISSION'].includes(role)
  const [loading, setLoading] = useState(true)
  const [publishing, setPublishing] = useState(false)
  const [elections, setElections] = useState([])
  const [result, setResult] = useState(null)
  const [selectedId, setSelectedId] = useState(searchParams.get('eleição') || searchParams.get('eleicao') || '')
  const [publishChoiceOpen, setPublishChoiceOpen] = useState(false)
  const resultSectionRef = useRef(null)

  const loadElections = useCallback(async () => {
    const records = await resultService.list()
    const normalised = records.map(normaliseElection)
    setElections(normalised)
    const firstId = selectedId || normalised[0]?.id || ''
    if (firstId && !selectedId) {
      setSelectedId(String(firstId))
      setSearchParams({ eleicao: String(firstId) }, { replace: true })
    }
    return normalised
  }, [selectedId, setSearchParams])

  const loadResult = useCallback(async (id, { silent = false } = {}) => {
    if (!id) {
      setResult(null)
      return
    }

    try {
      const data = await resultService.show(id)
      setResult(data)
    } catch (error) {
      setResult(null)
      if (!silent) notify.error('Não foi possível carregar o resultado.', error.response?.data?.message || 'Verifique a API.')
    }
  }, [])

  const refreshAll = useCallback(async () => {
    try {
      await loadElections()
      if (selectedId) await loadResult(selectedId, { silent: true })
    } catch {
      // falhas silenciosas em actualizações em tempo real
    }
  }, [loadElections, loadResult, selectedId])

  useElectionRealtime(selectedId, {
    onResultUpdated: refreshAll,
    onStatusUpdated: refreshAll,
  })

  useEffect(() => {
    loadElections()
      .catch((error) => notify.error('Não foi possível carregar resultados.', error.response?.data?.message || 'Verifique a API.'))
      .finally(() => setLoading(false))
  }, [])

  useEffect(() => {
    loadResult(selectedId)
    if (!selectedId) return undefined
    const timer = window.setInterval(() => loadResult(selectedId, { silent: true }), 30000)
    return () => window.clearInterval(timer)
  }, [loadResult, selectedId])

  const rows = useMemo(() => (result?.candidates ?? []).map((item) => ({
    id: item.candidate?.id,
    name: item.candidate?.member?.name ?? `Candidato ${item.candidate?.id ?? ''}`,
    online: Number(item.online_votes ?? 0),
    physical: Number(item.physical_votes ?? 0),
    total: Number(item.votes ?? 0),
  })).sort((a, b) => b.total - a.total), [result])

  const selectedElection = elections.find((election) => String(election.id) === String(selectedId))
  const totalVotes = Number(result?.total_votes ?? 0)
  const winner = rows[0]
  const visibleElections = elections.slice(0, 5)
  const selectionRoute = isVoter ? '/portal-eleitor/resultados/eleicoes' : '/resultados/eleicoes'

  const handleExport = () => {
    if (!result?.election) return
    exportCsv(
      `resultados-${result.election.id}`,
      ['Eleição', 'Órgão', 'Cargo', 'Candidato', 'Online', 'Presencial', 'Total'],
      rows.map((row) => [result.election.title, result.election.organ?.name, result.election.position?.name, row.name, row.online, row.physical, row.total]),
    )
  }

  const goToPhysicalResults = () => {
    setPublishChoiceOpen(false)
    navigate(`/eleicoes/${selectedId}/resultados-presenciais`)
  }

  const publishWithoutPhysical = async () => {
    try {
      setPublishing(true)
      setPublishChoiceOpen(false)
      await resultService.publish(selectedId, { has_physical_results: false })
      notify.success('Resultados publicados com sucesso.')
      await refreshAll()
    } catch (error) {
      notify.error('Resultados não publicados.', error.response?.data?.message || 'Verifique a API.')
    } finally {
      setPublishing(false)
    }
  }

  if (loading) return <Loading label="A carregar resultados..." />

  return (
    <section className="management-page report-page results-professional-page">
      <div className="management-title-row">
        <header className="management-header">
          <h1>Resultados</h1>
          <p>Consulte as eleições autorizadas e acompanhe os resultados parciais ou finais em tempo real.</p>
        </header>
        {!isVoter ? (
          <button className="primary-action-button top-create-button" type="button" onClick={handleExport} disabled={!result}>
            <Download size={18} /> Exportar
          </button>
        ) : null}
      </div>

      <section className="election-picker-panel professional-picker">
        <div className="section-title-row">
          <h2>{isVoter ? 'Eleições autorizadas' : 'Eleições com resultados'}</h2>
          {elections.length > 3 ? <button className="text-action-link ghost-link-button" type="button" onClick={() => navigate(selectionRoute)}>Ver todas</button> : null}
        </div>
        {elections.length === 0 ? <p className="empty-table-message">Ainda não existem eleições disponíveis para apresentar.</p> : null}
        {visibleElections.map((election) => (
          <button
            className={String(election.id) === String(selectedId) ? 'election-option selected' : 'election-option'}
            key={election.id}
            type="button"
            onClick={() => {
              setSelectedId(String(election.id))
              setSearchParams({ eleicao: String(election.id) })
              window.setTimeout(() => resultSectionRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' }), 100)
            }}
          >
            <div>
              <h3>{election.title}</h3>
              <p>Órgão: {election.organ}</p>
              <p>Cargo: {election.position} · Delegação: {election.delegation}</p>
            </div>
            <span className={`status-pill ${getElectionStatusClass(election.status)}`}><span></span>{getElectionStatusLabel(election.status)}</span>
          </button>
        ))}
      </section>

      {result ? (
        <div ref={resultSectionRef} className="results-live-section">
          {!isVoter ? <section className="result-stats-grid">
            <article className="result-stat-card"><div><span>Total votos </span><strong>{result.total_votes}</strong></div><BarChart3 size={22} /></article>
            
            <article className="result-stat-card"><div><span>Votos online (válidos)</span><strong>{result.online_votes ?? 0}</strong></div><BarChart3 size={22} /></article>
            <article className="result-stat-card"><div><span>Votos presenciais</span><strong>{result.physical_votes ?? 0}</strong></div><BarChart3 size={22} /></article>
            <article className="result-stat-card"><div><span>Votos em branco</span><strong>{result.blank_votes ?? 0}</strong></div><BarChart3 size={22} /></article>
          </section> : null}

          {!isVoter && canPublish && selectedElection?.status === 'CONCLUIDA' ? (
            <section className="publish-results-panel">
              <div>
                <h2><b>Publicação de resultados</b></h2>
                <p>Antes de publicar, indique se houve votação presencial. Se sim, registe, guarde e aprove os totais presenciais.</p>
              </div>
              <button className="primary-action-button" type="button" disabled={publishing} onClick={() => setPublishChoiceOpen(true)}><Send size={18} /> Publicar resultados</button>
            </section>
          ) : null}

          {!isVoter && winner ? (
            <section className="winner-card">
              <Trophy size={28} />
              <div><span>Candidato mais votado</span><strong>{winner.name}</strong><p>{winner.total} voto(s) no total.</p></div>
              <Link className="secondary-button" to={`/resultados/${selectedId}`}><Eye size={18} /> Consultar detalhes</Link>
            </section>
          ) : null}

          <section className="partial-results-card professional-results-card">
            <header><h2><BarChart3 size={22} /> {isVoter ? 'Resultados parciais' : 'Resultado final'}: {result.election?.position?.name ?? 'Cargo'}</h2></header>
            <div className="results-bars">
              {rows.map((row) => {
                const percent = totalVotes > 0 ? Math.round((row.total / totalVotes) * 100) : 0
                return (
                  <article className="result-bar-row" key={row.id}>
                    <div>
                      <div className='baixo'>
                        <strong>{row.name}</strong>
                        {!isVoter ? <small>Online: {row.online} · Presencial: {row.physical}</small> : null}
                      </div>
                     
                      <b>{row.total} voto(s) · {percent}%</b>
                      {/* {!isVoter ? <small>Online: {row.online} · Presencial: {row.physical}</small> : null} */}
                    </div>
                    <span className="bar-track"><span className="bar-fill red" style={{ width: `${percent}%` }}></span></span>
                  </article>
                )
              })}
            </div>
          </section>
        </div>
      ) : null}

      {publishChoiceOpen ? (
        <div className="modal-overlay" role="dialog" aria-modal="true">
          <article className="action-dialog publish-choice-dialog">
            <header><h2>Houve votos presenciais?</h2><p>Escolha o fluxo correcto antes da publicação final.</p></header>
            <div className="form-help-banner"><CheckCircle2 size={20} /><p>Se houve votação presencial, primeiro deve registar os totais, guardar, aprovar e só depois publicar.</p></div>
            <div className="modal-actions">
              <button className="secondary-button" type="button" onClick={() => setPublishChoiceOpen(false)}>Cancelar</button>
              <button className="secondary-button" type="button" onClick={goToPhysicalResults}>Sim, inserir presenciais</button>
              <button className="primary-action-button" type="button" disabled={publishing} onClick={publishWithoutPhysical}>Não, publicar apenas online</button>
            </div>
          </article>
        </div>
      ) : null}
    </section>
  )
}
