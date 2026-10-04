"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";

import { EditionWorkflow } from "@/components/tenant/edition-workflow";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { editionStatusLabel, getTenantEdition, listTenantEditions, type TenantEdition } from "@/lib/editions";

function statusVariant(status: string) {
  if (status === "published") return "success" as const;
  if (status === "failed") return "danger" as const;
  if (status === "completed") return "info" as const;
  return "warning" as const;
}

export default function TenantEditionsHistoryPage() {
  const [editions, setEditions] = useState<TenantEdition[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [active, setActive] = useState<TenantEdition | null>(null);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    try {
      const items = await listTenantEditions();
      setEditions(items);
      setError(null);
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "Unable to load editions.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  useEffect(() => {
    if (!editions.some((edition) => edition.status === "processing")) return;
    const timer = window.setInterval(() => {
      void load();
    }, 2500);
    return () => window.clearInterval(timer);
  }, [editions, load]);

  const openWorkflow = async (edition: TenantEdition) => {
    try {
      const detailed = await getTenantEdition(edition.id);
      setActive(detailed);
    } catch {
      setActive(edition);
    }
  };

  const filtered = editions.filter((edition) => edition.name.toLowerCase().includes(search.toLowerCase()));

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-3 md:flex-row md:items-end md:justify-between">
        <div>
          <p className="text-xs uppercase tracking-[0.18em] text-slate-500">Tenant admin</p>
          <h1 className="mt-2 text-3xl font-semibold text-slate-900">All editions history</h1>
          <p className="mt-1 text-sm text-slate-500">Extract PDF pages, publish, then the edition appears on your paper site.</p>
        </div>
        <Button asChild className="self-start">
          <Link href="/tenant-admin/edition-upload">Upload edition</Link>
        </Button>
      </div>

      <Card>
        <CardHeader>
          <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
            <div>
              <CardTitle>Edition archive</CardTitle>
              <CardDescription>Upload → Extract pages → Publish → live on the tenant frontend.</CardDescription>
            </div>
            <input
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              placeholder="Search edition"
              className="rounded-xl border border-slate-200 px-3 py-2 text-sm"
            />
          </div>
        </CardHeader>
        <CardContent>
          {error ? <p className="mb-4 rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-800">{error}</p> : null}
          {loading ? (
            <div className="space-y-3">
              <div className="h-10 animate-pulse rounded bg-slate-100" />
              <div className="h-10 animate-pulse rounded bg-slate-100" />
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full min-w-[760px] text-left text-sm">
                <thead className="text-xs uppercase text-slate-500">
                  <tr>
                    <th className="px-3 py-3">Edition</th>
                    <th className="px-3 py-3">Date</th>
                    <th className="px-3 py-3">Pages</th>
                    <th className="px-3 py-3">Status</th>
                    <th className="px-3 py-3">Action</th>
                  </tr>
                </thead>
                <tbody>
                  {filtered.map((edition) => (
                    <tr key={edition.id} className="border-t border-slate-100">
                      <td className="px-3 py-3 font-medium text-slate-900">{edition.name}</td>
                      <td className="px-3 py-3 text-slate-500">{edition.edition_date ?? "-"}</td>
                      <td className="px-3 py-3">{edition.total_pages}</td>
                      <td className="px-3 py-3">
                        <Badge variant={statusVariant(edition.status)}>
                          {editionStatusLabel(edition.status, edition.processing_progress)}
                        </Badge>
                      </td>
                      <td className="px-3 py-3">
                        <div className="flex flex-wrap items-center gap-2">
                          {edition.status !== "published" ? (
                            <button
                              type="button"
                              onClick={() => void openWorkflow(edition)}
                              className="font-medium text-sky-700 underline"
                            >
                              {edition.status === "completed" ? "Publish" : "Extract pages"}
                            </button>
                          ) : (
                            <a className="font-medium text-sky-700 underline" href={`/epaper/${edition.slug}`}>
                              View edition
                            </a>
                          )}
                          {edition.status === "published" ? (
                            <button type="button" onClick={() => void openWorkflow(edition)} className="text-slate-500 underline">
                              Details
                            </button>
                          ) : null}
                        </div>
                      </td>
                    </tr>
                  ))}
                  {!filtered.length ? (
                    <tr>
                      <td colSpan={5} className="px-3 py-10 text-center text-slate-500">
                        No editions found.
                      </td>
                    </tr>
                  ) : null}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>

      {active ? (
        <div className="fixed inset-0 z-50 flex items-end justify-center bg-slate-950/40 p-4 sm:items-center" role="dialog" aria-modal="true">
          <div className="w-full max-w-2xl rounded-2xl bg-white p-5 shadow-xl">
            <div className="mb-4 flex items-start justify-between gap-3">
              <div>
                <p className="text-xs uppercase tracking-[0.18em] text-slate-500">Edition workflow</p>
                <h2 className="mt-1 text-xl font-semibold text-slate-900">{active.name}</h2>
              </div>
              <button type="button" className="rounded-lg border px-3 py-1 text-sm" onClick={() => setActive(null)}>
                Close
              </button>
            </div>
            <EditionWorkflow
              edition={active}
              onChange={(next) => {
                setActive(next);
                setEditions((current) => current.map((item) => (item.id === next.id ? { ...item, ...next } : item)));
              }}
            />
          </div>
        </div>
      ) : null}
    </div>
  );
}
