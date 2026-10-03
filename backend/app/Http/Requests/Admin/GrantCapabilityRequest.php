<?php

namespace App\Http\Requests\Admin;

use App\Support\AdminCapabilities;
use Illuminate\Validation\Rule;

class GrantCapabilityRequest extends AdminFormRequest
{
    public function rules(): array
    {
        return [
            'capability' => ['required', 'string', Rule::in(AdminCapabilities::ALL)],
            'justification' => ['nullable', 'string', 'max:500'],
        ];
    }
}
