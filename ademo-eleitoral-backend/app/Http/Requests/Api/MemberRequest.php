<?php

namespace App\Http\Requests\Api;

use App\Models\Member;
use App\Models\User;
use Illuminate\Validation\Rule;

class MemberRequest extends ApiFormRequest
{
    protected function prepareForValidation(): void
    {
        $data = [];

        if ($this->has('name')) {
            $data['name'] = $this->uppercaseName($this->input('name'));
        }

        if ($this->has('bi_number')) {
            $data['bi_number'] = $this->input('bi_number') ? mb_strtoupper(trim((string) $this->input('bi_number')), 'UTF-8') : $this->input('bi_number');
        }

        $this->merge($data);
    }

    public function rules(): array
    {
        $required = $this->isMethod('post') ? 'required' : 'sometimes';
        $member = $this->routeId() ? Member::find($this->routeId()) : null;
        $linkedUserId = $member ? User::where('access_code', $member->member_code)->value('id') : null;

        return [
            'member_code' => [
                $required,
                'string',
                'max:50',
                Rule::unique('members', 'member_code')->ignore($this->routeId()),
                Rule::unique('users', 'access_code')->ignore($linkedUserId),
            ],
            'name' => [$required, 'string', 'max:150', 'regex:/^\s*\S+\s+\S+.*$/u'],
            'phone' => [
                $required,
                'string',
                'regex:/^(82|83|84|85|86|87)[0-9]{7}$/',
                Rule::unique('members', 'phone')->ignore($this->routeId()),
                Rule::unique('users', 'phone')->ignore($linkedUserId),
            ],
            'email' => [
                'nullable',
                'email',
                'max:200',
                Rule::unique('members', 'email')->ignore($this->routeId()),
                Rule::unique('users', 'email')->ignore($linkedUserId),
            ],
            'bi_number' => [$required, 'string', 'regex:/^[0-9]{11}[A-Z]$/'],
            'delegation_id' => [$required, 'integer', 'exists:delegations,id'],
            'status' => ['sometimes', Rule::in(['ACTIVE', 'INACTIVE', 'SUSPENDED'])],
            'registered_at' => ['nullable', 'date'],
            'registered_by' => ['sometimes', 'integer', 'exists:users,id'],
        ];
    }

    public function messages(): array
    {
        return [
            'member_code.unique' => 'Este código de membro já foi registado.',
            'email.email' => 'Informe um email válido.',
            'email.unique' => 'Este email já foi registado no sistema.',
            'phone.unique' => 'Este contacto já foi registado no sistema.',
            'phone.required' => 'Informe o contacto do membro.',
            'phone.regex' => 'Informe um número moçambicano válido com 9 dígitos, começando por 82, 83, 84, 85, 86 ou 87.',
            'bi_number.required' => 'Informe o número do BI.',
            'bi_number.regex' => 'O BI deve ter 11 dígitos e uma letra maiúscula no fim.',
            'delegation_id.required' => 'Seleccione a delegação do membro.',
            'delegation_id.exists' => 'A delegação seleccionada não existe.',
            'name.required' => 'Informe o nome do membro.',
            'name.regex' => 'Informe o nome completo do membro, com pelo menos duas palavras.',
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
