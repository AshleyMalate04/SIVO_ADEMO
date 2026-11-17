<?php

use App\Models\Candidate;
use Illuminate\Support\Facades\Route;
use Illuminate\Support\Facades\Storage;

Route::get('/', function () {
    return view('welcome');
});

Route::get('/storage/{path}', function (string $path) {
    abort_if(str_starts_with($path, 'candidates/documents/'), 404);
    abort_unless(Storage::disk('public')->exists($path), 404);

    return Storage::disk('public')->response($path);
})->where('path', '.*');

Route::get('/candidate-photos/{candidate}', function (Candidate $candidate) {
    abort_unless($candidate->photo_path && Storage::disk('public')->exists($candidate->photo_path), 404);

    return Storage::disk('public')->response($candidate->photo_path);
})->name('candidate.photos.show');

Route::get('/candidate-documents/{candidate}', function (Candidate $candidate) {
    $path = $candidate->document_path;
    abort_unless($path && preg_match('~^candidates/documents/[A-Za-z0-9._-]+$~', $path), 404);

    $disk = Storage::disk('local')->exists($path) ? Storage::disk('local') : Storage::disk('public');
    abort_unless($disk->exists($path), 404);

    return $disk->download($path);
})->middleware('signed')->name('candidate.documents.show');
