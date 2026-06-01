<?php

namespace App\Http\Controllers\Api;

use App\Http\Requests\Api\MemberRequest;
use App\Models\Member;
use App\Models\User;
use App\Services\AccessNotificationService;
use App\Services\AuditService;
use App\Support\ApiResponse;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

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
                $user = User::firstOrCreate(
                    ['access_code' => $member->member_code],
                    [
                        'name' => $member->name,
                        'email' => $member->email,
                        'phone' => $member->phone,
                        'password' => AccessNotificationService::DEFAULT_PASSWORD,
                        'role' => 'ELEITOR',
                        'status' => $member->status === 'ACTIVE' ? 'ACTIVE' : 'INACTIVE',
                        'delegation_id' => $member->delegation_id,
                    ]
                );

                $emailSent = AccessNotificationService::notifyInitialAccess($user);
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
        $member->update(['status' => 'INACTIVE']);

        User::where('access_code', $member->member_code)->update(['status' => 'INACTIVE']);

        AuditService::modelAction($request, 'OCULTADO', $member, ['status' => 'INACTIVE']);

        return ApiResponse::success($member, 'Membro eliminado com sucesso.');
    }

    public function import(): JsonResponse
    {
        return ApiResponse::error('Importação de membros ainda não implementada.', 501);
    }
}
