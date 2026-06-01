<?php

namespace App\Http\Controllers\Api;

use App\Http\Requests\Api\VoteReceiptRequest;
use App\Models\VoteReceipt;

class VoteReceiptController extends CrudController
{
    protected string $model = VoteReceipt::class;

    protected ?string $requestClass = VoteReceiptRequest::class;

    protected array $with = ['election'];

    protected array $searchable = ['voter_hash', 'public_code'];
}
