<?php

namespace Tests\Feature;

use App\Models\Candidate;
use App\Models\Delegation;
use App\Models\Election;
use App\Models\Member;
use App\Models\Organ;
use App\Models\Position;
use App\Models\Province;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Facades\URL;
use Tests\TestCase;

class CandidateDocumentAccessTest extends TestCase
{
    use RefreshDatabase;

    public function test_document_requires_a_valid_short_lived_signature_and_is_downloaded(): void
    {
        Storage::fake('local');
        Storage::fake('public');
        $candidate = $this->candidate();
        Storage::disk('local')->put($candidate->document_path, 'private document');

        $this->get('/candidate-documents/'.$candidate->id)->assertForbidden();
        $this->get('/storage/'.$candidate->document_path)->assertNotFound();

        $url = $candidate->document_url;
        $this->assertNotNull($url);
        $this->get($url)
            ->assertOk()
            ->assertHeader('content-disposition', 'attachment; filename=record.pdf');

        $this->get($url.'&candidate=999')->assertForbidden();
        $expired = URL::temporarySignedRoute('candidate.documents.show', now()->subMinute(), [
            'candidate' => $candidate->id,
        ]);
        $this->get($expired)->assertForbidden();
    }

    public function test_existing_public_document_remains_available_through_signed_route(): void
    {
        Storage::fake('local');
        Storage::fake('public');
        $candidate = $this->candidate();
        Storage::disk('public')->put($candidate->document_path, 'legacy document');

        $this->get($candidate->document_url)->assertOk();
        $this->get('/storage/'.$candidate->document_path)->assertNotFound();
    }

    private function candidate(): Candidate
    {
        $province = Province::create(['name' => 'Test province']);
        $delegation = Delegation::create(['name' => 'Test delegation', 'province_id' => $province->id]);
        $organ = Organ::create(['name' => 'Test organ']);
        $position = Position::create(['name' => 'Test position', 'organ_id' => $organ->id]);
        $member = Member::create([
            'member_code' => 'TEST-MEMBER', 'name' => 'Test member', 'delegation_id' => $delegation->id,
        ]);
        $user = User::create([
            'name' => 'Test user', 'access_code' => 'TEST-USER', 'password' => 'test-password',
            'role' => 'COMISSAO', 'status' => 'ACTIVE',
        ]);
        $election = Election::create([
            'title' => 'Test election', 'organ_id' => $organ->id, 'position_id' => $position->id,
            'starts_at' => now()->addDay(), 'ends_at' => now()->addDays(2), 'created_by' => $user->id,
        ]);

        return Candidate::create([
            'election_id' => $election->id, 'member_id' => $member->id, 'position_id' => $position->id,
            'document_path' => 'candidates/documents/record.pdf',
        ]);
    }
}
