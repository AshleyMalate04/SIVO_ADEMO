import { BrowserRouter, Navigate, Route, Routes } from "react-router-dom";
import AuthLayout from "../components/layout/AuthLayout";
import AppLayout from "../components/layout/AppLayout";
import LoginPage from "../pages/auth/LoginPage";
import ForgotPasswordPage from "../pages/auth/ForgotPasswordPage";
import VerifyCodePage from "../pages/auth/VerifyCodePage";
import ResetPasswordPage from "../pages/auth/ResetPasswordPage";
import DashboardPage from "../pages/dashboard/DashboardPage";
import DelegationsPage from "../pages/delegations/DelegationsPage";
import DelegationFormPage from "../pages/delegations/DelegationFormPage";
import OrgansPage from "../pages/organs/OrgansPage";
import OrganFormPage from "../pages/organs/OrganFormPage";
import MembersPage from "../pages/members/MembersPage";
import MemberFormPage from "../pages/members/MemberFormPage";
import OperationalUsersPage from "../pages/users/OperationalUsersPage";
import OperationalUserFormPage from "../pages/users/OperationalUserFormPage";
import ElectionsPage from "../pages/elections/ElectionsPage";
import ElectionCreatePage from "../pages/elections/ElectionCreatePage";
import ElectionSelectionPage from "../pages/elections/ElectionSelectionPage";
import ElectionCreateTeamPage from "../pages/elections/ElectionCreateTeamPage";
import ElectionDetailsPage from "../pages/elections/ElectionDetailsPage";
import PhysicalResultsPage from "../pages/elections/PhysicalResultsPage";
import ElectionTeamPage from "../pages/elections/ElectionTeamPage";
import ElectionVotersPage from "../pages/elections/ElectionVotersPage";
import ElectionVoterFormPage from "../pages/elections/ElectionVoterFormPage";
import ElectionCandidatesPage from "../pages/elections/ElectionCandidatesPage";
import ElectionCandidateFormPage from "../pages/elections/ElectionCandidateFormPage";
import MyElectionsPage from "../pages/voting/MyElectionsPage";
import BallotPage from "../pages/voting/BallotPage";
import CandidateProfilePage from "../pages/voting/CandidateProfilePage";
import VoteSuccessPage from "../pages/voting/VoteSuccessPage";
import ResultsPage from "../pages/results/ResultsPage";
import ResultDetailsPage from "../pages/results/ResultDetailsPage";
import AuditPage from "../pages/audit/AuditPage";
import SettingsPage from "../pages/settings/SettingsPage";
import UnauthorizedPage from "../pages/errors/UnauthorizedPage";
import ProtectedRoute from "./ProtectedRoute";
import RoleRoute from "./RoleRoute";

const ADMIN = ["ADMIN"];
const STAFF = ["ADMIN", "COMISSAO", "COMMISSION", "FISCAL"];
const MANAGERS = ["ADMIN", "COMISSAO", "COMMISSION"];
const COMMISSION = ["COMISSAO", "COMMISSION"];
const EVERYONE = ["ADMIN", "COMISSAO", "COMMISSION", "FISCAL", "ELEITOR", "VOTER"];
const VOTER = ["ELEITOR", "VOTER"];

function guarded(element, roles) {
  return <RoleRoute allowedRoles={roles}>{element}</RoleRoute>;
}

export default function AppRoutes() {
  return (
    <BrowserRouter>
      <Routes>
        <Route element={<AuthLayout />}>
          <Route path="/" element={<Navigate to="/login" replace />} />
          <Route path="/login" element={<LoginPage />} />
          <Route path="/recuperar-acesso" element={<ForgotPasswordPage />} />
          <Route path="/verificar-codigo" element={<VerifyCodePage />} />
          <Route path="/nova-senha" element={<ResetPasswordPage />} />
        </Route>

        <Route element={<ProtectedRoute />}>
          <Route element={<AppLayout />}>
            <Route path="/nao-autorizado" element={<UnauthorizedPage />} />
            <Route path="/dashboard" element={guarded(<DashboardPage />, STAFF)} />

            <Route path="/delegacoes" element={guarded(<DelegationsPage />, STAFF)} />
            <Route path="/delegacoes/nova" element={guarded(<DelegationFormPage />, ADMIN)} />
            <Route path="/delegacoes/:id/editar" element={guarded(<DelegationFormPage />, ADMIN)} />

            <Route path="/orgaos-cargos" element={guarded(<OrgansPage />, STAFF)} />
            <Route path="/orgaos-cargos/novo" element={guarded(<OrganFormPage />, ADMIN)} />
            <Route path="/orgaos-cargos/:id/editar" element={guarded(<OrganFormPage />, ADMIN)} />

            <Route path="/membros" element={guarded(<MembersPage />, STAFF)} />
            <Route path="/membros/novo" element={guarded(<MemberFormPage />, MANAGERS)} />
            <Route path="/membros/:id/editar" element={guarded(<MemberFormPage />, MANAGERS)} />

            <Route path="/comissao-fiscal" element={guarded(<OperationalUsersPage mode="staff" />, ADMIN)} />
            <Route path="/comissao-fiscal/novo" element={guarded(<OperationalUserFormPage />, ADMIN)} />
            <Route path="/comissao-fiscal/:id/editar" element={guarded(<OperationalUserFormPage />, ADMIN)} />
            {/* <Route path="/utilizadores" element={guarded(<OperationalUsersPage mode="users" />, ADMIN)} /> */}

            <Route path="/eleicoes" element={guarded(<ElectionsPage />, STAFF)} />
            <Route path="/eleicoes/nova" element={guarded(<ElectionCreatePage />, COMMISSION)} />
            <Route path="/eleicoes/:id/editar" element={guarded(<ElectionCreatePage />, COMMISSION)} />
            <Route path="/eleicoes/nova/equipa" element={guarded(<ElectionCreateTeamPage />, COMMISSION)} />
            <Route path="/eleicoes/equipa" element={guarded(<ElectionTeamPage />, STAFF)} />
            <Route path="/eleicoes/equipa/adicionar" element={guarded(<ElectionCreateTeamPage mode="add" />, COMMISSION)} />
            <Route path="/eleicoes/:id" element={guarded(<ElectionDetailsPage />, STAFF)} />
            <Route path="/eleicoes/:id/equipa" element={guarded(<ElectionCreateTeamPage />, COMMISSION)} />
            <Route path="/eleicoes/:id/resultados-presenciais" element={guarded(<PhysicalResultsPage />, COMMISSION)} />

            <Route path="/candidatos" element={guarded(<ElectionCandidatesPage />, STAFF)} />
            <Route path="/candidatos/novo" element={guarded(<ElectionCandidateFormPage />, COMMISSION)} />
            <Route path="/candidatos/:id/editar" element={guarded(<ElectionCandidateFormPage />, COMMISSION)} />
            <Route path="/candidatos/:candidateId/detalhes" element={guarded(<CandidateProfilePage />, STAFF)} />

            <Route path="/eleitores" element={guarded(<ElectionVotersPage />, STAFF)} />
            <Route path="/eleitores/novo" element={guarded(<ElectionVoterFormPage />, COMMISSION)} />

            <Route path="/votar/:eleicaoId" element={guarded(<BallotPage />, VOTER)} />
            <Route path="/votar/sucesso" element={guarded(<VoteSuccessPage />, VOTER)} />
            <Route path="/portal-eleitor/votacoes" element={guarded(<MyElectionsPage />, VOTER)} />
            <Route path="/portal-eleitor/votacoes/:eleicaoId" element={guarded(<BallotPage />, VOTER)} />
            <Route path="/portal-eleitor/eleicoes/:id" element={guarded(<ElectionDetailsPage />, VOTER)} />
            <Route
              path="/portal-eleitor/votacoes/:eleicaoId/candidatos/:candidateId"
              element={guarded(<CandidateProfilePage />, VOTER)}
            />
            <Route path="/portal-eleitor/votacoes/sucesso" element={guarded(<VoteSuccessPage />, VOTER)} />

            <Route path="/portal-eleitor/resultados" element={guarded(<ResultsPage />, VOTER)} />
            <Route path="/portal-eleitor/resultados/eleicoes" element={guarded(<ElectionSelectionPage mode="voter-results" />, VOTER)} />
            <Route path="/resultados" element={guarded(<ResultsPage />, EVERYONE)} />
            <Route path="/resultados/eleicoes" element={guarded(<ElectionSelectionPage mode="results" />, EVERYONE)} />
            <Route path="/resultados/:id" element={guarded(<ResultDetailsPage />, EVERYONE)} />

            <Route path="/auditoria" element={guarded(<AuditPage />, ["ADMIN", "FISCAL"])} />
            <Route path="/auditoria/eleicoes" element={guarded(<ElectionSelectionPage mode="audit" />, ["ADMIN", "FISCAL", "COMISSAO", "COMMISSION"])} />

            <Route path="/configuracoes" element={guarded(<SettingsPage />, EVERYONE)} />
          </Route>
        </Route>

        <Route path="*" element={<Navigate to="/dashboard" replace />} />
      </Routes>
    </BrowserRouter>
  );
}
