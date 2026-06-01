<?php

namespace App\Http\Requests\Api;

use Illuminate\Validation\Rule;
use Carbon\Carbon;
use Illuminate\Validation\Validator;

class ElectionRequest extends ApiFormRequest
{
    public function rules(): array
    {
        $required = $this->isMethod('post') ? 'required' : 'sometimes';

        return [
            'title' => [$required, 'string', 'max:200'],
            'organ_id' => [$required, 'integer', 'exists:organs,id'],
            'position_id' => [$required, 'integer', 'exists:positions,id'],
            'delegation_id' => [$required, 'integer', 'exists:delegations,id'],
            'parent_election_id' => ['nullable', 'integer', 'exists:elections,id'],
            'round_number' => ['sometimes', 'integer', Rule::in([1, 2])],
            'starts_at' => [$required, 'date'],
            'ends_at' => [$required, 'date', 'after:starts_at'],
            'description' => [$required, 'string'],
            'allow_blank_vote' => ['sometimes', 'boolean'],
            'status' => ['sometimes', Rule::in(['PROGRAMADA', 'EM_VOTACAO', 'CONCLUIDA', 'RESULTADOS_PUBLICADOS', 'SUSPENDED'])],
            'created_by' => ['sometimes', 'integer', 'exists:users,id'],
        ];
    }

    public function withValidator(Validator $validator): void
{
    $validator->after(function (Validator $validator): void {
        $timezone = config('app.timezone', 'Africa/Maputo');

        if (! $this->filled('starts_at') || ! $this->filled('ends_at')) {
            return;
        }

        $startsAt = Carbon::parse($this->input('starts_at'), $timezone);
        $endsAt = Carbon::parse($this->input('ends_at'), $timezone);
        $now = Carbon::now($timezone)->startOfMinute();

        if ($startsAt->lt($now)) {
            $validator->errors()->add(
                'starts_at',
                'O início da votação não pode ser inferior à data e hora actual.'
            );
        }

        if ($endsAt->lte($startsAt)) {
            $validator->errors()->add(
                'ends_at',
                'O fim da votação deve ser posterior ao início da votação.'
            );
        }
    });
}
}
