import { X } from "lucide-react";
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
          <X size={20} />
        </button>

        <div className="modal-content">
          <h2>Confirme o seu voto</h2>
          <p>Vai votar em:</p>

          <div className="modal-candidate-info">
            <h3>{candidate.name}</h3>
            <small>{candidate.delegation}</small>
          </div>

          <p className="modal-warning">
            Após confirmar, não será possível alterar a sua escolha.
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
              {isSubmitting ? "A confirmar..." : "Confirmar voto"}
            </button>
          </div>
        </div>
      </div>
    </div>,
    document.body,
  );
}
