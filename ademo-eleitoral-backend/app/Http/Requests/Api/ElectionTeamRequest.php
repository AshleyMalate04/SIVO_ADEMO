<?php

namespace App\Http\Requests\Api;

use Illuminate\Validation\Rule;

class ElectionTeamRequest extends ApiFormRequest
{
    public function rules(): array
    {
        return [
            'users' => ['required', 'array', 'min:1'],
            'users.*.user_id' => ['required', 'integer', 'exists:users,id'],
            'users.*.role_in_election' => ['required', Rule::in(['COMMISSION', 'COMISSAO', 'FISCAL'])],
        ];
    }
}
