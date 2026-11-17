<?php

namespace App\Http\Requests\Auth;

use App\Http\Requests\Api\ApiFormRequest;

class UpdatePasswordRequest extends ApiFormRequest
{
    public function rules(): array
    {
        return [
            'current_password' => ['required', 'string'],
            'password' => ['required', 'string', 'min:8', 'different:current_password', 'confirmed'],
        ];
    }

    public function messages(): array
    {
        return [
            'password.different' => 'A nova palavra-passe deve ser diferente da palavra-passe inicial ou actual.',
        ];
    }
}
