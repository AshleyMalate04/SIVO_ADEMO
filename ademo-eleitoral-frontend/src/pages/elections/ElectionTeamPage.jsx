import { useEffect, useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { Plus, Search } from 'lucide-react'
import Loading from '../../components/common/Loading'
import PaginationLayout from '../../components/common/PaginationLayout'
import RowActions from '../../components/common/RowActions'
import { delegationService } from '../../services/delegationService'
import { electionService } from '../../services/electionService'
import { useAuth } from '../../hooks/useAuth'
import { notify } from '../../utils/notify'
import { commonStatusClass, normalizeId, onlyActive, searchText as normalizeSearchText } from '../../utils/statusFilters'

const roleLabel = (role) => ({
  COMISSAO: 'Comissão',
  COMMISSION: 'Comissão',
  FISCAL: 'Fiscal',
}[role] ?? role)

const normalizeTeam = (election) => (election.team ?? []).map((member) => ({
  id: `${election.id}-${member.user_id}`,
  electionId: election.id,
  userId: member.user_id,
  election: `${election.title} (${election.status})`,
  name: member.user?.name ?? 'Sem nome',
  profile: roleLabel(member.role_in_election ?? member.user?.role),
  delegationId: normalizeId(member.user?.delegation_id ?? member.user?.delegation?.id),
  delegation: member.user?.delegation?.name ?? 'Sem delegação',
  email: member.user?.email ?? 'Sem email',
  createdAt: member.created_at ? new Date(member.created_at).toLocaleDateString('pt-MZ') : 'Sem data',
  rawStatus: member.status ?? 'AUTHORIZED',
  status: member.status === 'SUSPENDED' ? 'Suspendido' : (member.status === 'REMOVED' ? 'Removido' : 'Autorizado'),
}))

export default function ElectionTeamPage() {
  const { role } = useAuth()
  const canManage = role === 'COMMISSION' || role === 'COMISSAO'
  const [records, setRecords] = useState([])
  const [delegations, setDelegations] = useState([])
  const [loading, setLoading] = useState(true)
  const [filters, setFilters] = useState({ q: '', election: '', profile: '', delegation: '' })

  const loadTeam = () => {
    setLoading(true)
    Promise.all([electionService.list(), delegationService.list()])
      .then(([elections, delegationRecords]) => {
        setRecords(elections.flatMap(normalizeTeam))
        setDelegations(onlyActive(delegationRecords))
      })
      .catch((error) => notify.error('Não foi possível carregar a equipa da eleição.', error.response?.data?.message || 'Verifique a API.'))
      .finally(() => setLoading(false))
  }

  useEffect(() => {
    loadTeam()
  }, [])

  const electionOptions = useMemo(() => [...new Map(records.map((record) => [record.electionId, record.election])).entries()], [records])

  const filteredRecords = useMemo(() => {
    const term = normalizeSearchText(filters.q)

    return records.filter((record) => {
      const matchesTerm = !term || [record.name, record.profile, record.election, record.delegation, record.email]
        .some((value) => normalizeSearchText(value).includes(term))
      const matchesElection = !filters.election || String(record.electionId) === String(filters.election)
      const matchesProfile = !filters.profile || record.profile === filters.profile
      const matchesDelegation = !filters.delegation || String(record.delegationId) === String(filters.delegation)

      return matchesTerm && matchesElection && matchesProfile && matchesDelegation
    })
  }, [filters, records])

  const updateStatus = async (member, status) => {
    await electionService.updateTeamStatus(member.electionId, member.userId, status)
    notify.success(status === 'AUTHORIZED' ? 'Membro autorizado novamente.' : 'Membro removido da equipa.')
    loadTeam()
  }

  return (
    <section className="management-page">
      <div className="management-title-row">
        <header className="management-header">
          <h1>Equipa da eleição</h1>
          <p>Visualize os membros autorizados a acompanhar cada eleição.</p>
        </header>
        {canManage ? (
          <Link className="primary-action-button top-create-button" to="/eleicoes/equipa/adicionar">
            <Plus size={18} />
            Registar equipa
          </Link>
        ) : null}
      </div>

      <section className="filters-panel team-filters" aria-label="Filtros da equipa">
        <label className="filter-field filter-search">
          <Search size={18} />
          <input
            value={filters.q}
            onChange={(event) => setFilters((current) => ({ ...current, q: event.target.value }))}
            placeholder="Pesquisar por nome, perfil ou eleição"
          />
        </label>
        <label className="filter-field">
          <select value={filters.election} onChange={(event) => setFilters((current) => ({ ...current, election: event.target.value }))}>
            <option value="">Todas as eleições</option>
            {electionOptions.map(([id, title]) => <option key={id} value={id}>{title}</option>)}
          </select>
        </label>
        <label className="filter-field">
          <select value={filters.profile} onChange={(event) => setFilters((current) => ({ ...current, profile: event.target.value }))}>
            <option value="">Todos os perfis</option>
            <option>Comissão</option>
            <option>Fiscal</option>
          </select>
        </label>
        <label className="filter-field">
          <select value={filters.delegation} onChange={(event) => setFilters((current) => ({ ...current, delegation: event.target.value }))}>
            <option value="">Todas as delegações</option>
            {delegations.map((delegation) => <option key={delegation.id} value={delegation.id}>{delegation.name}</option>)}
          </select>
        </label>
      </section>

      <section className="table-card management-table-card">
        {loading ? (
          <Loading label="A carregar equipa da eleição..." />
        ) : (
          <PaginationLayout items={filteredRecords} summaryLabel="membros da equipa">
            {(visibleMembers) => (
              <table>
                <thead>
                  <tr>
                    <th>Nome</th>
                    <th>Perfil</th>
                    <th>Eleição</th>
                    <th>Delegação de Origem</th>
                    <th>Email</th>
                    <th>Membro desde</th>
                    <th>Estado</th>
                    <th>Acções</th>
                  </tr>
                </thead>
                <tbody>
                  {visibleMembers.length === 0 ? (
                    <tr>
                      <td colSpan="8" className="empty-table-message">Sem registos para apresentar.</td>
                    </tr>
                  ) : visibleMembers.map((member) => (
                    <tr key={member.id}>
                      <td className="title-cell">{member.name}</td>
                      <td>{member.profile}</td>
                      <td>{member.election}</td>
                      <td>{member.delegation}</td>
                      <td>{member.email}</td>
                      <td>{member.createdAt}</td>
                      <td><span className={`status-pill ${commonStatusClass(member.rawStatus ?? member.status)}`}><span></span>{member.status}</span></td>
                      <td>
                        <RowActions
                          canManage={canManage}
                          hideDelete
                          isInactive={member.rawStatus === 'SUSPENDED'}
                          title={member.name}
                          details={[
                            ['Nome', member.name],
                            ['Perfil', member.profile],
                            ['Eleição', member.election],
                            ['Delegação de Origem', member.delegation],
                            ['Email', member.email],
                            ['Membro desde', member.createdAt],
                            ['Estado', member.status],
                          ]}
                          onInactivate={canManage ? () => updateStatus(member, 'SUSPENDED') : null}
                          onActivate={canManage ? () => updateStatus(member, 'AUTHORIZED') : null}
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
