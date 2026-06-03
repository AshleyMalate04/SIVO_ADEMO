<?php

use App\Http\Controllers\Api\AuditController;
use App\Http\Controllers\Api\AuthController;
use App\Http\Controllers\Api\CandidateController;
use App\Http\Controllers\Api\DelegationController;
use App\Http\Controllers\Api\DistritController;
use App\Http\Controllers\Api\ElectionController;
use App\Http\Controllers\Api\ElectionVoterController;
use App\Http\Controllers\Api\MemberController;
use App\Http\Controllers\Api\NotificationController;
use App\Http\Controllers\Api\OrganController;
use App\Http\Controllers\Api\PhysicalResultController;
use App\Http\Controllers\Api\PositionController;
use App\Http\Controllers\Api\ProvinceController;
use App\Http\Controllers\Api\ResultController;
use App\Http\Controllers\Api\SettingController;
use App\Http\Controllers\Api\UserController;
use App\Http\Controllers\Api\VotingController;
use Illuminate\Support\Facades\Route;

Route::get('/health', fn () => \App\Support\ApiResponse::success(['status' => 'ok'], 'API operacional.'));

Route::prefix('auth')->group(function (): void {
    Route::post('/login', [AuthController::class, 'login'])->middleware('throttle:10,1');
    Route::post('/forgot-password', [AuthController::class, 'forgotPassword'])->middleware('throttle:5,1');
    Route::post('/verify-code', [AuthController::class, 'verifyCode'])->middleware('throttle:10,1');
    Route::post('/reset-password', [AuthController::class, 'resetPassword'])->middleware('throttle:5,1');

    Route::middleware(['auth:sanctum', 'active'])->group(function (): void {
        Route::post('/logout', [AuthController::class, 'logout']);
        Route::post('/logout-all', [AuthController::class, 'logoutAll']);
        Route::get('/me', [AuthController::class, 'me']);
    });
});

Route::middleware(['auth:sanctum', 'active'])->group(function (): void {
    Route::middleware('role:ADMIN,COMISSAO,COMMISSION,FISCAL')->group(function (): void {
        Route::get('/provinces', [ProvinceController::class, 'index']);
        Route::get('/provinces/{id}', [ProvinceController::class, 'show']);
        Route::get('/provinces/{id}/districts', [ProvinceController::class, 'districts']);
        Route::get('/districts/{id}', [DistritController::class, 'show']);

        Route::get('/delegations', [DelegationController::class, 'index']);
        Route::get('/delegations/{id}', [DelegationController::class, 'show']);

        Route::get('/organs', [OrganController::class, 'index']);
        Route::get('/organs/{id}', [OrganController::class, 'show']);
        Route::get('/organs/{id}/positions', [OrganController::class, 'positions']);

        Route::get('/members', [MemberController::class, 'index']);
        Route::get('/members/{id}', [MemberController::class, 'show']);

        Route::get('/users', [UserController::class, 'index']);

        Route::get('/elections/{id}/voters', [ElectionVoterController::class, 'byElection']);
    });

    Route::middleware('role:ADMIN')->group(function (): void {
        Route::post('/delegations', [DelegationController::class, 'store']);
        Route::put('/delegations/{id}', [DelegationController::class, 'update']);
        Route::delete('/delegations/{id}', [DelegationController::class, 'destroy']);

        Route::post('/organs', [OrganController::class, 'store']);
        Route::put('/organs/{id}', [OrganController::class, 'update']);
        Route::delete('/organs/{id}', [OrganController::class, 'destroy']);
        Route::post('/organs/{id}/positions', [OrganController::class, 'storePosition']);
        Route::put('/positions/{id}', [PositionController::class, 'update']);
        Route::delete('/positions/{id}', [PositionController::class, 'destroy']);

        Route::post('/users', [UserController::class, 'store']);
        Route::get('/users/{id}', [UserController::class, 'show']);
        Route::put('/users/{id}', [UserController::class, 'update']);
        Route::patch('/users/{id}/status', [UserController::class, 'updateStatus']);
    });

    Route::middleware('role:ADMIN,COMISSAO')->group(function (): void {
        Route::post('/members', [MemberController::class, 'store']);
        Route::put('/members/{id}', [MemberController::class, 'update']);
        Route::delete('/members/{id}', [MemberController::class, 'destroy']);
        Route::post('/members/import', [MemberController::class, 'import']);
    });

    Route::middleware('role:ADMIN,COMISSAO,COMMISSION,FISCAL,ELEITOR')->group(function (): void {
        Route::get('/elections', [ElectionController::class, 'index']);
        Route::get('/elections/{id}', [ElectionController::class, 'show']);
    });

    Route::middleware('role:COMISSAO,COMMISSION')->group(function (): void {
        Route::post('/elections', [ElectionController::class, 'store']);
        Route::put('/elections/{id}', [ElectionController::class, 'update']);
        Route::delete('/elections/{id}', [ElectionController::class, 'destroy']);
        Route::patch('/elections/{id}/status', [ElectionController::class, 'updateStatus']);
        Route::post('/elections/{id}/team', [ElectionController::class, 'team']);
        Route::patch('/elections/{id}/team/{userId}/status', [ElectionController::class, 'updateTeamStatus']);
        Route::post('/elections/{id}/second-round', [ElectionController::class, 'secondRound']);

        Route::post('/elections/{id}/candidates', [CandidateController::class, 'storeForElection']);
        Route::put('/candidates/{id}', [CandidateController::class, 'update']);
        Route::patch('/candidates/{id}/status', [CandidateController::class, 'updateStatus']);

        Route::post('/elections/{id}/voters', [ElectionVoterController::class, 'storeForElection']);
        Route::patch('/elections/{id}/voters/{memberId}/status', [ElectionVoterController::class, 'updateStatus']);
        Route::delete('/elections/{id}/voters/{memberId}', [ElectionVoterController::class, 'destroyByMember']);
        Route::post('/elections/{id}/credentials', [ElectionVoterController::class, 'credentials']);
    });

    // Route::get('/elections/{id}/candidates', [CandidateController::class, 'byElection']);
    // Route::get('/candidates/{id}', [CandidateController::class, 'show']);

    Route::get('/candidates', [CandidateController::class, 'index']);
    Route::get('/elections/{id}/candidates', [CandidateController::class, 'byElection']);
    Route::get('/candidates/{id}', [CandidateController::class, 'show']);

    Route::middleware('role:ELEITOR,VOTER')->group(function (): void {
        Route::get('/voting/elections', [VotingController::class, 'elections']);
        Route::get('/voting/elections/{id}/ballot', [VotingController::class, 'ballot']);
        Route::post('/voting/elections/{id}/confirm', [VotingController::class, 'confirm']);
        Route::get('/voting/elections/{id}/receipt', [VotingController::class, 'receipt']);

        Route::get('/notifications', [NotificationController::class, 'index']);
        Route::patch('/notifications/read-all', [NotificationController::class, 'readAll']);
        Route::patch('/notifications/{id}/read', [NotificationController::class, 'read']);
        Route::delete('/notifications/{id}', [NotificationController::class, 'destroy']);
    });

    Route::get('/results', [ResultController::class, 'index']);
    Route::get('/results/{electionId}', [ResultController::class, 'show']);
    Route::post('/results/{electionId}/publish', [ResultController::class, 'publish'])->middleware('role:ADMIN,COMISSAO,COMMISSION');

    Route::get('/elections/{id}/physical-results', [PhysicalResultController::class, 'show'])->middleware('role:ADMIN,COMISSAO,COMMISSION,FISCAL');
    Route::post('/elections/{id}/physical-results', [PhysicalResultController::class, 'store'])->middleware('role:ADMIN,COMISSAO,COMMISSION');
    Route::patch('/elections/{id}/physical-results/approve', [PhysicalResultController::class, 'approve'])->middleware('role:ADMIN,COMISSAO,COMMISSION,FISCAL');

    Route::get('/audit', [AuditController::class, 'index'])->middleware('role:ADMIN,FISCAL');
    Route::get('/elections/{id}/audit', [AuditController::class, 'byElection'])->middleware('role:ADMIN,FISCAL,COMISSAO,COMMISSION');

    Route::get('/settings', [SettingController::class, 'current']);
    Route::put('/settings', [SettingController::class, 'updateCurrent']);
    Route::put('/settings/email', [SettingController::class, 'updateEmail']);
    Route::put('/settings/password', [SettingController::class, 'updatePassword']);
    // Route::get('/elections/{id}/candidates', [CandidateController::class
});
