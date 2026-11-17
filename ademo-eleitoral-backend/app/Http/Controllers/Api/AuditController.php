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
use App\Models\Notification;
use App\Models\Organ;
use App\Models\PhysicalVoteTotal;
use App\Models\Position;
use App\Models\User;
use App\Support\ApiResponse;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Collection;

class AuditController extends CrudController
{
    protected string $model = AuditLog::class;

    protected ?string $requestClass = AuditLogRequest::class;

    protected array $with = ['election', 'user'];

    protected array $searchable = ['action', 'entity', 'ip', 'user_agent'];

    public function index(Request $request): JsonResponse
    {

        // Estas relacoes fazem parte da representacao da auditoria e evitam
        // carregamento tardio linha a linha.
        $query = AuditLog::query()->with(['election', 'user']);

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

        $perPage = min(max((int) $request->integer('per_page', 100), 1), 1000);
        $page = $query->latest()->paginate($perPage);
        $entityNames = $this->resolveEntityNames($page->getCollection());
        $page->getCollection()->transform(fn (AuditLog $log) => $this->presentLog($log, $entityNames));

        return ApiResponse::success($page, 'Registos listados com sucesso.');

    }

    public function byElection(int|string $id): JsonResponse
    {
        $page = AuditLog::with('user', 'election')
            ->where('election_id', $id)
            ->whereNotIn('action', ['LOGIN', 'LOGOUT', 'LOGOUT_ALL'])
            ->latest()
            ->paginate(100);

        $entityNames = $this->resolveEntityNames($page->getCollection());
        $page->getCollection()->transform(fn (AuditLog $log) => $this->presentLog($log, $entityNames));

        return ApiResponse::success($page, 'Auditoria da eleição listada com sucesso.');
    }

    private function presentLog(AuditLog $log, array $entityNames): array
    {
        $data = $log->toArray();
        $data['user_name'] = $log->user?->name ?? 'Acção automática do sistema';
        $data['action_label'] = $this->actionLabel($log->action);
        $data['entity_label'] = $this->entityLabel($log->entity);
        $data['entity_name'] = $this->entityName($log, $entityNames);
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
            'ELIMINADO', 'ELIMINADA', 'ELEITOR_REMOVIDO' => 'Registo eliminado',
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
            'Notification' => 'Notificacao',
            'Delegation' => 'Delegação',
            'Organ' => 'Órgão',
            'Position' => 'Cargo',
            'Vote' => 'Voto',
            'Setting' => 'Configurações',
            default => $entity ?: 'Sistema',
        };
    }

    private function entityName(AuditLog $log, array $entityNames): ?string
    {
        $details = is_array($log->details) ? $log->details : [];
        $id = $log->entity_id;
        if (! $id) {
            return $details['record_name'] ?? $details['name'] ?? $details['title'] ?? null;
        }

        return $entityNames[$this->entityKey($log->entity, $id)]
            ?? $details['record_name']
            ?? $details['name']
            ?? $details['title']
            ?? null;
    }

    /**
     * Resolve os nomes em lotes. Antes, cada linha da auditoria executava uma
     * consulta adicional (N+1), chegando a centenas de consultas por pagina.
     *
     * @param  Collection<int, AuditLog>  $logs
     * @return array<string, string>
     */
    private function resolveEntityNames(Collection $logs): array
    {
        $names = [];
        $groups = $logs
            ->filter(fn (AuditLog $log) => $log->entity_id !== null)
            ->groupBy(fn (AuditLog $log) => $this->canonicalEntity($log->entity));

        $simpleModels = [
            'User' => [User::class, 'name'],
            'Election' => [Election::class, 'title'],
            'Member' => [Member::class, 'name'],
            'Notification' => [Notification::class, 'title'],
            'Delegation' => [Delegation::class, 'name'],
            'Organ' => [Organ::class, 'name'],
            'Position' => [Position::class, 'name'],
        ];

        foreach ($simpleModels as $entity => [$model, $column]) {
            $ids = $groups->get($entity)?->pluck('entity_id')->unique()->values()->all() ?? [];
            if ($ids === []) {
                continue;
            }

            foreach ($model::query()->whereKey($ids)->pluck($column, 'id') as $id => $name) {
                $names[$entity.'#'.$id] = (string) $name;
            }
        }

        $relationModels = [
            'Candidate' => [Candidate::class, 'member', 'member'],
            'ElectionTeam' => [ElectionTeam::class, 'user', 'user'],
            'ElectionVoter' => [ElectionVoter::class, 'member', 'member'],
            'PhysicalVoteTotal' => [PhysicalVoteTotal::class, 'candidate.member', 'candidate.member'],
        ];

        foreach ($relationModels as $entity => [$model, $relation, $path]) {
            $ids = $groups->get($entity)?->pluck('entity_id')->unique()->values()->all() ?? [];
            if ($ids === []) {
                continue;
            }

            foreach ($model::query()->with($relation)->whereKey($ids)->get() as $record) {
                $name = data_get($record, $path.'.name');
                if ($name) {
                    $names[$entity.'#'.$record->getKey()] = (string) $name;
                }
            }
        }

        return $names;
    }

    private function entityKey(?string $entity, int|string $id): string
    {
        return $this->canonicalEntity($entity).'#'.$id;
    }

    private function canonicalEntity(?string $entity): string
    {
        return match ($entity) {
            'users' => 'User',
            'elections' => 'Election',
            'candidates' => 'Candidate',
            'members' => 'Member',
            default => (string) $entity,
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

        if (isset($details['record_name']) && in_array($log->action, ['CREATE', 'REGISTO_DE_MEMBRO', 'CRIACAO_DE_ELEICAO', 'SELECCAO_DE_CANDIDATO'], true)) {
            $lines[] = 'Registo efectuado: '.$this->detailValue($details['record_name']);

            return $lines;
        }

        if (isset($details['record_name']) && in_array($log->action, ['ELIMINADO', 'ELIMINADA', 'ELEITOR_REMOVIDO'], true)) {
            $lines[] = 'Registo eliminado: '.$this->detailValue($details['record_name']);
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
            if (str_ends_with((string) $key, '_id') || in_array($key, ['previous_status', 'status', 'ip', 'user_agent', 'record_name', 'snapshot'], true)) {
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
            'record_name' => 'Registo efectuado',
            'is_blank' => 'Voto em branco',
            'has_voted' => 'Ja votou',
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
