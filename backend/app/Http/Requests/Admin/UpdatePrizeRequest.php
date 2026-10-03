<?php

namespace App\Http\Requests\Admin;

class UpdatePrizeRequest extends AdminFormRequest
{
    public function rules(): array
    {
        return [
            'title_ar' => ['sometimes', 'string', 'max:255'],
            'title_en' => ['sometimes', 'string', 'max:255'],
            'description_ar' => ['nullable', 'string'],
            'description_en' => ['nullable', 'string'],
            'category' => ['sometimes', 'string', 'in:grand,major,minor,consolation'],
            'valuation_usd_cents' => ['sometimes', 'integer', 'min:0'],
            'display_iqd_label' => ['nullable', 'string', 'max:255'],
            'image_url' => ['nullable', 'url', 'max:500'],
        ];
    }
}
