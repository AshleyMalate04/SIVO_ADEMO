import { useEffect, useMemo, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { ArrowLeft } from "lucide-react";
import FormError from "../../components/common/FormError";
import Loading from "../../components/common/Loading";
import VoteConfirmModal from "../../components/voting/VoteConfirmModal";
import { voteService } from "../../services/voteService";
import { getApiErrorMessage } from "../../utils/apiError";
import { notify } from "../../utils/notify";

const formatTime = (seconds) => {
  const safeSeconds = Math.max(0, seconds);
  const hours = String(Math.floor(safeSeconds / 3600)).padStart(2, "0");
  const minutes = String(Math.floor((safeSeconds % 3600) / 60)).padStart(2, "0");
  const rest = String(safeSeconds % 60).padStart(2, "0");

  return `${hours}:${minutes}:${rest}`;
};

const secondsUntil = (value) => {
  if (!value) return 0;
  return Math.max(0, Math.floor((new Date(value).getTime() - Date.now()) / 1000));
};

export default function BallotPage() {
  const navigate = useNavigate();
  const { eleicaoId } = useParams();
  const storageKey = useMemo(() => `ademo-ballot-selection-${eleicaoId || "default"}`, [eleicaoId]);
  const [selectedOption, setSelectedOption] = useState(() => sessionStorage.getItem(storageKey) || "");
  const [remainingSeconds, setRemainingSeconds] = useState(0);
  const [payload, setPayload] = useState(null);
  const [error, setError] = useState("");
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    voteService.ballot(eleicaoId)
      .then((data) => {
        const options = [
          ...(data.candidates ?? []).map((candidate) => ({
            id: candidate.id,
            name: candidate.member?.name ?? "Sem nome",
            delegation: candidate.member?.delegation?.name ?? "Sem delegação",
            photo: candidate.photo_path || "",
            isBlank: false,
          })),
          ...(data.election?.allow_blank_vote ? [{ id: "blank", name: "Voto em branco", delegation: "Sem escolha de candidato", photo: "", isBlank: true }] : []),
        ];
        setPayload({ ...data, options });
        setRemainingSeconds(secondsUntil(data.election?.ends_at));
        if (data.has_voted) {
          notify.success("Voto já registado.", "Você já votou nesta eleição. O boletim fica apenas para consulta.");
        }
        if (!selectedOption && options[0]) setSelectedOption(String(options[0].id));
      })
      .catch((error) => notify.error("Não foi possível carregar o boletim.", error.response?.data?.message || "Verifique a API."))
      .finally(() => setLoading(false));
  }, [eleicaoId, selectedOption]);

  const selectedCandidate = payload?.options?.find((candidate) => String(candidate.id) === selectedOption);

  useEffect(() => {
    sessionStorage.setItem(storageKey, selectedOption);
  }, [selectedOption, storageKey]);

  useEffect(() => {
    const timer = window.setInterval(() => {
      setRemainingSeconds((current) => Math.max(0, current - 1));
    }, 1000);

    return () => window.clearInterval(timer);
  }, []);

  function handleContinue(event) {
    event.preventDefault();

    if (!payload?.is_authorized_voter) {
      notify.warning("Sem autorização.", "Você não foi seleccionado para votar nesta eleição.");
      return;
    }

    if (payload?.has_voted) {
      notify.warning("Voto já registado.", "Você já votou nesta eleição e não pode votar novamente.");
      return;
    }

    if (!payload?.can_vote) {
      notify.warning("Votação indisponível.", "Esta eleição não está aberta para votação neste momento.");
      return;
    }

    if (!selectedOption) {
      setError("Seleccione uma opção para continuar.");
      notify.error("Escolha obrigatória.", "Seleccione uma opção para continuar.");
      return;
    }

    notify.warning("Confirme a sua escolha.", "Revise o voto antes de submeter definitivamente.");
    setShowConfirmModal(true);
  }

  async function handleConfirmVote() {
    try {
      setIsSubmitting(true);
      await voteService.confirm(eleicaoId, {
        member_id: payload.member_id,
        candidate_id: selectedCandidate?.isBlank ? null : Number(selectedCandidate.id),
        is_blank: Boolean(selectedCandidate?.isBlank),
      });
      notify.success("Voto registado com sucesso.", "O seu voto foi recebido pelo sistema.");
      navigate(`/portal-eleitor/votacoes/sucesso`);
    } catch (error) {
      notify.error("Voto não registado.", getApiErrorMessage(error));
    } finally {
      setIsSubmitting(false);
    }
  }

  if (loading) return <Loading label="A carregar boletim..." />;

  return (
    <>
      <form className="voter-page ballot-page" onSubmit={handleContinue}>
        <header className="management-header">
          <h1>Boletim de Voto</h1>
          <p>Seleccione o candidato pretendido. Pode consultar os detalhes antes de confirmar.</p>
        </header>

        <section className="ballot-panel">
          <section className="ballot-election-summary">
            <span>Eleição</span>
            <h2>{payload?.election?.title ?? "Eleição"}</h2>
            <p><strong>Assunto:</strong> {payload?.election?.position?.name ?? "Sem cargo"}</p>
          </section>

          <div className="ballot-timer">
            <div>
              <span>Tempo restante</span>
              <strong>{formatTime(remainingSeconds)}</strong>
            </div>
            <span className="ballot-timer-track">
              <span style={{ width: `${Math.max(8, Math.min(100, remainingSeconds / 60))}%` }}></span>
            </span>
          </div>

          <div className="ballot-heading">
            <h2>{payload?.election?.position?.name ?? "Candidatos"}</h2>
            <p>Seleccione um candidato para prosseguir.</p>
          </div>

          <div className="ballot-options">
            {payload?.options?.length ? payload.options.map((candidate) => (
              <label className={selectedOption === String(candidate.id) ? "ballot-option selected" : "ballot-option"} key={candidate.id}>
                <input checked={selectedOption === String(candidate.id)} name="candidate" onChange={() => { setSelectedOption(String(candidate.id)); setError(""); }} type="radio" />
                <span className="candidate-photo">
                  {candidate.photo ? <img src={candidate.photo} alt={candidate.name} /> : <b>{candidate.isBlank ? "VB" : candidate.name.slice(0, 2).toUpperCase()}</b>}
                </span>
                <span className="candidate-ballot-info">
                  <strong>{candidate.name}</strong>
                  <small>{candidate.delegation}</small>
                  {!candidate.isBlank ? (
                    <Link className="ballot-more-link" to={`/portal-eleitor/votacoes/${eleicaoId}/candidatos/${candidate.id}`} onClick={(event) => event.stopPropagation()}>
                      Ver mais
                    </Link>
                  ) : null}
                </span>
                <span className="ballot-radio-visual" aria-hidden="true"></span>
              </label>
            )) : <p className="empty-table-message">Sem candidatos aprovados para esta eleição.</p>}
          </div>

          <FormError message={error} />
          <div className="form-actions">
            <Link className="secondary-button" to="/portal-eleitor/votacoes">
              <ArrowLeft size={18} />
              Voltar
            </Link>
            <button className="primary-action-button" type="submit" disabled={payload?.has_voted || !payload?.can_vote}>
              {payload?.has_voted ? 'Já votou' : 'Continuar'}
            </button>
          </div>
        </section>
      </form>

      {showConfirmModal && selectedCandidate && (
        <VoteConfirmModal candidate={selectedCandidate} onConfirm={handleConfirmVote} onCancel={() => setShowConfirmModal(false)} isSubmitting={isSubmitting} />
      )}
    </>
  );
}
