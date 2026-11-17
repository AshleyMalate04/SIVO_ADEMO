import { lazy, Suspense } from "react";
import { BrowserRouter, Navigate, Route, Routes } from "react-router-dom";
import Loading from "../components/common/Loading";
import AuthLayout from "../components/layout/AuthLayout";
import AppLayout from "../components/layout/AppLayout";
import ProtectedRoute from "./ProtectedRoute";
import RoleRoute from "./RoleRoute";

const AuditPage = lazy(() => import("../pages/audit/AuditPage"));
const ForgotPasswordPage = lazy(() => import("../pages/auth/ForgotPasswordPage"));
const LoginPage = lazy(() => import("../pages/auth/LoginPage"));
const ResetPasswordPage = lazy(() => import("../pages/auth/ResetPasswordPage"));
const VerifyCodePage = lazy(() => import("../pages/auth/VerifyCodePage"));
const DashboardPage = lazy(() => import("../pages/dashboard/DashboardPage"));
const DelegationFormPage = lazy(() => import("../pages/delegations/DelegationFormPage"));
const DelegationsPage = lazy(() => import("../pages/delegations/DelegationsPage"));
const ElectionCandidateFormPage = lazy(() => import("../pages/elections/ElectionCandidateFormPage"));
const ElectionCandidatesPage = lazy(() => import("../pages/elections/ElectionCandidatesPage"));
const ElectionCreatePage = lazy(() => import("../pages/elections/ElectionCreatePage"));
const ElectionCreateTeamPage = lazy(() => import("../pages/elections/ElectionCreateTeamPage"));
const ElectionDetailsPage = lazy(() => import("../pages/elections/ElectionDetailsPage"));
const ElectionSelectionPage = lazy(() => import("../pages/elections/ElectionSelectionPage"));
const ElectionsPage = lazy(() => import("../pages/elections/ElectionsPage"));
const ElectionTeamPage = lazy(() => import("../pages/elections/ElectionTeamPage"));
const ElectionVoterFormPage = lazy(() => import("../pages/elections/ElectionVoterFormPage"));
const ElectionVotersPage = lazy(() => import("../pages/elections/ElectionVotersPage"));
const PhysicalResultsPage = lazy(() => import("../pages/elections/PhysicalResultsPage"));
const UnauthorizedPage = lazy(() => import("../pages/errors/UnauthorizedPage"));
const MemberFormPage = lazy(() => import("../pages/members/MemberFormPage"));
const MembersPage = lazy(() => import("../pages/members/MembersPage"));
const OrganFormPage = lazy(() => import("../pages/organs/OrganFormPage"));
const OrgansPage = lazy(() => import("../pages/organs/OrgansPage"));
const ResultDetailsPage = lazy(() => import("../pages/results/ResultDetailsPage"));
const ResultsPage = lazy(() => import("../pages/results/ResultsPage"));
const SettingsPage = lazy(() => import("../pages/settings/SettingsPage"));
const OperationalUserFormPage = lazy(() => import("../pages/users/OperationalUserFormPage"));
const OperationalUsersPage = lazy(() => import("../pages/users/OperationalUsersPage"));
const BallotPage = lazy(() => import("../pages/voting/BallotPage"));
const CandidateProfilePage = lazy(() => import("../pages/voting/CandidateProfilePage"));
const MyElectionsPage = lazy(() => import("../pages/voting/MyElectionsPage"));
const VoteSuccessPage = lazy(() => import("../pages/voting/VoteSuccessPage"));

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
      <Suspense fallback={<Loading label="A carregar página..." />}>
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

            <Route path="/perfil" element={guarded(<SettingsPage />, EVERYONE)} />
            <Route path="/configuracoes" element={<Navigate to="/perfil" replace />} />
          </Route>
        </Route>

        <Route path="*" element={<Navigate to="/dashboard" replace />} />
      </Routes>
      </Suspense>
    </BrowserRouter>
  );
}
