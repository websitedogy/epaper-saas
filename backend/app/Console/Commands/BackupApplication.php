<?php

namespace App\Console\Commands;

use App\Mail\BackupStatusMail;
use Illuminate\Console\Command;
use Illuminate\Support\Facades\Mail;
use Illuminate\Support\Facades\Storage;
use Symfony\Component\Process\Process;

class BackupApplication extends Command
{
    protected $signature = 'app:backup';
    protected $description = 'Dump the database and store a timestamped backup on the backups disk.';

    public function handle(): int
    {
        $disk = Storage::disk((string) config('backup.disk', 'backups'));
        $stamp = now()->format('Ymd-His');
        $filename = 'dogy-'.$stamp.'.sql';
        $tempPath = storage_path('app/backup-work/'.$filename);
        @mkdir(dirname($tempPath), 0775, true);

        try {
            $this->dumpDatabase($tempPath);
            $disk->put($filename, file_get_contents($tempPath));
            $this->prune($disk);
            $this->notifyBackup(true, 'Stored '.$filename.' on the backups disk.');
            $this->info('Backup stored as '.$filename);

            return self::SUCCESS;
        } catch (\Throwable $exception) {
            $this->notifyBackup(false, $exception->getMessage());
            $this->error($exception->getMessage());

            return self::FAILURE;
        } finally {
            @unlink($tempPath);
        }
    }

    private function dumpDatabase(string $tempPath): void
    {
        $connection = config('database.default');
        $config = config('database.connections.'.$connection);

        if (($config['driver'] ?? '') === 'sqlite') {
            $database = $config['database'] ?? ':memory:';
            if ($database === ':memory:') {
                file_put_contents($tempPath, "-- sqlite memory database\n");

                return;
            }
            if (! is_file($database)) {
                throw new \RuntimeException('SQLite database file was not found.');
            }
            copy($database, $tempPath);

            return;
        }

        if (in_array($config['driver'] ?? '', ['mysql', 'mariadb'], true)) {
            $process = new Process([
                'mysqldump',
                '--single-transaction',
                '--quick',
                '--routines',
                '--no-tablespaces',
                '--host='.$config['host'],
                '--port='.($config['port'] ?? 3306),
                '--user='.$config['username'],
                '--result-file='.$tempPath,
                $config['database'],
            ], null, ['MYSQL_PWD' => (string) ($config['password'] ?? '')]);
            $process->setTimeout(300);
            $process->run();
            if (! $process->isSuccessful()) {
                throw new \RuntimeException(trim($process->getErrorOutput()) ?: 'mysqldump failed.');
            }

            return;
        }

        throw new \RuntimeException('Unsupported database driver for backups: '.($config['driver'] ?? 'unknown'));
    }

    private function prune($disk): void
    {
        $keep = max(1, (int) config('backup.keep', 14));
        $files = collect($disk->files())
            ->filter(fn (string $file) => str_starts_with(basename($file), 'dogy-') && str_ends_with($file, '.sql'))
            ->sort()
            ->values();

        $files->slice(0, max(0, $files->count() - $keep))->each(fn (string $file) => $disk->delete($file));
    }

    private function notifyBackup(bool $successful, string $details): void
    {
        $email = config('backup.alert_email');
        if (! $email) {
            return;
        }

        try {
            Mail::to($email)->send(new BackupStatusMail($successful, $details));
        } catch (\Throwable) {
            // Backup success should not depend on mail delivery.
        }
    }
}
