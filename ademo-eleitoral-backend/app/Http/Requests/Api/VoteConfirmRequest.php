<?php

namespace App\Http\Requests\Api;

class VoteConfirmRequest extends ApiFormRequest
{
    public function rules(): array
    {
        return [
            'candidate_id' => ['nullable', 'integer', 'exists:candidates,id'],
            'is_blank' => ['sometimes', 'boolean'],
        ];
    }
}
