<?php

namespace App\Http\Requests\Admin;

class IssueKycApprovalRequest extends AdminFormRequest
{
    protected function prepareForValidation(): void
    {
        $rawUser = trim((string) $this->input('subject_user_id'));
        if ($rawUser && !\Illuminate\Support\Str::isUuid($rawUser)) {
            $user = \App\Models\User::where('learner_code', $rawUser)
                ->orWhere('email', $rawUser)
                ->first();
            if ($user) {
                $this->merge(['subject_user_id' => $user->id]);
            }
        }

        if ($this->input('status') === 'valid') {
            $this->merge(['status' => 'approved']);
        }
    }

    public function rules(): array
    {
        return [
            'subject_user_id' => ['required', 'string', 'uuid', 'exists:users,id'],
            'status' => ['required', 'string', 'in:approved,valid,rejected'],
        ];
    }
}
