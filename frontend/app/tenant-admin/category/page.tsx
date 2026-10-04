"use client";

import { useEffect, useState } from "react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { apiFetch } from "@/lib/api";

type Category = {
  id: string;
  name: string;
  description: string | null;
  is_active: boolean;
};

export default function TenantCategoryPage() {
  const [categories, setCategories] = useState<Category[]>([]);
  const [form, setForm] = useState({ name: "", description: "", status: "Active" });
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<string | null>(null);

  const load = async () => {
    setLoading(true);
    try {
      const payload = await apiFetch<{ data: Category[] }>("/api/v1/customer/categories");
      setCategories(payload.data ?? []);
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Could not load categories.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void load();
  }, []);

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!form.name.trim()) return;
    setSaving(true);
    setMessage(null);
    try {
      await apiFetch("/api/v1/customer/categories", {
        method: "POST",
        body: JSON.stringify({
          name: form.name.trim(),
          description: form.description || null,
          is_active: form.status === "Active",
        }),
      });
      setForm({ name: "", description: "", status: "Active" });
      setIsModalOpen(false);
      await load();
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Could not save category.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-start justify-between gap-4">
        <div>
          <p className="text-xs uppercase tracking-[0.18em] text-slate-500">Tenant admin</p>
          <h1 className="mt-2 text-3xl font-semibold text-slate-900">Category management</h1>
        </div>
        <Button type="button" onClick={() => { setMessage(null); setIsModalOpen(true); }} className="flex items-center gap-2 rounded-xl bg-slate-900 px-4 py-2.5 text-sm font-medium text-white shadow-sm hover:bg-slate-800">
          <span className="text-lg leading-none">+</span>
          Category
        </Button>
      </div>

      {message ? <p className="rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-700">{message}</p> : null}

      <Card>
        <CardHeader>
          <CardTitle>All categories</CardTitle>
          <CardDescription>Manage the top-level publication groups.</CardDescription>
        </CardHeader>
        <CardContent>
          {loading ? <p className="py-8 text-center text-sm text-slate-500">Loading categories...</p> : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Name</TableHead>
                  <TableHead>Description</TableHead>
                  <TableHead>Status</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {categories.map((category) => (
                  <TableRow key={category.id}>
                    <TableCell className="font-medium text-slate-900">{category.name}</TableCell>
                    <TableCell className="text-slate-600">{category.description ?? "—"}</TableCell>
                    <TableCell>
                      <Badge variant={category.is_active ? "success" : "warning"}>{category.is_active ? "Active" : "Draft"}</Badge>
                    </TableCell>
                  </TableRow>
                ))}
                {!categories.length ? (
                  <TableRow>
                    <TableCell colSpan={3} className="py-8 text-center text-slate-500">No categories yet.</TableCell>
                  </TableRow>
                ) : null}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      {isModalOpen ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/40 p-4 backdrop-blur-sm">
          <div className="w-full max-w-lg rounded-[20px] border border-slate-200 bg-white p-5 shadow-[0_20px_60px_rgba(15,23,42,0.18)]">
            <div className="mb-4 flex items-center justify-between">
              <div>
                <p className="text-[10px] font-semibold uppercase tracking-[0.2em] text-slate-500">Add new</p>
                <h2 className="mt-1 text-[28px] font-semibold tracking-[-0.04em] text-slate-900">Category</h2>
              </div>
              <button type="button" onClick={() => setIsModalOpen(false)} className="flex h-9 w-9 items-center justify-center rounded-full border border-slate-200 text-lg text-slate-500 transition hover:bg-slate-100">×</button>
            </div>
            <form className="space-y-4" onSubmit={handleSubmit}>
              <div className="space-y-2">
                <label className="block text-sm font-medium text-slate-700">Category name</label>
                <input value={form.name} onChange={(event) => setForm((current) => ({ ...current, name: event.target.value }))} className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm text-slate-900 outline-none transition focus:border-sky-500 focus:ring-2 focus:ring-sky-100" placeholder="e.g. Technology" />
              </div>
              <div className="space-y-2">
                <label className="block text-sm font-medium text-slate-700">Status</label>
                <select value={form.status} onChange={(event) => setForm((current) => ({ ...current, status: event.target.value }))} className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm text-slate-900 outline-none transition focus:border-sky-500 focus:ring-2 focus:ring-sky-100">
                  <option value="Active">Active</option>
                  <option value="Draft">Draft</option>
                </select>
              </div>
              {message ? <p className="text-sm text-red-600">{message}</p> : null}
              <div className="flex justify-end gap-3 pt-2">
                <Button type="button" variant="secondary" onClick={() => setIsModalOpen(false)} className="rounded-xl border border-slate-200 bg-white text-slate-700 hover:bg-slate-50">Cancel</Button>
                <Button type="submit" disabled={saving} className="rounded-xl bg-slate-900 px-5 text-white hover:bg-slate-800">{saving ? "Saving..." : "Save category"}</Button>
              </div>
            </form>
          </div>
        </div>
      ) : null}
    </div>
  );
}
