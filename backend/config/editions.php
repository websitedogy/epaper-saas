<?php

return [
    'max_upload_bytes' => 52428800,
    'sync_threshold_bytes' => 10485760,
    'render_dpi' => (int) env('EDITION_RENDER_DPI', 120),
    'disk' => env('EDITION_DISK', env('FILESYSTEM_DISK', 'local')),
    'signed_url_minutes' => (int) env('EDITION_SIGNED_URL_MINUTES', 30),
    'ghostscript_binary' => env(
        'EDITION_GHOSTSCRIPT_BINARY',
        PHP_OS_FAMILY === 'Windows' ? 'C:\\Program Files\\gs\\gs10.06.0\\bin\\gswin64c.exe' : 'gs',
    ),
];
