<?php

namespace App\Http\Requests\Api;

use Illuminate\Validation\Rule;

class VoteRequest extends ApiFormRequest
{
    public function rules(): array
    {
        $required = $this->isMethod('post') ? 'required' : 'sometimes';

        return [
            'election_id' => [$required, 'integer', 'exists:elections,id'],
            'candidate_id' => ['nullable', 'integer', 'required_unless:is_blank,true', 'exists:candidates,id'],
            'is_blank' => ['sometimes', 'boolean'],
            'proof_hash' => [$required, 'string', 'max:255', Rule::unique('votes', 'proof_hash')->ignore($this->routeId())],
        ];
    }
}
