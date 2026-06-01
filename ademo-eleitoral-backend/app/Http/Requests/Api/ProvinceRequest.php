<?php

namespace App\Http\Requests\Api;

use Illuminate\Validation\Rule;

class ProvinceRequest extends ApiFormRequest
{
    public function rules(): array
    {
        $required = $this->isMethod('post') ? 'required' : 'sometimes';

        return [
            'name' => [$required, 'string', 'max:100'],
            'code' => ['nullable', 'string', 'max:10', Rule::unique('province', 'code')->ignore($this->routeId())],
            'status' => ['sometimes', Rule::in(['ACTIVE', 'INACTIVE', 'SUSPENDED'])],
        ];
    }
}
