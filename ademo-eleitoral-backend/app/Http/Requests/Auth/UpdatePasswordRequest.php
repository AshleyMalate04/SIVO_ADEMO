<?php

namespace App\Http\Requests\Auth;

use App\Http\Requests\Api\ApiFormRequest;

class UpdatePasswordRequest extends ApiFormRequest
{
    public function rules(): array
    {
        return [
            'current_password' => ['required', 'string'],
            'password' => ['required', 'string', 'min:8', 'confirmed'],
        ];
    }
}
