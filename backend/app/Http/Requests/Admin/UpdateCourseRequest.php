<?php

namespace App\Http\Requests\Admin;

use Illuminate\Validation\Rule;

class UpdateCourseRequest extends AdminFormRequest
{
    protected function prepareForValidation(): void
    {
        if ($this->has('price_usd_cents') && !$this->has('bundle_price_cents')) {
            $this->merge(['bundle_price_cents' => $this->input('price_usd_cents')]);
        }
    }

    public function rules(): array
    {
        $courseId = $this->route('id') ?? $this->route('course');

        return [
            'title_ar' => ['sometimes', 'required', 'string', 'max:255'],
            'title_en' => ['sometimes', 'required', 'string', 'max:255'],
            'slug' => ['sometimes', 'nullable', 'string', 'max:255', Rule::unique('courses', 'slug')->ignore($courseId)],
            'description_ar' => ['sometimes', 'required', 'string'],
            'description_en' => ['sometimes', 'required', 'string'],
            'cover_image_url' => ['nullable', 'string', 'max:500'],
            'bundle_price_cents' => ['sometimes', 'required', 'integer', 'min:0'],
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
