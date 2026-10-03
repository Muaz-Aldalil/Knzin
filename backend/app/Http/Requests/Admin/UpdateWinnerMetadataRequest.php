<?php

namespace App\Http\Requests\Admin;

class UpdateWinnerMetadataRequest extends AdminFormRequest
{
    public function rules(): array
    {
        return [
            'winner_masked_name' => ['nullable', 'string', 'max:255'],
            'winner_governorate' => ['nullable', 'string', 'max:255'],
            'prize_delivered' => ['nullable', 'boolean'],
            'stream_recording_url' => ['nullable', 'url', 'max:500'],
        ];
    }
}
