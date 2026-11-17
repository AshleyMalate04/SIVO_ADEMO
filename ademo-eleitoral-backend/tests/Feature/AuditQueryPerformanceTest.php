<?php

namespace Tests\Feature;

use App\Models\AuditLog;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\DB;
use Laravel\Sanctum\Sanctum;
use Tests\TestCase;

class AuditQueryPerformanceTest extends TestCase
{
    use RefreshDatabase;

    public function test_audit_entity_names_are_loaded_without_one_query_per_row(): void
    {
        $admin = User::create([
            'name' => 'Administrador de auditoria',
            'access_code' => 'AUDIT-ADMIN',
            'email' => 'audit-admin@example.test',
            'password' => 'password123',
            'role' => 'ADMIN',
            'status' => 'ACTIVE',
            'password_changed_at' => now(),
        ]);

        foreach (range(1, 30) as $number) {
            AuditLog::create([
                'user_id' => $admin->id,
                'action' => 'UPDATE',
                'entity' => 'User',
                'entity_id' => $admin->id,
                'details' => ['sequence' => $number],
            ]);
        }

        Sanctum::actingAs($admin);
        DB::flushQueryLog();
        DB::enableQueryLog();

        $response = $this->getJson('/api/audit?per_page=30');
        $queryCount = count(DB::getQueryLog());

        $response->assertOk()
            ->assertJsonCount(30, 'data.data')
            ->assertJsonPath('data.data.0.entity_name', $admin->name);
        $this->assertLessThanOrEqual(10, $queryCount, "A auditoria executou {$queryCount} consultas.");
    }
}
