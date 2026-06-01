<?php

namespace App\Events;

use App\Models\Notification;
use Illuminate\Broadcasting\Channel;
use Illuminate\Contracts\Broadcasting\ShouldBroadcastNow;
use Illuminate\Foundation\Events\Dispatchable;
use Illuminate\Queue\SerializesModels;

class NotificacaoCriada implements ShouldBroadcastNow
{
    use Dispatchable;
    use SerializesModels;

    public function __construct(public Notification $notification)
    {
        $this->notification->loadMissing('user');
    }

    public function broadcastOn(): array
    {
        return [new Channel('ademo.notifications')];
    }

    public function broadcastAs(): string
    {
        return 'notificacao.criada';
    }

    public function broadcastWith(): array
    {
        return [
            'notification' => $this->notification->toArray(),
        ];
    }
}
