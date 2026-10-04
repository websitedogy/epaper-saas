"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { CheckCircle2, FileImage, Loader2, UploadCloud } from "lucide-react";

import { Button } from "@/components/ui/button";
import {
  extractTenantEdition,
  getTenantEdition,
  loadEditionPagePreview,
  publishTenantEdition,
  type TenantEdition,
} from "@/lib/editions";

export function EditionWorkflow({
  edition,
  onChange,
}: {
  edition: TenantEdition;
  onChange: (edition: TenantEdition) => void;
}) {
  const [busy, setBusy] = useState<"extract" | "publish" | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [previews, setPreviews] = useState<string[]>([]);

  useEffect(() => {
    const urls: string[] = [];
    let cancelled = false;

    async function loadPreviews() {
      if (edition.status !== "completed" && edition.status !== "published") {
        setPreviews([]);
        return;
      }

      const pageCount = Math.min(edition.total_pages || edition.pages?.length || 0, 8);
      if (!pageCount) {
        setPreviews([]);
        return;
      }

      if (edition.status === "published" && edition.pages?.length) {
        setPreviews(edition.pages.slice(0, 8).map((page) => page.image_url));
        return;
      }

      const loaded: string[] = [];
      for (let page = 1; page <= pageCount; page += 1) {
        try {
          const url = await loadEditionPagePreview(edition.id, page);
          urls.push(url);
          loaded.push(url);
        } catch {
          break;
        }
      }
      if (!cancelled) setPreviews(loaded);
    }

    void loadPreviews();
    return () => {
      cancelled = true;
      urls.forEach((url) => URL.revokeObjectURL(url));
    };
  }, [edition.id, edition.status, edition.total_pages, edition.pages]);

  useEffect(() => {
    if (edition.status !== "processing") return;
    const timer = window.setInterval(() => {
      void getTenantEdition(edition.id).then(onChange).catch(() => undefined);
    }, 2500);
    return () => window.clearInterval(timer);
  }, [edition.id, edition.status, onChange]);

  const run = async (action: "extract" | "publish") => {
    setBusy(action);
    setError(null);
    try {
      const next = action === "extract" ? await extractTenantEdition(edition.id) : await publishTenantEdition(edition.id);
      onChange(next);
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "Request failed.");
    } finally {
      setBusy(null);
    }
  };

  const canExtract = ["uploaded", "failed", "completed", "processing"].includes(edition.status);
  const canPublish = edition.status === "completed" && edition.total_pages > 0;

  return (
    <div className="space-y-4">
      <ol className="grid gap-2 sm:grid-cols-3">
        {[
          { key: "uploaded", label: "1. PDF uploaded", done: true },
          {
            key: "extracted",
            label: "2. Extract pages",
            done: edition.status === "completed" || edition.status === "published",
          },
          { key: "published", label: "3. Publish", done: edition.status === "published" },
        ].map((step) => (
          <li
            key={step.key}
            className={`rounded-xl border px-3 py-2 text-sm ${step.done ? "border-emerald-200 bg-emerald-50 text-emerald-800" : "border-slate-200 bg-slate-50 text-slate-600"}`}
          >
            {step.done ? <CheckCircle2 className="mr-1 inline h-4 w-4" /> : null}
            {step.label}
          </li>
        ))}
      </ol>

      {edition.status === "failed" ? (
        <p className="rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-800">
          Page extraction failed. Check Ghostscript, then try Extract Pages again.
        </p>
      ) : null}

      {previews.length ? (
        <div>
          <p className="mb-2 flex items-center gap-2 text-sm font-medium text-slate-700">
            <FileImage className="h-4 w-4" />
            {edition.total_pages} pages extracted
          </p>
          <div className="flex gap-2 overflow-x-auto pb-1">
            {previews.map((src, index) => (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                key={`${edition.id}-${index}`}
                src={src}
                alt={`Page ${index + 1}`}
                className="h-36 w-24 shrink-0 rounded-lg border border-slate-200 bg-white object-cover object-top"
              />
            ))}
          </div>
        </div>
      ) : null}

      <div className="flex flex-wrap gap-2">
        {canExtract && edition.status !== "published" ? (
          <Button type="button" onClick={() => void run("extract")} disabled={busy !== null}>
            {busy === "extract" ? <Loader2 className="h-4 w-4 animate-spin" /> : <UploadCloud className="h-4 w-4" />}
            {busy === "extract"
              ? "Extracting pages..."
              : edition.status === "failed" || edition.status === "completed" || edition.status === "processing"
                ? "Re-extract pages"
                : "Extract pages"}
          </Button>
        ) : null}
        {canPublish ? (
          <Button type="button" onClick={() => void run("publish")} disabled={busy !== null}>
            {busy === "publish" ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
            Publish edition
          </Button>
        ) : null}
        {edition.status === "published" ? (
          <Button asChild>
            <Link href={`/epaper/${edition.slug}`}>View on paper site</Link>
          </Button>
        ) : null}
      </div>

      {busy === "extract" ? (
        <p className="text-sm text-slate-500">Large newspapers can take a minute while each PDF page is converted.</p>
      ) : null}
      {error ? <p className="rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-800">{error}</p> : null}
    </div>
  );
}
