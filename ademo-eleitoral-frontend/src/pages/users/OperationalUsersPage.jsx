import { useEffect, useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { ArrowDown, Search } from 'lucide-react'
import Loading from '../../components/common/Loading'
import PaginationLayout from '../../components/common/PaginationLayout'
import RowActions from '../../components/common/RowActions'
import { useAuth } from '../../hooks/useAuth'
import { userService } from '../../services/userService'
import { normalizeStatus, searchText as normalizeSearchText } from '../../utils/statusFilters'
import { notify } from '../../utils/notify'
import { canCreateResource, canManageResource, canMutateStatus } from '../../utils/rolePermissions'

const roleLabel = (role) => ({
  ADMIN: 'Administrador',
  COMMISSION: 'Comissão',
  COMISSAO: 'Comissão',
  FISCAL: 'Fiscal',
  VOTER: 'Eleitor',
  ELEITOR: 'Eleitor',
}[role] ?? role)

const statusLabel = (status) => ({
  ACTIVE: 'Activo',
  INACTIVE: 'Desactivado',
  SUSPENDED: 'Suspendido',
  BLOCKED: 'Suspendido',
}[status] ?? status)

const roleGroups = {
  staff: ['COMMISSION', 'COMISSAO', 'FISCAL'],
  users: ['COMMISSION', 'COMISSAO', 'FISCAL', 'VOTER', 'ELEITOR'],
}

const normalizeUser = (user) => ({
  id: user.id,
  name: user.name ?? 'Sem nome',
  code: user.access_code ?? 'Sem código',
  delegation: user.delegation?.name ?? 'Sem delegação',
  email: user.email ?? 'Sem email',
  contact: user.phone ?? 'Sem contacto',
  role: roleLabel(user.role),
  rawRole: user.role,
  status: statusLabel(user.status),
  rawStatus: user.status,
})

export default function OperationalUsersPage({ mode = 'staff' }) {
  const { role } = useAuth()
  const isStaffManagement = mode === 'staff'
  const canCreate = isStaffManagement && canCreateResource(role, 'users')
  const canManage = isStaffManagement && canManageResource(role, 'users')
  const canInactivate = isStaffManagement && canMutateStatus(role, 'users')
  const [users, setUsers] = useState([])
  const [loading, setLoading] = useState(true)
  const [filters, setFilters] = useState({ q: '', role: '', status: '' })

  const loadUsers = async () => {
    try {
      setLoading(true)
      const records = await userService.list()
      const allowedRoles = roleGroups[mode] ?? roleGroups.staff
      setUsers(records.filter((record) => allowedRoles.includes(record.role) && normalizeStatus(record.status) !== 'INACTIVE').map(normalizeUser))
    } catch (error) {
      notify.error('Não foi possível carregar utilizadores.', error.response?.data?.message || 'Verifique a API.')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadUsers()
  }, [mode])

  const filteredUsers = useMemo(() => {
    const term = normalizeSearchText(filters.q)

    return users.filter((user) => {
      const matchesTerm = !term || [user.name, user.email, user.contact, user.code, user.role, user.delegation]
        .some((value) => normalizeSearchText(value).includes(term))
      const matchesRole = !filters.role || user.rawRole === filters.role || (filters.role === 'COMISSAO' && user.rawRole === 'COMMISSION')
      const matchesStatus = !filters.status || normalizeStatus(user.rawStatus) === normalizeStatus(filters.status)

      return matchesTerm && matchesRole && matchesStatus
    })
  }, [filters, users])

  const pageTitle = isStaffManagement ? 'Gestão Comissão e Fiscal' : 'Utilizadores'
  const summaryLabel = isStaffManagement ? 'membros e fiscais' : 'utilizadores'

  return (
    <section className="management-page">
      <header className="management-header">
        <h1>{pageTitle}</h1>
        <p>
          {isStaffManagement
            ? 'Controle os membros da comissao e fiscais que tem acesso operacional ao sistema eleitoral.'
            : 'Consulte os utilizadores registados no sistema, sem incluir administradores.'}
        </p>
      </header>

      {isStaffManagement && canCreate ? (
        <div className="mode-tabs" aria-label="Modo de gestão">
          <Link className="mode-tab active" to="/comissao-fiscal">Visualizar</Link>
          <Link className="mode-tab" to="/comissao-fiscal/novo">Registar</Link>
        </div>
      ) : null}

      <section className="filters-panel" aria-label="Filtros de utilizadores">
        <label className="filter-field filter-search">
          <Search size={22} />
          <input
            value={filters.q}
            onChange={(event) => setFilters((current) => ({ ...current, q: event.target.value }))}
            placeholder="Pesquisar por nome, email, telefone ou perfil"
          />
        </label>
        <label className="filter-field">
          <select value={filters.role} onChange={(event) => setFilters((current) => ({ ...current, role: event.target.value }))}>
            <option value="">Todos os perfis</option>
            <option value="COMISSAO">Comissão</option>
            <option value="FISCAL">Fiscal</option>
            {!isStaffManagement ? <option value="ELEITOR">Eleitor</option> : null}
          </select>
        </label>
        <label className="filter-field">
          <select value={filters.status} onChange={(event) => setFilters((current) => ({ ...current, status: event.target.value }))}>
            <option value="">Todos os estados</option>
            <option value="ACTIVE">Activo</option>
            <option value="SUSPENDED">Suspendido</option>
          </select>
        </label>
      </section>

      <section className="table-card management-table-card">
        {loading ? (
          <Loading label="A carregar utilizadores..." />
        ) : (
          <PaginationLayout items={filteredUsers} summaryLabel={summaryLabel}>
            {(pageItems) => (
              <table>
                <thead>
                  <tr>
                    <th>Nome</th>
                    <th>Código</th>
                    <th>Delegação de Origem</th>
                    <th>Email</th>
                    <th>Perfil</th>
                    <th><span className="state-heading">Estado <ArrowDown size={18} /></span></th>
                    {isStaffManagement ? <th>Acções</th> : null}
                  </tr>
                </thead>
                <tbody>
                  {pageItems.map((user) => (
                    <tr key={user.id}>
                      <td className="title-cell">{user.name}</td>
                      <td>{user.code}</td>
                      <td>{user.delegation}</td>
                      <td>{user.email}</td>
                      <td>{user.role}</td>
                      <td><span className="status-pill"><span></span>{user.status}</span></td>
                      {isStaffManagement ? (
                        <td>
                          <RowActions
                            canManage={canManage}
                            title={user.name}
                            details={[
                              ['Nome', user.name],
                              ['Código', user.code],
                              ['Delegação de Origem', user.delegation],
                              ['Email', user.email],
                              ['Contacto', user.contact],
                              ['Perfil', user.role],
                              ['Estado', user.status],
                            ]}
                            editTo={`/comissao-fiscal/${user.id}/editar`}
                            isInactive={user.rawStatus !== 'ACTIVE'}
                            onInactivate={canInactivate ? async () => {
                              await userService.updateStatus(user.id, { status: 'SUSPENDED' })
                              notify.success('Utilizador suspendido com sucesso.')
                              loadUsers()
                            } : null}
                            onActivate={canInactivate ? async () => {
                              await userService.updateStatus(user.id, { status: 'ACTIVE' })
                              notify.success('Utilizador activado com sucesso.')
                              loadUsers()
                            } : null}
                            onDelete={canManage ? async () => {
                              await userService.updateStatus(user.id, { status: 'INACTIVE' })
                              notify.success('Utilizador eliminado com sucesso.')
                              loadUsers()
                            } : null}
                          />
                        </td>
                      ) : null}
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
