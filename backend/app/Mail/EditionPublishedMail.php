<?php

namespace App\Mail;

use App\Models\Edition;
use Illuminate\Bus\Queueable;
use Illuminate\Mail\Mailable;
use Illuminate\Mail\Mailables\Content;
use Illuminate\Mail\Mailables\Envelope;
use Illuminate\Queue\SerializesModels;

class EditionPublishedMail extends Mailable
{
    use Queueable, SerializesModels;

    public function __construct(public Edition $edition, public string $publicUrl)
    {
    }

    public function envelope(): Envelope
    {
        return new Envelope(subject: $this->edition->name.' is published');
    }

    public function content(): Content
    {
        return new Content(markdown: 'mail.edition-published', with: [
            'name' => $this->edition->name,
            'pages' => $this->edition->total_pages,
            'url' => $this->publicUrl,
        ]);
    }
}
