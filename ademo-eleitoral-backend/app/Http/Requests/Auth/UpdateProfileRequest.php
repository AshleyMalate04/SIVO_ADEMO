<?php

namespace App\Http\Requests\Auth;

use App\Http\Requests\Api\ApiFormRequest;
use Illuminate\Validation\Rule;

class UpdateProfileRequest extends ApiFormRequest
{
    protected function prepareForValidation(): void
    {
        if ($this->has('name')) {
            $this->merge([
                'name' => preg_replace('/\s+/u', ' ', trim((string) $this->input('name'))),
            ]);
        }
    }

    public function rules(): array
    {
        $userId = $this->user()?->id;

        return [
            'name' => ['required', 'string', 'max:150', 'regex:/^\s*\S+\s+\S+.*$/u'],
            'email' => ['nullable', 'email', 'max:200', Rule::unique('users', 'email')->ignore($userId)],
            'phone' => [
                'nullable',
                'string',
                'regex:/^(?:\+258)?(?:82|83|84|85|86|87)[0-9]{7}$/',
                Rule::unique('users', 'phone')->ignore($userId),
            ],
        ];
    }

    public function messages(): array
    {
        return [
            'name.required' => 'Informe o seu nome.',
            'name.regex' => 'Informe o nome completo, com pelo menos duas palavras.',
            'email.email' => 'Informe um email válido.',
            'email.unique' => 'Este email já está associado a outra conta.',
            'phone.regex' => 'Informe um número moçambicano válido.',
            'phone.unique' => 'Este telefone já está associado a outra conta.',
        ];
    }
}
