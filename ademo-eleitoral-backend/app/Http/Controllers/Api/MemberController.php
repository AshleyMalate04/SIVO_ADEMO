<?php

namespace App\Http\Controllers\Api;

use App\Http\Requests\Api\MemberRequest;
use App\Models\Member;
use App\Models\User;
use App\Services\AccessNotificationService;
use App\Services\AuditService;
use App\Support\ApiResponse;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\QueryException;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;

class MemberController extends CrudController
{
    protected string $model = Member::class;

    protected ?string $requestClass = MemberRequest::class;

    protected array $with = ['delegation', 'registrar'];

    protected array $searchable = ['member_code', 'name', 'phone', 'email', 'bi_number'];

    public function update(Request $request, int|string $id): JsonResponse
    {
        $member = Member::findOrFail($id);
        $isStatusActivation = $request->input('status') === 'ACTIVE' && count($request->all()) === 1;

        if ($member->status !== 'ACTIVE' && ! $isStatusActivation) {
            return ApiResponse::error('Não é possível editar um membro desactivado.', 422);
        }

        $response = parent::update($request, $id);
        $member = Member::find($id);

        if ($member) {
            $user = User::where('access_code', $member->member_code)->first();
            if ($user) {
                $user->update([
                    'name' => $member->name,
                    'email' => $member->email,
                    'phone' => $member->phone,
                    'status' => $member->status === 'ACTIVE' ? 'ACTIVE' : 'INACTIVE',
                    'delegation_id' => $member->delegation_id,
                ]);
            }
        }

        return $response;
    }

    protected function prepareData(array $data, ?Model $record = null): array
    {
        if ($record === null) {
            $data['registered_at'] = $data['registered_at'] ?? now()->toDateString();
            $data['registered_by'] = request()->user()?->id;
            $data['status'] = $data['status'] ?? 'ACTIVE';
        }

        return $data;
    }

    public function store(Request $request): JsonResponse
    {
        $response = parent::store($request);
        $payload = $response->getData(true);
        $memberId = $payload['data']['id'] ?? null;

        if ($memberId) {
            $member = Member::find($memberId);
            if ($member) {
                $initialPassword = AccessNotificationService::generateInitialPassword();
                $user = User::firstOrCreate(
                    ['access_code' => $member->member_code],
                    [
                        'name' => $member->name,
                        'email' => $member->email,
                        'phone' => $member->phone,
                        'password' => $initialPassword,
                        'role' => 'ELEITOR',
                        'status' => $member->status === 'ACTIVE' ? 'ACTIVE' : 'INACTIVE',
                        'delegation_id' => $member->delegation_id,
                    ]
                );

                $emailSent = $user->wasRecentlyCreated
                    ? AccessNotificationService::notifyInitialAccess($user, $initialPassword)
                    : false;
                if ($user->wasRecentlyCreated && ! $emailSent) {
                    $payload['data']['initial_password'] = $initialPassword;
                    $response->setData($payload);
                }
                AuditService::record($request, 'CONTA_DE_ELEITOR_CRIADA', 'User', $user->id, [
                    'member_id' => $member->id,
                    'access_code' => $user->access_code,
                    'email_sent' => $emailSent,
                    'email_available' => (bool) $user->email,
                ]);
            }
        }

        return $response;
    }

    public function destroy(Request $request, int|string $id): JsonResponse
    {
        $member = Member::findOrFail($id);

        try {
            DB::transaction(function () use ($request, $member): void {
                $linkedUser = User::where('access_code', $member->member_code)->first();

                if ($linkedUser) {
                    AuditService::modelAction($request, 'ELIMINADO', $linkedUser, [
                        'record_name' => $linkedUser->name,
                        'status' => $linkedUser->status,
                        'access_code' => $linkedUser->access_code,
                        'snapshot' => $linkedUser->attributesToArray(),
                    ]);
                    $linkedUser->delete();
                }

                AuditService::modelAction($request, 'ELIMINADO', $member, [
                    'record_name' => $member->name,
                    'status' => $member->status,
                    'member_code' => $member->member_code,
                    'snapshot' => $member->attributesToArray(),
                ]);
                $member->delete();
            });
        } catch (QueryException) {
            return ApiResponse::error(
                'Nao e possivel eliminar este membro porque existem candidaturas, votos ou eleicoes associadas. Suspenda o membro se precisar impedir novas operacoes.',
                422,
            );
        }

        return ApiResponse::success(null, 'Membro eliminado com sucesso.');
    }

    public function import(): JsonResponse
    {
        return ApiResponse::error('Importação de membros ainda não implementada.', 501);
    }
}
