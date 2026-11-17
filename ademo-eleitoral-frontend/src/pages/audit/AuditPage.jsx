import { useEffect, useMemo, useState } from 'react'
import { createPortal } from 'react-dom'
import { useSearchParams } from 'react-router-dom'
import { Download, Search, X } from 'lucide-react'
import Loading from '../../components/common/Loading'
import ManagementPagination from '../../components/common/ManagementPagination'
import DatePicker from '../../components/common/DatePicker'
import ClearFiltersButton from '../../components/common/ClearFiltersButton'
import RowActions from '../../components/common/RowActions'
import { auditService } from '../../services/auditService'
import { exportCsv } from '../../utils/exportFile'
import { notify } from '../../utils/notify'

const DEFAULT_PAGE_SIZE = 25

const normalize = (value) => String(value ?? '')
  .toLowerCase()
  .normalize('NFD')
  .replace(/[\u0300-\u036f]/g, '')

const formatDateTime = (value, fallback) => {
  const raw = value || fallback

  if (!raw) return 'Data não registada'

  const [datePart, timePart = ''] = String(raw).replace(' ', 'T').split('T')
  const [year, month, day] = datePart.split('-')
  const [hour = '00', minute = '00'] = timePart.split(':')

  if (!year || !month || !day) return String(raw)

  return `${day}/${month}/${year}, ${hour}:${minute}`
}

const statusLabels = {
  ACTIVE: 'Activo',
  ACTIVO: 'Activo',
  INACTIVE: 'Desactivado',
  INACTIVO: 'Desactivado',
  DESACTIVADO: 'Desactivado',
  DISABLED: 'Desactivado',
  SUSPENDED: 'Suspenso',
  SUSPENSO: 'Suspenso',
  BLOCKED: 'Bloqueado',
  BLOQUEADO: 'Bloqueado',
  APPROVED: 'Aprovado',
  APROVADO: 'Aprovado',
  REJECTED: 'Rejeitado',
  REJEITADO: 'Rejeitado',
  PENDING: 'Pendente',
  PENDENTE: 'Pendente',
  AUTHORIZED: 'Autorizado',
  AUTORIZADO: 'Autorizado',
  REMOVED: 'Removido',
  REMOVIDO: 'Removido',
  PROGRAMADA: 'Programada',
  EM_VOTACAO: 'Em votação',
  EM_VOTAÇÃO: 'Em votação',
  CONCLUIDA: 'Concluída',
  CONCLUÍDA: 'Concluída',
  RESULTADOS_PUBLICADOS: 'Resultados publicados',
  DRAFT: 'Rascunho',
  PUBLISHED: 'Publicado',
}

const allowedAuditActions = [
  'VOTO_REGISTADO',
  'ELEICAO_CRIADA',
  'ELEICAO_ACTUALIZADA',
  'ESTADO_ELEICAO_ALTERADO_AUTOMATICAMENTE',
  'MEMBRO_REGISTADO',
  'CANDIDATO_SELECCIONADO',
  'RESULTADOS_PRESENCIAIS_GUARDADOS',
  'RESULTADOS_PRESENCIAIS_REGISTADOS',
  'RESULTADOS_PRESENCIAIS_APROVADOS',
  'RESULTADOS_PUBLICADOS',
  'REGISTO_OCULTADO',
  'REGISTO_ELIMINADO',
  'REGISTO_SUSPENSO',
  'REGISTO_ACTIVADO',
  'REGISTO_CRIADO',
  'ELEICAO_CONCLUIDA',
  'ELEITORES_AUTORIZADOS',
  'EQUIPA_ELEICAO_ACTUALIZADA',
]

const actionAliases = {
  VOTOU: 'VOTO_REGISTADO',
  VOTE_CAST: 'VOTO_REGISTADO',
  VOTO_EFECTUADO: 'VOTO_REGISTADO',

  CRIACAO_DE_ELEICAO: 'ELEICAO_CRIADA',
  ELECTION_CREATED: 'ELEICAO_CRIADA',

  ACTUALIZACAO_DE_ELEICAO: 'ELEICAO_ACTUALIZADA',
  ELECTION_UPDATED: 'ELEICAO_ACTUALIZADA',

  ALTERACAO_DE_ESTADO_DE_ELEICAO: 'ESTADO_ELEICAO_ALTERADO_AUTOMATICAMENTE',
  ALTERACAO_AUTOMATICA_DE_ESTADO_DE_ELEICAO: 'ESTADO_ELEICAO_ALTERADO_AUTOMATICAMENTE',
  ELEICAO_ESTADO_ACTUALIZADO: 'ESTADO_ELEICAO_ALTERADO_AUTOMATICAMENTE',

  REGISTO_DE_MEMBRO: 'MEMBRO_REGISTADO',
  MEMBER_CREATED: 'MEMBRO_REGISTADO',

  SELECCAO_DE_CANDIDATO: 'CANDIDATO_SELECCIONADO',
  CANDIDATO_REGISTADO: 'CANDIDATO_SELECCIONADO',
  CANDIDATE_CREATED: 'CANDIDATO_SELECCIONADO',

  RESULTADOS_PRESENCIAIS_SALVOS: 'RESULTADOS_PRESENCIAIS_GUARDADOS',
  RESULTADOS_PRESENCIAIS_INSERIDOS: 'RESULTADOS_PRESENCIAIS_REGISTADOS',
  RESULTADOS_PRESENCIAIS_CRIADOS: 'RESULTADOS_PRESENCIAIS_REGISTADOS',

  RESULTS_PUBLISHED_AUTOMATICALLY: 'RESULTADOS_PUBLICADOS',
  RESULTADO_PUBLICADO: 'RESULTADOS_PUBLICADOS',

  OCULTADO: 'REGISTO_OCULTADO',
  HIDE: 'REGISTO_OCULTADO',
  HIDDEN: 'REGISTO_OCULTADO',
  ELIMINADO: 'REGISTO_ELIMINADO',
  ELIMINADA: 'REGISTO_ELIMINADO',
  DELETED: 'REGISTO_ELIMINADO',
  ELEITOR_REMOVIDO: 'REGISTO_ELIMINADO',

  SUSPENSA: 'REGISTO_SUSPENSO',
  SUSPENSO: 'REGISTO_SUSPENSO',
  SUSPENDED: 'REGISTO_SUSPENSO',

  ACTIVADA: 'REGISTO_ACTIVADO',
  ACTIVO: 'REGISTO_ACTIVADO',
  ACTIVATED: 'REGISTO_ACTIVADO',

  CREATE: 'REGISTO_CRIADO',
  CREATED: 'REGISTO_CRIADO',
  REGISTO_DE_CRIACAO: 'REGISTO_CRIADO',

  CONCLUIDA: 'ELEICAO_CONCLUIDA',
  ELEICAO_FINALIZADA: 'ELEICAO_CONCLUIDA',

  CREDENCIAIS_GERADAS: 'ELEITORES_AUTORIZADOS',
  ELEITORES_ADICIONADOS: 'ELEITORES_AUTORIZADOS',

  EQUIPA_DE_ELEICAO_ACTUALIZADA: 'EQUIPA_ELEICAO_ACTUALIZADA',
  ELECTION_TEAM_UPDATED: 'EQUIPA_ELEICAO_ACTUALIZADA',
}

const actionLabels = {
  VOTO_REGISTADO: 'Voto registado',
  ELEICAO_CRIADA: 'Eleição criada',
  ELEICAO_ACTUALIZADA: 'Eleição actualizada',
  ESTADO_ELEICAO_ALTERADO_AUTOMATICAMENTE: 'Estado da eleição alterado automaticamente',
  MEMBRO_REGISTADO: 'Membro registado',
  CANDIDATO_SELECCIONADO: 'Candidato seleccionado',
  RESULTADOS_PRESENCIAIS_GUARDADOS: 'Resultados presenciais guardados',
  RESULTADOS_PRESENCIAIS_REGISTADOS: 'Resultados presenciais registados',
  RESULTADOS_PRESENCIAIS_APROVADOS: 'Resultados presenciais aprovados',
  RESULTADOS_PUBLICADOS: 'Resultados publicados',
  REGISTO_OCULTADO: 'Registo ocultado',
  REGISTO_ELIMINADO: 'Registo eliminado',
  REGISTO_SUSPENSO: 'Registo suspenso',
  REGISTO_ACTIVADO: 'Registo activo',
  REGISTO_CRIADO: 'Registo criado',
  ELEICAO_CONCLUIDA: 'Eleição concluída',
  ELEITORES_AUTORIZADOS: 'Eleitores autorizados',
  EQUIPA_ELEICAO_ACTUALIZADA: 'Equipa da eleição actualizada',
}

const entityLabels = {
  User: 'Utilizador',
  users: 'Utilizador',
  Election: 'Eleição',
  elections: 'Eleição',
  Vote: 'Voto',
  votes: 'Voto',
  Candidate: 'Candidato',
  candidates: 'Candidato',
  Member: 'Membro',
  members: 'Membro',
  Setting: 'Configuração',
  settings: 'Configuração',
  ElectionTeam: 'Equipa da eleição',
  election_team: 'Equipa da eleição',
  ElectionVoter: 'Eleitor autorizado',
  election_voters: 'Eleitor autorizado',
  PhysicalVoteTotal: 'Resultado presencial',
  physical_vote_totals: 'Resultado presencial',
  Notification: 'Notificacao',
  notifications: 'Notificacao',
  Delegation: 'Delegação',
  delegations: 'Delegação',
  Organ: 'Órgão',
  organs: 'Órgão',
  Position: 'Cargo',
  positions: 'Cargo',
}

const detailLabels = {
  election: 'Eleição',
  election_title: 'Eleição',
  title: 'Título',
  previous_status: 'Estado anterior',
  old_status: 'Estado anterior',
  status: 'Estado actual',
  new_status: 'Estado actual',
  note: 'Nota',
  rule: 'Regra',
  user: 'Utilizador',
  user_name: 'Utilizador',
  member: 'Membro',
  member_name: 'Membro',
  candidate: 'Candidato',
  candidate_name: 'Candidato',
  position: 'Cargo',
  position_name: 'Cargo',
  delegation: 'Delegação',
  delegation_name: 'Delegação',
  is_blank: 'Voto em branco',
  fields: 'Campos alterados',
  record_name: 'Registo efectuado',
  total_votes: 'Total de votos',
  online_votes: 'Votos online',
  physical_votes: 'Votos presenciais',
  presential_votes: 'Votos presenciais',
  blank_votes: 'Votos em branco',
  has_physical_results: 'Inclui votos presenciais',
}

const hiddenDetailKeys = new Set([
  'ip',
  'user_agent',
  'password',
  'remember_token',
  'token',
])

const canonicalAction = (value) => {
  const action = String(value ?? '').trim()

  return actionAliases[action] || action
}

const isAllowedAction = (action) => allowedAuditActions.includes(canonicalAction(action))

const humaniseAction = (value) => {
  const action = canonicalAction(value)

  return actionLabels[action] || 'Acção não identificada'
}

const humaniseEntity = (value) => entityLabels[value] || String(value || 'Sistema')

const translateValue = (value) => {
  if (value === null || value === undefined || value === '') return 'Não informado'
  if (typeof value === 'boolean') return value ? 'Sim' : 'Não'
  if (Array.isArray(value)) return value.map(translateValue).join(', ')

  if (typeof value === 'object') {
    if (value.name) return value.name
    if (value.title) return value.title
    if (value.description) return value.description

    return Object.entries(value)
      .filter(([key]) => !hiddenDetailKeys.has(key) && !String(key).endsWith('_id') && key !== 'id')
      .map(([key, item]) => `${detailLabel(key)}: ${translateValue(item)}`)
      .join('; ')
  }

  const text = String(value)

  return statusLabels[text] || statusLabels[text.toUpperCase()] || text
}

const detailLabel = (key) => detailLabels[key] || String(key).replaceAll('_', ' ')

const formatDetails = (row) => {
  if (Array.isArray(row.description_lines) && row.description_lines.length) {
    return row.description_lines.map(translateValue)
  }

  const details = row.details

  if (!details) return [row.description || 'Sem detalhes adicionais.']

  if (typeof details === 'string') {
    try {
      return formatDetails({ ...row, details: JSON.parse(details) })
    } catch {
      return [details]
    }
  }

  if (Array.isArray(details)) return details.map((item) => translateValue(item))

  const lines = Object.entries(details)
    .filter(([key, value]) => (
      !hiddenDetailKeys.has(key)
      && value !== null
      && value !== undefined
      && key !== 'id'
      && !String(key).endsWith('_id')
    ))
    .map(([key, value]) => `${detailLabel(key)}: ${translateValue(value)}`)
    .filter(Boolean)

  return lines.length ? lines : ['Sem detalhes adicionais.']
}

const displayUser = (row) => {
  if (row.user?.name) return row.user.name
  if (row.user_name) return row.user_name

  return 'Acção automática do sistema'
}

const displayEntity = (row) => {
  if (row.entity_display) return row.entity_display

  const entity = humaniseEntity(row.entity)
  const details = typeof row.details === 'object' && row.details !== null ? row.details : {}

  const name =
    row.entity_name
    || details.name
    || details.title
    || details.member_name
    || details.candidate_name
    || details.election_title

  return name ? `${entity}: ${name}` : entity
}

export default function AuditPage() {
  const [page, setPage] = useState(1)
  const [pageSize, setPageSize] = useState(DEFAULT_PAGE_SIZE)
  const [query, setQuery] = useState('')
  const [actionFilter, setActionFilter] = useState('')
  const [dateFilter, setDateFilter] = useState('')
  const [rows, setRows] = useState([])
  const [selectedLog, setSelectedLog] = useState(null)
  const [loading, setLoading] = useState(true)
  const [searchParams] = useSearchParams()
  const selectedId = searchParams.get('eleição') || searchParams.get('eleicao')

  useEffect(() => {
    setLoading(true)

    auditService.list(selectedId ? { election_id: selectedId } : {})
      .then((records) => {
        setRows(records.filter((row) => isAllowedAction(row.action)))
      })
      .catch((error) => {
        notify.error(
          'Não foi possível carregar auditoria.',
          error.response?.data?.message || 'Verifique a API.',
        )
      })
      .finally(() => setLoading(false))
  }, [selectedId])

  const filteredRows = useMemo(() => {
    const term = normalize(query)

    return rows.filter((row) => {
      const detailsText = formatDetails(row).join(' ')
      const text = normalize(`${formatDateTime(row.created_at, row.updated_at)} ${displayUser(row)} ${humaniseAction(row.action)} ${displayEntity(row)} ${detailsText}`)
      const rowDate = String(row.created_at || row.updated_at || '').slice(0, 10)

      return (!term || text.includes(term))
        && (!actionFilter || canonicalAction(row.action) === actionFilter)
        && (!dateFilter || rowDate === dateFilter)
    })
  }, [actionFilter, dateFilter, query, rows])

  useEffect(() => {
    const totalPages = Math.max(1, Math.ceil(filteredRows.length / pageSize))

    if (page > totalPages) setPage(totalPages)
  }, [filteredRows.length, page, pageSize])

  const actions = allowedAuditActions
  const safePage = Math.min(page, Math.max(1, Math.ceil(filteredRows.length / pageSize)))
  const pageRows = filteredRows.slice((safePage - 1) * pageSize, safePage * pageSize)
  const firstRow = filteredRows.length ? (safePage - 1) * pageSize + 1 : 0
  const lastRow = Math.min(safePage * pageSize, filteredRows.length)

  if (loading) return <Loading label="A carregar auditoria..." />

  return (
    <section className="management-page report-page">
      <div className="management-title-row">
        <header className="management-header">
          <h1>Auditoria</h1>
          <p>Consulte apenas as acções relevantes registadas no sistema.</p>
        </header>
        <button
          className="primary-action-button top-create-button"
          type="button"
          disabled={filteredRows.length === 0}
          title={filteredRows.length === 0 ? 'Não existem dados para exportar' : 'Exportar registos de auditoria'}
          onClick={() => exportCsv(
            'auditoria',
            ['Data/Hora', 'Utilizador', 'Acção', 'Entidade', 'Descrição'],
            filteredRows.map((row) => [
              formatDateTime(row.created_at, row.updated_at),
              displayUser(row),
              humaniseAction(row.action),
              displayEntity(row),
              formatDetails(row).join('; '),
            ]),
          )}
        >
          <Download size={18} />
          Exportar logs
        </button>
      </div>

      <section className="filters-panel audit-filters" aria-label="Filtros de auditoria">
        <label className="filter-field">
          <select value={actionFilter} onChange={(event) => { setActionFilter(event.target.value); setPage(1) }}>
            <option value="">Todos os tipos</option>
            {actions.map((action) => <option key={action} value={action}>{humaniseAction(action)}</option>)}
          </select>
        </label>
        <DatePicker value={dateFilter} onChange={(nextDate) => { setDateFilter(nextDate); setPage(1) }} ariaLabel="Filtrar auditoria por data" />
        <label className="filter-field filter-search">
          <Search size={20} />
          <input
            placeholder="Pesquisar auditoria..."
            value={query}
            onChange={(event) => { setQuery(event.target.value); setPage(1) }}
          />
        </label>
        <ClearFiltersButton
          active={Boolean(query || actionFilter || dateFilter)}
          onClick={() => { setQuery(''); setActionFilter(''); setDateFilter(''); setPage(1) }}
        />
      </section>

      <section className="table-card audit-table">
        <table>
          <thead>
            <tr>
              <th>Data/Hora</th>
              <th>Utilizador</th>
              <th>Acção</th>
              <th>Entidade</th>
              <th>Descrição</th>
              <th>Consultar</th>
            </tr>
          </thead>
          <tbody>
            {pageRows.length === 0 ? (
              <tr>
                <td colSpan="6" className="empty-table-message">Sem auditorias para apresentar.</td>
              </tr>
            ) : pageRows.map((row) => (
              <tr key={row.id}>
                <td data-label="Data/Hora">{formatDateTime(row.created_at, row.updated_at)}</td>
                <td data-label="Utilizador" className="title-cell">{displayUser(row)}</td>
                <td data-label="Acção"><span className="audit-tag">{humaniseAction(row.action)}</span></td>
                <td data-label="Entidade">{displayEntity(row)}</td>
                <td data-label="Descrição">{formatDetails(row)[0]}</td>
                <td data-label="Consultar">
                  <RowActions
                    title={`Auditoria de ${displayUser(row)}`}
                    onView={() => setSelectedLog(row)}
                    hideDelete
                    disableEdit
                    disableStatus
                  />
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        <footer className="table-footer">
          <span className="table-footer__summary" aria-label={`${firstRow}-${lastRow} de ${filteredRows.length} resultados`}>
            <strong>{firstRow}-{lastRow} de {filteredRows.length}</strong><span className="table-footer__summary-label">resultados</span>
          </span>
          <ManagementPagination
            totalItems={filteredRows.length}
            page={safePage}
            pageSize={pageSize}
            onPageChange={setPage}
            onPageSizeChange={(nextPageSize) => { setPageSize(nextPageSize); setPage(1) }}
          />
        </footer>
      </section>

      {selectedLog ? createPortal(
        <div className="modal-overlay audit-details-overlay" role="dialog" aria-modal="true" onClick={() => setSelectedLog(null)}>
          <article className="action-dialog audit-details-dialog professional-modal-card" onClick={(event) => event.stopPropagation()}>
            <header>
              <h2>Detalhes da auditoria</h2>
              <button className="modal-close-button" type="button" aria-label="Fechar" onClick={() => setSelectedLog(null)}><X size={20} /></button>
            </header>
            <div className="audit-detail-grid">
              <span><strong>Data/Hora</strong>{formatDateTime(selectedLog.created_at, selectedLog.updated_at)}</span>
              <span><strong>Utilizador</strong>{displayUser(selectedLog)}</span>
              <span><strong>Acção</strong>{humaniseAction(selectedLog.action)}</span>
              <span><strong>Entidade</strong>{displayEntity(selectedLog)}</span>
            </div>
            <div className="audit-detail-list">
              {formatDetails(selectedLog).map((line, index) => <p key={`${line}-${index}`}>{line}</p>)}
            </div>
          </article>
        </div>,
        document.body,
      ) : null}
    </section>
  )
}
