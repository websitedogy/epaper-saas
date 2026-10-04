<?php

namespace App\Support;

use Illuminate\Contracts\Filesystem\Filesystem;
use Illuminate\Support\Facades\File;
use Illuminate\Support\Facades\Storage;

class EditionStorage
{
    public static function disk(): Filesystem
    {
        return Storage::disk('editions');
    }

    public static function put($file, string $directory): string
    {
        return $file->store($directory, 'editions');
    }

    public static function exists(string $path): bool
    {
        return $path !== '' && self::disk()->exists($path);
    }

    public static function localFile(string $path): string
    {
        $disk = self::disk();

        try {
            $localPath = $disk->path($path);
            if (is_string($localPath) && is_file($localPath)) {
                return $localPath;
            }
        } catch (\Throwable) {
            // Remote disks such as S3 do not expose a real filesystem path.
        }

        $copy = storage_path('app/edition-work/source-'.sha1($path).'-'.basename($path));
        File::ensureDirectoryExists(dirname($copy));
        File::put($copy, $disk->get($path));

        return $copy;
    }

    public static function putContents(string $path, string $contents): void
    {
        self::disk()->put($path, $contents);
    }

    public static function respond(string $path, bool $public = false)
    {
        abort_unless(self::exists($path), 404);

        $disk = self::disk();
        if (config('editions.disk') === 's3') {
            return redirect()->away($disk->temporaryUrl(
                $path,
                now()->addMinutes((int) config('editions.signed_url_minutes', 30)),
            ));
        }

        return $disk->response($path, null, [
            'Content-Type' => 'image/webp',
            'Cache-Control' => $public
                ? 'public, max-age=31536000, immutable'
                : 'private, max-age=60',
        ]);
    }
}
