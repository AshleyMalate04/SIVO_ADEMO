<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Support\Facades\DB;

return new class extends Migration
{
    public function up(): void
    {
        if (DB::getDriverName() === 'sqlite') {
            return;
        }

        DB::statement('ALTER TABLE elections DROP CONSTRAINT IF EXISTS elections_status_check');
        DB::statement("UPDATE elections SET status = 'PROGRAMADA' WHERE status IN ('DRAFT', 'SCHEDULED')");
        DB::statement("UPDATE elections SET status = 'EM_VOTACAO' WHERE status IN ('OPEN', 'PUBLISHED')");
        DB::statement("UPDATE elections SET status = 'CONCLUIDA' WHERE status = 'CLOSED'");
        DB::statement("UPDATE elections SET status = 'RESULTADOS_PUBLICADOS' WHERE status IN ('FINISHED', 'RESULTS_PUBLISHED')");
        DB::statement("ALTER TABLE elections ALTER COLUMN status SET DEFAULT 'PROGRAMADA'");
        DB::statement("ALTER TABLE elections ADD CONSTRAINT elections_status_check CHECK (status IN ('PROGRAMADA','EM_VOTACAO','CONCLUIDA','RESULTADOS_PUBLICADOS'))");
    }

    public function down(): void
    {
        if (DB::getDriverName() === 'sqlite') {
            return;
        }

        DB::statement('ALTER TABLE elections DROP CONSTRAINT IF EXISTS elections_status_check');
        DB::statement("UPDATE elections SET status = 'DRAFT' WHERE status = 'PROGRAMADA'");
        DB::statement("UPDATE elections SET status = 'OPEN' WHERE status = 'EM_VOTACAO'");
        DB::statement("UPDATE elections SET status = 'CLOSED' WHERE status = 'CONCLUIDA'");
        DB::statement("UPDATE elections SET status = 'FINISHED' WHERE status = 'RESULTADOS_PUBLICADOS'");
        DB::statement("ALTER TABLE elections ALTER COLUMN status SET DEFAULT 'DRAFT'");
        DB::statement("ALTER TABLE elections ADD CONSTRAINT elections_status_check CHECK (status IN ('DRAFT','PUBLISHED','OPEN','CLOSED','CANCELLED','FINISHED'))");
    }
};
