@component('mail::message')
# Newsroom ready

**{{ $paper }}** is set up on **{{ $domain }}**.

Sign in as **{{ $tenantEmail }}**:

@component('mail::button', ['url' => $loginUrl])
Open tenant admin
@endcomponent

Upload a PDF, extract pages, then publish to put the edition on the paper site.

Thanks,<br>
{{ config('app.name') }}
@endcomponent
