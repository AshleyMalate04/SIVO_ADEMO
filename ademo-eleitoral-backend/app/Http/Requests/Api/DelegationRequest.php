<?php

namespace App\Http\Requests\Api;

use Illuminate\Validation\Rule;

class DelegationRequest extends ApiFormRequest
{
    public function rules(): array
    {
        $required = $this->isMethod('post') ? 'required' : 'sometimes';

        return [
            'name' => [$required, 'string', 'max:150'],
            'province_id' => [$required, 'integer', 'exists:province,id'],
            'district_id' => ['nullable', 'integer', 'exists:distrit,id'],
            'address' => ['nullable', 'string'],
            'status' => ['sometimes', Rule::in(['ACTIVE', 'INACTIVE', 'SUSPENDED'])],
        ];
    }
}
