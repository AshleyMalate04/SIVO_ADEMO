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
            'district_id' => [$required, 'integer', 'exists:distrit,id'],
            'address' => [$required, 'string'],
            'status' => ['sometimes', Rule::in(['ACTIVE', 'INACTIVE', 'SUSPENDED'])],
        ];
    }
}
