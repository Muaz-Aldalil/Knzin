<?php

namespace App\Http\Requests\Admin;

class ListAuditLogsRequest extends AdminFormRequest
{
    public function rules(): array
    {
        return [
            'actor' => ['nullable', 'string', 'max:255'],
            'action' => ['nullable', 'string', 'max:64'],
            'target_type' => ['nullable', 'string', 'max:64'],
            'target_id' => ['nullable', 'string', 'max:64'],
            'outcome' => ['nullable', 'string', 'in:success,failure,denied'],
            'from' => ['nullable', 'date'],
            'to' => ['nullable', 'date'],
            'cursor' => ['nullable', 'string'],
            'per_page' => ['nullable', 'integer', 'min:1', 'max:50'],
        ];
    }
}
