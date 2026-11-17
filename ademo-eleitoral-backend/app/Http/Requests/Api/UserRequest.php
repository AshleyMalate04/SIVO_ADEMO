<?php

namespace App\Http\Requests\Api;

use App\Models\User;
use Illuminate\Validation\Rule;

class UserRequest extends ApiFormRequest
{
    protected function prepareForValidation(): void
    {
        $data = [];

        if ($this->has('name')) {
            $data['name'] = $this->uppercaseName($this->input('name'));
        }

        if ($this->has('email')) {
            $data['email'] = mb_strtolower(trim((string) $this->input('email')), 'UTF-8');
        }

        $this->merge($data);
    }

    public function rules(): array
    {
        $required = $this->isMethod('post') ? 'required' : 'sometimes';
        $currentUser = $this->routeId() ? User::find($this->routeId()) : null;
        $emailRules = [$required, 'email', 'max:200', Rule::unique('users', 'email')->ignore($this->routeId())];
        $phoneRules = [$required, 'string', 'regex:/^(82|83|84|85|86|87)[0-9]{7}$/', Rule::unique('users', 'phone')->ignore($this->routeId())];

        if (! $currentUser || $this->input('email') !== $currentUser->email) {
            $emailRules[] = Rule::unique('members', 'email');
        }

        if (! $currentUser || $this->input('phone') !== $currentUser->phone) {
            $phoneRules[] = Rule::unique('members', 'phone');
        }

        return [
            'name' => [$required, 'string', 'max:150', 'regex:/^\s*\S+\s+\S+.*$/u'],
            'access_code' => [$required, 'string', 'max:50', Rule::unique('users', 'access_code')->ignore($this->routeId())],
            'email' => $emailRules,
            'phone' => $phoneRules,
            'password' => ['nullable', 'string', 'min:8', 'max:255'],
            'role' => [$required, Rule::in(['ADMIN', 'COMMISSION', 'COMISSAO', 'FISCAL', 'VOTER', 'ELEITOR'])],
            'status' => ['sometimes', Rule::in(['ACTIVE', 'INACTIVE', 'SUSPENDED', 'BLOCKED'])],
            'delegation_id' => [$required, 'integer', 'exists:delegations,id'],
            'last_login_at' => ['nullable', 'date'],
        ];
    }

    public function messages(): array
    {
        return [
            'email.required' => 'Informe o email do utilizador.',
            'access_code.unique' => 'Este código de acesso já foi registado.',
            'email.email' => 'Informe um email válido.',
            'email.unique' => 'Este email já foi registado no sistema.',
            'phone.unique' => 'Este contacto já foi registado no sistema.',
            'phone.required' => 'Informe o contacto do utilizador.',
            'phone.regex' => 'Informe um número moçambicano válido com 9 dígitos, começando por 82, 83, 84, 85, 86 ou 87.',
            'delegation_id.required' => 'Seleccione a delegação do utilizador.',
            'password.required' => 'Informe a palavra-passe do utilizador.',
            'password.min' => 'A palavra-passe deve ter pelo menos 8 caracteres.',
            'role.required' => 'Seleccione o perfil do utilizador.',
            'role.in' => 'O perfil seleccionado não é válido.',
            'name.required' => 'Informe o nome do utilizador.',
            'name.regex' => 'Informe o nome completo do utilizador, com pelo menos duas palavras.',
        ];
    }

    private function uppercaseName(mixed $value): mixed
    {
        if (! is_string($value)) {
            return $value;
        }

        return mb_strtoupper(preg_replace('/\s+/u', ' ', trim($value)), 'UTF-8');
    }
}
