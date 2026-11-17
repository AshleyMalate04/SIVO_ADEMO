import { useEffect, useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { Search } from 'lucide-react'
import Loading from '../../components/common/Loading'
import PaginationLayout from '../../components/common/PaginationLayout'
import RowActions from '../../components/common/RowActions'
import ClearFiltersButton from '../../components/common/ClearFiltersButton'
import { useAuth } from '../../hooks/useAuth'
import { notify } from '../../utils/notify'
import { canCreateResource, canManageResource, canMutateStatus } from '../../utils/rolePermissions'
import { organService } from '../../services/organService'
import { commonStatusClass, normalizeStatus, searchText as normalizeSearchText } from '../../utils/statusFilters'

const normalizeOrgan = (organ) => ({
  id: organ.id,
  organ: organ.name,
  description: organ.description ?? 'Sem descrição',
  roles: (organ.positions ?? []).map((position) => position.name).join(', ') || 'Sem cargos',
  rawStatus: organ.status,
  status: organ.status === 'SUSPENDED' ? 'Suspendido' : (organ.status === 'ACTIVE' ? 'Activo' : 'Desactivado'),
})

export default function OrgansPage() {
  const { role } = useAuth()
  const canCreate = canCreateResource(role, 'organs')
  const canManage = canManageResource(role, 'organs')
  const canInactivate = canMutateStatus(role, 'organs')
  const [organs, setOrgans] = useState([])
  const [filters, setFilters] = useState({ q: '', status: '' })
  const [loading, setLoading] = useState(true)

  const loadOrgans = async () => {
    try {
      setLoading(true)
      const records = await organService.list()
      setOrgans(records.map(normalizeOrgan).filter((item) => normalizeStatus(item.rawStatus) !== 'INACTIVE'))
    } catch (error) {
      notify.error('Não foi possível carregar órgãos.', error.response?.data?.message || 'Verifique se a API esta activa.')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadOrgans()
  }, [])

  const filteredOrgans = useMemo(() => {
    const term = normalizeSearchText(filters.q)
    return organs.filter((organ) => {
      const matchesTerm = !term || [organ.organ, organ.roles, organ.description]
        .some((value) => normalizeSearchText(value).includes(term))
      const matchesStatus = !filters.status || normalizeStatus(organ.rawStatus) === normalizeStatus(filters.status)
      return matchesTerm && matchesStatus
    })
  }, [organs, filters])

  return (
    <section className="management-page">
      <header className="management-header">
        <h1>Gestão de órgãos e cargos</h1>
        <p>Estrutura eleitoral dinâmica e configurável.</p>
      </header>

      {canCreate ? <div className="mode-tabs" aria-label="Modo de gestão">
        <Link className="mode-tab active" to="/orgaos-cargos">Visualizar</Link>
        {canCreate ? <Link className="mode-tab" to="/orgaos-cargos/novo">Registar</Link> : null}
      </div> : null}

      <section className="filters-panel organs-filters" aria-label="Filtros de órgãos">
        <label className="filter-field filter-search">
          <Search size={22} />
          <input value={filters.q} onChange={(event) => setFilters((current) => ({ ...current, q: event.target.value }))} placeholder="Pesquisar órgãos ou cargos..." />
        </label>
        <label className="filter-field">
          <select value={filters.status} onChange={(event) => setFilters((current) => ({ ...current, status: event.target.value }))}>
            <option value="">Todos os estados</option>
            <option value="ACTIVE">Activo</option>
            <option value="SUSPENDED">Suspendido</option>
          </select>
        </label>
        <ClearFiltersButton active={Object.values(filters).some(Boolean)} onClick={() => setFilters({ q: '', status: '' })} />
      </section>

      <section className="table-card management-table-card">
        {loading ? <Loading label="A carregar órgãos..." /> : (
        <PaginationLayout items={filteredOrgans} summaryLabel="órgãos">
          {(pageItems) => (
            <table>
              <thead>
                <tr>
                  <th>Órgão</th>
                  <th>Cargos</th>
                  <th>Estado</th>
                  <th>Acções</th>
                </tr>
              </thead>
              <tbody>
                {pageItems.length === 0 ? (
                  <tr>
                    <td colSpan="4" className="empty-table-message">Sem órgãos para apresentar.</td>
                  </tr>
                ) : pageItems.map((organ) => (
                  <tr key={organ.id}>
                    <td className="title-cell">{organ.organ}</td>
                    <td>{organ.roles}</td>
                      <td><span className={`status-pill ${commonStatusClass(organ.rawStatus)}`}>{organ.status}</span></td>
                    <td>
                      <RowActions
                        canManage={canManage}
                        title={organ.organ}
                        isInactive={organ.rawStatus !== 'ACTIVE'}
                        details={[
                          ['Órgão', organ.organ],
                          ['Cargos', organ.roles],
                          ['Estado', organ.status],
                          ['Descrição', organ.description],
                        ]}
                        editTo={`/orgaos-cargos/${organ.id}/editar`}
                        disableEdit={organ.rawStatus !== 'ACTIVE'}
                        onInactivate={canInactivate ? async () => {
                          await organService.update(organ.id, { status: 'SUSPENDED' })
                          notify.success('Órgão suspendido com sucesso.')
                          loadOrgans()
                        } : null}
                        onActivate={canInactivate ? async () => {
                          await organService.update(organ.id, { status: 'ACTIVE' })
                          notify.success('Órgão activado com sucesso.')
                          loadOrgans()
                        } : null}
                        onDelete={canManage ? async () => {
                          await organService.remove(organ.id)
                          notify.success('Órgão eliminado com sucesso.')
                          loadOrgans()
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
