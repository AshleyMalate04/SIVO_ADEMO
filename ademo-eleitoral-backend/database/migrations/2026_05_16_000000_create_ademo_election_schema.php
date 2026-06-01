<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('province', function (Blueprint $table): void {
            $table->id();
            $table->string('name', 100);
            $table->string('code', 10)->nullable()->unique();
            $table->string('status', 20)->default('ACTIVE');
            $table->timestamps();
        });

        Schema::create('distrit', function (Blueprint $table): void {
            $table->id();
            $table->foreignId('province_id')->constrained('province')->cascadeOnUpdate()->restrictOnDelete();
            $table->string('name', 150);
            $table->string('code', 10)->nullable();
            $table->string('status', 20)->default('ACTIVE');
            $table->timestamps();
        });

        Schema::create('delegations', function (Blueprint $table): void {
            $table->id();
            $table->string('name', 150);
            $table->foreignId('province_id')->constrained('province')->cascadeOnUpdate()->restrictOnDelete();
            $table->foreignId('district_id')->nullable()->constrained('distrit')->cascadeOnUpdate()->nullOnDelete();
            $table->text('address')->nullable();
            $table->string('status', 20)->default('ACTIVE');
            $table->timestamps();
        });

        Schema::table('users', function (Blueprint $table): void {
            $table->foreign('delegation_id')->references('id')->on('delegations')->cascadeOnUpdate()->nullOnDelete();
        });

        Schema::create('organs', function (Blueprint $table): void {
            $table->id();
            $table->string('name', 150);
            $table->text('description')->nullable();
            $table->string('status', 20)->default('ACTIVE');
            $table->timestamps();
        });

        Schema::create('positions', function (Blueprint $table): void {
            $table->id();
            $table->foreignId('organ_id')->constrained('organs')->cascadeOnUpdate()->restrictOnDelete();
            $table->string('name', 150);
            $table->text('description')->nullable();
            $table->string('status', 20)->default('ACTIVE');
            $table->timestamps();
        });

        Schema::create('members', function (Blueprint $table): void {
            $table->id();
            $table->string('member_code', 50)->unique();
            $table->string('name', 150);
            $table->string('phone', 30)->nullable();
            $table->string('email', 200)->nullable();
            $table->string('bi_number', 20)->nullable();
            $table->foreignId('delegation_id')->constrained('delegations')->cascadeOnUpdate()->restrictOnDelete();
            $table->string('status', 20)->default('ACTIVE');
            $table->date('registered_at')->nullable();
            $table->timestamps();
        });

        Schema::create('elections', function (Blueprint $table): void {
            $table->id();
            $table->string('title', 200);
            $table->foreignId('organ_id')->constrained('organs')->cascadeOnUpdate()->restrictOnDelete();
            $table->foreignId('position_id')->constrained('positions')->cascadeOnUpdate()->restrictOnDelete();
            $table->foreignId('delegation_id')->nullable()->constrained('delegations')->cascadeOnUpdate()->nullOnDelete();
            $table->foreignId('parent_election_id')->nullable()->constrained('elections')->cascadeOnUpdate()->nullOnDelete();
            $table->integer('round_number')->default(1);
            $table->timestamp('starts_at');
            $table->timestamp('ends_at');
            $table->text('description')->nullable();
            $table->boolean('allow_blank_vote')->default(false);
            $table->string('status', 30)->default('PROGRAMADA');
            $table->foreignId('created_by')->constrained('users')->cascadeOnUpdate()->restrictOnDelete();
            $table->timestamps();
        });

        Schema::create('election_team', function (Blueprint $table): void {
            $table->id();
            $table->foreignId('election_id')->constrained('elections')->cascadeOnUpdate()->cascadeOnDelete();
            $table->foreignId('user_id')->constrained('users')->cascadeOnUpdate()->cascadeOnDelete();
            $table->string('role_in_election', 30);
            $table->timestamps();
            $table->unique(['election_id', 'user_id']);
        });

        Schema::create('candidates', function (Blueprint $table): void {
            $table->id();
            $table->foreignId('election_id')->constrained('elections')->cascadeOnUpdate()->cascadeOnDelete();
            $table->foreignId('member_id')->constrained('members')->cascadeOnUpdate()->restrictOnDelete();
            $table->foreignId('position_id')->constrained('positions')->cascadeOnUpdate()->restrictOnDelete();
            $table->text('biography')->nullable();
            $table->text('proposal')->nullable();
            $table->string('photo_path')->nullable();
            $table->string('document_path')->nullable();
            $table->string('status', 20)->default('APPROVED');
            $table->timestamps();
            $table->unique(['election_id', 'member_id']);
        });

        Schema::create('election_voters', function (Blueprint $table): void {
            $table->id();
            $table->foreignId('election_id')->constrained('elections')->cascadeOnUpdate()->cascadeOnDelete();
            $table->foreignId('member_id')->constrained('members')->cascadeOnUpdate()->restrictOnDelete();
            $table->foreignId('delegation_id')->nullable()->constrained('delegations')->cascadeOnUpdate()->nullOnDelete();
            $table->string('status', 20)->default('AUTHORIZED');
            $table->boolean('has_voted')->default(false);
            $table->timestamp('voted_at')->nullable();
            $table->string('voter_hash')->unique();
            $table->timestamps();
            $table->unique(['election_id', 'member_id']);
        });

        Schema::create('votes', function (Blueprint $table): void {
            $table->id();
            $table->foreignId('election_id')->constrained('elections')->cascadeOnUpdate()->restrictOnDelete();
            $table->foreignId('candidate_id')->nullable()->constrained('candidates')->cascadeOnUpdate()->restrictOnDelete();
            $table->boolean('is_blank')->default(false);
            $table->string('proof_hash')->unique();
            $table->timestamps();
        });

        Schema::create('vote_receipts', function (Blueprint $table): void {
            $table->id();
            $table->foreignId('election_id')->constrained('elections')->cascadeOnUpdate()->restrictOnDelete();
            $table->string('voter_hash');
            $table->string('public_code', 100)->unique();
            $table->timestamps();
        });

        Schema::create('audit_logs', function (Blueprint $table): void {
            $table->id();
            $table->foreignId('election_id')->nullable()->constrained('elections')->cascadeOnUpdate()->nullOnDelete();
            $table->foreignId('user_id')->nullable()->constrained('users')->cascadeOnUpdate()->nullOnDelete();
            $table->string('action', 100);
            $table->string('entity', 100);
            $table->unsignedBigInteger('entity_id')->nullable();
            $table->json('details')->nullable();
            $table->string('ip', 45)->nullable();
            $table->text('user_agent')->nullable();
            $table->timestamps();
        });

        Schema::create('notifications', function (Blueprint $table): void {
            $table->id();
            $table->foreignId('user_id')->constrained('users')->cascadeOnUpdate()->cascadeOnDelete();
            $table->string('title', 200);
            $table->text('message');
            $table->string('type', 50);
            $table->timestamp('read_at')->nullable();
            $table->timestamps();
        });

        Schema::create('settings', function (Blueprint $table): void {
            $table->id();
            $table->foreignId('user_id')->unique()->constrained('users')->cascadeOnUpdate()->cascadeOnDelete();
            $table->string('theme', 20)->default('LIGHT');
            $table->boolean('high_contrast')->default(false);
            $table->string('font_size', 10)->default('MEDIUM');
            $table->boolean('email_notifications')->default(true);
            $table->boolean('system_notifications')->default(true);
            $table->boolean('whatsapp_notifications')->default(false);
            $table->timestamps();
        });

        $this->addCheckConstraints();
    }

    public function down(): void
    {
        Schema::dropIfExists('settings');
        Schema::dropIfExists('notifications');
        Schema::dropIfExists('audit_logs');
        Schema::dropIfExists('vote_receipts');
        Schema::dropIfExists('votes');
        Schema::dropIfExists('election_voters');
        Schema::dropIfExists('candidates');
        Schema::dropIfExists('election_team');
        Schema::dropIfExists('elections');
        Schema::dropIfExists('members');
        Schema::dropIfExists('positions');
        Schema::dropIfExists('organs');
        Schema::table('users', function (Blueprint $table): void {
            $table->dropForeign(['delegation_id']);
        });
        Schema::dropIfExists('delegations');
        Schema::dropIfExists('distrit');
        Schema::dropIfExists('province');
    }

    private function addCheckConstraints(): void
    {
        if (DB::getDriverName() === 'sqlite') {
            return;
        }

        DB::statement("ALTER TABLE province ADD CONSTRAINT province_status_check CHECK (status IN ('ACTIVE','INACTIVE'))");
        DB::statement("ALTER TABLE distrit ADD CONSTRAINT distrit_status_check CHECK (status IN ('ACTIVE','INACTIVE'))");
        DB::statement("ALTER TABLE delegations ADD CONSTRAINT delegations_status_check CHECK (status IN ('ACTIVE','INACTIVE'))");
        DB::statement("ALTER TABLE organs ADD CONSTRAINT organs_status_check CHECK (status IN ('ACTIVE','INACTIVE'))");
        DB::statement("ALTER TABLE positions ADD CONSTRAINT positions_status_check CHECK (status IN ('ACTIVE','INACTIVE'))");
        DB::statement("ALTER TABLE users ADD CONSTRAINT users_role_check CHECK (role IN ('ADMIN','COMMISSION','COMISSAO','FISCAL','VOTER','ELEITOR'))");
        DB::statement("ALTER TABLE users ADD CONSTRAINT users_status_check CHECK (status IN ('ACTIVE','INACTIVE','BLOCKED'))");
        DB::statement("ALTER TABLE members ADD CONSTRAINT members_status_check CHECK (status IN ('ACTIVE','INACTIVE'))");
        DB::statement("ALTER TABLE elections ADD CONSTRAINT elections_round_number_check CHECK (round_number IN (1,2))");
        DB::statement("ALTER TABLE elections ADD CONSTRAINT elections_status_check CHECK (status IN ('PROGRAMADA','EM_VOTACAO','CONCLUIDA','RESULTADOS_PUBLICADOS'))");
        DB::statement('ALTER TABLE elections ADD CONSTRAINT chk_elections_dates CHECK (ends_at > starts_at)');
        DB::statement("ALTER TABLE election_team ADD CONSTRAINT election_team_role_check CHECK (role_in_election IN ('COMMISSION','COMISSAO','FISCAL'))");
        DB::statement("ALTER TABLE candidates ADD CONSTRAINT candidates_status_check CHECK (status IN ('APPROVED','REJECTED','SUSPENDED'))");
        DB::statement("ALTER TABLE election_voters ADD CONSTRAINT election_voters_status_check CHECK (status IN ('AUTHORIZED','REMOVED'))");
        DB::statement('ALTER TABLE votes ADD CONSTRAINT chk_vote_blank_or_candidate CHECK ((is_blank = TRUE AND candidate_id IS NULL) OR (is_blank = FALSE AND candidate_id IS NOT NULL))');
        DB::statement("ALTER TABLE notifications ADD CONSTRAINT notifications_type_check CHECK (type IN ('INFO','WARNING','ELECTION','SYSTEM'))");
        DB::statement("ALTER TABLE settings ADD CONSTRAINT settings_theme_check CHECK (theme IN ('LIGHT','DARK','SYSTEM'))");
        DB::statement("ALTER TABLE settings ADD CONSTRAINT settings_font_size_check CHECK (font_size IN ('SMALL','MEDIUM','LARGE'))");
    }
};
