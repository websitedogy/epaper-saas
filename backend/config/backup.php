<?php

return [
    'disk' => 'backups',
    'keep' => (int) env('BACKUP_KEEP', 14),
    'daily_at' => env('BACKUP_DAILY_AT', '02:15'),
    'alert_email' => env('BACKUP_ALERT_EMAIL'),
];
