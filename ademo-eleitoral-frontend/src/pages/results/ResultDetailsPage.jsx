import { useEffect, useMemo, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import { ArrowLeft, BarChart3, Trophy } from 'lucide-react'
import Loading from '../../components/common/Loading'
import { resultService } from '../../services/resultService'
import { notify } from '../../utils/notify'
import { formatDateTime } from '../../utils/localDateTime'

export default function ResultDetailsPage() {
  const { id } = useParams()
  const [loading, setLoading] = useState(true)
  const [result, setResult] = useState(null)

  useEffect(() => {
    resultService.show(id)
      .then(setResult)
      .catch((error) => notify.error('Não foi possível carregar os detalhes do resultado.', error.response?.data?.message || 'Verifique a API.'))
      .finally(() => setLoading(false))
  }, [id])

  const rows = useMemo(() => (result?.candidates ?? []).map((item) => ({
    id: item.candidate?.id,
    name: item.candidate?.member?.name ?? `Candidato ${item.candidate?.id ?? ''}`,
    online: Number(item.online_votes ?? 0),
    physical: Number(item.physical_votes ?? 0),
    total: Number(item.votes ?? 0),
  })).sort((a, b) => b.total - a.total), [result])
  const visualRows = useMemo(() => {
    const blankVotes = Number(result?.blank_votes ?? 0)
    if (blankVotes <= 0) return rows

    return [...rows, {
      id: 'blank',
      name: 'Votos em branco',
      online: 0,
      physical: 0,
      total: blankVotes,
      isBlank: true,
    }].sort((a, b) => b.total - a.total)
  }, [result?.blank_votes, rows])

  if (loading) return <Loading label="A carregar detalhes do resultado..." />
  if (!result) return <section className="management-page"><p className="empty-table-message">Resultado não encontrado.</p></section>

  const election = result.election
  const winner = rows[0]

  return (
    <section className="management-page result-detail-page">
      <Link className="back-link" to="/resultados"><ArrowLeft size={16} /> Voltar</Link>
      <header className="management-header">
        <h1>Resultado final</h1>
        <p>{election?.title}</p>
      </header>

      <section className="election-detail-card">
        <div className="detail-title-row">
          <h2>Dados da eleição</h2>
          {winner ? <span className="winner-mini"><Trophy size={16} /> Vencedor: {winner.name}</span> : null}
        </div>
        <div className="detail-info-grid">
          <p><span>Órgão</span>{election?.organ?.name ?? 'Sem órgão'}</p>
          <p><span>Cargo</span>{election?.position?.name ?? 'Sem cargo'}</p>
          <p><span>Período</span>{formatDateTime(election?.starts_at)} até {formatDateTime(election?.ends_at)}</p>
          <p><span>Total de votos</span>{result.total_votes ?? 0}</p>
          <p><span>Votos online (válidos)</span>{result.online_votes ?? 0}</p>
          <p><span>Votos presenciais</span>{result.physical_votes ?? 0}</p>
          <p><span>Votos em branco</span>{result.blank_votes ?? 0}</p>
        </div>
      </section>

      <section className="table-card management-table-card">
        <table>
          <thead>
            <tr>
              <th>Posição</th>
              <th>Candidato</th>
              <th>Online</th>
              <th>Presencial</th>
              <th>Total</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((row, index) => (
              <tr key={row.id}>
                <td>{index + 1}.º</td>
                <td className="title-cell">{row.name}</td>
                <td>{row.online}</td>
                <td>{row.physical}</td>
                <td><strong>{row.total}</strong></td>
              </tr>
            ))}
          </tbody>
        </table>
      </section>

      <section className="partial-results-card professional-results-card">
        <header><h2><BarChart3 size={22} /> Apuramento visual</h2></header>
        <div className="results-bars">
          {visualRows.map((row) => {
            const percent = Number(result.total_votes) > 0 ? Math.round((row.total / Number(result.total_votes)) * 100) : 0
            return (
              <article className="result-bar-row" key={`bar-${row.id}`}>
                <div>
                  <span className="baixo">
                    <strong>{row.name}</strong>
                    {!row.isBlank ? <small>Online: {row.online} · Presencial: {row.physical}</small> : <small>Votos em branco apurados</small>}
                  </span>
                  <b>{percent}%</b>
                </div>
                <span className="bar-track"><span className="bar-fill" style={{ width: `${percent}%` }}></span></span>
              </article>
            )
          })}
        </div>
      </section>
    </section>
  )
}
