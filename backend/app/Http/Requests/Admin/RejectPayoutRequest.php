<?php

namespace App\Http\Requests\Admin;

class RejectPayoutRequest extends AdminFormRequest
{
    public function rules(): array
    {
        return [
            'reason' => ['required', 'string', 'max:500'],
        ];
    }
}
