<?php

namespace App\Http\Controllers\Api;

use App\Http\Requests\Api\SettingRequest;
use App\Http\Requests\Auth\UpdateEmailRequest;
use App\Http\Requests\Auth\UpdatePasswordRequest;
use App\Http\Requests\Auth\UpdateProfileRequest;
use App\Models\Setting;
use App\Models\User;
use App\Services\AuditService;
use App\Services\NotificationService;
use App\Support\ApiResponse;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Hash;
use RuntimeException;

class SettingController extends CrudController
{
    protected string $model = Setting::class;

    protected ?string $requestClass = SettingRequest::class;

    protected array $with = ['user'];

    public function current(Request $request): JsonResponse
    {
        $settings = Setting::firstOrCreate(['user_id' => $request->user()->id]);

        return ApiResponse::success($settings, 'Configurações obtidas com sucesso.');
    }

    public function updateCurrent(SettingRequest $request): JsonResponse
    {
        $settings = Setting::firstOrCreate(['user_id' => $request->user()->id]);
        $settings->update($request->validated());
        AuditService::record($request, 'CONFIGURACOES_ACTUALIZADAS', 'Setting', $settings->id);

        return ApiResponse::success($settings, 'Configurações actualizadas com sucesso.');
    }

    public function updateEmail(UpdateEmailRequest $request): JsonResponse
    {
        $user = User::findOrFail($request->user()->id);
        $user->update($request->validated());
        AuditService::record($request, 'EMAIL_ACTUALIZADO', 'User', $user->id);

        return ApiResponse::success($user, 'Email actualizado com sucesso.');
    }

    public function updateProfile(UpdateProfileRequest $request): JsonResponse
    {
        $user = User::findOrFail($request->user()->id);
        $user->update($request->validated());
        AuditService::record($request, 'PERFIL_ACTUALIZADO', 'User', $user->id);

        return ApiResponse::success(
            $user->fresh()->load('delegation', 'setting'),
            'Dados pessoais actualizados com sucesso.'
        );
    }

    public function updatePassword(UpdatePasswordRequest $request): JsonResponse
    {
        $data = $request->validated();

        try {
            $passwordMatches = Hash::check($data['current_password'], $request->user()->password);
        } catch (RuntimeException) {
            $passwordMatches = false;
        }

        if (! $passwordMatches) {
            return ApiResponse::error('Palavra-passe actual incorrecta.', 422);
        }

        $user = User::findOrFail($request->user()->id);
        $user->forceFill([
            'password' => Hash::make($data['password']),
            'password_changed_at' => now(),
        ])->save();
        AuditService::record($request, 'SENHA_ACTUALIZADA', 'User', $user->id);
        app(NotificationService::class)->notifyPasswordChanged($user->fresh());

        return ApiResponse::success([
            'must_change_password' => false,
            'password_changed_at' => $user->password_changed_at,
            'user' => $user->fresh(),
        ], 'Palavra-passe actualizada com sucesso.');
    }
}
