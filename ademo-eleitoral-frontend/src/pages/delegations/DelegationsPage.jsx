import { useEffect, useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { ArrowDown, Search } from 'lucide-react'
import Loading from '../../components/common/Loading'
import PaginationLayout from '../../components/common/PaginationLayout'
import RowActions from '../../components/common/RowActions'
import { useAuth } from '../../hooks/useAuth'
import { notify } from '../../utils/notify'
import { canCreateResource, canManageResource, canMutateStatus } from '../../utils/rolePermissions'
import { delegationService } from '../../services/delegationService'
import { normalizeStatus, searchText as normalizeSearchText } from '../../utils/statusFilters'

const normalizeDelegation = (delegation) => ({
  id: delegation.id,
  name: delegation.name,
  province: delegation.province?.name ?? 'Sem provincia',
  district: delegation.district?.name ?? 'Sem distrito',
  address: delegation.address ?? 'Não informado',
  rawStatus: delegation.status,
  status: delegation.status === 'SUSPENDED' ? 'Suspendida' : (delegation.status === 'ACTIVE' ? 'Activo' : 'Desactivada'),
})

export default function DelegationsPage() {
  const { role } = useAuth()
  const canCreate = canCreateResource(role, 'delegations')
  const canManage = canManageResource(role, 'delegations')
  const canInactivate = canMutateStatus(role, 'delegations')
  const [delegations, setDelegations] = useState([])
  const [provinces, setProvinces] = useState([])
  const [filters, setFilters] = useState({ q: '', province: '', status: '' })
  const [loading, setLoading] = useState(true)

  const loadDelegations = async () => {
    try {
      setLoading(true)
      const [records, provinceRecords] = await Promise.all([
        delegationService.list(),
        delegationService.provinces(),
      ])
      setDelegations(records.map(normalizeDelegation).filter((item) => normalizeStatus(item.rawStatus) !== 'INACTIVE'))
      setProvinces(provinceRecords)
    } catch (error) {
      notify.error('Não foi possível carregar delegações.', error.response?.data?.message || 'Verifique se a API esta activa.')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadDelegations()
  }, [])

  const filteredDelegations = useMemo(() => {
    const term = normalizeSearchText(filters.q)
    return delegations.filter((delegation) => {
      const matchesTerm = !term || [delegation.name, delegation.province, delegation.district, delegation.address]
        .some((value) => normalizeSearchText(value).includes(term))
      const matchesProvince = !filters.province || delegation.province === filters.province
      const matchesStatus = !filters.status || normalizeStatus(delegation.rawStatus) === normalizeStatus(filters.status)
      return matchesTerm && matchesProvince && matchesStatus
    })
  }, [delegations, filters])

  return (
    <section className="management-page">
      <header className="management-header">
        <h1>Gestão de Delegações</h1>
        <p>Gestão das delegações/provincias da ADEMO.</p>
      </header>

      {canCreate ? <div className="mode-tabs" aria-label="Modo de gestão">
        <Link className="mode-tab active" to="/delegacoes">Visualizar</Link>
        {canCreate ? <Link className="mode-tab" to="/delegacoes/nova">Registar</Link> : null}
      </div> : null}

      <section className="filters-panel" aria-label="Filtros de delegações">
        <label className="filter-field filter-search">
          <Search size={22} />
          <input value={filters.q} onChange={(event) => setFilters((current) => ({ ...current, q: event.target.value }))} placeholder="Pesquisar delegação" />
        </label>
        <label className="filter-field">
          <select value={filters.province} onChange={(event) => setFilters((current) => ({ ...current, province: event.target.value }))}>
            <option value="">Todas as provincias</option>
            {provinces.map((province) => <option key={province.id} value={province.name}>{province.name}</option>)}
          </select>
        </label>
        <label className="filter-field">
          <select value={filters.status} onChange={(event) => setFilters((current) => ({ ...current, status: event.target.value }))}>
            <option value="">Todos os estados</option>
            <option value="ACTIVE">Activo</option>
            <option value="SUSPENDED">Suspendida</option>
          </select>
        </label>
      </section>

      <section className="table-card management-table-card">
        {loading ? <Loading label="A carregar delegações..." /> : (
        <PaginationLayout items={filteredDelegations} summaryLabel="delegações">
          {(pageItems) => (
            <table>
              <thead>
                <tr>
                  <th>Nome</th>
                  <th>Provincia</th>
                  <th>Distrito</th>
                  <th><span className="state-heading">Estado <ArrowDown size={18} /></span></th>
                  <th>Acções</th>
                </tr>
              </thead>
              <tbody>
                {pageItems.length === 0 ? (
                  <tr>
                    <td colSpan="5" className="empty-table-message">Sem delegações para apresentar.</td>
                  </tr>
                ) : pageItems.map((delegation) => (
                  <tr key={delegation.id}>
                    <td className="title-cell">{delegation.name}</td>
                    <td>{delegation.province}</td>
                    <td>{delegation.district}</td>
                    <td><span className="status-pill"><span></span>{delegation.status}</span></td>
                    <td>
                      <RowActions
                        canManage={canManage}
                        title={delegation.name}
                        isInactive={delegation.rawStatus !== 'ACTIVE'}
                        details={[
                          ['Nome', delegation.name],
                          ['Provincia', delegation.province],
                          ['Distrito', delegation.district],
                          ['Endereco', delegation.address],
                          ['Estado', delegation.status],
                        ]}
                        editTo={`/delegacoes/${delegation.id}/editar`}
                        disableEdit={delegation.rawStatus !== 'ACTIVE'}
                        onInactivate={canInactivate ? async () => {
                          await delegationService.update(delegation.id, { status: 'SUSPENDED' })
                          notify.success('Delegação suspendida com sucesso.')
                          loadDelegations()
                        } : null}
                        onActivate={canInactivate ? async () => {
                          await delegationService.update(delegation.id, { status: 'ACTIVE' })
                          notify.success('Delegação activada com sucesso.')
                          loadDelegations()
                        } : null}
                        onDelete={canManage ? async () => {
                          await delegationService.remove(delegation.id)
                          notify.success('Delegação eliminada com sucesso.')
                          loadDelegations()
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
