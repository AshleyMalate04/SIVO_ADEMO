<?php

namespace App\Http\Requests\Api;

use Illuminate\Validation\Rule;

class ElectionStatusRequest extends ApiFormRequest
{
    public function rules(): array
    {
        return [
            'status' => ['required', Rule::in(['PROGRAMADA', 'EM_VOTACAO', 'CONCLUIDA', 'RESULTADOS_PUBLICADOS', 'SUSPENDED'])],
        ];
    }
}
