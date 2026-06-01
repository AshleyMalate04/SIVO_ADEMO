import { useEffect, useMemo, useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import { ArrowLeft, CheckCircle2, Send, ShieldCheck } from 'lucide-react'
import Loading from '../../components/common/Loading'
import { electionService } from '../../services/electionService'
import { resultService } from '../../services/resultService'
import { getApiErrorMessage } from '../../utils/apiError'
import { notify } from '../../utils/notify'
import { useElectionRealtime } from '../../hooks/useElectionRealtime'

export default function PhysicalResultsPage() {
  const { id } = useParams()
  const navigate = useNavigate()
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [election, setElection] = useState(null)
  const [candidates, setCandidates] = useState([])
  const [totals, setTotals] = useState({})
  const [approved, setApproved] = useState(false)

  const loadData = async () => {
    try {
      setLoading(true)
      const [electionRecord, candidateRecords, physical] = await Promise.all([
        electionService.show(id),
        electionService.candidates(id),
        electionService.physicalResults(id),
      ])
      setElection(electionRecord)
      setCandidates(candidateRecords)
      const existingTotals = {}
      ;(physical?.totals ?? []).forEach((item) => {
        existingTotals[item.candidate_id ?? 'blank'] = item.votes ?? 0
      })
      setTotals(existingTotals)
      setApproved((physical?.totals ?? []).length > 0 && (physical?.totals ?? []).every((item) => item.status === 'APPROVED'))
    } catch (error) {
      notify.error('Não foi possível carregar resultados presenciais.', error.response?.data?.message || 'Verifique a API.')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { loadData() }, [id])

  useElectionRealtime(id, {
    onResultUpdated: () => loadData(),
    onStatusUpdated: () => loadData(),
  })

  const totalVotes = useMemo(() => Object.values(totals).reduce((sum, value) => sum + Number(value || 0), 0), [totals])
  const isPublished = election?.status === 'RESULTADOS_PUBLICADOS'

  const setCandidateVotes = (candidateId, value) => {
    setApproved(false)
    setTotals((current) => ({ ...current, [candidateId]: Number(value) }))
  }

  const handleSave = async (event) => {
    event.preventDefault()
    const payload = [
      ...candidates.map((candidate) => ({ candidate_id: candidate.id, votes: Number(totals[candidate.id] || 0) })),
      { candidate_id: null, votes: Number(totals.blank || 0) },
    ]

    try {
      setSaving(true)
      await electionService.savePhysicalResults(id, payload)
      notify.success('Resultados presenciais guardados.', 'A comissão ou fiscalização ainda deve aprovar antes da publicação final.')
      await loadData()
    } catch (error) {
      notify.error('Resultados não guardados.', getApiErrorMessage(error, { totals: payload }))
    } finally {
      setSaving(false)
    }
  }

  const approveResults = async () => {
    try {
      setSaving(true)
      await electionService.approvePhysicalResults(id)
      setApproved(true)
      notify.success('Resultados presenciais aprovados.')
      await loadData()
    } catch (error) {
      notify.error('Não foi possível aprovar.', getApiErrorMessage(error))
    } finally {
      setSaving(false)
    }
  }

  const publishResults = async () => {
    try {
      setSaving(true)
      await resultService.publish(id)
      notify.success('Resultados publicados com sucesso.', 'A partir de agora só estará disponível a consulta.')
      navigate(`/resultados/${id}`)
    } catch (error) {
      notify.error('Resultados não publicados.', getApiErrorMessage(error))
    } finally {
      setSaving(false)
    }
  }

  if (loading) return <Loading label="A carregar resultados presenciais..." />

  return (
    <section className="management-page physical-results-page">
      <Link className="back-link" to="/eleicoes"><ArrowLeft size={16} /> Voltar</Link>
      <header className="management-header">
        <h1>Resultados presenciais</h1>
        <p>{election?.title ?? 'Eleição seleccionada'} — integre os votos presenciais antes de publicar o resultado final.</p>
      </header>

      <form className="management-form-card professional-form-card" onSubmit={handleSave}>
        <div className="result-stats-grid">
          <div className="result-stat-card highlight-stat"><span>Total presencial</span><strong>{totalVotes}</strong></div>
          <div className="result-stat-card"><span>Candidatos</span><strong>{candidates.length}</strong></div>
          <div className="result-stat-card"><span>Estado</span><strong>{isPublished ? 'Publicado' : approved ? 'Aprovado' : 'Por aprovar'}</strong></div>
        </div>

        <div className="form-help-banner">
          <ShieldCheck size={20} />
          <p>Registe apenas os totais apurados pela votação presencial. Todos os registos, alterações, aprovações e publicações ficam registados na auditoria.</p>
        </div>

        <div className="form-grid two-columns">
          {candidates.map((candidate) => (
            <label className="form-field" key={candidate.id}>
              <span>{candidate.member?.name ?? candidate.name ?? `Candidato ${candidate.id}`}</span>
              <input
                min="0"
                type="number"
                value={totals[candidate.id] ?? 0}
                disabled={isPublished}
                onChange={(event) => setCandidateVotes(candidate.id, event.target.value)}
              />
            </label>
          ))}
          <label className="form-field">
            <span>Votos em branco presenciais</span>
            <input min="0" type="number" value={totals.blank ?? 0} disabled={isPublished} onChange={(event) => setCandidateVotes('blank', event.target.value)} />
          </label>
        </div>

        <div className="form-footer">
          <Link className="secondary-button" to="/eleicoes">Cancelar</Link>
          {!isPublished ? <button className="primary-action-button" type="submit" disabled={saving}>{saving ? 'A guardar...' : 'Guardar presenciais'}</button> : null}
          {!isPublished ? <button className="secondary-button" type="button" disabled={saving || totalVotes < 0} onClick={approveResults}><CheckCircle2 size={18} /> Aprovar resultados</button> : null}
          {!isPublished ? <button className="primary-action-button" type="button" disabled={saving || !approved} onClick={publishResults}><Send size={18} /> Publicar resultados</button> : null}
          {isPublished ? <Link className="primary-action-button" to={`/resultados/${id}`}>Consultar resultado final</Link> : null}
        </div>
      </form>
    </section>
  )
}
