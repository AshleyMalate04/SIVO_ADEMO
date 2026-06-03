<?php

namespace App\Jobs;

use App\Models\User;
use App\Services\NotificationService;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Foundation\Queue\Queueable;

class SendUserNotificationJob implements ShouldQueue
{
    use Queueable;

    public int $tries = 3;

    public int $timeout = 60;

    /**
     * @var array<int, int>
     */
    public array $backoff = [30, 120, 300];

    /**
     * @param  array{title:string,message:string,type:string,election_id?:int|null,action_url?:string|null}  $payload
     */
    public function __construct(private readonly int $userId, private readonly array $payload)
    {
        $this->onQueue('notifications');
        $this->afterCommit();
    }

    public function handle(NotificationService $notificationService): void
    {
        $user = User::query()->with('setting')->find($this->userId);

        if (! $user) {
            return;
        }

        $notificationService->deliverToUser($user, $this->payload);
    }
}
