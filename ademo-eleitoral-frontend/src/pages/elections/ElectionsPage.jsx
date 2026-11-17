import { useEffect, useMemo, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { Plus, Search } from 'lucide-react'
import Loading from '../../components/common/Loading'
import PaginationLayout from '../../components/common/PaginationLayout'
import ClearFiltersButton from '../../components/common/ClearFiltersButton'
import RowActions from '../../components/common/RowActions'
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
  const navigate = useNavigate()
  const { role } = useAuth()
  const canManageElections = canManageElectionRole(role)
  const [elections, setElections] = useState([])
  const [delegations, setDelegations] = useState([])
  const [loading, setLoading] = useState(true)
  const [filters, setFilters] = useState({ q: '', delegation: '', status: '' })

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
            placeholder="Pesquisar eleições..."
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
        <ClearFiltersButton active={Object.values(filters).some(Boolean)} onClick={() => setFilters({ q: '', delegation: '', status: '' })} />
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
                    <th>Estado</th>
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
                      <td><span className={`status-pill ${getElectionStatusClass(election.status)}`}>{getElectionStatusLabel(election.status)}</span></td>
                      <td>
                        <RowActions
                          canManage={canManageElections}
                          title={election.title}
                          details={[
                            ['Eleição', election.title], ['Órgão', election.organ], ['Cargo', election.position],
                            ['Delegação', election.delegation], ['Início', election.startsAt], ['Fim', election.endsAt],
                          ]}
                          onView={() => navigate(`/eleicoes/${election.id}`)}
                          editTo={election.status === 'PROGRAMADA' ? `/eleicoes/${election.id}/editar` : null}
                          disableStatus
                          hideDelete={election.status !== 'PROGRAMADA'}
                          onDelete={canManageElections && election.status === 'PROGRAMADA' ? async () => {
                            await electionService.remove(election.id)
                            notify.success('Eleição eliminada com sucesso.')
                            loadElections()
                          } : null}
                        />
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </PaginationLayout>
        )}
      </section>
    </section>
  )
}
