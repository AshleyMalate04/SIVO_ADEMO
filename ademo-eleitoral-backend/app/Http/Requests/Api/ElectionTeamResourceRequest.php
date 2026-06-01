<?php

namespace App\Http\Requests\Api;

use Illuminate\Validation\Rule;

class ElectionTeamResourceRequest extends ApiFormRequest
{
    public function rules(): array
    {
        $required = $this->isMethod('post') ? 'required' : 'sometimes';

        return [
            'election_id' => [$required, 'integer', 'exists:elections,id'],
            'user_id' => [$required, 'integer', 'exists:users,id'],
            'role_in_election' => [$required, Rule::in(['COMMISSION', 'COMISSAO', 'FISCAL'])],
        ];
    }
}
