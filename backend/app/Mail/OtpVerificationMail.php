<?php

namespace App\Mail;

use Illuminate\Bus\Queueable;
use Illuminate\Mail\Mailable;
use Illuminate\Mail\Mailables\Content;
use Illuminate\Mail\Mailables\Envelope;
use Illuminate\Queue\SerializesModels;

class OtpVerificationMail extends Mailable
{
    use Queueable, SerializesModels;

    public function __construct(
        public string $code,
        public string $recipientEmail,
        public int $expiresInMinutes = 10
    ) {}

    public function envelope(): Envelope
    {
        return new Envelope(
            subject: 'رمز التحقق لمنصة كَنزين | KNZiN Verification Code',
        );
    }

    public function content(): Content
    {
        return new Content(
            view: 'emails.otp-verification',
            text: 'emails.otp-verification-text',
        );
    }

    public function attachments(): array
    {
        return [];
    }
}
