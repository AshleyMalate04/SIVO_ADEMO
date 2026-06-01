<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('elections', function (Blueprint $table): void {
            if (! Schema::hasColumn('elections', 'results_status')) {
                $table->string('results_status', 30)->default('NOT_PUBLISHED')->after('status');
            }

            if (! Schema::hasColumn('elections', 'results_published_at')) {
                $table->timestamp('results_published_at')->nullable()->after('results_status');
            }

            if (! Schema::hasColumn('elections', 'results_published_by')) {
                $table->foreignId('results_published_by')->nullable()->after('results_published_at')->constrained('users')->nullOnDelete();
            }
        });

        Schema::table('election_voters', function (Blueprint $table): void {
            if (! Schema::hasColumn('election_voters', 'voting_mode')) {
                $table->string('voting_mode', 20)->default('ONLINE')->after('status');
            }
        });

        Schema::table('votes', function (Blueprint $table): void {
            if (! Schema::hasColumn('votes', 'vote_origin')) {
                $table->string('vote_origin', 20)->default('ONLINE')->after('is_blank');
            }
        });

        if (! Schema::hasTable('physical_vote_totals')) {
            Schema::create('physical_vote_totals', function (Blueprint $table): void {
                $table->id();
                $table->foreignId('election_id')->constrained('elections')->cascadeOnDelete();
                $table->foreignId('candidate_id')->nullable()->constrained('candidates')->cascadeOnDelete();
                $table->unsignedInteger('votes')->default(0);
                $table->string('status', 20)->default('PENDING');
                $table->foreignId('registered_by')->nullable()->constrained('users')->nullOnDelete();
                $table->foreignId('approved_by')->nullable()->constrained('users')->nullOnDelete();
                $table->timestamp('approved_at')->nullable();
                $table->timestamps();
                $table->unique(['election_id', 'candidate_id']);
            });
        }
    }

    public function down(): void
    {
        Schema::dropIfExists('physical_vote_totals');

        Schema::table('votes', function (Blueprint $table): void {
            if (Schema::hasColumn('votes', 'vote_origin')) {
                $table->dropColumn('vote_origin');
            }
        });

        Schema::table('election_voters', function (Blueprint $table): void {
            if (Schema::hasColumn('election_voters', 'voting_mode')) {
                $table->dropColumn('voting_mode');
            }
        });

        Schema::table('elections', function (Blueprint $table): void {
            if (Schema::hasColumn('elections', 'results_published_by')) {
                $table->dropConstrainedForeignId('results_published_by');
            }

            if (Schema::hasColumn('elections', 'results_published_at')) {
                $table->dropColumn('results_published_at');
            }

            if (Schema::hasColumn('elections', 'results_status')) {
                $table->dropColumn('results_status');
            }
        });
    }
};
