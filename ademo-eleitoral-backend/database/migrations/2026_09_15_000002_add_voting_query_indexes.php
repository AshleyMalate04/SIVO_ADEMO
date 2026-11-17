<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('votes', function (Blueprint $table): void {
            $table->index(
                ['election_id', 'is_blank', 'candidate_id'],
                'votes_election_blank_candidate_idx'
            );
        });

        Schema::table('vote_receipts', function (Blueprint $table): void {
            $table->index(
                ['election_id', 'voter_hash'],
                'vote_receipts_election_voter_idx'
            );
        });

        Schema::table('physical_vote_totals', function (Blueprint $table): void {
            $table->index(
                ['election_id', 'status', 'candidate_id'],
                'physical_totals_election_status_candidate_idx'
            );
        });
    }

    public function down(): void
    {
        Schema::table('physical_vote_totals', function (Blueprint $table): void {
            $table->dropIndex('physical_totals_election_status_candidate_idx');
        });

        Schema::table('vote_receipts', function (Blueprint $table): void {
            $table->dropIndex('vote_receipts_election_voter_idx');
        });

        Schema::table('votes', function (Blueprint $table): void {
            $table->dropIndex('votes_election_blank_candidate_idx');
        });
    }
};
