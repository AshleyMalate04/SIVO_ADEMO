<?php

namespace App\Http\Requests\Api;

use Illuminate\Validation\Rule;

class SettingRequest extends ApiFormRequest
{
    public function rules(): array
    {
        return [
            'theme' => ['sometimes', Rule::in(['LIGHT', 'DARK', 'SYSTEM'])],
            'high_contrast' => ['sometimes', 'boolean'],
            'font_size' => ['sometimes', Rule::in(['SMALL', 'MEDIUM', 'LARGE'])],
            'email_notifications' => ['sometimes', 'boolean'],
            'system_notifications' => ['sometimes', 'boolean'],
            'whatsapp_notifications' => ['sometimes', 'boolean'],
        ];
    }
}
