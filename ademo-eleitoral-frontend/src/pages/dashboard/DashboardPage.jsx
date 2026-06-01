import { useEffect, useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { ArrowDown, Building2, CalendarCheck, FileText, ShieldCheck, Users } from 'lucide-react'
import Loading from '../../components/common/Loading'
import { auditService } from '../../services/auditService'
import { delegationService } from '../../services/delegationService'
import { electionService } from '../../services/electionService'
import { memberService } from '../../services/memberService'
import { userService } from '../../services/userService'
import { getElectionStatusClass, getElectionStatusLabel } from '../../data/elections'
import { useAuth } from '../../hooks/useAuth'

const roleConfig = {
  ADMIN: {
    title: 'Painel do administrador',
    description: 'Resumo administrativo do sistema eleitoral da ADEMO.',
    showElections: true,
    showAudit: false,
  },
  COMMISSION: {
    title: 'Visão geral',
    description: 'Acompanhe as eleições atribuídas à comissão e a preparação do processo eleitoral.',
    showElections: true,
    showAudit: false,
  },
  COMISSAO: {
    title: 'Visão geral',
    description: 'Acompanhe as eleições atribuídas à comissão e a preparação do processo eleitoral.',
    showElections: true,
    showAudit: false,
  },
  FISCAL: {
    title: 'Painel do fiscal',
    description: 'Acompanhe eleições atribuídas, resultados e actividade auditável.',
    showElections: true,
    showAudit: true,
  },
}

const formatDateTime = (value) => {
  if (!value) return 'Sem data'
  const [datePart, timePart = ''] = String(value).replace(' ', 'T').split('T')
  const [year, month, day] = datePart.split('-')
  const [hour = '00', minute = '00'] = timePart.split(':')

  if (!year || !month || !day) return String(value)

  return `${day}/${month}/${year}, ${hour}:${minute}`
}

export default function DashboardPage() {
  const { role } = useAuth()
  const config = roleConfig[role] ?? roleConfig.COMISSAO
  const [loading, setLoading] = useState(true)
  const [data, setData] = useState({
    elections: [],
    delegations: [],
    members: [],
    users: [],
    audits: [],
  })

  useEffect(() => {
    Promise.allSettled([
      electionService.list(),
      delegationService.list(),
      memberService.list(),
      role === 'ADMIN' ? userService.list() : Promise.resolve([]),
      config.showAudit ? auditService.list() : Promise.resolve([]),
    ]).then(([elections, delegations, members, users, audits]) => {
      setData({
        elections: elections.status === 'fulfilled' ? elections.value : [],
        delegations: delegations.status === 'fulfilled' ? delegations.value : [],
        members: members.status === 'fulfilled' ? members.value : [],
        users: users.status === 'fulfilled' ? users.value : [],
        audits: audits.status === 'fulfilled' ? audits.value : [],
      })
    }).finally(() => setLoading(false))
  }, [config.showAudit, role])

  const stats = useMemo(() => {
    if (role === 'ADMIN') {
      return [
        { label: 'Utilizadores activos', value: data.users.filter((user) => user.status === 'ACTIVE').length, icon: Users },
        { label: 'Delegações', value: data.delegations.length, icon: Building2 },
        { label: 'Eleições registadas', value: data.elections.length, icon: FileText },
      ]
    }

    if (role === 'FISCAL') {
      return [
        { label: 'Eleições atribuídas', value: data.elections.length, icon: CalendarCheck },
        { label: 'Em votação', value: data.elections.filter((election) => election.status === 'EM_VOTACAO').length, icon: ShieldCheck },
        { label: 'Eventos de auditoria', value: data.audits.length, icon: FileText },
      ]
    }

    return [
      { label: 'Eleições atribuídas', value: data.elections.length, icon: CalendarCheck },
      { label: 'Programadas', value: data.elections.filter((election) => election.status === 'PROGRAMADA').length, icon: Building2 },
      { label: 'Membros activos', value: data.members.filter((member) => member.status === 'ACTIVE').length, icon: Users },
    ]
  }, [data, role])

  if (loading) return <Loading label="A carregar painel..." />

  return (
    <div className="dashboard">
      <section className="page-intro">
        <h1>{config.title}</h1>
        <p>{config.description}</p>
      </section>

      <section className="stats-grid" aria-label="Resumo">
        {stats.map((stat) => {
          const Icon = stat.icon

          return (
            <article className="stat-card" key={stat.label}>
              <div>
                <span>{stat.label}</span>
                <strong>{stat.value}</strong>
              </div>
              <div className="stat-icon">
                <Icon size={27} strokeWidth={2} />
              </div>
            </article>
          )
        })}
      </section>

      {config.showElections ? (
        <section className="recent-elections">
          <div className="section-heading">
            <h2>Eleições recentes</h2>
            <Link to="/eleicoes">Ver todas</Link>
          </div>

          <div className="table-card">
            <table>
              <thead>
                <tr>
                  <th>Título</th>
                  <th>Órgão</th>
                  <th>Cargo</th>
                  <th>Delegação</th>
                  <th>Início</th>
                  <th><span className="state-heading">Estado <ArrowDown size={18} /></span></th>
                </tr>
              </thead>
              <tbody>
                {data.elections.slice(0, 5).length === 0 ? (
                  <tr>
                    <td colSpan="6" className="empty-table-message">Sem eleições para apresentar.</td>
                  </tr>
                ) : data.elections.slice(0, 5).map((election) => (
                  <tr key={election.id}>
                    <td className="title-cell"><Link to={`/eleicoes/${election.id}`}>{election.title}</Link></td>
                    <td>{election.organ?.name ?? 'Sem órgão'}</td>
                    <td>{election.position?.name ?? 'Sem cargo'}</td>
                    <td>{election.delegation?.name ?? 'Geral'}</td>
                    <td>{formatDateTime(election.starts_at)}</td>
                    <td><span className={`status-pill ${getElectionStatusClass(election.status)}`}><span></span>{getElectionStatusLabel(election.status)}</span></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>
      ) : null}

      {/* {config.showAudit ? (
        <section className="recent-elections">
          <div className="section-heading">
            <h2>Auditorias gerais do sistema</h2>
          </div>
          <section className="filters-panel" aria-label="Filtros de auditoria geral">
            <label className="filter-field filter-search">
              <Search size={20} />
              <input placeholder="Pesquisar por acção, utilizador, entidade ou IP" />
            </label>
          </section>
          <div className="table-card audit-table">
            <table>
              <thead>
                <tr>
                  <th>Data/Hora</th>
                  <th>Utilizador</th>
                  <th>Acção</th>
                  <th>Entidade</th>
                  <th>IP</th>
                </tr>
              </thead>
              <tbody>
                {data.audits.slice(0, 5).length === 0 ? (
                  <tr>
                    <td colSpan="5" className="empty-table-message">Sem auditorias para apresentar.</td>
                  </tr>
                ) : data.audits.slice(0, 5).map((row) => (
                  <tr key={row.id}>
                    <td>{formatDateTime(row.created_at)}</td>
                    <td className="title-cell">{row.user?.name ?? 'Sistema'}</td>
                    <td><span className="audit-tag">{row.action}</span></td>
                    <td><code>{row.entity}</code></td>
                    <td>{row.ip ?? 'Sem IP'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>
      ) : null} */}
    </div>
  )
}
