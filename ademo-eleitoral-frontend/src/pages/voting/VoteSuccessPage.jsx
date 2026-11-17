import { Link, useLocation } from 'react-router-dom'
import { CheckCircle2 } from 'lucide-react'

export default function VoteSuccessPage() {
  const { state } = useLocation()
  const receiptCode = state?.receiptCode
  const electionTitle = state?.electionTitle
  const resultsPath = state?.electionId
    ? `/portal-eleitor/resultados?eleicao=${state.electionId}`
    : '/portal-eleitor/resultados'

  return (
    <section className="voter-page vote-success-page">
      <div className="vote-success-card">
        <div className="success-icon"><CheckCircle2 size={56} /></div>
        <h1>Voto registado</h1>
        <p>
          {electionTitle
            ? `O seu voto na eleição "${electionTitle}" foi registado no sistema.`
            : 'O seu voto foi registado no sistema.'}
        </p>
        {receiptCode ? (
          <div className="receipt-card">
            <span>Comprovativo</span>
            <strong>{receiptCode}</strong>
            <p>Este código confirma a sua participação, mas não revela a sua escolha. Guarde-o se precisar de comprovar que votou.</p>
          </div>
        ) : null}
        <div className="form-actions">
          <Link className="secondary-button" to="/portal-eleitor/votacoes">Voltar às eleições</Link>
          <Link className="primary-action-button" to={resultsPath}>Ver resultados</Link>
        </div>
      </div>
    </section>
  )
}
