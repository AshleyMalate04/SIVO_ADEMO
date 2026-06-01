<?php

namespace App\Http\Controllers\Api;

use App\Http\Requests\Api\DistritRequest;
use App\Models\Distrit;

class DistritController extends CrudController
{
    protected string $model = Distrit::class;

    protected ?string $requestClass = DistritRequest::class;

    protected array $with = ['province', 'delegations'];

    protected array $searchable = ['name', 'code'];
}
