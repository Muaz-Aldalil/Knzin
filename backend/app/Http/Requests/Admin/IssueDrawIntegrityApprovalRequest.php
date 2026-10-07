<?php

namespace App\Http\Requests\Admin;

class IssueDrawIntegrityApprovalRequest extends AdminFormRequest
{
    protected function prepareForValidation(): void
    {
        if ($this->input('status') === 'valid') {
            $this->merge(['status' => 'approved']);
        }
    }

    public function rules(): array
    {
        return [
            'draw_id' => ['required', 'string', 'uuid', 'exists:draws,id'],
            'status' => ['required', 'string', 'in:approved,valid,rejected'],
        ];
    }
}
