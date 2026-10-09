<?php

namespace App\Http\Requests\Admin;

use App\Rules\SafeMediaUrl;

class StoreCoursePartRequest extends AdminFormRequest
{
    public function rules(): array
    {
        return [
            'title_ar' => ['required', 'string', 'max:255'],
            'title_en' => ['required', 'string', 'max:255'],
            'description_ar' => ['nullable', 'string'],
            'description_en' => ['nullable', 'string'],
            'part_number' => ['nullable', 'integer', 'min:1'],
            'duration_minutes' => ['nullable', 'integer', 'min:0'],
            'video_storage_path' => ['nullable', 'string', 'max:500'],
            'video_url' => ['nullable', 'string', 'max:1000', new SafeMediaUrl()],
            'pdf_storage_path' => ['nullable', 'string', 'max:500'],
            'pdf_url' => ['nullable', 'string', 'max:1000', new SafeMediaUrl()],
            'pdf_title_ar' => ['nullable', 'string', 'max:255'],
            'pdf_title_en' => ['nullable', 'string', 'max:255'],
            'is_free' => ['nullable', 'boolean'],
            'is_active' => ['nullable', 'boolean'],
        ];
    }
}
