<?php

namespace App\Http\Requests\Api;

use Illuminate\Validation\Rule;

class ElectionStatusRequest extends ApiFormRequest
{
    public function rules(): array
    {
        return [
            // A publicacao usa o endpoint proprio, que valida o apuramento presencial.
            'status' => ['required', Rule::in(['EM_VOTACAO', 'CONCLUIDA'])],
        ];
    }
}
