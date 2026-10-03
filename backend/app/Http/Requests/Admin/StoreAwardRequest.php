<?php

namespace App\Http\Requests\Admin;

class StoreAwardRequest extends AdminFormRequest
{
    public function rules(): array
    {
        return [
            'recipient_user_id' => ['required', 'string', 'max:255'],
            'draw_id' => ['nullable', 'string', 'uuid', 'exists:draws,id'],
            'award_title' => ['required', 'string', 'max:150'],
            'award_details' => ['nullable', 'string'],
            'valuation_usd_cents' => ['nullable', 'integer', 'min:0'],
            'reason' => ['required', 'string', 'max:500'],
        ];
    }
}
