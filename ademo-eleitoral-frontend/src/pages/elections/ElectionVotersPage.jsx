import { useCallback, useEffect, useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { Search } from 'lucide-react'
import Loading from '../../components/common/Loading'
import PaginationLayout from '../../components/common/PaginationLayout'
import ClearFiltersButton from '../../components/common/ClearFiltersButton'
import RowActions from '../../components/common/RowActions'
import { delegationService } from '../../services/delegationService'
import { electionService } from '../../services/electionService'
import { voterService } from '../../services/voterService'
import { useAuth } from '../../hooks/useAuth'
import { notify } from '../../utils/notify'
import { canCreateResource, canManageResource, canMutateStatus } from '../../utils/rolePermissions'
import { commonStatusClass, normalizeId, normalizeStatus, onlyActive, searchText as normalizeSearchText } from '../../utils/statusFilters'
import { useElectionRealtime } from '../../hooks/useElectionRealtime'

const statusLabel = (status) => ({
  AUTHORIZED: 'Autorizado',
  REMOVED: 'Removido',
  SUSPENDED: 'Suspenso',
}[status] ?? status)

const normalizeVoter = (record) => ({
  id: record.id,
  memberId: record.member_id,
  electionId: record.election_id,
  name: record.member?.name ?? 'Sem nome',
  delegationId: normalizeId(record.member?.delegation_id ?? record.member?.delegation?.id ?? record.delegation_id ?? record.delegation?.id),
  delegation: record.member?.delegation?.name ?? record.delegation?.name ?? 'Sem delegação',
  code: record.member?.member_code ?? 'Sem código',
  election: record.election?.title ?? 'Sem eleição',
  contact: record.member?.phone ?? 'Sem contacto',
  email: record.member?.email ?? 'Sem email',
  voted: record.has_voted ? 'Sim' : 'Não',
  rawStatus: record.status,
  status: statusLabel(record.status),
})

export default function ElectionVotersPage() {
  const { role } = useAuth()
  const canCreate = canCreateResource(role, 'voters')
  const canManage = canManageResource(role, 'voters')
  const canInactivate = canMutateStatus(role, 'voters')
  const [elections, setElections] = useState([])
  const [delegations, setDelegations] = useState([])
  const [selectedElection, setSelectedElection] = useState('')
  const [voters, setVoters] = useState([])
  const [loading, setLoading] = useState(true)
  const [query, setQuery] = useState('')
  const [delegationFilter, setDelegationFilter] = useState('')
  const [statusFilter, setStatusFilter] = useState('')

  useEffect(() => {
    Promise.all([electionService.list(), delegationService.list()])
      .then(([records, delegationRecords]) => {
        setElections(records)
        setDelegations(onlyActive(delegationRecords))
        setSelectedElection(records[0]?.id ? String(records[0].id) : '')
      })
      .catch((error) => notify.error('Não foi possível carregar eleições.', error.response?.data?.message || 'Verifique a API.'))
  }, [])

  useEffect(() => {
    if (!selectedElection) {
      setLoading(false)
      setVoters([])
      return
    }

    setLoading(true)
    voterService.byElection(selectedElection)
      .then((records) => setVoters(records.map(normalizeVoter)))
      .catch((error) => notify.error('Não foi possível carregar eleitores.', error.response?.data?.message || 'Verifique a API.'))
      .finally(() => setLoading(false))
  }, [selectedElection])

  const refreshVoters = useCallback(() => {
    if (!selectedElection) return

    voterService.byElection(selectedElection)
      .then((records) => setVoters(records.map(normalizeVoter)))
      .catch(() => {
        // Actualizacoes em tempo real nao devem interromper a utilizacao da pagina.
      })
  }, [selectedElection])

  useElectionRealtime(selectedElection, {
    onResultUpdated: refreshVoters,
    onStatusUpdated: refreshVoters,
  })

  const filteredVoters = useMemo(() => {
    const term = query.trim().toLowerCase()

    return voters.filter((voter) => {
      const matchesTerm = !term || [voter.name, voter.delegation, voter.code, voter.election, voter.contact, voter.email]
        .some((value) => normalizeSearchText(value).includes(term))
      const matchesDelegation = !delegationFilter || String(voter.delegationId) === String(delegationFilter)
      const matchesStatus = !statusFilter || normalizeStatus(voter.rawStatus) === normalizeStatus(statusFilter)
      return matchesTerm && matchesDelegation && matchesStatus
    })
  }, [delegationFilter, query, statusFilter, voters])

  const removeVoter = async (voter) => {
    await voterService.removeFromElection(voter.electionId, voter.memberId)
    notify.success('Eleitor removido desta eleição.')
    setVoters((current) => current.filter((item) => item.id !== voter.id))
  }

  const suspendVoter = async (voter) => {
    await voterService.updateStatus(voter.electionId, voter.memberId, 'SUSPENDED')
    notify.success('Eleitor suspendido com sucesso.')
    setVoters((current) => current.map((item) => item.id === voter.id ? { ...item, rawStatus: 'SUSPENDED', status: 'Suspenso' } : item))
  }

  const activateVoter = async (voter) => {
    await voterService.updateStatus(voter.electionId, voter.memberId, 'AUTHORIZED')
    notify.success('Eleitor activado com sucesso.')
    setVoters((current) => current.map((item) => item.id === voter.id ? { ...item, rawStatus: 'AUTHORIZED', status: 'Autorizado' } : item))
  }

  return (
    <section className="management-page">
      <header className="management-header">
        <h1>Gestão de eleitores</h1>
        <p>Consulte os membros seleccionados como eleitores autorizados para cada eleição.</p>
      </header>

      {canCreate ? (
        <div className="mode-tabs" aria-label="Modo de gestão">
          <Link className="mode-tab active" to="/eleitores">Visualizar</Link>
          <Link className="mode-tab" to="/eleitores/novo">Registar</Link>
        </div>
      ) : null}

      <section className="filters-panel two-filter-panel" aria-label="Filtros de eleitores">
        <label className="filter-field filter-search">
          <Search size={22} />
          <input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Pesquisar eleitores..." />
        </label>
        <label className="filter-field">
          <select value={delegationFilter} onChange={(event) => setDelegationFilter(event.target.value)}>
            <option value="">Todas as delegações</option>
            {delegations.map((delegation) => <option key={delegation.id} value={delegation.id}>{delegation.name}</option>)}
          </select>
        </label>
        <label className="filter-field">
          <select value={statusFilter} onChange={(event) => setStatusFilter(event.target.value)}>
            <option value="">Todos os estados</option>
            <option value="AUTHORIZED">Autorizado</option>
            <option value="SUSPENDED">Suspenso</option>
            <option value="REMOVED">Removido</option>
          </select>
        </label>
        <ClearFiltersButton
          active={Boolean(query || delegationFilter || statusFilter)}
          onClick={() => { setQuery(''); setDelegationFilter(''); setStatusFilter('') }}
        />
      </section>

      <section className="selection-panel">
        <div>
          <strong>Seleccione a eleição pela qual deseja visualizar os eleitores.</strong>
          <p>Esta escolha define a lista apresentada abaixo; a pesquisa e a delegação continuam como filtros.</p>
        </div>
        <label className="form-field select-field">
          <span>Eleição</span>
          <select value={selectedElection} onChange={(event) => setSelectedElection(event.target.value)}>
            <option value="">Seleccione a eleição</option>
            {elections.map((election) => <option key={election.id} value={election.id}>{`${election.title} (${election.status})`}</option>)}
          </select>
        </label>
      </section>

      <section className="table-card management-table-card">
        {loading ? (
          <Loading label="A carregar eleitores..." />
        ) : (
          <PaginationLayout items={filteredVoters} summaryLabel="eleitores">
            {(pageItems) => (
              <table>
                <thead>
                  <tr>
                    <th>Nome</th>
                    <th>Delegação de origem</th>
                    <th>Código</th>
                    <th>Eleição</th>
                    <th>Contacto</th>
                    <th>Já votou</th>
                    <th>Estado</th>
                    <th>Acções</th>
                  </tr>
                </thead>
                <tbody>
                  {pageItems.length === 0 ? (
                    <tr>
                      <td colSpan="8" className="empty-table-message">Sem eleitores para apresentar.</td>
                    </tr>
                  ) : pageItems.map((voter) => (
                    <tr key={voter.id}>
                      <td className="title-cell">{voter.name}</td>
                      <td>{voter.delegation}</td>
                      <td>{voter.code}</td>
                      <td>{voter.election}</td>
                      <td>{voter.contact}</td>
                      <td>{voter.voted}</td>
                      <td><span className={`status-pill ${commonStatusClass(voter.rawStatus)}`}>{voter.status}</span></td>
                      <td>
                        <RowActions
                          canManage={canManage}
                          title={voter.name}
                          isInactive={voter.rawStatus === 'SUSPENDED'}
                          details={[
                            ['Nome', voter.name],
                            ['Delegação de origem', voter.delegation],
                            ['Código', voter.code],
                            ['Eleição', voter.election],
                            ['Contacto', voter.contact],
                            ['Email', voter.email],
                            ['Já votou', voter.voted],
                            ['Estado', voter.status],
                          ]}
                          onInactivate={canInactivate ? () => suspendVoter(voter) : null}
                          onActivate={canInactivate ? () => activateVoter(voter) : null}
                          onDelete={canManage ? () => removeVoter(voter) : null}
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
