<?php

namespace App\Http\Requests\Api;

use Illuminate\Validation\Rule;

class VoteReceiptRequest extends ApiFormRequest
{
    public function rules(): array
    {
        $required = $this->isMethod('post') ? 'required' : 'sometimes';

        return [
            'election_id' => [$required, 'integer', 'exists:elections,id'],
            'voter_hash' => [$required, 'string', 'max:255'],
            'public_code' => [$required, 'string', 'max:100', Rule::unique('vote_receipts', 'public_code')->ignore($this->routeId())],
        ];
    }
}
