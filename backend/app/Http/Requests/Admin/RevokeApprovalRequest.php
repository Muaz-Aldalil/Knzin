<?php

namespace App\Http\Requests\Admin;

class RevokeApprovalRequest extends AdminFormRequest
{
    public function rules(): array
    {
        return [
            'reason' => ['required', 'string', 'max:500'],
        ];
    }
}
