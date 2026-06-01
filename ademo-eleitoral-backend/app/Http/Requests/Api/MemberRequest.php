<?php

namespace App\Http\Requests\Api;

use App\Models\Member;
use App\Models\User;
use Illuminate\Validation\Rule;

class MemberRequest extends ApiFormRequest
{
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
            'name' => [$required, 'string', 'max:150'],
            'phone' => [
                'nullable',
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
            'bi_number' => ['nullable', 'string', 'regex:/^[0-9]{11}[A-Z]$/'],
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
            'phone.regex' => 'Informe um número moçambicano válido com 9 dígitos, começando por 82, 83, 84, 85, 86 ou 87.',
            'bi_number.regex' => 'O BI deve ter 11 dígitos e uma letra maiúscula no fim.',
            'delegation_id.required' => 'Seleccione a delegação do membro.',
            'delegation_id.exists' => 'A delegação seleccionada não existe.',
            'name.required' => 'Informe o nome do membro.',
        ];
    }
}
