<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('notifications', function (Blueprint $table): void {
            $table->index(['user_id', 'read_at', 'created_at'], 'notifications_user_read_created_idx');
            $table->index(['user_id', 'election_id', 'title'], 'notifications_user_election_title_idx');
        });

        Schema::table('elections', function (Blueprint $table): void {
            $table->index(['status', 'starts_at', 'ends_at'], 'elections_status_dates_idx');
            $table->index(['organ_id', 'position_id', 'delegation_id', 'status'], 'elections_scope_status_idx');
        });

        Schema::table('election_voters', function (Blueprint $table): void {
            $table->index(['election_id', 'status', 'member_id'], 'election_voters_election_status_member_idx');
            $table->index(['member_id', 'status', 'election_id'], 'election_voters_member_status_election_idx');
        });

        Schema::table('election_team', function (Blueprint $table): void {
            $table->index(['election_id', 'status', 'user_id'], 'election_team_election_status_user_idx');
            $table->index(['user_id', 'status', 'election_id'], 'election_team_user_status_election_idx');
        });

        Schema::table('members', function (Blueprint $table): void {
            $table->index('email', 'members_email_idx');
            $table->index('phone', 'members_phone_idx');
            $table->index(['delegation_id', 'status'], 'members_delegation_status_idx');
        });

        Schema::table('users', function (Blueprint $table): void {
            $table->index(['role', 'status'], 'users_role_status_idx');
            $table->index('phone', 'users_phone_idx');
        });
    }

    public function down(): void
    {
        Schema::table('users', function (Blueprint $table): void {
            $table->dropIndex('users_role_status_idx');
            $table->dropIndex('users_phone_idx');
        });

        Schema::table('members', function (Blueprint $table): void {
            $table->dropIndex('members_email_idx');
            $table->dropIndex('members_phone_idx');
            $table->dropIndex('members_delegation_status_idx');
        });

        Schema::table('election_team', function (Blueprint $table): void {
            $table->dropIndex('election_team_election_status_user_idx');
            $table->dropIndex('election_team_user_status_election_idx');
        });

        Schema::table('election_voters', function (Blueprint $table): void {
            $table->dropIndex('election_voters_election_status_member_idx');
            $table->dropIndex('election_voters_member_status_election_idx');
        });

        Schema::table('elections', function (Blueprint $table): void {
            $table->dropIndex('elections_status_dates_idx');
            $table->dropIndex('elections_scope_status_idx');
        });

        Schema::table('notifications', function (Blueprint $table): void {
            $table->dropIndex('notifications_user_read_created_idx');
            $table->dropIndex('notifications_user_election_title_idx');
        });
    }
};
