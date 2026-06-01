<?php

namespace App\Http\Requests\Api;

use Illuminate\Validation\Rule;

class DistritRequest extends ApiFormRequest
{
    public function rules(): array
    {
        $required = $this->isMethod('post') ? 'required' : 'sometimes';

        return [
            'province_id' => [$required, 'integer', 'exists:province,id'],
            'name' => [$required, 'string', 'max:150'],
            'code' => ['nullable', 'string', 'max:10'],
            'status' => ['sometimes', Rule::in(['ACTIVE', 'INACTIVE', 'SUSPENDED'])],
        ];
    }
}
