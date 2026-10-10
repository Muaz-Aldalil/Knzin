<?php

namespace App\Console\Commands;

use App\Mail\OtpVerificationMail;
use Illuminate\Console\Command;
use Illuminate\Support\Facades\Mail;

class TestEmailCommand extends Command
{
    protected $signature = 'mail:test {email : The destination email address}';
    protected $description = 'Send a test OTP verification email using the configured mail driver';

    public function handle(): int
    {
        $email = $this->argument('email');
        $code = (string) random_int(100000, 999999);

        $this->info("Attempting to send test OTP email to: {$email}");
        $this->line("Mailer: " . config('mail.default'));
        $this->line("From: " . config('mail.from.address') . " (" . config('mail.from.name') . ")");

        try {
            Mail::to($email)->send(new OtpVerificationMail($code, $email, 10));
            $this->info("✅ Email successfully dispatched to {$email} with code: {$code}");
            return Command::SUCCESS;
        } catch (\Throwable $e) {
            $this->error("❌ Failed to send email: " . $e->getMessage());
            return Command::FAILURE;
        }
    }
}
