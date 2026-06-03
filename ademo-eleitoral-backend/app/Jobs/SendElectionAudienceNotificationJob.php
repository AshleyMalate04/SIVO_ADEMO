<?php

namespace App\Jobs;

use App\Services\NotificationService;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Foundation\Queue\Queueable;

class SendElectionAudienceNotificationJob implements ShouldQueue
{
    use Queueable;

    public int $tries = 3;

    public int $timeout = 120;

    /**
     * @var array<int, int>
     */
    public array $backoff = [60, 300, 900];

    /**
     * @param  array{title:string,message:string,type:string,election_id?:int|null,action_url?:string|null}  $payload
     */
    public function __construct(private readonly int $electionId, private readonly array $payload)
    {
        $this->onQueue('notifications');
        $this->afterCommit();
    }

    public function handle(NotificationService $notificationService): void
    {
        $notificationService->dispatchElectionAudienceUsers($this->electionId, $this->payload);
    }
}
