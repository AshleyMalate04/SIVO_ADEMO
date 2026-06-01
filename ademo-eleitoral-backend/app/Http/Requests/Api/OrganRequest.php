<?php

namespace App\Http\Requests\Api;

use Illuminate\Validation\Rule;

class OrganRequest extends ApiFormRequest
{
    public function rules(): array
    {
        return [
            'name' => [$this->isMethod('post') ? 'required' : 'sometimes', 'string', 'max:150'],
            'description' => ['nullable', 'string'],
            'status' => ['sometimes', Rule::in(['ACTIVE', 'INACTIVE', 'SUSPENDED'])],
        ];
    }
}
