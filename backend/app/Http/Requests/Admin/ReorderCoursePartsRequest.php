<?php

namespace App\Http\Requests\Admin;

class ReorderCoursePartsRequest extends AdminFormRequest
{
    public function rules(): array
    {
        return [
            'part_ids' => ['sometimes', 'required', 'array', 'min:1'],
            'part_ids.*' => ['required', 'string'],
            'parts' => ['sometimes', 'required', 'array', 'min:1'],
        ];
    }

    /**
     * Get clean array of ordered part IDs.
     *
     * @return array<string>
     */
    public function getOrderedPartIds(): array
    {
        if ($this->has('part_ids') && is_array($this->input('part_ids'))) {
            return array_values($this->input('part_ids'));
        }

        $parts = $this->input('parts', []);
        $ids = [];
        foreach ($parts as $p) {
            if (is_array($p) && isset($p['id'])) {
                $ids[] = (string) $p['id'];
            } elseif (is_string($p) || is_numeric($p)) {
                $ids[] = (string) $p;
            }
        }

        return $ids;
    }
}
