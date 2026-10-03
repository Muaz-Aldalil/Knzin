<?php

namespace App\Http\Requests\Admin;

use Illuminate\Contracts\Validation\Validator;

class UpdateSettingsRequest extends AdminFormRequest
{
    protected const ALLOWED_FIELDS = [
        'commission_rate_bps',
        'payout_min_cents',
        'justification',
    ];

    public function rules(): array
    {
        return [
            'commission_rate_bps' => ['sometimes', 'integer', 'min:0', 'max:10000'],
            'payout_min_cents' => ['sometimes', 'integer', 'min:0'],
            'justification' => ['nullable', 'string', 'max:500'],
        ];
    }

    public function withValidator(Validator $validator): void
    {
        $validator->after(function (Validator $validator) {
            $inputKeys = array_keys($this->all());
            $disallowed = array_diff($inputKeys, self::ALLOWED_FIELDS);

            if (!empty($disallowed)) {
                foreach ($disallowed as $field) {
                    $validator->errors()->add($field, "The field '{$field}' is not allowed or is protected.");
                }
            }

            if (!$this->has('commission_rate_bps') && !$this->has('payout_min_cents')) {
                $validator->errors()->add('settings', 'At least one configurable setting must be provided.');
            }
        });
    }
}
