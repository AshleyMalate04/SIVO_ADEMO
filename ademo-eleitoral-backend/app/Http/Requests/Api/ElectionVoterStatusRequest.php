<?php

namespace App\Http\Requests\Api;

use Illuminate\Validation\Rule;

class ElectionVoterStatusRequest extends ApiFormRequest
{
    public function rules(): array
    {
        return [
            'status' => ['required', Rule::in(['AUTHORIZED', 'REMOVED', 'SUSPENDED'])],
        ];
    }
}
