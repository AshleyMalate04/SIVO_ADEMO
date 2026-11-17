<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('vote_receipts', function (Blueprint $table): void {
            $table->dropIndex('vote_receipts_election_voter_idx');
            $table->unique(
                ['election_id', 'voter_hash'],
                'vote_receipts_election_voter_unique'
            );
        });

        Schema::table('audit_logs', function (Blueprint $table): void {
            $table->index('created_at', 'audit_logs_created_idx');
            $table->index(['election_id', 'created_at'], 'audit_logs_election_created_idx');
            $table->index(['action', 'created_at'], 'audit_logs_action_created_idx');
        });
    }

    public function down(): void
    {
        Schema::table('audit_logs', function (Blueprint $table): void {
            $table->dropIndex('audit_logs_action_created_idx');
            $table->dropIndex('audit_logs_election_created_idx');
            $table->dropIndex('audit_logs_created_idx');
        });

        Schema::table('vote_receipts', function (Blueprint $table): void {
            $table->dropUnique('vote_receipts_election_voter_unique');
            $table->index(
                ['election_id', 'voter_hash'],
                'vote_receipts_election_voter_idx'
            );
        });
    }
};
