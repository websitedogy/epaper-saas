<?php

namespace App\Mail;

use Illuminate\Bus\Queueable;
use Illuminate\Mail\Mailable;
use Illuminate\Mail\Mailables\Content;
use Illuminate\Mail\Mailables\Envelope;
use Illuminate\Queue\SerializesModels;

class BackupStatusMail extends Mailable
{
    use Queueable, SerializesModels;

    public function __construct(
        public bool $successful,
        public string $details,
    ) {
    }

    public function envelope(): Envelope
    {
        return new Envelope(subject: $this->successful ? 'Dogy backup completed' : 'Dogy backup failed');
    }

    public function content(): Content
    {
        return new Content(markdown: 'mail.backup-status', with: [
            'successful' => $this->successful,
            'details' => $this->details,
        ]);
    }
}
