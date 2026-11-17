<?php

namespace Tests\Feature;

use App\Models\User;
use Database\Seeders\DistritSeeder;
use Database\Seeders\ManagementRecordsSeeder;
use Database\Seeders\ProvinceSeeder;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Hash;
use Tests\TestCase;

class ManagementRecordsAccessTest extends TestCase
{
    use RefreshDatabase;

    public function test_demo_staff_and_voters_can_log_in_with_the_initial_password(): void
    {
        $this->seed(ProvinceSeeder::class);
        $this->seed(DistritSeeder::class);
        $this->seed(ManagementRecordsSeeder::class);

        foreach (['DEMO-COM-0001', 'DEMO-FIS-0001', 'DEMO-MEM-0001'] as $code) {
            $this->postJson('/api/auth/login', [
                'access_code' => $code,
                'password' => '12345678',
            ])->assertOk()
                ->assertJsonPath('data.user.access_code', $code)
                ->assertJsonPath('data.user.must_change_password', true);
        }
    }

    public function test_reseeding_repairs_untouched_demo_passwords_without_resetting_personal_ones(): void
    {
        $this->seed(ProvinceSeeder::class);
        $this->seed(DistritSeeder::class);
        $this->seed(ManagementRecordsSeeder::class);

        $changedUser = User::where('access_code', 'DEMO-COM-0001')->firstOrFail();
        $changedUser->forceFill(['password' => 'personal-password-123', 'password_changed_at' => now()])->save();

        $untouchedUser = User::where('access_code', 'DEMO-FIS-0001')->firstOrFail();
        $untouchedUser->forceFill(['password' => 'unavailable-random-password'])->save();

        $this->seed(ManagementRecordsSeeder::class);

        $this->assertTrue(Hash::check('personal-password-123', $changedUser->fresh()->password));
        $this->assertTrue(Hash::check('12345678', $untouchedUser->fresh()->password));
        $this->assertSame(18, User::where('access_code', 'like', 'DEMO-%')->count());
    }
}
