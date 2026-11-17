import { useEffect, useMemo, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { Search } from 'lucide-react'
import Loading from '../../components/common/Loading'
import PaginationLayout from '../../components/common/PaginationLayout'
import ClearFiltersButton from '../../components/common/ClearFiltersButton'
import RowActions from '../../components/common/RowActions'
import { candidateService } from '../../services/candidateService'
import { electionService } from '../../services/electionService'
import { useAuth } from '../../hooks/useAuth'
import { notify } from '../../utils/notify'
import { canCreateResource, canManageResource, canMutateStatus } from '../../utils/rolePermissions'
import { commonStatusClass, normalizeId, normalizeStatus, searchText as normalizeSearchText } from '../../utils/statusFilters'

const statusLabel = (status) => ({
  APPROVED: 'Aprovado',
  REJECTED: 'Rejeitado',
  SUSPENDED: 'Suspenso',
}[status] ?? status)

const normalizeCandidate = (candidate, election) => ({
  id: candidate.id,
  name: candidate.member?.name ?? 'Sem nome',
  delegationId: normalizeId(candidate.member?.delegation_id ?? candidate.member?.delegation?.id),
  delegation: candidate.member?.delegation?.name ?? 'Sem delegação',
  organ: election.organ?.name ?? candidate.election?.organ?.name ?? 'Sem órgão',
  position: candidate.position?.name ?? election.position?.name ?? 'Sem cargo',
  election: election.title ?? candidate.election?.title ?? 'Sem eleição',
  electionId: election.id ?? candidate.election_id,
  rawStatus: candidate.status,
  status: statusLabel(candidate.status),
  proposal: candidate.proposal ?? 'Sem proposta',
  biography: candidate.biography ?? 'Sem biografia',
})

export default function ElectionCandidatesPage() {
  const navigate = useNavigate()
  const { role } = useAuth()
  const canCreate = canCreateResource(role, 'candidates')
  const canManage = canManageResource(role, 'candidates')
  const canInactivate = canMutateStatus(role, 'candidates')
  const [elections, setElections] = useState([])
  const [candidates, setCandidates] = useState([])
  const [loading, setLoading] = useState(true)
  const [filters, setFilters] = useState({ q: '', election: '', status: '' })

  // const loadCandidates = async () => {
  //   try {
  //     setLoading(true)
  //     const electionRecords = await electionService.list()
  //     setElections(electionRecords)
  //     const groups = await Promise.all(electionRecords.map(async (election) => {
  //       const records = await candidateService.byElection(election.id)
  //       return records.map((candidate) => normalizeCandidate(candidate, election))
  //     }))
  //     setCandidates(groups.flat())
  //   } catch (error) {
  //     notify.error('Não foi possível carregar candidatos.', error.response?.data?.message || 'Verifique a API.')
  //   } finally {
  //     setLoading(false)
  //   }
  // }


  const loadCandidates = async () => {
  try {
    setLoading(true)

    const [electionRecords, candidateRecords] = await Promise.all([
      electionService.list(),
      candidateService.list(),
    ])

    setElections(electionRecords)

    setCandidates(
      candidateRecords.map((candidate) => normalizeCandidate(candidate, candidate.election ?? {}))
    )
  } catch (error) {
    notify.error(
      'Não foi possível carregar candidatos.',
      error.response?.data?.message || 'Verifique a API.'
    )
  } finally {
    setLoading(false)
  }
}
  useEffect(() => {
    loadCandidates()
  }, [])

  const filteredCandidates = useMemo(() => {
    const term = normalizeSearchText(filters.q)
    return candidates.filter((candidate) => {
      const matchesTerm = !term || [candidate.name, candidate.organ, candidate.position, candidate.election, candidate.delegation]
        .some((value) => normalizeSearchText(value).includes(term))
      const matchesElection = !filters.election || String(candidate.electionId) === filters.election
      const matchesStatus = !filters.status || normalizeStatus(candidate.rawStatus) === normalizeStatus(filters.status)
      return matchesTerm && matchesElection && matchesStatus
    })
  }, [candidates, filters])

  const updateCandidateStatus = async (candidate, status) => {
    await candidateService.updateStatus(candidate.id, { status })
    notify.success(status === 'SUSPENDED' ? 'Candidato suspendido com sucesso.' : 'Candidato activado com sucesso.')
    loadCandidates()
  }

  const deleteCandidate = async (candidate) => {
    await candidateService.remove(candidate.id)
    notify.success('Candidato eliminado com sucesso.')
    loadCandidates()
  }

  return (
    <section className="management-page">
      <header className="management-header">
        <h1>Gestão do candidato</h1>
        <p>Consulte e registe candidatos associados as eleições, órgãos e cargos disponíveis.</p>
      </header>

      {canCreate ? (
        <div className="mode-tabs" aria-label="Modo de gestão">
          <Link className="mode-tab active" to="/candidatos">Visualizar</Link>
          <Link className="mode-tab" to="/candidatos/novo">Registar</Link>
        </div>
      ) : null}

      <section className="filters-panel" aria-label="Filtros de candidatos">
        <label className="filter-field filter-search">
          <Search size={22} />
          <input value={filters.q} onChange={(event) => setFilters((current) => ({ ...current, q: event.target.value }))} placeholder="Pesquisar candidatos..." />
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
            <option value="APPROVED">Aprovado</option>
            <option value="SUSPENDED">Suspenso</option>
            <option value="REJECTED">Rejeitado</option>
          </select>
        </label>
        <ClearFiltersButton active={Object.values(filters).some(Boolean)} onClick={() => setFilters({ q: '', election: '', status: '' })} />
      </section>

      <section className="table-card management-table-card candidates-table">
        {loading ? (
          <Loading label="A carregar candidatos..." />
        ) : (
          <PaginationLayout items={filteredCandidates} summaryLabel="candidatos">
            {(pageItems) => (
              <table>
                <thead>
                  <tr>
                    <th>Nome</th>
                    <th>Delegação de origem</th>
                    <th>Órgão</th>
                    <th>Cargo</th>
                    <th>Eleição</th>
                    <th>Estado</th>
                    <th>Acções</th>
                  </tr>
                </thead>
                <tbody>
                  {pageItems.length === 0 ? (
                    <tr>
                      <td colSpan="7" className="empty-table-message">Sem candidatos para apresentar.</td>
                    </tr>
                  ) : pageItems.map((candidate) => (
                    <tr key={candidate.id}>
                      <td className="title-cell">{candidate.name}</td>
                      <td>{candidate.delegation}</td>
                      <td>{candidate.organ}</td>
                      <td>{candidate.position}</td>
                      <td>{candidate.election}</td>
                      <td><span className={`status-pill ${commonStatusClass(candidate.rawStatus ?? candidate.status)}`}>{candidate.status}</span></td>
                      <td>
                        <RowActions
                          canManage={canManage}
                          title={candidate.name}
                          isInactive={candidate.rawStatus === 'SUSPENDED'}
                          details={[
                            ['Nome', candidate.name],
                            ['Delegação de origem', candidate.delegation],
                            ['Órgão', candidate.organ],
                            ['Cargo', candidate.position],
                            ['Eleição', candidate.election],
                            ['Estado', candidate.status],
                            ['Biografia', candidate.biography],
                            ['Proposta', candidate.proposal],
                          ]}
                          editTo={`/candidatos/${candidate.id}/editar`}
                          onView={() => navigate(`/candidatos/${candidate.id}/detalhes`)}
                          onInactivate={canInactivate ? () => updateCandidateStatus(candidate, 'SUSPENDED') : null}
                          onActivate={canInactivate ? () => updateCandidateStatus(candidate, 'APPROVED') : null}
                          onDelete={canManage ? () => deleteCandidate(candidate) : null}
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
