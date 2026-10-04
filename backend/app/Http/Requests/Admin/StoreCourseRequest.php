<?php

namespace App\Http\Requests\Admin;

class StoreCourseRequest extends AdminFormRequest
{
    protected function prepareForValidation(): void
    {
        if ($this->has('price_usd_cents') && !$this->has('bundle_price_cents')) {
            $this->merge(['bundle_price_cents' => $this->input('price_usd_cents')]);
        }
    }

    public function rules(): array
    {
        return [
            'title_ar' => ['required', 'string', 'max:255'],
            'title_en' => ['required', 'string', 'max:255'],
            'slug' => ['nullable', 'string', 'max:255', 'unique:courses,slug'],
            'description_ar' => ['required', 'string'],
            'description_en' => ['required', 'string'],
            'cover_image_url' => ['nullable', 'string', 'max:500'],
            'bundle_price_cents' => ['required', 'integer', 'min:0'],
            'bundle_promotional_tickets' => ['nullable', 'integer', 'min:0'],
            'display_price_label' => ['nullable', 'string', 'max:255'],
            'is_active' => ['nullable', 'boolean'],
            'curriculum_summary_ar' => ['nullable', 'string'],
            'curriculum_summary_en' => ['nullable', 'string'],
            'outcomes' => ['nullable', 'array'],
            'outcomes.*.title_ar' => ['nullable', 'string', 'max:255'],
            'outcomes.*.title_en' => ['nullable', 'string', 'max:255'],
            'outcomes.*.desc_ar' => ['nullable', 'string'],
            'outcomes.*.desc_en' => ['nullable', 'string'],
        ];
    }
}
