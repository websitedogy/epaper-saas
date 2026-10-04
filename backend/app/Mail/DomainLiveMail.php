<?php

namespace App\Mail;

use App\Models\Domain;
use Illuminate\Bus\Queueable;
use Illuminate\Mail\Mailable;
use Illuminate\Mail\Mailables\Content;
use Illuminate\Mail\Mailables\Envelope;
use Illuminate\Queue\SerializesModels;

class DomainLiveMail extends Mailable
{
    use Queueable, SerializesModels;

    public function __construct(public Domain $domain)
    {
    }

    public function envelope(): Envelope
    {
        return new Envelope(subject: $this->domain->domain.' is live on Dogy ePaper');
    }

    public function content(): Content
    {
        return new Content(markdown: 'mail.domain-live', with: [
            'domain' => $this->domain->domain,
            'paper' => $this->domain->customer?->paper_name ?: $this->domain->customer?->name,
            'url' => 'https://'.$this->domain->domain,
        ]);
    }
}
