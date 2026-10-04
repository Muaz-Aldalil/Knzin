<?php

namespace App\Http\Requests\Admin;

use App\Services\LandingCmsService;
use Illuminate\Validation\Rule;

class UpdateLandingCmsRequest extends AdminFormRequest
{
    public function rules(): array
    {
        return [
            'content' => ['sometimes', 'array'],
        ];
    }

    public function getContentData(): array
    {
        if ($this->has('content') && is_array($this->input('content'))) {
            return $this->input('content');
        }

        // Return all inputs except token/method overhead
        return $this->except(['_token', '_method']);
    }
}
