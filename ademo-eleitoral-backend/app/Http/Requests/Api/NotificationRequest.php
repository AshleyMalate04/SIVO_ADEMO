<?php

namespace App\Http\Requests\Api;

use Illuminate\Validation\Rule;

class NotificationRequest extends ApiFormRequest
{
    public function rules(): array
    {
        $required = $this->isMethod('post') ? 'required' : 'sometimes';

        return [
            'user_id' => [$required, 'integer', 'exists:users,id'],
            'title' => [$required, 'string', 'max:200'],
            'message' => [$required, 'string'],
            'type' => [$required, Rule::in(['INFO', 'WARNING', 'ELECTION', 'SYSTEM'])],
            'read_at' => ['nullable', 'date'],
        ];
    }
}
