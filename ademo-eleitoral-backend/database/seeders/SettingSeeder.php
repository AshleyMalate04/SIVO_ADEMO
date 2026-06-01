<?php

namespace Database\Seeders;

use App\Models\Setting;
use App\Models\User;
use Illuminate\Database\Seeder;

class SettingSeeder extends Seeder
{
    public function run(): void
    {
        User::query()->each(function (User $user): void {
            Setting::updateOrCreate(
                ['user_id' => $user->id],
                [
                    'theme' => 'LIGHT',
                    'high_contrast' => false,
                    'font_size' => 'MEDIUM',
                    'email_notifications' => true,
                    'system_notifications' => true,
                    'whatsapp_notifications' => false,
                ]
            );
        });
    }
}
