import { Link } from "react-router-dom";
import FeedbackCard from "../../components/common/FeedbackCard";

export default function UnauthorizedPage() {
  return (
    <div className="management-page">
      <FeedbackCard
        title="Acesso não autorizado"
        message="A sua conta não tem permissão para abrir esta área."
      />
      <Link className="primary-button" to="/dashboard">
        Voltar ao painel
      </Link>
    </div>
  );
}
