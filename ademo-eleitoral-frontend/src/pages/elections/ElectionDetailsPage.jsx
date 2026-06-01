import { useEffect, useState } from 'react'
import { Link, useLocation, useNavigate, useParams } from 'react-router-dom'
import { ArrowLeft, BarChart3, CalendarClock, CheckCircle2, Pencil, ShieldCheck, Trophy, UserCog, Vote } from 'lucide-react'
import Loading from '../../components/common/Loading'
import { electionService } from '../../services/electionService'
import { resultService } from '../../services/resultService'
import { getElectionStatusClass, getElectionStatusLabel } from '../../data/elections'
import { useAuth } from '../../hooks/useAuth'
import { notify } from '../../utils/notify'
import { formatDateTime } from '../../utils/localDateTime'
import { getApiErrorMessage } from '../../utils/apiError'
import { useElectionRealtime } from '../../hooks/useElectionRealtime'

const roleLabel = (role) => ({ COMISSAO: 'Comissão', COMMISSION: 'Comissão', FISCAL: 'Fiscal' }[role] ?? role)

export default function ElectionDetailsPage() {
  const { id } = useParams()
  const navigate = useNavigate()
  const location = useLocation()
  const { role } = useAuth()
  const [election, setElection] = useState(null)
  const [result, setResult] = useState(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [publishChoiceOpen, setPublishChoiceOpen] = useState(false)
  const canEdit = role === 'COMMISSION' || role === 'COMISSAO'
  const canVote = role === 'VOTER' || role === 'ELEITOR'
  const isVoterView = location.pathname.startsWith('/portal-eleitor')
  const backTo = isVoterView ? '/portal-eleitor/votacoes' : '/eleicoes'

  const loadElection = async () => {
    try {
      setLoading(true)
      const record = await electionService.show(id)
      setElection(record)
      try { setResult(await resultService.show(id)) } catch { setResult(null) }
    } catch (error) {
      notify.error('Não foi possível carregar a eleição.', error.response?.data?.message || 'Verifique a API.')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { loadElection() }, [id])

  useElectionRealtime(id, {
    onResultUpdated: () => loadElection(),
    onStatusUpdated: () => loadElection(),
  })

  const updateStatus = async (status) => {
    try {
      setSaving(true)
      await electionService.updateStatus(id, status)
      notify.success('Estado da eleição actualizado com sucesso.')
      await loadElection()
    } catch (error) {
      notify.error('Estado não actualizado.', getApiErrorMessage(error, { status }))
    } finally {
      setSaving(false)
    }
  }

  const publishResults = async () => {
    try {
      setSaving(true)
      await resultService.publish(id, { has_physical_results: false })
      notify.success('Resultados publicados com sucesso.')
      await loadElection()
    } catch (error) {
      notify.error('Resultados não publicados.', getApiErrorMessage(error))
    } finally {
      setSaving(false)
    }
  }

  if (loading) return <Loading label="A carregar detalhes da eleição..." />
  if (!election) return <section className="management-page"><p className="empty-table-message">Eleição não encontrada.</p></section>

  const team = election.team ?? []
  const canEditElection = canEdit && election.status === 'PROGRAMADA'
  const canVoteNow = canVote && Boolean(election.can_vote ?? (election.status === 'EM_VOTACAO' && !election.has_voted))
  const rows = result?.candidates ?? []
  const winner = rows.map((item) => ({
    name: item.candidate?.member?.name ?? `Candidato ${item.candidate?.id ?? ''}`,
    total: Number(item.votes ?? 0),
  })).sort((a, b) => b.total - a.total)[0]

  return (
    <section className="management-page election-detail-page professional-detail-page readable-detail-page">
      <Link className="back-link" to={backTo}><ArrowLeft size={16} /> Voltar</Link>
      <div className="detail-layout">
        <div className="detail-main">
          <header className="management-header election-detail-heading">
            <span>Detalhes da eleição #{id}</span>
            <h1>{election.title}</h1>
          </header>
          <section className="election-detail-card hero-detail-card">
            <div className="detail-title-row">
              <h2>{election.title}</h2>
              <span className={`status-pill ${getElectionStatusClass(election.status)}`}><span></span>{getElectionStatusLabel(election.status)}</span>
            </div>
            <div className="detail-info-grid">
              <p><span>Órgão</span>{election.organ?.name ?? 'Sem órgão'}</p>
              <p><span>Cargo</span>{election.position?.name ?? 'Sem cargo'}</p>
              <p><span>Período da votação</span>{formatDateTime(election.starts_at)} até {formatDateTime(election.ends_at)}</p>
              <p><span>Delegação responsável</span>{election.delegation?.name ?? 'Geral'}</p>
            </div>
            <p className="detail-description">{election.description ?? 'Sem descrição registada.'}</p>
          </section>

          <section className="election-detail-card">
            <h2>Informações da votação</h2>
            <div className="detail-info-grid voting-info-grid">
              <p><CalendarClock size={17} /><span>Início da votação</span>{formatDateTime(election.starts_at)}</p>
              <p><CalendarClock size={17} /><span>Fim da votação</span>{formatDateTime(election.ends_at)}</p>
              <p><Vote size={17} /><span>Regra de votação</span>Maioria simples</p>
              <p><ShieldCheck size={17} /><span>Voto em branco</span>{election.allow_blank_vote ? 'Permitido' : 'Não permitido'}</p>
            </div>
          </section>

          {result ? (
            <section className="election-detail-card">
              <div className="detail-title-row"><h2>Resumo dos resultados</h2>{winner ? <span className="winner-mini"><Trophy size={16} /> {winner.name}</span> : null}</div>
              <div className="detail-info-grid">
                <p><BarChart3 size={17} /><span>Total de votos</span>{result.total_votes ?? 0}</p>
                <p><BarChart3 size={17} /><span>Votos online (válidos)</span>{result.online_votes ?? 0}</p>
                <p><BarChart3 size={17} /><span>Votos presenciais</span>{result.physical_votes ?? 0}</p>
                <p><BarChart3 size={17} /><span>Votos em branco</span>{result.blank_votes ?? 0}</p>
              </div>
              <Link className="secondary-button" to={isVoterView ? `/portal-eleitor/resultados?eleicao=${id}` : `/resultados/${id}`}>Consultar apuramento completo</Link>
            </section>
          ) : null}

          {!isVoterView ? <section className="election-detail-card">
            <div className="detail-title-row">
              <h2>Equipa da eleição</h2>
              {canEditElection && !isVoterView ? <Link className="secondary-button" to={`/eleicoes/${id}/equipa`}>Gerir equipa</Link> : null}
            </div>
            <div className="candidate-summary-grid">
              {team.length === 0 ? <p className="empty-table-message">Sem membros associados a esta eleição.</p> : team.map((member) => (
                <article className="candidate-summary-card" key={`${member.election_id}-${member.user_id}`}>
                  <div className="candidate-mini-avatar"><UserCog size={22} /></div>
                  <h3>{member.user?.name ?? 'Sem nome'}</h3>
                  <small>{roleLabel(member.role_in_election)}</small>
                  <p><strong>Email</strong>{member.user?.email ?? 'Sem email'}</p>
                  <p><strong>Delegação</strong>{member.user?.delegation?.name ?? 'Sem delegação'}</p>
                </article>
              ))}
            </div>
          </section> : null}
        </div>
        <aside className="election-side-card professional-side-card">
          <h2>Estado da eleição</h2>
          <p><span>Situação</span><strong>{getElectionStatusLabel(election.status)}</strong></p>
          {canVote ? <p><span>Eleitor autorizado</span><CheckCircle2 size={16} /> {election.has_voted ? 'Você já votou nesta eleição.' : canVoteNow ? 'Já pode votar.' : 'Votação indisponível neste estado.'}</p> : null}
          {canVoteNow ? <Link className="primary-action-button" to={`/portal-eleitor/votacoes/${id}`}>Ir para o boletim</Link> : null}
          {canEditElection ? <Link className="secondary-button" to={`/eleicoes/${id}/editar`}><Pencil size={16} /> Editar dados</Link> : null}
          {canEdit && !isVoterView && election.status === 'PROGRAMADA' ? <button className="secondary-button" type="button" disabled={saving} onClick={() => updateStatus('EM_VOTACAO')}>Abrir votação</button> : null}
          {canEdit && !isVoterView && election.status === 'EM_VOTACAO' ? <button className="secondary-button" type="button" disabled={saving} onClick={() => updateStatus('CONCLUIDA')}>Concluir eleição</button> : null}
          {canEdit && !isVoterView && election.status === 'CONCLUIDA' ? <Link className="secondary-button" to={`/eleicoes/${id}/resultados-presenciais`}>Inserir presenciais</Link> : null}
          {canEdit && !isVoterView && election.status === 'CONCLUIDA' ? <button className="primary-action-button" type="button" disabled={saving} onClick={() => setPublishChoiceOpen(true)}>Publicar resultados</button> : null}
          {['PROGRAMADA', 'EM_VOTACAO', 'CONCLUIDA', 'RESULTADOS_PUBLICADOS'].includes(election.status) ? <Link className="primary-action-button" to={isVoterView ? `/portal-eleitor/resultados?eleicao=${id}` : `/resultados/${id}`}>Consultar resultados</Link> : null}
        </aside>
      </div>
      {publishChoiceOpen ? (
        <div className="modal-overlay" role="dialog" aria-modal="true">
          <article className="action-dialog publish-choice-dialog">
            <header><h2>Houve votos presenciais?</h2><p>Escolha o fluxo correcto antes da publicação final.</p></header>
            <div className="form-help-banner"><ShieldCheck size={20} /><p>Se houve votação presencial, primeiro deve registar os totais, guardar, aprovar e só depois publicar.</p></div>
            <div className="modal-actions">
              <button className="secondary-button" type="button" onClick={() => setPublishChoiceOpen(false)}>Cancelar</button>
              <button className="secondary-button" type="button" onClick={() => navigate(`/eleicoes/${id}/resultados-presenciais`)}>Sim, inserir presenciais</button>
              <button className="primary-action-button" type="button" disabled={saving} onClick={publishResults}>Não, publicar apenas online</button>
            </div>
          </article>
        </div>
      ) : null}
    </section>
  )
}
