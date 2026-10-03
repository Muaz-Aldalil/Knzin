<?php

namespace App\Http\Requests\Admin;

class StoreDrawRequest extends AdminFormRequest
{
    public function rules(): array
    {
        return [
            'tier' => ['required', 'string', 'in:hourly,daily,monthly'],
            'execution_type' => ['required', 'string', 'in:automated_electronic,live_broadcast'],
            'title_ar' => ['required', 'string', 'max:255'],
            'title_en' => ['required', 'string', 'max:255'],
            'starts_at' => ['required', 'date'],
            'ends_at' => ['required', 'date', 'after:starts_at'],
            'broadcast_url' => ['nullable', 'url', 'max:500'],
        ];
    }
}
