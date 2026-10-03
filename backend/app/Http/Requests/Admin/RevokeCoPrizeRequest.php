<?php

namespace App\Http\Requests\Admin;

class RevokeCoPrizeRequest extends AdminFormRequest
{
    public function rules(): array
    {
        return [
            'justification' => ['required', 'string', 'max:500'],
            'confirm' => ['required', 'boolean', 'accepted'],
        ];
    }
}
