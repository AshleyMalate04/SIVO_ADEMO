<?php

namespace App\Notifications;

use App\Support\FrontendUrl;
use Illuminate\Bus\Queueable;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Notifications\Messages\MailMessage;
use Illuminate\Notifications\Notification;

class AdemoEmailNotification extends Notification implements ShouldQueue
{
    use Queueable;

    public int $tries = 3;

    public int $timeout = 60;

    /**
     * @var array<int, int>
     */
    public array $backoff = [60, 300, 900];

    /**
     * @param  array{title:string,message:string,type:string,election_id?:int|null,action_url?:string|null}  $payload
     */
    public function __construct(private readonly array $payload)
    {
        $this->onQueue('mail');
    }

    /**
     * @return array<int, string>
     */
    public function via(object $notifiable): array
    {
        return ['mail'];
    }

    public function shouldSend(object $notifiable, string $channel): bool
    {
        if ($channel !== 'mail') {
            return true;
        }

        if (! ($notifiable->email ?? null)) {
            return false;
        }

        if (method_exists($notifiable, 'isActive') && ! $notifiable->isActive()) {
            return false;
        }

        $setting = $notifiable->relationLoaded('setting')
            ? $notifiable->setting
            : $notifiable->setting()->first();

        return $setting?->email_notifications ?? true;
    }

    public function toMail(object $notifiable): MailMessage
    {
        return (new MailMessage)
            ->subject($this->payload['title'])
            ->view('emails.notification', [
                'name' => $notifiable->name ?? 'Utilizador',
                'title' => $this->payload['title'],
                'messageText' => $this->payload['message'],
                'type' => $this->payload['type'],
                'actionUrl' => $this->payload['action_url'] ?? $this->defaultActionUrl(),
            ]);
    }

    private function defaultActionUrl(): string
    {
        return FrontendUrl::to('/dashboard');
    }
}
