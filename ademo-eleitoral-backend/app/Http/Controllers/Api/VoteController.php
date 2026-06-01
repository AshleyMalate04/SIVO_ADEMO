<?php

namespace App\Http\Controllers\Api;

use App\Http\Requests\Api\VoteRequest;
use App\Models\Vote;

class VoteController extends CrudController
{
    protected string $model = Vote::class;

    protected ?string $requestClass = VoteRequest::class;

    protected array $with = ['election', 'candidate'];
}
