"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { Suspense, useEffect, useMemo, useState } from "react";

import { Header } from "@/components/layout/header";
import { Sidebar } from "@/components/layout/sidebar";
import { Button } from "@/components/ui/button";
import { API_BASE_URL, API_TOKEN_KEY } from "@/lib/api";
import { districtOptionsByState, indianStates } from "@/lib/india-locations";

type ClientRecord = {
  id: string;
  name: string;
  email: string;
  phone_number?: string | null;
  status: string;
  domain_name?: string | null;
  paper_name?: string | null;
  state?: string | null;
  district?: string | null;
};

const statusLabels: Record<string, string> = {
  active: "Active",
  pending: "Pending",
  suspended: "Expired",
  expired: "Expired",
  renewal: "Renewals",
};

const editableStatuses = [
  { value: "pending", label: "Pending" },
  { value: "active", label: "Active" },
  { value: "suspended", label: "Suspended" },
  { value: "expired", label: "Expired" },
];

type EditForm = {
  name: string;
  email: string;
  phone_number: string;
  domain_name: string;
  paper_name: string;
  state: string;
  district: string;
  status: string;
};

function CustomersPageContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false);
  const [clients, setClients] = useState<ClientRecord[]>([]);
  const [loading, setLoading] = useState(false);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [editing, setEditing] = useState<ClientRecord | null>(null);
  const [form, setForm] = useState<EditForm | null>(null);
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);

  const selectedStatus = searchParams.get("status");
  const pageTitle = useMemo(() => {
    if (!selectedStatus) return "All Clients";
    return statusLabels[selectedStatus] ?? selectedStatus;
  }, [selectedStatus]);

  useEffect(() => {
    const token = window.localStorage.getItem(API_TOKEN_KEY);
    if (!token) {
      setClients([]);
      router.replace("/login");
      return;
    }

    const fetchClients = async () => {
      setLoading(true);
      setLoadError(null);
      try {
        const url = new URL(`${API_BASE_URL}/api/v1/super-admin/clients`);
        if (selectedStatus) {
          url.searchParams.set("status", selectedStatus);
        }

        const response = await fetch(url.toString(), {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });

        if (!response.ok) {
          if (response.status === 401 || response.status === 403) {
            window.localStorage.removeItem(API_TOKEN_KEY);
            router.replace("/login");
          }
          setClients([]);
          setLoadError("Clients could not be loaded.");
          return;
        }

        const payload = await response.json();
        const rows = payload.data?.data ?? payload.data ?? [];
        setClients(rows);
      } catch {
        setClients([]);
        setLoadError("The API is unreachable. Start the backend on port 8000 and refresh.");
      } finally {
        setLoading(false);
      }
    };

    void fetchClients();
  }, [selectedStatus, router]);

  const districtOptions = useMemo(() => {
    const options = form?.state ? (districtOptionsByState[form.state] ?? ["Other"]) : [];
    if (form?.district && !options.includes(form.district)) {
      return [form.district, ...options];
    }
    return options;
  }, [form?.state, form?.district]);

  const openEdit = (client: ClientRecord) => {
    setSaveError(null);
    setEditing(client);
    setForm({
      name: client.name,
      email: client.email,
      phone_number: client.phone_number ?? "",
      domain_name: client.domain_name ?? "",
      paper_name: client.paper_name ?? "",
      state: client.state ?? "",
      district: client.district ?? "",
      status: client.status,
    });
  };

  const closeEdit = () => {
    setEditing(null);
    setForm(null);
    setSaveError(null);
  };

  const saveClient = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!editing || !form) return;

    const token = window.localStorage.getItem(API_TOKEN_KEY);
    if (!token) {
      router.replace("/login");
      return;
    }

    setSaving(true);
    setSaveError(null);
    try {
      const response = await fetch(`${API_BASE_URL}/api/v1/super-admin/clients/${editing.id}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(form),
      });
      const payload = await response.json().catch(() => ({}));
      if (!response.ok) {
        const firstError = payload.errors ? Object.values(payload.errors).flat()[0] : null;
        setSaveError(typeof firstError === "string" ? firstError : payload.message ?? "The client could not be updated.");
        return;
      }

      setClients((current) => current.map((client) => (client.id === editing.id ? { ...client, ...payload.data } : client)));
      closeEdit();
    } catch {
      setSaveError("The API is unreachable. Start the backend on port 8000 and refresh.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="min-h-[100dvh] overflow-x-hidden bg-slate-100 lg:flex lg:items-stretch">
      <Sidebar mobileOpen={mobileSidebarOpen} onToggle={() => setMobileSidebarOpen((value) => !value)} />

      <div className="min-w-0 flex-1">
        <Header onToggleSidebar={() => setMobileSidebarOpen((value) => !value)} />

        <main className="space-y-6 p-4 sm:p-6 lg:p-8">
          <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <p className="text-xs uppercase tracking-[0.18em] text-slate-500">Super admin</p>
                <h1 className="mt-2 text-3xl font-semibold text-slate-900">{pageTitle}</h1>
              </div>
            </div>
          </div>

          <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
            <div className="border-b border-slate-200 px-5 py-4">
              <h2 className="text-xl font-semibold text-slate-900">All clients</h2>
              <p className="mt-1 text-sm text-slate-600">Client history and direct client records.</p>
            </div>

            <div className="overflow-x-auto">
              {loadError ? (
                <p className="px-5 py-10 text-center text-sm text-red-600">{loadError}</p>
              ) : loading && clients.length === 0 ? (
                <div className="space-y-3 p-6">
                  {[1, 2, 3].map((row) => <div key={row} className="h-10 animate-pulse rounded-lg bg-slate-100" />)}
                </div>
              ) : (
                <table className="min-w-[960px] w-full border-collapse text-left">
                  <thead className="bg-slate-50 text-xs uppercase tracking-[0.08em] text-slate-500">
                    <tr>
                      <th className="px-5 py-3 font-medium">Name</th>
                      <th className="px-5 py-3 font-medium">Phone</th>
                      <th className="px-5 py-3 font-medium">Email</th>
                      <th className="px-5 py-3 font-medium">Domain</th>
                      <th className="px-5 py-3 font-medium">Paper</th>
                      <th className="px-5 py-3 font-medium">State</th>
                      <th className="px-5 py-3 font-medium">Dist</th>
                      <th className="px-5 py-3 font-medium">Status</th>
                      <th className="px-5 py-3 font-medium">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {clients.length > 0 ? (
                      clients.map((client) => (
                        <tr key={client.id} className="border-t border-slate-200 text-sm text-slate-700">
                          <td className="px-5 py-3 font-medium text-slate-900">{client.name}</td>
                          <td className="px-5 py-3">{client.phone_number ?? "—"}</td>
                          <td className="px-5 py-3">{client.email}</td>
                          <td className="px-5 py-3">{client.domain_name ?? "—"}</td>
                          <td className="px-5 py-3">{client.paper_name ?? "—"}</td>
                          <td className="px-5 py-3">{client.state ?? "—"}</td>
                          <td className="px-5 py-3">{client.district ?? "—"}</td>
                          <td className="px-5 py-3">
                            <span className="inline-flex rounded-full border border-slate-200 bg-slate-100 px-2.5 py-1 text-xs font-medium capitalize text-slate-700">
                              {client.status}
                            </span>
                          </td>
                          <td className="px-5 py-3">
                            <button
                              type="button"
                              onClick={() => openEdit(client)}
                              className="rounded-md border border-slate-200 px-3 py-1.5 text-xs font-medium text-slate-700 hover:bg-slate-50"
                            >
                              Edit
                            </button>
                          </td>
                        </tr>
                      ))
                    ) : (
                      <tr>
                        <td colSpan={9} className="px-5 py-10 text-center text-sm text-slate-500">
                          No clients found for this filter.
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              )}
            </div>
          </div>
        </main>
      </div>

      {form && editing ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 p-4">
          <div className="max-h-[90dvh] w-full max-w-2xl overflow-y-auto rounded-2xl bg-white p-6 shadow-xl">
            <div className="mb-5 flex items-center justify-between">
              <div>
                <p className="text-sm uppercase tracking-[0.18em] text-slate-500">Edit client</p>
                <h2 className="mt-1 text-2xl font-semibold text-slate-900">{editing.name}</h2>
              </div>
              <button type="button" onClick={closeEdit} disabled={saving} className="rounded-full border border-slate-200 px-3 py-1 text-sm text-slate-600 hover:bg-slate-100 disabled:opacity-50">
                Close
              </button>
            </div>

            <form className="space-y-4" onSubmit={saveClient}>
              <div className="grid gap-4 md:grid-cols-2">
                <label className="space-y-2 text-sm text-slate-700">
                  <span>Name</span>
                  <input value={form.name} onChange={(event) => setForm({ ...form, name: event.target.value })} className="w-full rounded-md border border-slate-200 bg-white px-3 py-2 text-slate-900 outline-none" required />
                </label>
                <label className="space-y-2 text-sm text-slate-700">
                  <span>Phone no</span>
                  <input value={form.phone_number} onChange={(event) => setForm({ ...form, phone_number: event.target.value })} className="w-full rounded-md border border-slate-200 bg-white px-3 py-2 text-slate-900 outline-none" required />
                </label>
                <label className="space-y-2 text-sm text-slate-700">
                  <span>Mail id</span>
                  <input type="email" value={form.email} onChange={(event) => setForm({ ...form, email: event.target.value })} className="w-full rounded-md border border-slate-200 bg-white px-3 py-2 text-slate-900 outline-none" required />
                </label>
                <label className="space-y-2 text-sm text-slate-700">
                  <span>Status</span>
                  <select value={form.status} onChange={(event) => setForm({ ...form, status: event.target.value })} className="w-full rounded-md border border-slate-200 bg-white px-3 py-2 text-slate-900 outline-none" required>
                    {editableStatuses.map((status) => (
                      <option key={status.value} value={status.value}>{status.label}</option>
                    ))}
                  </select>
                </label>
                <label className="space-y-2 text-sm text-slate-700">
                  <span>Domain name</span>
                  <input value={form.domain_name} onChange={(event) => setForm({ ...form, domain_name: event.target.value })} className="w-full rounded-md border border-slate-200 bg-white px-3 py-2 text-slate-900 outline-none" required />
                </label>
                <label className="space-y-2 text-sm text-slate-700">
                  <span>Paper name</span>
                  <input value={form.paper_name} onChange={(event) => setForm({ ...form, paper_name: event.target.value })} className="w-full rounded-md border border-slate-200 bg-white px-3 py-2 text-slate-900 outline-none" required />
                </label>
                <label className="space-y-2 text-sm text-slate-700">
                  <span>State</span>
                  <select
                    value={form.state}
                    onChange={(event) => setForm({ ...form, state: event.target.value, district: "" })}
                    className="w-full rounded-md border border-slate-200 bg-white px-3 py-2 text-slate-900 outline-none"
                    required
                  >
                    <option value="">Select state</option>
                    {indianStates.map((state) => (
                      <option key={state} value={state}>{state}</option>
                    ))}
                  </select>
                </label>
                <label className="space-y-2 text-sm text-slate-700">
                  <span>Dist</span>
                  <select
                    value={form.district}
                    onChange={(event) => setForm({ ...form, district: event.target.value })}
                    className="w-full rounded-md border border-slate-200 bg-white px-3 py-2 text-slate-900 outline-none"
                    required
                    disabled={!form.state}
                  >
                    <option value="">Select district</option>
                    {districtOptions.map((district) => (
                      <option key={district} value={district}>{district}</option>
                    ))}
                  </select>
                </label>
              </div>

              {saveError ? <p className="text-sm text-red-600">{saveError}</p> : null}

              <div className="flex justify-end gap-3 pt-2">
                <button type="button" onClick={closeEdit} disabled={saving} className="rounded-md border border-slate-200 px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-100 disabled:opacity-50">
                  Cancel
                </button>
                <Button type="submit" disabled={saving}>{saving ? "Saving..." : "Save changes"}</Button>
              </div>
            </form>
          </div>
        </div>
      ) : null}
    </div>
  );
}

export default function CustomersPage() {
  return (
    <Suspense fallback={<div className="p-6 text-slate-500">Loading clients...</div>}>
      <CustomersPageContent />
    </Suspense>
  );
}
