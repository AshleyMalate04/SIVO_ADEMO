import { useEffect, useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { BarChart3 } from 'lucide-react'
import { Bar, BarChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts'
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
    description: 'Resumo administrativo do Sistema de Votação Eleitoral da ADEMO.',
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
    const activeMembers = data.members.filter((member) => member.status === 'ACTIVE').length
    const countStatus = (...statuses) => data.elections.filter((election) => statuses.includes(election.status)).length

    if (role === 'ADMIN') {
      return [
        { label: 'Utilizadores activos', value: data.users.filter((user) => user.status === 'ACTIVE').length },
        { label: 'Membros activos', value: activeMembers },
        { label: 'Delegações', value: data.delegations.length },
        { label: 'Eleições registadas', value: data.elections.length },
      ]
    }

    if (role === 'FISCAL') {
      return [
        { label: 'Eleições atribuídas', value: data.elections.length },
        { label: 'Em votação', value: countStatus('EM_VOTACAO') },
        { label: 'Concluídas', value: countStatus('CONCLUIDA', 'RESULTADOS_PUBLICADOS') },
        { label: 'Eventos de auditoria', value: data.audits.length },
      ]
    }

    return [
      { label: 'Eleições atribuídas', value: data.elections.length },
      { label: 'Programadas', value: countStatus('PROGRAMADA') },
      { label: 'Em votação', value: countStatus('EM_VOTACAO') },
      { label: 'Membros activos', value: activeMembers },
    ]
  }, [data, role])

  const electionStatusData = useMemo(() => [
    { key: 'PROGRAMADA', label: 'Programadas', value: data.elections.filter((item) => item.status === 'PROGRAMADA').length },
    { key: 'EM_VOTACAO', label: 'Em votação', value: data.elections.filter((item) => item.status === 'EM_VOTACAO').length },
    { key: 'CONCLUIDA', label: 'Concluídas', value: data.elections.filter((item) => item.status === 'CONCLUIDA').length },
    { key: 'RESULTADOS_PUBLICADOS', label: 'Publicadas', value: data.elections.filter((item) => item.status === 'RESULTADOS_PUBLICADOS').length },
  ], [data.elections])

  const hasElectionChartData = electionStatusData.some((item) => item.value > 0)

  if (loading) return <Loading label="A carregar painel..." />

  return (
    <div className="dashboard">
      <section className="page-intro">
        <h1>{config.title}</h1>
        <p>{config.description}</p>
      </section>

      <section className="stats-grid" aria-label="Resumo">
        {stats.map((stat) => (
          <article className="stat-card" key={stat.label}>
            <span>{stat.label}</span>
            <strong>{stat.value}</strong>
          </article>
        ))}
      </section>

      <section className="dashboard-visual-grid dashboard-visual-single" aria-label="Gráfico do painel">
        <article className="dashboard-insight-card" aria-labelledby="election-status-title">
          <div className="dashboard-insight-heading">
            <div><h2 id="election-status-title">Estado das eleições</h2><p>Quantidade de eleições em cada etapa do processo.</p></div>
          </div>
          <div className="dashboard-chart-layout">
            <div className="dashboard-chart" role="img" aria-label="Gráfico com a quantidade de eleições por estado">
              {hasElectionChartData ? <ResponsiveContainer width="100%" height="100%" minWidth={0} minHeight={220} initialDimension={{ width: 620, height: 235 }}>
                <BarChart data={electionStatusData} margin={{ top: 10, right: 8, left: -16, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="4 4" vertical={false} stroke="#e3e6e8" />
                  <XAxis dataKey="label" tick={{ fill: '#525b5f', fontSize: 13 }} axisLine={false} tickLine={false} />
                  <YAxis allowDecimals={false} tick={{ fill: '#6a7478', fontSize: 13 }} axisLine={false} tickLine={false} />
                  <Tooltip cursor={{ fill: '#f5f6f7' }} formatter={(value) => [`${value} eleição${value === 1 ? '' : 'ões'}`, 'Total']} />
                  <Bar dataKey="value" fill="#b4232a" radius={[3, 3, 0, 0]} maxBarSize={50} />
                </BarChart>
              </ResponsiveContainer> : <div className="dashboard-chart-empty"><BarChart3 size={28} /><strong>Sem eleições registadas</strong><span>O gráfico será preenchido quando existirem dados.</span></div>}
            </div>
            <ul className="dashboard-chart-summary" aria-label="Valores do gráfico">
              {electionStatusData.map((item) => <li key={item.key}><span>{item.label}</span><strong>{item.value}</strong></li>)}
            </ul>
          </div>
        </article>

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
                  <th>Estado</th>
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
                    <td><span className={`status-pill ${getElectionStatusClass(election.status)}`}>{getElectionStatusLabel(election.status)}</span></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>
      ) : null}

    </div>
  )
}
