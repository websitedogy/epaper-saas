"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { Suspense, useEffect, useMemo, useState } from "react";

import { Header } from "@/components/layout/header";
import { Sidebar } from "@/components/layout/sidebar";
import { API_BASE_URL, API_TOKEN_KEY } from "@/lib/api";

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

function CustomersPageContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false);
  const [clients, setClients] = useState<ClientRecord[]>([]);
  const [loading, setLoading] = useState(false);

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
          return;
        }

        const payload = await response.json();
        const rows = payload.data?.data ?? payload.data ?? [];
        setClients(rows);
      } finally {
        setLoading(false);
      }
    };

    void fetchClients();
  }, [selectedStatus, router]);

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
              {loading && clients.length === 0 ? (
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
                        </tr>
                      ))
                    ) : (
                      <tr>
                        <td colSpan={8} className="px-5 py-10 text-center text-sm text-slate-500">
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
