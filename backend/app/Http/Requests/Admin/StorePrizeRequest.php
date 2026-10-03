<?php

namespace App\Http\Requests\Admin;

class StorePrizeRequest extends AdminFormRequest
{
    public function rules(): array
    {
        return [
            'title_ar' => ['required', 'string', 'max:255'],
            'title_en' => ['required', 'string', 'max:255'],
            'description_ar' => ['nullable', 'string'],
            'description_en' => ['nullable', 'string'],
            'category' => ['nullable', 'string', 'in:cash,merchandise'],
            'valuation_usd_cents' => ['nullable', 'integer', 'min:0'],
            'display_iqd_label' => ['nullable', 'string', 'max:255'],
            'image_url' => ['nullable', 'url', 'max:500'],
        ];
    }
}
