<?php

namespace App\Http\Controllers\Api;

use App\Http\Requests\Api\NotificationRequest;
use App\Models\Notification;
use App\Support\ApiResponse;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class NotificationController extends CrudController
{
    protected string $model = Notification::class;

    protected ?string $requestClass = NotificationRequest::class;

    protected array $with = ['user', 'election'];

    protected array $searchable = ['title', 'message', 'type'];

    public function index(Request $request): JsonResponse
    {
        $query = Notification::with('election')
            ->where('user_id', $request->user()->id)
            ->latest();

        if ($request->filled('q')) {
            $term = '%'.$request->string('q')->toString().'%';
            $query->where(function ($query) use ($term): void {
                $query->where('title', 'like', $term)
                    ->orWhere('message', 'like', $term)
                    ->orWhere('type', 'like', $term);
            });
        }

        if ($request->boolean('unread')) {
            $query->whereNull('read_at');
        }

        return ApiResponse::success(
            $query->paginate(min((int) $request->integer('per_page', 15), 100)),
            'Notificações listadas com sucesso.'
        );
    }

    public function read(Request $request, int|string $id): JsonResponse
    {
        $notification = Notification::where('user_id', $request->user()->id)->findOrFail($id);
        $notification->update(['read_at' => now()]);

        return ApiResponse::success($notification->fresh('election'), 'Notificação marcada como lida.');
    }

    public function readAll(Request $request): JsonResponse
    {
        Notification::where('user_id', $request->user()->id)->whereNull('read_at')->update(['read_at' => now()]);

        return ApiResponse::success(null, 'Notificações marcadas como lidas.');
    }

    public function destroy(Request $request, int|string $id): JsonResponse
    {
        $notification = Notification::where('user_id', $request->user()->id)->findOrFail($id);
        $notification->delete();

        return ApiResponse::success(null, 'Notificação eliminada com sucesso.');
    }
}
