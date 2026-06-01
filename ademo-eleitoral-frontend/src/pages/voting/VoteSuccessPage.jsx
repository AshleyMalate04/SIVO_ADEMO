import { Link } from 'react-router-dom'
import { CheckCircle2 } from 'lucide-react'

export default function VoteSuccessPage() {
  return (
    <section className="voter-page vote-success-page">
      <div className="vote-success-card">
        <div className="success-icon"><CheckCircle2 size={74} /></div>
        <h1>Voto registado com sucesso</h1>
        <p>O seu voto foi registado no sistema para Eleição para Presidente da Mesa da Assembleia 2026.</p>
        <div className="receipt-card">
          <span>Comprovativo</span>
          <strong>ADEMO-2026-X9F2A1</strong>
          <p>Este código confirma a sua participação, mas não revela a sua escolha.</p>
        </div>
        <div className="form-actions">
          <Link className="secondary-button" to="/portal-eleitor/votacoes">Voltar ao painel</Link>
          <Link className="primary-action-button" to="/portal-eleitor/resultados">Ver resultados desta eleição</Link>
        </div>
      </div>
    </section>
  )
}
