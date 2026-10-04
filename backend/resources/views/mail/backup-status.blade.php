@component('mail::message')
# {{ $successful ? 'Backup completed' : 'Backup failed' }}

{{ $details }}

{{ config('app.name') }}
@endcomponent
