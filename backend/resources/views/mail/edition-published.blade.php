@component('mail::message')
# Edition published

**{{ $name }}** is live ({{ $pages }} pages).

@component('mail::button', ['url' => $url])
Read the edition
@endcomponent

Thanks,<br>
{{ config('app.name') }}
@endcomponent
