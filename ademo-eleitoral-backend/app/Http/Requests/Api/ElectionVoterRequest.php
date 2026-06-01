<?php

namespace App\Http\Requests\Api;

class ElectionVoterRequest extends ApiFormRequest
{
    public function rules(): array
    {
        return [
            'member_ids' => ['required', 'array', 'min:1'],
            'member_ids.*' => ['required', 'integer', 'exists:members,id'],
            'delegation_id' => ['nullable', 'integer', 'exists:delegations,id'],
        ];
    }
}
