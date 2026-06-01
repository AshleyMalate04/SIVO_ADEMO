<?php

namespace App\Http\Requests\Api;

use Illuminate\Validation\Rule;

class PositionRequest extends ApiFormRequest
{
    public function rules(): array
    {
        $required = $this->isMethod('post') ? 'required' : 'sometimes';

        return [
            'organ_id' => [$required, 'integer', 'exists:organs,id'],
            'name' => [$required, 'string', 'max:150'],
            'description' => ['nullable', 'string'],
            'status' => ['sometimes', Rule::in(['ACTIVE', 'INACTIVE', 'SUSPENDED'])],
        ];
    }
}
