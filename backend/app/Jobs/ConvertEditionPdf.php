<?php

namespace App\Jobs;

use App\Models\Edition;
use App\Models\EditionPage;
use App\Support\EditionStorage;
use Illuminate\Bus\Queueable;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Foundation\Bus\Dispatchable;
use Illuminate\Queue\InteractsWithQueue;
use Illuminate\Queue\SerializesModels;
use Illuminate\Support\Facades\File;
use RuntimeException;

class ConvertEditionPdf implements ShouldQueue
{
    use Dispatchable, InteractsWithQueue, Queueable, SerializesModels;

    public int $timeout = 900;
    public int $tries = 2;

    public function __construct(public string $editionId)
    {
    }

    public function handle(): void
    {
        $edition = Edition::query()->findOrFail($this->editionId);
        $workingDirectory = storage_path('app/edition-work/'.$edition->id);

        try {
            $edition->update(['status' => 'processing', 'processing_progress' => 0]);

            $pdfPath = EditionStorage::localFile($edition->original_pdf);
            if (! is_file($pdfPath)) {
                throw new RuntimeException('The uploaded PDF could not be found.');
            }

            File::ensureDirectoryExists($workingDirectory);
            $this->renderPdfPages($pdfPath, $workingDirectory);

            $pngs = glob($workingDirectory.DIRECTORY_SEPARATOR.'page-*.png') ?: [];
            natsort($pngs);
            $pngs = array_values($pngs);
            if ($pngs === []) {
                throw new RuntimeException('The PDF did not produce any pages.');
            }

            if (! function_exists('imagecreatefrompng') || ! function_exists('imagewebp')) {
                throw new RuntimeException('PHP GD with WebP support is required to extract edition pages.');
            }

            $pageDirectory = 'editions/'.$edition->customer_id.'/'.$edition->id.'/pages';
            $edition->pages()->delete();

            foreach ($pngs as $index => $pngPath) {
                $image = imagecreatefrompng($pngPath);
                if (! $image) {
                    throw new RuntimeException('Unable to read rendered PDF page.');
                }

                $width = imagesx($image);
                $height = imagesy($image);
                $relativePath = $pageDirectory.'/page-'.str_pad((string) ($index + 1), 3, '0', STR_PAD_LEFT).'.webp';
                $tempWebp = $workingDirectory.DIRECTORY_SEPARATOR.'page-out.webp';
                imagewebp($image, $tempWebp, 82);
                imagedestroy($image);
                EditionStorage::putContents($relativePath, (string) file_get_contents($tempWebp));

                EditionPage::create([
                    'edition_id' => $edition->id,
                    'page_number' => $index + 1,
                    'image_path' => $relativePath,
                    'width' => $width,
                    'height' => $height,
                ]);
                $edition->update(['processing_progress' => (int) round((($index + 1) / count($pngs)) * 100)]);
            }

            $edition->update(['total_pages' => count($pngs), 'status' => 'completed', 'processing_progress' => 100]);
        } catch (\Throwable $exception) {
            $edition->update(['status' => 'failed']);
            throw $exception;
        } finally {
            File::deleteDirectory($workingDirectory);
        }
    }

    public function failed(\Throwable $exception): void
    {
        Edition::query()->whereKey($this->editionId)->update(['status' => 'failed']);
    }

    private function renderPdfPages(string $pdfPath, string $workingDirectory): void
    {
        $outputPattern = $workingDirectory.DIRECTORY_SEPARATOR.'page-%03d.png';

        try {
            $this->runCommand($this->ghostscriptCommand($pdfPath, $outputPattern), $workingDirectory);
        } catch (\Throwable $ghostscriptError) {
            if (! extension_loaded('imagick')) {
                throw $ghostscriptError;
            }

            $this->renderWithImagick($pdfPath, $workingDirectory);
        }
    }

    private function ghostscriptCommand(string $pdfPath, string $outputPattern): string
    {
        $binary = $this->resolveGhostscriptBinary();

        return sprintf(
            '%s -dSAFER -dBATCH -dNOPAUSE -sDEVICE=png16m -r%d -sOutputFile="%s" "%s"',
            $this->quoteBinary($binary),
            (int) config('editions.render_dpi', 120),
            $outputPattern,
            $pdfPath,
        );
    }

    private function resolveGhostscriptBinary(): string
    {
        $candidates = array_values(array_filter([
            (string) config('editions.ghostscript_binary'),
            'gswin64c',
            'gswin64c.exe',
            'gswin32c',
            'gs',
        ]));

        foreach (glob('C:\\Program Files\\gs\\*\\bin\\gswin64c.exe') ?: [] as $path) {
            $candidates[] = $path;
        }
        foreach (glob('C:\\Program Files (x86)\\gs\\*\\bin\\gswin32c.exe') ?: [] as $path) {
            $candidates[] = $path;
        }

        foreach ($candidates as $candidate) {
            if ($this->binaryExists($candidate)) {
                return $candidate;
            }
        }

        throw new RuntimeException('Install Ghostscript and set EDITION_GHOSTSCRIPT_BINARY, or enable the Imagick PHP extension.');
    }

    private function binaryExists(string $binary): bool
    {
        if ($binary === '') {
            return false;
        }

        if (is_file($binary)) {
            return true;
        }

        if (str_contains($binary, '\\') || str_contains($binary, '/')) {
            return false;
        }

        $command = PHP_OS_FAMILY === 'Windows'
            ? 'where '.escapeshellarg($binary)
            : 'command -v '.escapeshellarg($binary);
        exec($command, $output, $code);

        return $code === 0 && $output !== [];
    }

    private function quoteBinary(string $binary): string
    {
        if (str_contains($binary, ' ') || str_contains($binary, '\\') || str_contains($binary, '/')) {
            return '"'.$binary.'"';
        }

        return $binary;
    }

    private function renderWithImagick(string $pdfPath, string $workingDirectory): void
    {
        $imagick = new \Imagick();
        $dpi = (int) config('editions.render_dpi', 120);
        $imagick->setResolution($dpi, $dpi);
        $imagick->readImage($pdfPath);
        $pageNumber = 1;
        foreach ($imagick as $page) {
            $page->setImageFormat('png');
            $page->writeImage($workingDirectory.DIRECTORY_SEPARATOR.sprintf('page-%03d.png', $pageNumber));
            $pageNumber++;
        }
        $imagick->clear();
        $imagick->destroy();
    }

    private function runCommand(string $command, string $workingDirectory): void
    {
        $process = proc_open($command, [1 => ['pipe', 'w'], 2 => ['pipe', 'w']], $pipes, $workingDirectory);
        if (! is_resource($process)) {
            throw new RuntimeException('Unable to start PDF renderer.');
        }

        $error = stream_get_contents($pipes[2]);
        fclose($pipes[1]);
        fclose($pipes[2]);
        if (proc_close($process) !== 0) {
            throw new RuntimeException(trim((string) $error) ?: 'PDF conversion failed.');
        }
    }
}
