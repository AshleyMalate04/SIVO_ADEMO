<?php

namespace App\Http\Controllers\Api;

use App\Http\Requests\Api\AuditLogRequest;
use App\Models\AuditLog;
use App\Models\Candidate;
use App\Models\Delegation;
use App\Models\Election;
use App\Models\ElectionTeam;
use App\Models\ElectionVoter;
use App\Models\Member;
use App\Models\Organ;
use App\Models\PhysicalVoteTotal;
use App\Models\Position;
use App\Models\User;
use App\Support\ApiResponse;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class AuditController extends CrudController
{
    protected string $model = AuditLog::class;

    protected ?string $requestClass = AuditLogRequest::class;

    protected array $with = ['election', 'user'];

    protected array $searchable = ['action', 'entity', 'ip', 'user_agent'];

    public function index(Request $request): JsonResponse
    {

        $query = AuditLog::query()->with($this->requestedRelations($request));

        if (! $request->boolean('include_session_logs')) {
            $query->whereNotIn('action', ['LOGIN', 'LOGOUT', 'LOGOUT_ALL']);
        }

        if ($request->filled('election_id')) {
            $query->where('election_id', $request->integer('election_id'));
        }

        if ($request->filled('type')) {
            $query->where('action', $request->string('type')->toString());
        }

        if ($request->filled('date')) {
            $query->whereDate('created_at', $request->date('date'));
        }

        if ($request->filled('q')) {
            $term = '%'.$request->string('q')->toString().'%';
            $query->where(function ($query) use ($term): void {
                $query->where('action', 'like', $term)
                    ->orWhere('entity', 'like', $term)
                    ->orWhere('user_agent', 'like', $term)
                    ->orWhereHas('user', fn ($user) => $user->where('name', 'like', $term))
                    ->orWhereHas('election', fn ($election) => $election->where('title', 'like', $term));
            });
        }

        $perPage = min((int) $request->integer('per_page', 1000), 2000);
        $page = $query->latest()->paginate($perPage);
        $page->getCollection()->transform(fn (AuditLog $log) => $this->presentLog($log));

        return ApiResponse::success($page, 'Registos listados com sucesso.');
        
    }

    public function byElection(int|string $id): JsonResponse
    {
        $page = AuditLog::with('user', 'election')
            ->where('election_id', $id)
            ->whereNotIn('action', ['LOGIN', 'LOGOUT', 'LOGOUT_ALL'])
            ->latest()
            ->paginate(100);

        $page->getCollection()->transform(fn (AuditLog $log) => $this->presentLog($log));

        return ApiResponse::success($page, 'Auditoria da eleição listada com sucesso.');
    }

    private function presentLog(AuditLog $log): array
    {
        $data = $log->toArray();
        $data['user_name'] = $log->user?->name ?? 'Acção automática do sistema';
        $data['action_label'] = $this->actionLabel($log->action);
        $data['entity_label'] = $this->entityLabel($log->entity);
        $data['entity_name'] = $this->entityName($log);
        $data['entity_display'] = $data['entity_name']
            ? $data['entity_label'].': '.$data['entity_name']
            : $data['entity_label'];
        $data['description_lines'] = $this->descriptionLines($log);

        return $data;
    }

    private function actionLabel(?string $action): string
    {
        return match ($action) {
            'VOTOU' => 'Voto registado',
            'CRIACAO_DE_ELEICAO', 'ELECTION_CREATED' => 'Eleição criada',
            'ACTUALIZACAO_DE_ELEICAO' => 'Eleição actualizada',
            'ALTERACAO_DE_ESTADO_DE_ELEICAO' => 'Estado da eleição alterado',
            'ALTERACAO_AUTOMATICA_DE_ESTADO_DE_ELEICAO' => 'Estado alterado automaticamente',
            'REGISTO_DE_MEMBRO' => 'Membro registado',
            'SELECCAO_DE_CANDIDATO' => 'Candidato seleccionado',
            'RESULTADOS_PUBLICADOS', 'RESULTS_PUBLISHED_AUTOMATICALLY' => 'Resultados publicados',
            'RESULTADOS_PRESENCIAIS_GUARDADOS' => 'Resultados presenciais guardados',
            'RESULTADOS_PRESENCIAIS_APROVADOS' => 'Resultados presenciais aprovados',
            'SENHA_ACTUALIZADA' => 'Palavra-passe actualizada',
            'EMAIL_ACTUALIZADO' => 'Email actualizado',
            'CONFIGURACOES_ACTUALIZADAS' => 'Configurações actualizadas',
            'CONCLUIDA' => 'Eleição concluída',
            'SUSPENSA' => 'Registo suspenso',
            'ACTIVADA' => 'Registo activado',
            'OCULTADO' => 'Registo ocultado',
            'CREATE' => 'Registo criado',
            'UPDATE' => 'Registo actualizado',
            default => $action ? ucfirst(strtolower(str_replace('_', ' ', $action))) : 'Acção não identificada',
        };
    }

    private function entityLabel(?string $entity): string
    {
        return match ($entity) {
            'User', 'users' => 'Utilizador',
            'Election', 'elections' => 'Eleição',
            'Candidate', 'candidates' => 'Candidato',
            'Member', 'members' => 'Membro',
            'ElectionTeam' => 'Equipa da eleição',
            'ElectionVoter' => 'Eleitor da eleição',
            'PhysicalVoteTotal' => 'Voto presencial',
            'Delegation' => 'Delegação',
            'Organ' => 'Órgão',
            'Position' => 'Cargo',
            'Vote' => 'Voto',
            'Setting' => 'Configurações',
            default => $entity ?: 'Sistema',
        };
    }

    private function entityName(AuditLog $log): ?string
    {
        $id = $log->entity_id;
        if (! $id) {
            return null;
        }

        return match ($log->entity) {
            'User', 'users' => User::find($id)?->name,
            'Election', 'elections' => Election::find($id)?->title,
            'Candidate', 'candidates' => Candidate::with('member')->find($id)?->member?->name,
            'Member', 'members' => Member::find($id)?->name,
            'ElectionTeam' => ElectionTeam::with('user')->find($id)?->user?->name,
            'ElectionVoter' => ElectionVoter::with('member')->find($id)?->member?->name,
            'PhysicalVoteTotal' => PhysicalVoteTotal::with('candidate.member')->find($id)?->candidate?->member?->name,
            'Delegation' => Delegation::find($id)?->name,
            'Organ' => Organ::find($id)?->name,
            'Position' => Position::find($id)?->name,
            default => null,
        };
    }

    private function descriptionLines(AuditLog $log): array
    {
        $details = is_array($log->details) ? $log->details : [];
        $lines = [];

        if ($log->election) {
            $lines[] = 'Eleição: '.$log->election->title;
        } elseif (isset($details['election_id'])) {
            $title = Election::find($details['election_id'])?->title;
            if ($title) {
                $lines[] = 'Eleição: '.$title;
            }
        }

        if (isset($details['previous_status']) || isset($details['status'])) {
            if (isset($details['previous_status'])) {
                $lines[] = 'Estado anterior: '.$this->statusLabel((string) $details['previous_status']);
            }
            if (isset($details['status'])) {
                $lines[] = 'Estado actual: '.$this->statusLabel((string) $details['status']);
            }
        }

        foreach ($details as $key => $value) {
            if (str_ends_with((string) $key, '_id') || in_array($key, ['previous_status', 'status', 'ip', 'user_agent'], true)) {
                continue;
            }

            $lines[] = $this->detailLabel((string) $key).': '.$this->detailValue($value);
        }

        return $lines ?: ['Sem detalhes adicionais.'];
    }

    private function detailLabel(string $key): string
    {
        return match ($key) {
            'title' => 'Título',
            'note' => 'Nota',
            'rule' => 'Regra',
            'fields' => 'Campos alterados',
            'is_blank' => 'Voto em branco',
            'total_votes' => 'Total de votos',
            'online_votes' => 'Votos online',
            'physical_votes' => 'Votos presenciais',
            'has_physical_results' => 'Inclui votos presenciais',
            default => ucfirst(str_replace('_', ' ', $key)),
        };
    }

    private function detailValue(mixed $value): string
    {
        if (is_bool($value)) {
            return $value ? 'Sim' : 'Não';
        }

        if (is_array($value)) {
            return implode(', ', array_map(fn ($item) => $this->detailValue($item), $value));
        }

        return $this->statusLabel((string) $value);
    }

    private function statusLabel(string $status): string
    {
        return match ($status) {
            'ACTIVE' => 'Activo',
            'INACTIVE' => 'Desactivado',
            'SUSPENDED' => 'Suspenso',
            'BLOCKED' => 'Bloqueado',
            'APPROVED' => 'Aprovado',
            'REJECTED' => 'Rejeitado',
            'PENDING' => 'Pendente',
            'AUTHORIZED' => 'Autorizado',
            'REMOVED' => 'Removido',
            'PROGRAMADA' => 'Programada',
            'EM_VOTACAO' => 'Em votação',
            'CONCLUIDA' => 'Concluída',
            'RESULTADOS_PUBLICADOS' => 'Resultados publicados',
            'DRAFT' => 'Rascunho',
            'PUBLISHED' => 'Publicado',
            default => $status,
        };
    }
}
