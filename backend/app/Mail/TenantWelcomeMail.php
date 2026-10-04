<?php

namespace App\Mail;

use App\Models\Customer;
use Illuminate\Bus\Queueable;
use Illuminate\Mail\Mailable;
use Illuminate\Mail\Mailables\Content;
use Illuminate\Mail\Mailables\Envelope;
use Illuminate\Queue\SerializesModels;

class TenantWelcomeMail extends Mailable
{
    use Queueable, SerializesModels;

    public function __construct(
        public Customer $customer,
        public string $loginUrl,
        public string $tenantEmail,
    ) {
    }

    public function envelope(): Envelope
    {
        return new Envelope(subject: 'Your Dogy ePaper newsroom is ready');
    }

    public function content(): Content
    {
        return new Content(markdown: 'mail.tenant-welcome', with: [
            'paper' => $this->customer->paper_name ?: $this->customer->name,
            'domain' => $this->customer->domain_name,
            'loginUrl' => $this->loginUrl,
            'tenantEmail' => $this->tenantEmail,
        ]);
    }
}
