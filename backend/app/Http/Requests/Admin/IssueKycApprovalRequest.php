<?php

namespace App\Http\Requests\Admin;

class IssueKycApprovalRequest extends AdminFormRequest
{
    public function rules(): array
    {
        return [
            'subject_user_id' => ['required', 'string', 'uuid', 'exists:users,id'],
            'status' => ['required', 'string', 'in:approved,rejected'],
        ];
    }
}
