<?php

namespace App\Http\Requests\Api;

use Illuminate\Validation\Rule;

class CandidateRequest extends ApiFormRequest
{
    public function rules(): array
    {
        $required = $this->isMethod('post') ? 'required' : 'sometimes';
        $electionId = $this->route('id') ?? $this->input('election_id');

        return [
            'election_id' => [$this->route('id') ? 'sometimes' : $required, 'integer', 'exists:elections,id'],
            'member_id' => [
                $required,
                'integer',
                'exists:members,id',
                Rule::unique('candidates', 'member_id')->where('election_id', $electionId)->ignore($this->routeId()),
            ],
            'position_id' => [$required, 'integer', 'exists:positions,id'],
            'biography' => [$required, 'string'],
            'proposal' => [$required, 'string'],
            'photo_path' => ['nullable', 'string', 'max:255', 'regex:/^candidates\/photos\/[A-Za-z0-9._-]+$/'],
            'document_path' => ['nullable', 'string', 'max:255', 'regex:/^candidates\/documents\/[A-Za-z0-9._-]+$/'],
            'photo_file' => [$this->isMethod('post') ? 'required_without:photo_path' : 'nullable', 'image', 'max:4096'],
            'document_file' => ['nullable', 'file', 'mimes:pdf,doc,docx,png,jpg,jpeg', 'max:8192'],
            'status' => ['sometimes', Rule::in(['APPROVED', 'REJECTED', 'SUSPENDED'])],
        ];
    }

    public function messages(): array
    {
        return [
            'photo_file.max' => 'A fotografia do candidato deve ter no máximo 4 MB.',
            'photo_file.image' => 'A fotografia do candidato deve ser uma imagem válida.',
            'photo_file.required_without' => 'Seleccione a fotografia do candidato.',
        ];
    }
}
