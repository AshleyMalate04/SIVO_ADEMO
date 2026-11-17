import { useEffect, useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { Search } from 'lucide-react'
import Loading from '../../components/common/Loading'
import PaginationLayout from '../../components/common/PaginationLayout'
import RowActions from '../../components/common/RowActions'
import ClearFiltersButton from '../../components/common/ClearFiltersButton'
import { delegationService } from '../../services/delegationService'
import { memberService } from '../../services/memberService'
import { useAuth } from '../../hooks/useAuth'
import { notify } from '../../utils/notify'
import { canCreateResource, canManageResource, canMutateStatus } from '../../utils/rolePermissions'
import { commonStatusClass, normalizeStatus, searchText as normalizeSearchText } from '../../utils/statusFilters'

const formatDate = (value) => {
  if (!value) return 'Sem data'
  const [datePart] = String(value).split('T')
  const [year, month, day] = datePart.split('-')
  return year && month && day ? `${day}/${month}/${year}` : String(value)
}

const normalizeMember = (member) => ({
  id: member.id,
  name: member.name,
  code: member.member_code,
  delegationId: member.delegation_id ? String(member.delegation_id) : '',
  delegation: member.delegation?.name ?? 'Sem delegação',
  email: member.email ?? 'Sem email',
  contact: member.phone ?? 'Sem contacto',
  bi: member.bi_number ?? 'Sem BI',
  registeredAt: formatDate(member.registered_at ?? member.created_at),
  registeredBy: member.registrar?.name ?? 'Não identificado',
  rawStatus: member.status,
  status: member.status === 'SUSPENDED' ? 'Suspendido' : (member.status === 'ACTIVE' ? 'Activo' : 'Desactivado'),
})

export default function MembersPage() {
  const { role } = useAuth()
  const canCreate = canCreateResource(role, 'members')
  const canManage = canManageResource(role, 'members')
  const canInactivate = canMutateStatus(role, 'members')
  const [members, setMembers] = useState([])
  const [delegations, setDelegations] = useState([])
  const [loading, setLoading] = useState(true)
  const [filters, setFilters] = useState({ q: '', status: '', delegation: '' })

  const loadMembers = async () => {
    try {
      setLoading(true)
      const [memberRecords, delegationRecords] = await Promise.all([memberService.list(), delegationService.list()])
      setMembers(memberRecords.map(normalizeMember).filter((item) => normalizeStatus(item.rawStatus) !== 'INACTIVE'))
      setDelegations(delegationRecords.filter((delegation) => delegation.status === 'ACTIVE'))
    } catch (error) {
      notify.error('Não foi possível carregar membros.', error.response?.data?.message || 'Verifique a API.')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadMembers()
  }, [])

  const filteredMembers = useMemo(() => {
    const term = normalizeSearchText(filters.q)

    return members.filter((member) => {
      const matchesTerm = !term || [member.name, member.email, member.contact, member.delegation, member.code]
        .some((value) => normalizeSearchText(value).includes(term))
      const matchesStatus = !filters.status || normalizeStatus(member.rawStatus) === normalizeStatus(filters.status)
      const matchesDelegation = !filters.delegation || member.delegationId === filters.delegation
      return matchesTerm && matchesStatus && matchesDelegation
    })
  }, [filters, members])

  return (
    <section className="management-page">
      <header className="management-header">
        <h1>Gestão de membros</h1>
        <p>Consulte e actualize os dados dos membros habilitados para participar no processo eleitoral.</p>
      </header>

      {canCreate ? <div className="mode-tabs" aria-label="Modo de gestão">
        <Link className="mode-tab active" to="/membros">Visualizar</Link>
        {canCreate ? <Link className="mode-tab" to="/membros/novo">Registar</Link> : null}
      </div> : null}

      <section className="filters-panel members-filters" aria-label="Filtros de membros">
        <label className="filter-field filter-search">
          <Search size={22} />
          <input value={filters.q} onChange={(event) => setFilters((current) => ({ ...current, q: event.target.value }))} placeholder="Pesquisar membros..." />
        </label>
        <label className="filter-field">
          <select value={filters.delegation} onChange={(event) => setFilters((current) => ({ ...current, delegation: event.target.value }))}>
            <option value="">Todas as delegações</option>
            {delegations.map((delegation) => <option key={delegation.id} value={delegation.id}>{delegation.name}</option>)}
          </select>
        </label>
        <label className="filter-field">
          <select value={filters.status} onChange={(event) => setFilters((current) => ({ ...current, status: event.target.value }))}>
            <option value="">Todos os estados</option>
            <option value="ACTIVE">Activo</option>
            <option value="SUSPENDED">Suspendido</option>
          </select>
        </label>
        <ClearFiltersButton active={Object.values(filters).some(Boolean)} onClick={() => setFilters({ q: '', status: '', delegation: '' })} />
      </section>

      <section className="table-card management-table-card members-table">
        {loading ? <Loading label="A carregar membros..." /> : (
        <PaginationLayout items={filteredMembers} summaryLabel="membros">
          {(pageItems) => (
            <table>
              <thead>
                <tr>
                  <th>Nome</th>
                  <th>Código</th>
                  <th>Delegação de origem</th>
                  <th>Membro desde</th>
                  <th>Registado por</th>
                  <th>Estado</th>
                  <th>Acções</th>
                </tr>
              </thead>
              <tbody>
                {pageItems.length === 0 ? (
                  <tr>
                    <td colSpan="7" className="empty-table-message">Sem membros para apresentar.</td>
                  </tr>
                ) : pageItems.map((member) => (
                  <tr key={member.id}>
                    <td className="title-cell">{member.name}</td>
                    <td>{member.code}</td>
                    <td>{member.delegation}</td>
                    <td>{member.registeredAt}</td>
                    <td>{member.registeredBy}</td>
                    <td><span className={`status-pill ${commonStatusClass(member.rawStatus ?? member.status)}`}>{member.status}</span></td>
                    <td>
                      <RowActions
                        canManage={canManage}
                        title={member.name}
                        isInactive={member.rawStatus !== 'ACTIVE'}
                        details={[
                          ['Nome', member.name],
                          ['Código', member.code],
                          ['Delegação de origem', member.delegation],
                          ['Email', member.email],
                          ['Contacto', member.contact],
                          ['BI', member.bi],
                          ['Membro desde', member.registeredAt],
                          ['Registado por', member.registeredBy],
                          ['Estado', member.status],
                        ]}
                        editTo={`/membros/${member.id}/editar`}
                        disableEdit={member.rawStatus !== 'ACTIVE'}
                        onInactivate={canInactivate ? async () => {
                          await memberService.update(member.id, { status: 'SUSPENDED' })
                          notify.success('Membro suspendido com sucesso.')
                          loadMembers()
                        } : null}
                        onActivate={canInactivate ? async () => {
                          await memberService.update(member.id, { status: 'ACTIVE' })
                          notify.success('Membro activado com sucesso.')
                          loadMembers()
                        } : null}
                        onDelete={canManage ? async () => {
                          await memberService.remove(member.id)
                          notify.success('Membro eliminado com sucesso.')
                          loadMembers()
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
