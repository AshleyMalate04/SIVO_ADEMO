import { useEffect, useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { CalendarDays, MapPin, Search } from 'lucide-react'
import Loading from '../../components/common/Loading'
import PaginationLayout from '../../components/common/PaginationLayout'
import { delegationService } from '../../services/delegationService'
import { electionService } from '../../services/electionService'
import { resultService } from '../../services/resultService'
import { getElectionStatusClass, getElectionStatusLabel } from '../../data/elections'
import { notify } from '../../utils/notify'
import { useElectionRealtime } from '../../hooks/useElectionRealtime'
import { normalizeStatus, onlyActive, searchText as normalizeSearchText } from '../../utils/statusFilters'

export default function ElectionSelectionPage({ mode = 'results' }) {
  const isAudit = mode === 'audit'
  const isVoterResults = mode === 'voter-results'
  const [loading, setLoading] = useState(true)
  const [elections, setElections] = useState([])
  const [delegations, setDelegations] = useState([])
  const [filters, setFilters] = useState({ q: '', election: '', status: '', delegation: '' })

  const loadData = () => {
    setLoading(true)
    const request = isVoterResults
      ? resultService.list().then((electionRecords) => {
          setElections(electionRecords)
          const delegationMap = new Map()
          electionRecords.forEach((election) => {
            if (election.delegation?.id) delegationMap.set(String(election.delegation.id), election.delegation)
          })
          setDelegations([...delegationMap.values()])
        })
      : Promise.all([electionService.list(), delegationService.list()]).then(([electionRecords, delegationRecords]) => {
          setElections(electionRecords)
          setDelegations(onlyActive(delegationRecords))
        })

    return request
      .catch((error) => notify.error('Não foi possível carregar eleições.', error.response?.data?.message || 'Verifique a API.'))
      .finally(() => setLoading(false))
  }

  useEffect(() => { loadData() }, [isVoterResults])

  useElectionRealtime(null, {
    onResultUpdated: () => loadData(),
    onStatusUpdated: () => loadData(),
  })

  const filteredElections = useMemo(() => {
    const term = normalizeSearchText(filters.q)

    return elections.filter((election) => {
      const matchesTerm = !term || [election.title, election.organ?.name, election.position?.name, election.delegation?.name]
        .some((value) => String(value ?? '').toLowerCase().includes(term))
      const matchesElection = !filters.election || String(election.id) === String(filters.election)
      const matchesStatus = !filters.status || normalizeStatus(election.status) === normalizeStatus(filters.status)
      const matchesDelegation = !filters.delegation || String(election.delegation_id ?? election.delegation?.id ?? '') === String(filters.delegation)

      return matchesTerm && matchesElection && matchesStatus && matchesDelegation
    })
  }, [elections, filters])

  const target = (id) => {
    if (isAudit) return `/auditoria?eleicao=${id}`
    if (isVoterResults) return `/portal-eleitor/resultados?eleicao=${id}`
    return `/resultados?eleicao=${id}`
  }

  if (loading) return <Loading label="A carregar eleições..." />

  return (
    <section className="management-page election-selection-page">
      <header className="management-header">
        <h1>{isAudit ? 'Seleccionar eleição para auditoria' : 'Seleccionar eleição para resultados'}</h1>
        <p>Filtre e escolha a eleição que pretende consultar.</p>
      </header>

      <section className="filters-panel election-card-filters" aria-label="Filtros de eleições">
        <label className="filter-field filter-search">
          <Search size={20} />
          <input value={filters.q} onChange={(event) => setFilters((current) => ({ ...current, q: event.target.value }))} placeholder="Pesquisar por título, órgão ou cargo" />
        </label>
        <label className="filter-field">
          <select value={filters.election} onChange={(event) => setFilters((current) => ({ ...current, election: event.target.value }))}>
            <option value="">Todas as eleições</option>
            {elections.map((election) => <option key={election.id} value={election.id}>{election.title}</option>)}
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
        <label className="filter-field">
          <select value={filters.delegation} onChange={(event) => setFilters((current) => ({ ...current, delegation: event.target.value }))}>
            <option value="">Todas as delegações</option>
            {delegations.map((delegation) => <option key={delegation.id} value={delegation.id}>{delegation.name}</option>)}
          </select>
        </label>
      </section>

      <PaginationLayout items={filteredElections} summaryLabel="eleições">
        {(pageItems) => (
          <section className="election-selection-grid">
            {pageItems.length === 0 ? (
              <div className="table-card empty-table-message">Sem eleições para apresentar.</div>
            ) : pageItems.map((election) => (
              <Link className="election-selection-card" key={election.id} to={target(election.id)}>
                <span className={`status-pill ${getElectionStatusClass(election.status)}`}><span></span>{getElectionStatusLabel(election.status)}</span>
                <h2>{election.title}</h2>
                <p><CalendarDays size={16} /> {election.organ?.name ?? 'Sem órgão'} · {election.position?.name ?? 'Sem cargo'}</p>
                <p><MapPin size={16} /> Delegação {election.delegation?.name ?? 'Geral'}</p>
                <strong>{isAudit ? 'Abrir auditoria' : 'Ver resultados'}</strong>
              </Link>
            ))}
          </section>
        )}
      </PaginationLayout>
    </section>
  )
}
