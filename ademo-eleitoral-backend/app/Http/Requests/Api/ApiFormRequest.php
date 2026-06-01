<?php

namespace App\Http\Requests\Api;

use Illuminate\Foundation\Http\FormRequest;

abstract class ApiFormRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    protected function routeId(): mixed
    {
        return $this->route('id')
            ?? $this->route('user')
            ?? $this->route('member')
            ?? $this->route('election')
            ?? $this->route('candidate')
            ?? $this->route('notification')
            ?? $this->route('setting');
    }
}
