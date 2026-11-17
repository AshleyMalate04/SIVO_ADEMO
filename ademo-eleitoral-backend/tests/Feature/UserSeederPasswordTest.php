<?php

namespace Tests\Feature;

use App\Models\User;
use Database\Seeders\UserSeeder;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Hash;
use Tests\TestCase;

class UserSeederPasswordTest extends TestCase
{
    use RefreshDatabase;

    public function test_reseeding_does_not_reset_an_existing_administrator_password(): void
    {
        $this->seed(UserSeeder::class);
        $admin = User::where('access_code', 'ADM-0001')->firstOrFail();
        $admin->forceFill([
            'password' => 'Personal-Password-2026!',
            'password_changed_at' => now(),
        ])->save();

        $this->seed(UserSeeder::class);

        $this->assertSame(1, User::where('access_code', 'ADM-0001')->count());
        $this->assertTrue(Hash::check('Personal-Password-2026!', $admin->fresh()->password));
        $this->assertNotNull($admin->fresh()->password_changed_at);
    }
}
