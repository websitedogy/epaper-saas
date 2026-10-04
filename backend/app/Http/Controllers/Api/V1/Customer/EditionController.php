<?php

namespace App\Http\Controllers\Api\V1\Customer;

use App\Http\Controllers\Api\BaseApiController;
use App\Jobs\ConvertEditionPdf;
use App\Mail\EditionPublishedMail;
use App\Models\Edition;
use App\Support\EditionStorage;
use App\Support\TenantContext;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Mail;
use Illuminate\Support\Str;

class EditionController extends BaseApiController
{
    public function index(Request $request): JsonResponse
    {
        $perPage = min(max($request->integer('per_page', 50), 1), 100);
        $editions = Edition::query()
            ->where('customer_id', $this->customerId($request))
            ->latest('edition_date')
            ->latest()
            ->paginate($perPage);

        $editions->getCollection()->transform(fn (Edition $edition) => $this->formatEdition($edition));

        return $this->successResponse($editions, 'Editions retrieved successfully');
    }

    public function store(Request $request): JsonResponse
    {
        $customerId = $this->customerId($request);
        $data = $request->validate([
            'name' => ['required', 'string', 'max:255'],
            'edition_date' => ['required', 'date'],
            'pdf' => ['required', 'file', 'mimes:pdf', 'max:51200'],
        ]);

        $file = $request->file('pdf');
        if (! $file || strtolower((string) $file->getClientOriginalExtension()) !== 'pdf') {
            return $this->errorResponse('Only PDF files are allowed.', 422);
        }

        $edition = Edition::create([
            'customer_id' => $customerId,
            'name' => $data['name'],
            'slug' => Str::slug($data['name']).'-'.Str::lower(Str::random(8)),
            'edition_date' => $data['edition_date'],
            'original_pdf' => EditionStorage::put($file, 'editions/'.$customerId.'/pdfs'),
            'status' => 'uploaded',
            'processing_progress' => 0,
            'total_pages' => 0,
        ]);

        return $this->successResponse($this->formatEdition($edition->fresh()), 'PDF uploaded. Extract pages next.', 201);
    }

    public function show(Request $request, Edition $edition): JsonResponse
    {
        abort_unless($edition->customer_id === $this->customerId($request), 404);

        return $this->successResponse($this->formatEdition($edition->load('pages')), 'Edition retrieved successfully');
    }

    public function extract(Request $request, Edition $edition): JsonResponse
    {
        abort_unless($edition->customer_id === $this->customerId($request), 404);

        if (! $edition->original_pdf || ! EditionStorage::exists($edition->original_pdf)) {
            return $this->errorResponse('Upload a PDF before extracting pages.', 422);
        }

        if ($edition->status === 'published') {
            return $this->errorResponse('Published editions cannot be extracted again.', 422);
        }

        $edition->update(['status' => 'processing', 'processing_progress' => 0]);

        $queued = config('queue.default') === 'redis';
        try {
            if ($queued) {
                ConvertEditionPdf::dispatch($edition->id);

                return $this->successResponse(
                    $this->formatEdition($edition->fresh()->load('pages')),
                    'Page extraction queued on the worker. This page will update when pages are ready.'
                );
            }

            set_time_limit(900);
            ConvertEditionPdf::dispatchSync($edition->id);
        } catch (\Throwable $exception) {
            Edition::query()->whereKey($edition->id)->update(['status' => 'failed']);

            return $this->errorResponse($exception->getMessage() ?: 'Page extraction failed.', 422);
        }

        return $this->successResponse(
            $this->formatEdition($edition->fresh()->load('pages')),
            'Pages extracted successfully. Review them and publish when ready.'
        );
    }

    public function pageImage(Request $request, Edition $edition, int $page): mixed
    {
        abort_unless($edition->customer_id === $this->customerId($request), 404);
        abort_unless($request->user(), 404);
        $editionPage = $edition->pages()->where('page_number', $page)->firstOrFail();

        return EditionStorage::respond($editionPage->image_path, false);
    }

    public function publish(Request $request, Edition $edition): JsonResponse
    {
        abort_unless($edition->customer_id === $this->customerId($request), 404);

        if ($edition->status === 'published') {
            return $this->successResponse($this->formatEdition($edition->fresh()->load('pages')), 'Edition is already published');
        }

        if ($edition->status !== 'completed' || $edition->total_pages < 1) {
            return $this->errorResponse('Extract pages before publishing this edition.', 422);
        }

        $edition->update(['status' => 'published', 'published_at' => now()]);
        $published = $edition->fresh()->load('pages');
        $this->notifyPublished($request, $published);

        return $this->successResponse($this->formatEdition($published), 'Edition published. It is now live on your paper site.');
    }

    public function publicShow(Request $request, string $slug): JsonResponse
    {
        $edition = $this->publishedEdition($request, $slug)->with('pages')->firstOrFail();

        return $this->successResponse($this->formatEdition($edition), 'Published edition retrieved successfully');
    }

    public function publicPageImage(Request $request, string $slug, int $page): mixed
    {
        $edition = $this->publishedEdition($request, $slug)->firstOrFail();
        $editionPage = $edition->pages()->where('page_number', $page)->firstOrFail();

        return EditionStorage::respond($editionPage->image_path, true);
    }

    private function publishedEdition(Request $request, string $slug)
    {
        $query = Edition::query()->where('slug', $slug)->where('status', 'published');
        $customerId = $request->attributes->get('tenant_customer_id');
        if ($customerId) {
            $query->where('customer_id', $customerId);
        }

        return $query;
    }

    private function customerId(Request $request): string
    {
        abort_unless($request->user()?->customer_id, 403, 'Tenant access required.');

        return (string) $request->user()->customer_id;
    }

    private function formatEdition(Edition $edition): array
    {
        return [
            'id' => $edition->id,
            'name' => $edition->name,
            'slug' => $edition->slug,
            'edition_date' => $edition->edition_date?->toDateString(),
            'total_pages' => $edition->total_pages,
            'status' => $edition->status,
            'processing_progress' => $edition->processing_progress,
            'published_at' => $edition->published_at?->toIso8601String(),
            'pages' => $edition->relationLoaded('pages') ? $edition->pages->map(fn ($page) => [
                'page_number' => $page->page_number,
                'width' => $page->width,
                'height' => $page->height,
                'image_url' => $this->pageImageUrl($edition, $page->page_number),
            ])->values()->all() : [],
        ];
    }

    private function pageImageUrl(Edition $edition, int $pageNumber): string
    {
        if ($edition->status === 'published') {
            return route('public.edition.page', ['slug' => $edition->slug, 'page' => $pageNumber]);
        }

        return url('/api/v1/customer/editions/'.$edition->id.'/pages/'.$pageNumber);
    }

    private function notifyPublished(Request $request, Edition $edition): void
    {
        $email = $request->user()?->email;
        if (! $email) {
            return;
        }

        $host = TenantContext::hostFromRequest($request);
        $scheme = $request->getScheme() === 'https' || app()->environment('production') ? 'https' : 'http';
        $url = $scheme.'://'.$host.'/epaper/'.$edition->slug;

        try {
            Mail::to($email)->send(new EditionPublishedMail($edition, $url));
        } catch (\Throwable) {
            // Publishing must succeed even if mail is misconfigured.
        }
    }
}
