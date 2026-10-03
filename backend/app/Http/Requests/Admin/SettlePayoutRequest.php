<?php

namespace App\Http\Requests\Admin;

class SettlePayoutRequest extends AdminFormRequest
{
    public function rules(): array
    {
        return [
            'reference_number' => ['required', 'string', 'max:128'],
            'receipt' => ['required', 'file', 'mimes:jpg,jpeg,png,webp', 'max:5120'],
            'notes' => ['nullable', 'string', 'max:1000'],
        ];
    }
}
