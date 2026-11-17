import { useEffect, useMemo, useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import { ArrowLeft, Search } from 'lucide-react'
import Loading from '../../components/common/Loading'
import ClearFiltersButton from '../../components/common/ClearFiltersButton'
import { delegationService } from '../../services/delegationService'
import { electionService } from '../../services/electionService'
import { userService } from '../../services/userService'
import { getAuthUser } from '../../lib/storage'
import { getApiErrorMessage } from '../../utils/apiError'
import { notify } from '../../utils/notify'
import { normalizeId, onlyActive, searchText as normalizeSearchText } from '../../utils/statusFilters'

const roleLabel = (role) => ({
  COMISSAO: 'Comissão',
  COMMISSION: 'Comissão',
  FISCAL: 'Fiscal',
}[role] ?? role)

function WizardSteps({ electionId }) {
  return (
    <div className="wizard-steps" aria-label="Etapas de criação da eleição">
      <Link className="wizard-step" to={electionId ? `/eleicoes/${electionId}/editar` : '/eleicoes/nova'}>
        <strong>1</strong>
        <span><small>ETAPA</small>Dados da eleição</span>
      </Link>
      <div className="wizard-step active">
        <strong>2</strong>
        <span><small>ETAPA</small>Equipa autorizada</span>
      </div>
    </div>
  )
}

const normalizeUser = (user) => ({
  id: Number(user.id),
  name: user.name ?? 'Sem nome',
  role: user.role,
  profile: roleLabel(user.role),
  delegationId: normalizeId(user.delegation_id ?? user.delegation?.id),
  delegation: user.delegation?.name ?? 'Sem delegação',
  email: user.email ?? 'Sem email',
})

export default function ElectionCreateTeamPage({ mode = 'wizard' }) {
  const { id } = useParams()
  const navigate = useNavigate()
  const isAddMode = mode === 'add'
  const authUser = getAuthUser()
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [allElections, setAllElections] = useState([])
  const [elections, setElections] = useState([])
  const [delegations, setDelegations] = useState([])
  const [selectedElectionId, setSelectedElectionId] = useState(id ?? '')
  const [users, setUsers] = useState([])
  const [selectedUsers, setSelectedUsers] = useState([])
  const [filters, setFilters] = useState({ q: '', profile: '', delegation: '' })

  useEffect(() => {
    Promise.all([electionService.list(), userService.list(), delegationService.list()])
      .then(([electionRecords, userRecords, delegationRecords]) => {
        const programmadas = electionRecords.filter((election) => election.status === 'PROGRAMADA')
        setAllElections(electionRecords)
        setElections(programmadas)
        setDelegations(onlyActive(delegationRecords))
        setUsers(userRecords
          .filter((user) => ['COMISSAO', 'COMMISSION', 'FISCAL'].includes(user.role) && user.status === 'ACTIVE')
          .map(normalizeUser))

        if (programmadas[0]?.id) {
          setSelectedElectionId((current) => current || String(programmadas[0].id))
        }
      })
      .catch((error) => notify.error('Não foi possível carregar a equipa.', error.response?.data?.message || 'Verifique a API.'))
      .finally(() => setLoading(false))
  }, [])

  useEffect(() => {
    if (!selectedElectionId) {
      setSelectedUsers(authUser?.id ? [Number(authUser.id)] : [])
      return
    }

    const election = allElections.find((item) => String(item.id) === String(selectedElectionId))
    const teamIds = (election?.team ?? [])
      .filter((member) => (member.status ?? 'AUTHORIZED') === 'AUTHORIZED')
      .map((member) => Number(member.user_id))
    const creatorId = authUser?.id ? [Number(authUser.id)] : []
    setSelectedUsers([...new Set([...teamIds, ...creatorId])])
  }, [allElections, authUser?.id, selectedElectionId])

  const filteredUsers = useMemo(() => {
    const term = normalizeSearchText(filters.q)

    return users.filter((user) => {
      const matchesTerm = !term || [user.name, user.email, user.delegation, user.profile]
        .some((value) => normalizeSearchText(value).includes(term))
      const matchesProfile = !filters.profile || user.role === filters.profile || (filters.profile === 'COMISSAO' && user.role === 'COMMISSION')
      const matchesDelegation = !filters.delegation || String(user.delegationId) === String(filters.delegation)
      return matchesTerm && matchesProfile && matchesDelegation
    })
  }, [filters, users])

  const toggleUser = (userId) => {
    const numericId = Number(userId)
    setSelectedUsers((current) => current.includes(numericId) ? current.filter((id) => id !== numericId) : [...current, numericId])
  }

  const handleSave = async () => {
    if (!selectedElectionId) {
      notify.error('Seleccione a eleição.', 'Escolha a eleição onde pretende definir a equipa.')
      return
    }

    const selectedElection = elections.find((election) => String(election.id) === String(selectedElectionId))
    if (!selectedElection) {
      notify.error('Eleição indisponível.', 'Só pode definir equipa em eleições no estado PROGRAMADA.')
      return
    }

    const payload = selectedUsers
      .map((userId) => users.find((user) => Number(user.id) === Number(userId)))
      .filter(Boolean)
      .map((user) => ({
        user_id: user.id,
        role_in_election: user.role === 'FISCAL' ? 'FISCAL' : 'COMISSAO',
      }))

    if (payload.length === 0) {
      notify.error('Seleccione pelo menos um membro.', 'A eleição precisa de comissão ou fiscal associado.')
      return
    }

    try {
      setSaving(true)
      await electionService.saveTeam(selectedElectionId, payload)
      notify.success('Equipa da eleição guardada.')
      navigate('/eleicoes')
    } catch (error) {
      notify.error('Equipa não guardada.', getApiErrorMessage(error, { users: payload }))
    } finally {
      setSaving(false)
    }
  }

  if (loading) return <Loading label="A carregar equipa da eleição..." />

  return (
    <section className="management-page election-create-page">
      <header className="management-header">
        <h1>{isAddMode ? 'Adicionar membros à equipa da eleição' : 'Etapa 2 - Equipa da eleição'}</h1>
        <p>{isAddMode ? 'Escolha a eleição e adicione membros à equipa já existente.' : 'Seleccione os membros da comissão e fiscais que irão acompanhar esta eleição.'}</p>
      </header>

      {!isAddMode ? <WizardSteps electionId={selectedElectionId} /> : null}

      <section className="selection-panel">
        <div>
          <strong>Seleccione a eleição pela qual deseja definir a equipa autorizada.</strong>
          <p>Esta escolha não é filtro; ela indica em que eleição os membros seleccionados serão guardados.</p>
        </div>
        <label className="form-field select-field">
          <span>Eleição</span>
          <select value={selectedElectionId} onChange={(event) => setSelectedElectionId(event.target.value)} disabled={!isAddMode && Boolean(id)}>
            <option value="">Seleccione a eleição</option>
            {elections.map((election) => <option key={election.id} value={election.id}>{`${election.title} (${election.status})`}</option>)}
          </select>
        </label>
      </section>

      <section className="filters-panel team-filters" aria-label="Filtros da equipa">
        <label className="filter-field filter-search">
          <Search size={22} />
          <input value={filters.q} onChange={(event) => setFilters((current) => ({ ...current, q: event.target.value }))} placeholder="Pesquisar membros..." />
        </label>
        <label className="filter-field">
          <select value={filters.profile} onChange={(event) => setFilters((current) => ({ ...current, profile: event.target.value }))}>
            <option value="">Todos os perfis</option>
            <option value="COMISSAO">Comissão</option>
            <option value="FISCAL">Fiscal</option>
          </select>
        </label>
        <label className="filter-field">
          <select value={filters.delegation} onChange={(event) => setFilters((current) => ({ ...current, delegation: event.target.value }))}>
            <option value="">Todas as delegações</option>
            {delegations.map((delegation) => <option key={delegation.id} value={delegation.id}>{delegation.name}</option>)}
          </select>
        </label>
        <ClearFiltersButton active={Object.values(filters).some(Boolean)} onClick={() => setFilters({ q: '', profile: '', delegation: '' })} />
      </section>

      <section className="table-card management-table-card team-table">
        <table>
          <thead>
            <tr>
              <th>Seleccionar</th>
              <th>Nome</th>
              <th>Perfil</th>
              <th>Delegação de origem</th>
              <th>Email</th>
            </tr>
          </thead>
          <tbody>
            {filteredUsers.length === 0 ? (
              <tr>
                <td colSpan="5" className="empty-table-message">Sem registos para apresentar.</td>
              </tr>
            ) : filteredUsers.map((user) => (
              <tr key={user.id}>
                <td><input className="team-checkbox" type="checkbox" checked={selectedUsers.includes(user.id)} onChange={() => toggleUser(user.id)} aria-label={`Seleccionar ${user.name}`} /></td>
                <td className="title-cell">{user.name}</td>
                <td>{user.profile}</td>
                <td>{user.delegation}</td>
                <td>{user.email}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </section>

      <div className="form-footer">
        <Link className="secondary-button" to={isAddMode ? '/eleicoes/equipa' : '/eleicoes/nova'}><ArrowLeft size={20} />Voltar</Link>
        <button className="primary-action-button" type="button" disabled={saving} onClick={handleSave}>{saving ? 'A guardar...' : 'Guardar equipa'}</button>
      </div>
    </section>
  )
}
