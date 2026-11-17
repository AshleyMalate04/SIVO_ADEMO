import { Link } from "react-router-dom";
import { CheckSquare, Info, Search } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import Loading from "../../components/common/Loading";
import ClearFiltersButton from "../../components/common/ClearFiltersButton";
import { voteService } from "../../services/voteService";
import { notify } from "../../utils/notify";
import { useElectionRealtime } from "../../hooks/useElectionRealtime";


const normalizeText = (value) => String(value ?? '')
  .toLowerCase()
  .normalize('NFD')
  .replace(/[\u0300-\u036f]/g, '')

const STATUS_FILTERS = [
  { label: "Programada", value: "PROGRAMADA" },
  { label: "Em votação", value: "EM_VOTACAO" },
  { label: "Concluída", value: "CONCLUIDA" },
  // { label: "Resultados publicados", value: "RESULTADOS_PUBLICADOS" },
  { label: "Participei", value: "PARTICIPEI" },
];

const statusLabel = (status) => ({
  PROGRAMADA: "Programada",
  EM_VOTACAO: "Em votação",
  CONCLUIDA: "Concluída",
  // RESULTADOS_PUBLICADOS: "Resultados publicados",
}[status] ?? status);

const formatPeriod = (election) => {
  const format = (value) => {
    if (!value) return "Sem data";
    const [datePart, timePart = ""] = String(value).replace(" ", "T").split("T");
    const [year, month, day] = datePart.split("-");
    const [hour = "00", minute = "00"] = timePart.split(":");
    return `${day}/${month}/${year} ${hour}:${minute}`;
  };

  return `Período: ${format(election.starts_at)} até ${format(election.ends_at)}`;
};

export default function MyElectionsPage() {
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [elections, setElections] = useState([]);
  const [loading, setLoading] = useState(true);

  const loadElections = () => {
    setLoading(true);
    return voteService.elections()
      .then(setElections)
      .catch((error) => notify.error("Não foi possível carregar eleições.", error.response?.data?.message || "Verifique a API."))
      .finally(() => setLoading(false));
  };

  useEffect(() => { loadElections(); }, []);

  useElectionRealtime(null, {
    onResultUpdated: () => loadElections(),
    onStatusUpdated: () => loadElections(),
  });

  const filteredElections = useMemo(() => {
    return elections.filter((election) => {
      const matchesSearch = normalizeText(election.title).includes(normalizeText(searchTerm));
      const matchesStatus = statusFilter === "all" || (statusFilter === "PARTICIPEI" ? election.has_voted : election.status === statusFilter);
      return matchesSearch && matchesStatus;
    });
  }, [elections, searchTerm, statusFilter]);

  if (loading) return <Loading label="A carregar eleições..." />;

  return (
    <section className="voter-page">
      <header className="management-header">
        <h1>Eleições disponíveis</h1>
        <p>Consulte todas as eleições e participe apenas nas votações em que foi seleccionado.</p>
      </header>

      <section className="voter-filters">
        <div className="search-filter">
          <Search size={20} />
          <input
            type="text"
            placeholder="Pesquisar por nome da eleição..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="search-input"
          />
        </div>

        <div className="status-filter-scroll" role="region" aria-label="Estados das eleições">
          <div className="status-filter-buttons">
            <button
              className={`filter-button ${statusFilter === "all" ? "active" : ""}`}
              onClick={() => setStatusFilter("all")}
              type="button"
            >
              Todas
            </button>
            {STATUS_FILTERS.map((filter) => (
              <button
                key={filter.value}
                className={`filter-button ${statusFilter === filter.value ? "active" : ""}`}
                onClick={() => setStatusFilter(filter.value)}
                type="button"
              >
                {filter.label}
              </button>
            ))}
          </div>
        </div>
        <ClearFiltersButton
          active={Boolean(searchTerm || statusFilter !== 'all')}
          onClick={() => { setSearchTerm(''); setStatusFilter('all') }}
        />
      </section>

      <section className="voter-election-grid">
        {filteredElections.map((election) => (
          <article className="voter-election-card" key={election.id}>
            <div className="voter-status-row">
              <span className={election.can_vote ? "voter-status active" : "voter-status"}>
                {statusLabel(election.status)}
              </span>
              {election.has_voted ? <span className="voter-status voted">Participou</span> : null}
            </div>
            <h2>{election.title}</h2>
            <p>{formatPeriod(election)}</p>
            <div className="voter-card-actions">
              <Link
                className={election.can_vote ? "primary-action-button" : "secondary-button disabled-link"}
                to={`/portal-eleitor/votacoes/${election.id}`}
                aria-disabled={!election.can_vote}
                onClick={(event) => {
                  if (!election.can_vote) {
                    event.preventDefault();
                  }
                }}
              >
                <CheckSquare size={18} />
                {election.has_voted ? "Já votou" : "Participar"}
              </Link>
              <Link className="secondary-button" to={`/portal-eleitor/eleicoes/${election.id}`}>
                <Info size={18} />
                Ver detalhes
              </Link>
            </div>
          </article>
        ))}
      </section>

      {filteredElections.length === 0 && (
        <div className="empty-state">
          <p>Nenhuma eleição encontrada com os filtros seleccionados.</p>
        </div>
      )}
    </section>
  );
}
