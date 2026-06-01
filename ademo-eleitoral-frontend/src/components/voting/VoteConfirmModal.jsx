import { CheckCircle2, XCircle } from "lucide-react";
import { createPortal } from "react-dom";

export default function VoteConfirmModal({
  candidate,
  onConfirm,
  onCancel,
  isSubmitting,
}) {
  return createPortal(
    <div className="modal-overlay" onClick={onCancel}>
      <div className="vote-confirm-modal" onClick={(e) => e.stopPropagation()}>
        <button
          className="modal-close"
          onClick={onCancel}
          type="button"
          aria-label="Fechar"
        >
          <XCircle size={24} />
        </button>

        <div className="modal-content">
          <div className="modal-icon success">
            <CheckCircle2 size={48} />
          </div>

          <h2>Confirme sua Votação</h2>
          <p>Tem certeza que deseja votar em:</p>

          <div className="modal-candidate-info">
            <h3>{candidate.name}</h3>
            <small>{candidate.delegation}</small>
          </div>

          <p className="modal-warning">
            Após confirmar, não será possível alterar sua escolha.
          </p>

          <div className="modal-actions">
            <button
              className="secondary-button"
              onClick={onCancel}
              type="button"
              disabled={isSubmitting}
            >
              Cancelar
            </button>
            <button
              className="primary-action-button"
              onClick={onConfirm}
              type="button"
              disabled={isSubmitting}
            >
              {isSubmitting ? "Confirmando..." : "Confirmar Voto"}
            </button>
          </div>
        </div>
      </div>
    </div>,
    document.body,
  );
}
