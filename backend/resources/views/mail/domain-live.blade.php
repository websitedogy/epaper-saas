@component('mail::message')
# Your paper is live

**{{ $paper }}** is now available at [{{ $url }}]({{ $url }}).

The hostname **{{ $domain }}** has verified DNS and an active HTTPS certificate.

Thanks,<br>
{{ config('app.name') }}
@endcomponent
