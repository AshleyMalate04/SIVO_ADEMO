<?php

namespace App\Http\Controllers\Api;

use App\Http\Requests\Api\ElectionTeamResourceRequest;
use App\Models\ElectionTeam;

class ElectionTeamController extends CrudController
{
    protected string $model = ElectionTeam::class;

    protected ?string $requestClass = ElectionTeamResourceRequest::class;

    protected array $with = ['election', 'user'];
}
