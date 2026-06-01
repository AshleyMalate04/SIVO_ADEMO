import { Link, useParams } from 'react-router-dom'
import { ArrowLeft, CheckCircle2, TriangleAlert } from 'lucide-react'

export default function VoteConfirmPage() {
  const { eleicaoId } = useParams()

  return (
    <section className="voter-page confirm-vote-page">
      <header className="management-header">
        <h1>Confirmar Voto</h1>
        <p>Última verificação antes de submeter definitivamente.</p>
      </header>

      <section className="confirm-card">
        <h2>Está prestes a confirmar o seu voto:</h2>
        <div className="vote-summary-box">
          <p><strong>Eleição:</strong> Eleição para Presidente da Mesa da Assembleia 2026</p>
          <p><strong>Cargo:</strong> Presidente</p>
          <p><strong>Escolha:</strong> Maria Ana</p>
        </div>
        <div className="vote-warning">
          <TriangleAlert size={24} />
          <strong>Depois de confirmar, o voto não poderá ser alterado.</strong>
        </div>
        <div className="form-footer">
          <Link className="secondary-button" to={`/portal-eleitor/votacoes/${eleicaoId}`}>
            <ArrowLeft size={18} />
            Voltar e alterar
          </Link>
          <Link className="primary-action-button" to="/portal-eleitor/votacoes/sucesso">
            <CheckCircle2 size={18} />
            Confirmar voto
          </Link>
        </div>
      </section>
    </section>
  )
}
