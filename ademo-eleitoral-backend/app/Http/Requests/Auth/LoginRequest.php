<?php

namespace App\Http\Requests\Auth;

use App\Http\Requests\Api\ApiFormRequest;

class LoginRequest extends ApiFormRequest
{
    protected function prepareForValidation(): void
    {
        $this->merge([
            'access_code' => strtoupper(trim((string) $this->input('access_code'))),
        ]);
    }

    public function rules(): array
    {
        return [
            'access_code' => ['required', 'string', 'max:50'],
            'password' => ['required', 'string'],
        ];
    }
}
