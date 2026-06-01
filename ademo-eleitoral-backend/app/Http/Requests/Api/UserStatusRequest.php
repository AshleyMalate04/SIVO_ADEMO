<?php

namespace App\Http\Requests\Api;

use Illuminate\Validation\Rule;

class UserStatusRequest extends ApiFormRequest
{
    public function rules(): array
    {
        return [
            'status' => ['required', Rule::in(['ACTIVE', 'INACTIVE', 'SUSPENDED', 'BLOCKED'])],
        ];
    }
}
