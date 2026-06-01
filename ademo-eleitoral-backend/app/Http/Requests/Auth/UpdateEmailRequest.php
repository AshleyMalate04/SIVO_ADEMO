<?php

namespace App\Http\Requests\Auth;

use App\Http\Requests\Api\ApiFormRequest;
use Illuminate\Validation\Rule;

class UpdateEmailRequest extends ApiFormRequest
{
    public function rules(): array
    {
        return [
            'email' => ['required', 'email', 'max:200', Rule::unique('users', 'email')->ignore($this->user()?->id)],
        ];
    }
}
