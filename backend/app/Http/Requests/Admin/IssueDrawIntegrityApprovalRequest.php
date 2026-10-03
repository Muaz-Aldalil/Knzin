<?php

namespace App\Http\Requests\Admin;

class IssueDrawIntegrityApprovalRequest extends AdminFormRequest
{
    public function rules(): array
    {
        return [
            'draw_id' => ['required', 'string', 'uuid', 'exists:draws,id'],
            'status' => ['required', 'string', 'in:approved,rejected'],
        ];
    }
}
