<?php

namespace App\Http\Requests\Api;

use Illuminate\Validation\Rule;

class CandidateStatusRequest extends ApiFormRequest
{
    public function rules(): array
    {
        return [
            'status' => ['required', Rule::in(['APPROVED', 'REJECTED', 'SUSPENDED'])],
        ];
    }
}
