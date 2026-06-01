import { useEffect, useMemo, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { ArrowDown, Search } from 'lucide-react'
import Loading from '../../components/common/Loading'
import PaginationLayout from '../../components/common/PaginationLayout'
import { delegationService } from '../../services/delegationService'
import { electionService } from '../../services/electionService'
import { memberService } from '../../services/memberService'
import { voterService } from '../../services/voterService'
import { getApiErrorMessage } from '../../utils/apiError'
import { notify } from '../../utils/notify'
import { normalizeId, onlyActive, searchText as normalizeSearchText } from '../../utils/statusFilters'

const normalizeMember = (member) => ({
  id: Number(member.id),
  name: member.name ?? 'Sem nome',
  code: member.member_code ?? 'Sem código',
  delegationId: normalizeId(member.delegation_id ?? member.delegation?.id),
  delegation: member.delegation?.name ?? 'Sem delegação',
  contact: member.phone ?? 'Sem contacto',
  email: member.email ?? 'Sem email',
  status: member.status === 'ACTIVE' ? 'Activo' : 'Inactivo',
})

export default function ElectionVoterFormPage() {
  const navigate = useNavigate()
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [elections, setElections] = useState([])
  const [members, setMembers] = useState([])
  const [delegations, setDelegations] = useState([])
  const [selectedElection, setSelectedElection] = useState('')
  const [selectedMembers, setSelectedMembers] = useState([])
  const [filters, setFilters] = useState({ q: '', delegation: '' })

  useEffect(() => {
    Promise.all([electionService.list(), memberService.list(), delegationService.list()])
      .then(([electionRecords, memberRecords, delegationRecords]) => {
        const programmadas = electionRecords.filter((election) => election.status === 'PROGRAMADA')
        setElections(programmadas)
        setSelectedElection(programmadas[0]?.id ? String(programmadas[0].id) : '')
        setMembers(onlyActive(memberRecords).map(normalizeMember))
        setDelegations(onlyActive(delegationRecords))
      })
      .catch((error) => notify.error('Não foi possível carregar dados.', error.response?.data?.message || 'Verifique a API.'))
      .finally(() => setLoading(false))
  }, [])

  useEffect(() => {
    if (!selectedElection) {
      setSelectedMembers([])
      return
    }
    voterService.byElection(selectedElection)
      .then((records) => {
        const authorized = records
          .filter((record) => (record.status ?? 'AUTHORIZED') === 'AUTHORIZED')
          .map((record) => Number(record.member_id))
        setSelectedMembers(authorized)
      })
      .catch(() => setSelectedMembers([]))
  }, [selectedElection])

  const filteredMembers = useMemo(() => {
    const term = normalizeSearchText(filters.q)

    return members.filter((member) => {
      const matchesTerm = !term || [member.name, member.email, member.contact, member.code, member.delegation]
        .some((value) => normalizeSearchText(value).includes(term))
      const matchesDelegation = !filters.delegation || String(member.delegationId) === String(filters.delegation)

      return matchesTerm && matchesDelegation
    })
  }, [filters, members])

  const toggleMember = (id) => {
    setSelectedMembers((current) => current.includes(id) ? current.filter((item) => item !== id) : [...current, id])
  }

  const saveVoters = async (event) => {
    event.preventDefault()
    if (!selectedElection) {
      notify.error('Seleccione a eleição.')
      return
    }

    if (selectedMembers.length === 0) {
      notify.error('Seleccione pelo menos um membro.')
      return
    }

    try {
      setSaving(true)
      await voterService.addToElection(selectedElection, { member_ids: selectedMembers })
      notify.success('Eleitores adicionados com sucesso.')
      navigate('/eleitores')
    } catch (error) {
      notify.error('Eleitores não guardados.', getApiErrorMessage(error, { member_ids: selectedMembers }))
    } finally {
      setSaving(false)
    }
  }

  if (loading) return <Loading label="A carregar membros..." />

  return (
    <section className="management-page">
      <header className="management-header">
        <h1>Gestão de Eleitores</h1>
        <p>Seleccione membros registados para os adicionar à lista de eleitores desta eleição.</p>
      </header>

      <div className="mode-tabs" aria-label="Modo de gestão">
        <Link className="mode-tab" to="/eleitores">Visualizar</Link>
        <Link className="mode-tab active" to="/eleitores/novo">Registar</Link>
      </div>

      <form className="management-form-card selectable-form-card" onSubmit={saveVoters}>
        <section className="selection-panel">
          <div>
            <strong>Seleccione a eleição pela qual deseja autorizar eleitores.</strong>
            <p>Esta escolha não é filtro; ela define em que eleição os membros seleccionados poderão votar.</p>
          </div>
          <label className="form-field select-field">
            <span>Eleição</span>
            <select value={selectedElection} onChange={(event) => setSelectedElection(event.target.value)}>
              <option value="">Seleccione a eleição</option>
              {elections.map((election) => <option key={election.id} value={election.id}>{`${election.title} (${election.status})`}</option>)}
            </select>
          </label>
        </section>

        <section className="filters-panel" aria-label="Filtros para selecção de eleitores">
          <label className="filter-field filter-search">
            <Search size={22} />
            <input value={filters.q} onChange={(event) => setFilters((current) => ({ ...current, q: event.target.value }))} placeholder="Pesquisar por nome, email ou telefone" />
          </label>
          <label className="filter-field">
            <select value={filters.delegation} onChange={(event) => setFilters((current) => ({ ...current, delegation: event.target.value }))}>
              <option value="">Todas as delegações</option>
              {delegations.map((delegation) => <option key={delegation.id} value={delegation.id}>{delegation.name}</option>)}
            </select>
          </label>
        </section>

        <section className="table-card management-table-card selectable-table">
          <PaginationLayout items={filteredMembers} summaryLabel="membros">
            {(pageItems) => (
              <table>
                <thead>
                  <tr>
                    <th><input className="team-checkbox" type="checkbox" aria-label="Seleccionar todos" onChange={(event) => setSelectedMembers(event.target.checked ? filteredMembers.map((member) => member.id) : [])} /></th>
                    <th>Nome</th>
                    <th>Código</th>
                    <th>Delegação de Origem</th>
                    <th>Email</th>
                    <th>Contacto</th>
                    <th><span className="state-heading">Estado <ArrowDown size={18} /></span></th>
                  </tr>
                </thead>
                <tbody>
                  {pageItems.length === 0 ? (
                    <tr>
                      <td colSpan="7" className="empty-table-message">Sem membros para apresentar.</td>
                    </tr>
                  ) : pageItems.map((member) => (
                    <tr key={member.id}>
                      <td><input className="team-checkbox" type="checkbox" checked={selectedMembers.includes(member.id)} onChange={() => toggleMember(member.id)} aria-label={`Seleccionar ${member.name}`} /></td>
                      <td className="title-cell">{member.name}</td>
                      <td>{member.code}</td>
                      <td>{member.delegation}</td>
                      <td>{member.email}</td>
                      <td>{member.contact}</td>
                      <td><span className="status-pill"><span></span>{member.status}</span></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </PaginationLayout>
        </section>

        <div className="form-footer">
          <Link className="secondary-button" to="/eleitores">Cancelar</Link>
          <button className="primary-action-button" type="submit" disabled={saving}>{saving ? 'A guardar...' : 'Adicionar seleccionados'}</button>
        </div>
      </form>
    </section>
  )
}
