import { useEffect, useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { ArrowDown, Eye, Pencil, Plus, Search, Trash2 } from 'lucide-react'
import Loading from '../../components/common/Loading'
import PaginationLayout from '../../components/common/PaginationLayout'
import { delegationService } from '../../services/delegationService'
import { electionService } from '../../services/electionService'
import { getElectionStatusClass, getElectionStatusLabel } from '../../data/elections'
import { useAuth } from '../../hooks/useAuth'
import { notify } from '../../utils/notify'
import { formatDateTime } from '../../utils/localDateTime'
import { normalizeId, normalizeStatus, onlyActive, searchText as normalizeSearchText } from '../../utils/statusFilters'
import { useElectionRealtime } from '../../hooks/useElectionRealtime'

const canManageElectionRole = (role) => ['COMISSAO', 'COMMISSION'].includes(role)

const normalizeElection = (election) => ({
  id: election.id,
  title: election.title,
  organ: election.organ?.name ?? 'Sem órgão',
  position: election.position?.name ?? 'Sem cargo',
  delegation: election.delegation?.name ?? 'Geral',
  delegationId: normalizeId(election.delegation_id ?? election.delegation?.id),
  status: election.status,
  startsAt: formatDateTime(election.starts_at),
  endsAt: formatDateTime(election.ends_at),
  creator: election.creator?.name ?? 'Sistema',
})

export default function ElectionsPage() {
  const { role } = useAuth()
  const canManageElections = canManageElectionRole(role)
  const [elections, setElections] = useState([])
  const [delegations, setDelegations] = useState([])
  const [loading, setLoading] = useState(true)
  const [filters, setFilters] = useState({ q: '', delegation: '', status: '' })
  const [deleteTarget, setDeleteTarget] = useState(null)

  const loadElections = () => {
    setLoading(true)
    Promise.all([electionService.list(), delegationService.list()])
      .then(([electionRecords, delegationRecords]) => {
        setElections(electionRecords.map(normalizeElection))
        setDelegations(onlyActive(delegationRecords))
      })
      .catch((error) => notify.error('Não foi possível carregar eleições.', error.response?.data?.message || 'Verifique a API.'))
      .finally(() => setLoading(false))
  }

  useEffect(() => {
    loadElections()
  }, [])

  useElectionRealtime(null, {
    onResultUpdated: () => loadElections(),
    onStatusUpdated: () => loadElections(),
  })

  const requestDeleteElection = (election) => {
    if (election.status !== 'PROGRAMADA') {
      notify.error('Eleicao nao eliminada.', 'So pode eliminar eleicoes no estado programada.')
      return
    }

    setDeleteTarget(election)
  }

  const confirmDeleteElection = async () => {
    if (!deleteTarget) return
    try {
      await electionService.remove(deleteTarget.id)
      notify.success('Eleicao eliminada com sucesso.')
      setDeleteTarget(null)
      loadElections()
    } catch (error) {
      notify.error('Nao foi possivel eliminar a eleicao.', error.response?.data?.message || 'Verifique a API.')
    }
  }

  const filteredElections = useMemo(() => {
    const term = normalizeSearchText(filters.q)

    return elections.filter((election) => {
      const matchesTerm = !term || [election.title, election.organ, election.position, election.delegation, election.creator]
        .some((value) => normalizeSearchText(value).includes(term))
      const matchesDelegation = !filters.delegation || 
        (filters.delegation === 'GERAL' ? election.delegationId === '' : String(election.delegationId) === String(filters.delegation))
      const matchesStatus = !filters.status || normalizeStatus(election.status) === normalizeStatus(filters.status)

      return matchesTerm && matchesDelegation && matchesStatus
    })
  }, [elections, filters])

  return (
    <section className="management-page">
      <div className="management-title-row">
        <header className="management-header">
          <h1>Eleições</h1>
          <p>Acompanhe as eleições criadas, filtre por delegação e consulte o estado de cada votação.</p>
        </header>
        {canManageElections ? (
          <Link className="primary-action-button top-create-button" to="/eleicoes/nova">
            <Plus size={20} />
            Nova eleição
          </Link>
        ) : null}
      </div>

      <section className="filters-panel" aria-label="Filtros de eleições">
        <label className="filter-field filter-search">
          <Search size={22} />
          <input
            value={filters.q}
            onChange={(event) => setFilters((current) => ({ ...current, q: event.target.value }))}
            placeholder="Pesquisar por título, órgão, cargo"
          />
        </label>
        <label className="filter-field">
          <select value={filters.delegation} onChange={(event) => setFilters((current) => ({ ...current, delegation: event.target.value }))}>
            <option value="">Todas as delegações</option>
            <option value="GERAL">Geral (Sem delegação)</option>
            {delegations.map((delegation) => <option key={delegation.id} value={delegation.id}>{delegation.name}</option>)}
          </select>
        </label>
        <label className="filter-field">
          <select value={filters.status} onChange={(event) => setFilters((current) => ({ ...current, status: event.target.value }))}>
            <option value="">Todos os estados</option>
            <option value="PROGRAMADA">Programada</option>
            <option value="EM_VOTACAO">Em votação</option>
            <option value="CONCLUIDA">Concluída</option>
            <option value="RESULTADOS_PUBLICADOS">Resultados publicados</option>
          </select>
        </label>
      </section>

      <section className="table-card management-table-card elections-table">
        {loading ? (
          <Loading label="A carregar eleições..." />
        ) : (
          <PaginationLayout items={filteredElections} summaryLabel="eleições">
            {(pageItems) => (
              <table>
                <thead>
                  <tr>
                    <th>Título</th>
                    <th>Órgão</th>
                    <th>Cargo</th>
                    <th>Delegação</th>
                    <th>Início</th>
                    <th>Fim</th>
                    <th>Registado por</th>
                    <th><span className="state-heading">Estado <ArrowDown size={18} /></span></th>
                    <th>Acções</th>
                  </tr>
                </thead>
                <tbody>
                  {pageItems.length === 0 ? (
                    <tr>
                      <td colSpan="9" className="empty-table-message">Sem eleições para apresentar.</td>
                    </tr>
                  ) : pageItems.map((election) => (
                    <tr key={election.id}>
                      <td className="title-cell">{election.title}</td>
                      <td>{election.organ}</td>
                      <td>{election.position}</td>
                      <td>{election.delegation}</td>
                      <td>{election.startsAt}</td>
                      <td>{election.endsAt}</td>
                      <td>{election.creator}</td>
                      <td><span className={`status-pill ${getElectionStatusClass(election.status)}`}><span></span>{getElectionStatusLabel(election.status)}</span></td>
                      <td>
                        <div className="actions-cell">
                          <Link className="table-action" to={`/eleicoes/${election.id}`} aria-label="Consultar"><Eye size={22} /></Link>
                          {canManageElections && election.status === 'PROGRAMADA' ? (
                            <Link className="table-action" to={`/eleicoes/${election.id}/editar`} aria-label="Editar"><Pencil size={21} /></Link>
                          ) : (
                            <button className="table-action" type="button" aria-label="Editar indisponível" disabled><Pencil size={21} /></button>
                          )}
                          {canManageElections && election.status === 'PROGRAMADA' ? (
                            <button className="table-action" type="button" aria-label="Eliminar eleicao" onClick={() => requestDeleteElection(election)}><Trash2 size={21} /></button>
                          ) : (
                            <button className="table-action" type="button" aria-label="Eliminar eleicao indisponivel" disabled><Trash2 size={21} /></button>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </PaginationLayout>
        )}
      </section>
      {deleteTarget ? (
        <div className="modal-overlay" role="dialog" aria-modal="true" onClick={() => setDeleteTarget(null)}>
          <article className="action-dialog professional-modal-card" onClick={(event) => event.stopPropagation()}>
            <header className="action-dialog-header">
              <div>
                <span className="modal-kicker">Confirmação</span>
                <h2>Eliminar eleição</h2>
                <p>{deleteTarget.title}</p>
              </div>
            </header>
            <div className="danger-note">
              <strong>Tem certeza que deseja eliminar esta eleição?</strong>
              <p>Esta acção só é permitida para eleições programadas e deve ser confirmada apenas quando for realmente necessária.</p>
            </div>
            <div className="modal-actions">
              <button className="secondary-button" type="button" onClick={() => setDeleteTarget(null)}>Cancelar</button>
              <button className="danger-action-button" type="button" onClick={confirmDeleteElection}>Eliminar</button>
            </div>
          </article>
        </div>
      ) : null}
    </section>
  )
}
