<?php

namespace App\Http\Requests\Api;

class VoteReceiptLookupRequest extends ApiFormRequest
{
    public function rules(): array
    {
        return [
            'member_id' => ['required', 'integer', 'exists:members,id'],
        ];
    }
}
