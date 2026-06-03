<?php

use App\Models\Candidate;
use Illuminate\Support\Facades\Route;
use Illuminate\Support\Facades\Storage;

Route::get('/', function () {
    return view('welcome');
});

Route::get('/storage/{path}', function (string $path) {
    abort_unless(Storage::disk('public')->exists($path), 404);

    return Storage::disk('public')->response($path);
})->where('path', '.*');

Route::get('/candidate-photos/{candidate}', function (Candidate $candidate) {
    abort_unless($candidate->photo_path && Storage::disk('public')->exists($candidate->photo_path), 404);

    return Storage::disk('public')->response($candidate->photo_path);
})->name('candidate.photos.show');

Route::get('/candidate-documents/{candidate}', function (Candidate $candidate) {
    abort_unless($candidate->document_path && Storage::disk('public')->exists($candidate->document_path), 404);

    return Storage::disk('public')->response($candidate->document_path);
})->name('candidate.documents.show');
