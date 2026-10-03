<?php

namespace App\Http\Requests\Admin;

use App\Exceptions\ProtectedFieldException;
use Illuminate\Contracts\Validation\Validator;

class UpdateDrawRequest extends AdminFormRequest
{
    protected const PROTECTED_FIELDS = [
        'server_seed_hash',
        'server_seed_encrypted',
        'server_seed_revealed',
        'seed_committed_at',
        'seed_revealed_at',
        'status',
        'is_published',
        'published_at',
        'published_by_user_id',
    ];

    public function rules(): array
    {
        return [
            'tier' => ['sometimes', 'string', 'in:hourly,daily,monthly'],
            'execution_type' => ['sometimes', 'string', 'in:automated_electronic,live_broadcast'],
            'title_ar' => ['sometimes', 'string', 'max:255'],
            'title_en' => ['sometimes', 'string', 'max:255'],
            'starts_at' => ['sometimes', 'date'],
            'ends_at' => ['sometimes', 'date'],
            'broadcast_url' => ['nullable', 'url', 'max:500'],
        ];
    }

    public function withValidator(Validator $validator): void
    {
        $validator->after(function (Validator $validator) {
            foreach (self::PROTECTED_FIELDS as $field) {
                if ($this->has($field)) {
                    throw new ProtectedFieldException("The field '{$field}' is cryptographically protected or managed by the lifecycle state machine and cannot be modified.");
                }
            }

            if ($this->has('starts_at') && $this->has('ends_at')) {
                if (strtotime($this->input('ends_at')) <= strtotime($this->input('starts_at'))) {
                    $validator->errors()->add('ends_at', 'The ends_at date must be after starts_at.');
                }
            }
        });
    }
}
