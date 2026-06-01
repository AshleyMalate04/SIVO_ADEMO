<?php

namespace App\Events;

use App\Models\Election;
use Illuminate\Broadcasting\Channel;
use Illuminate\Contracts\Broadcasting\ShouldBroadcastNow;
use Illuminate\Foundation\Events\Dispatchable;
use Illuminate\Queue\SerializesModels;

class ParticipacaoActualizada implements ShouldBroadcastNow
{
    use Dispatchable;
    use SerializesModels;

    public function __construct(public Election $election)
    {
        $this->election->loadMissing(['organ', 'position', 'delegation']);
    }

    public function broadcastOn(): array
    {
        return [
            new Channel('ademo.results'),
            new Channel('election.'.$this->election->id),
        ];
    }

    public function broadcastAs(): string
    {
        return 'resultado.actualizado';
    }

    public function broadcastWith(): array
    {
        return ['election' => $this->election->toArray()];
    }
}
