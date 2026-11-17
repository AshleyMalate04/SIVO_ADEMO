<?php

namespace App\Http\Controllers\Api;

use App\Http\Requests\Api\PositionRequest;
use App\Models\Position;

class PositionController extends CrudController
{
    protected string $model = Position::class;

    protected ?string $requestClass = PositionRequest::class;

    protected array $with = ['organ'];

    protected array $searchable = ['name', 'description'];
}
