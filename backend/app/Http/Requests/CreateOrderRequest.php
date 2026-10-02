<?php

namespace App\Http\Requests;

use Illuminate\Contracts\Validation\Validator;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Http\Exceptions\HttpResponseException;
use Symfony\Component\HttpFoundation\Response;

class CreateOrderRequest extends FormRequest
{
    public const CANONICAL_LEGAL_SHIELD = "أوافق على الشروط والأحكام وسياسة الخصوصية، وأقر بأنني أقوم بشراء محتوى رقمي تعليمي، وأن تذكرة السحب المرفقة هي هدية ترويجية مجانية غير مستردة أو قابلة للتبديل";

    /**
     * Determine if the user is authorized to make this request.
     */
    public function authorize(): bool
    {
        return true;
    }

    /**
     * Prepare the data for validation.
     */
    protected function prepareForValidation(): void
    {
        if ($this->has('email')) {
            $this->merge([
                'email' => strtolower(trim((string) $this->input('email'))),
            ]);
        }
    }

    /**
     * Get the validation rules that apply to the request.
     *
     * @return array<string, \Illuminate\Contracts\Validation\ValidationRule|array<mixed>|string>
     */
    public function rules(): array
    {
        return [
            'email' => ['required', 'string', 'email', 'max:255'],
            'course_id' => ['required', 'string', 'uuid', 'exists:courses,id'],
            'item_type' => ['required', 'string', 'in:bundle,part'],
            'course_part_id' => ['nullable', 'required_if:item_type,part', 'string', 'uuid', 'exists:course_parts,id'],
            'legal_terms_agreed' => ['required', 'boolean', 'accepted'],
            'legal_shield_text' => ['required', 'string'],
            'idempotency_key' => ['required', 'string', 'max:64'],
            'quiz_answers' => ['required', 'array'],
            'quiz_answers.experience_level' => ['required', 'string'],
            'quiz_answers.learning_goal' => ['required', 'string'],
            'quiz_answers.weekly_hours' => ['required', 'string'],
            'referral_code' => ['nullable', 'string', 'max:64'],
            'campaign_tag' => ['nullable', 'string', 'max:64'],
        ];
    }

    /**
     * Additional validation for the canonical legal shield string.
     */
    public function withValidator(Validator $validator): void
    {
        $validator->after(function ($validator) {
            $providedText = trim((string) $this->input('legal_shield_text'));

            if ($providedText !== self::CANONICAL_LEGAL_SHIELD) {
                $validator->errors()->add(
                    'legal_shield_text',
                    'The legal terms verbatim agreement does not match the canonical text.'
                );
            }
        });
    }

    /**
     * Handle a failed validation attempt with JSend format.
     */
    protected function failedValidation(Validator $validator): void
    {
        $errors = $validator->errors()->toArray();
        $isLegalMismatch = array_key_exists('legal_shield_text', $errors);

        $response = response()->json([
            'status' => 'fail',
            'code' => $isLegalMismatch ? 'ERR_LEGAL_SHIELD_MISMATCH' : 'ERR_VALIDATION',
            'message' => $isLegalMismatch
                ? 'The legal terms verbatim agreement does not match the canonical text.'
                : 'Validation failed',
            'errors' => $errors,
        ], Response::HTTP_UNPROCESSABLE_ENTITY);

        throw new HttpResponseException($response);
    }
}
