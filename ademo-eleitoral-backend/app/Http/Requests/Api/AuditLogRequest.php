<?php

namespace App\Http\Requests\Api;

class AuditLogRequest extends ApiFormRequest
{
    public function rules(): array
    {
        $required = $this->isMethod('post') ? 'required' : 'sometimes';

        return [
            'election_id' => ['nullable', 'integer', 'exists:elections,id'],
            'user_id' => ['nullable', 'integer', 'exists:users,id'],
            'action' => [$required, 'string', 'max:100'],
            'entity' => [$required, 'string', 'max:100'],
            'entity_id' => ['nullable', 'integer'],
            'details' => ['nullable', 'array'],
            'ip' => ['nullable', 'string', 'max:45'],
            'user_agent' => ['nullable', 'string'],
        ];
    }
}
