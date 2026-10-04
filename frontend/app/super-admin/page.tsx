"use client";

import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Header } from "@/components/layout/header";
import { Sidebar } from "@/components/layout/sidebar";
import { StatCard } from "@/components/dashboard/stat-card";
import { API_BASE_URL, API_TOKEN_KEY } from "@/lib/api";
import { tenantLoginUrl } from "@/lib/hosts";
import { districtOptionsByState, indianStates } from "@/lib/india-locations";

type ClientRecord = {
  id: string;
  name: string;
  email: string;
  phone_number?: string | null;
  status: string;
  domain_name: string | null;
  paper_name: string | null;
  state?: string | null;
  district?: string | null;
  created_at?: string;
};

type CreatedTenant = {
  loginUrl: string;
  email: string;
  password: string;
};


const formDefaults = {
  name: "",
  email: "",
  tenant_email: "",
  tenant_password: "",
  phone_number: "",
  domain_name: "",
  paper_name: "",
  state: "",
  district: "",
};

export default function SuperAdminPage() {
  const router = useRouter();
  const [stats, setStats] = useState({
    total_customers: 0,
    active_customers: 0,
    pending_customers: 0,
    suspended_customers: 0,
    expired_customers: 0,
    domains_connected: 0,
    domains_pending: 0,
    ssl_active: 0,
    renewals: 0,
    recent_clients: [] as ClientRecord[],
  });
  const [clients, setClients] = useState<ClientRecord[]>([]);
  const [form, setForm] = useState(formDefaults);
  const [message, setMessage] = useState<string | null>(null);
  const [createdTenant, setCreatedTenant] = useState<CreatedTenant | null>(null);
  const [loading, setLoading] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false);
  const [selectedStatus, setSelectedStatus] = useState<string | null>(null);
  const [districtOptions, setDistrictOptions] = useState<string[]>([]);

  const token = typeof window !== "undefined" ? window.localStorage.getItem(API_TOKEN_KEY) : null;

  const refreshDashboard = async () => {
    if (!token) {
      router.replace("/login");
      return;
    }

    const response = await fetch(`${API_BASE_URL}/api/v1/super-admin/dashboard`, {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });

    if (!response.ok) {
      if (response.status === 401 || response.status === 403) {
        window.localStorage.removeItem(API_TOKEN_KEY);
        router.replace("/login");
      }
      return;
    }

    const payload = await response.json();
    setStats(payload.data);
    setClients(payload.data?.recent_clients ?? []);
  };

  useEffect(() => {
    if (!token) {
      router.replace("/login");
      return;
    }

    void refreshDashboard();
  }, [token, router]);

  useEffect(() => {
    if (!form.state) {
      setDistrictOptions([]);
      return;
    }

    setDistrictOptions(districtOptionsByState[form.state] ?? ["Other"]);
  }, [form.state]);

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    if (!token) {
      setMessage("Sign in to the Laravel API and store the token in localStorage under dogy_api_token first.");
      return;
    }

    setLoading(true);
    setMessage(null);

    const response = await fetch("http://localhost:8000/api/v1/super-admin/clients", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify(form),
    });

    setLoading(false);

    const payload = await response.json().catch(() => ({}));
    if (!response.ok) {
      setMessage(payload.message ?? "The client could not be created.");
      return;
    }

    const domain = payload.data?.client?.domain_name ?? form.domain_name;
    setMessage("Client created successfully.");
    setCreatedTenant({
      loginUrl: tenantLoginUrl(domain),
      email: form.tenant_email,
      password: form.tenant_password,
    });
    setForm(formDefaults);
    await refreshDashboard();
  };

  const statusVariant = (status: string) => {
    switch (status) {
      case "active":
        return "success";
      case "pending":
        return "warning";
      case "suspended":
        return "default";
      default:
        return "info";
    }
  };

  const handleStateChange = (state: string) => {
    setForm((current) => ({
      ...current,
      state,
      district: "",
    }));
    setDistrictOptions(districtOptionsByState[state] ?? ["Other"]);
  };

  const handleCardClick = async (status: string | null) => {
    setSelectedStatus(status);
    const query = status ? `?status=${encodeURIComponent(status)}` : "";
    router.push(`/super-admin/customers${query}`);
  };

  return (
    <div className="min-h-[100dvh] overflow-x-hidden bg-slate-100 lg:flex lg:items-stretch">
      <Sidebar mobileOpen={mobileSidebarOpen} onToggle={() => setMobileSidebarOpen((value) => !value)} />

      <div className="min-w-0 flex-1">
        <Header onToggleSidebar={() => setMobileSidebarOpen((value) => !value)} />

        <main className="space-y-6 p-4 sm:p-6">
          <div className="flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
            <div>
              <p className="text-sm uppercase tracking-[0.18em] text-slate-500">Dashboard</p>
              <h1 className="mt-1 text-3xl font-semibold text-slate-900">Super Admin</h1>
            </div>
            <Button onClick={() => { setCreatedTenant(null); setMessage(null); setIsModalOpen(true); }}>New client</Button>
          </div>

          <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
            <StatCard
              title="All Clients"
              value={String(stats.total_customers)}
              accent="bg-violet-100 text-violet-700"
              active={selectedStatus === null}
              onClick={() => handleCardClick(null)}
            />
            <StatCard
              title="Active"
              value={String(stats.active_customers)}
              accent="bg-emerald-100 text-emerald-700"
              active={selectedStatus === "active"}
              onClick={() => handleCardClick("active")}
            />
            <StatCard
              title="Pending"
              value={String(stats.pending_customers)}
              accent="bg-amber-100 text-amber-700"
              active={selectedStatus === "pending"}
              onClick={() => handleCardClick("pending")}
            />
            <StatCard
              title="Expired"
              value={String(stats.suspended_customers)}
              accent="bg-rose-100 text-rose-700"
              active={selectedStatus === "suspended"}
              onClick={() => handleCardClick("suspended")}
            />
            <StatCard
              title="Renewals"
              value={String(stats.renewals)}
              accent="bg-sky-100 text-sky-700"
              active={selectedStatus === "renewal"}
              onClick={() => handleCardClick("renewal")}
            />
            <StatCard title="Domains Connected" value={String(stats.domains_connected)} accent="bg-cyan-100 text-cyan-700" />
            <StatCard title="Domains Pending" value={String(stats.domains_pending)} accent="bg-amber-100 text-amber-700" />
            <StatCard title="SSL Active" value={String(stats.ssl_active)} accent="bg-emerald-100 text-emerald-700" />
            <StatCard title="Expired Tenants" value={String(stats.expired_customers)} accent="bg-rose-100 text-rose-700" />
          </div>

          <Card>
            <CardHeader>
              <CardTitle>All clients</CardTitle>
              <CardDescription>Client history and direct client records.</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="overflow-x-auto">
                <Table className="min-w-[900px]">
                  <TableHeader>
                    <TableRow>
                      <TableHead>Name</TableHead>
                      <TableHead>Phone</TableHead>
                      <TableHead>Email</TableHead>
                      <TableHead>Domain</TableHead>
                      <TableHead>Paper</TableHead>
                      <TableHead>State</TableHead>
                      <TableHead>Dist</TableHead>
                      <TableHead>Status</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {(clients.length ? clients : stats.recent_clients).map((client) => (
                      <TableRow key={client.id}>
                        <TableCell>{client.name}</TableCell>
                        <TableCell>{client.phone_number ?? "â€”"}</TableCell>
                        <TableCell>{client.email}</TableCell>
                        <TableCell>{client.domain_name ?? "â€”"}</TableCell>
                        <TableCell>{client.paper_name ?? "â€”"}</TableCell>
                        <TableCell>{client.state ?? "â€”"}</TableCell>
                        <TableCell>{client.district ?? "â€”"}</TableCell>
                        <TableCell>
                          <Badge variant={statusVariant(client.status)}>{client.status}</Badge>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            </CardContent>
          </Card>
        </main>

        {isModalOpen ? (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 p-4">
            <div className="w-full max-w-2xl rounded-2xl bg-white p-6 shadow-xl">
              <div className="mb-5 flex items-center justify-between">
                <div>
                  <p className="text-sm uppercase tracking-[0.18em] text-slate-500">Add client</p>
                  <h2 className="mt-1 text-2xl font-semibold text-slate-900">Add client</h2>
                </div>
                <button type="button" onClick={() => setIsModalOpen(false)} className="rounded-full border border-slate-200 px-3 py-1 text-sm text-slate-600 hover:bg-slate-100">
                  Close
                </button>
              </div>

              {createdTenant ? (
                <div className="mb-5 rounded-xl border border-emerald-200 bg-emerald-50 p-4 text-sm text-emerald-950">
                  <p className="font-semibold">Tenant admin created successfully</p>
                  <p className="mt-2">Share these login details with the client:</p>
                  <dl className="mt-3 grid gap-2 sm:grid-cols-[auto_1fr]">
                    <dt className="font-medium">Login link</dt>
                    <dd><a href={createdTenant.loginUrl} className="font-medium text-blue-700 underline">{createdTenant.loginUrl}</a></dd>
                    <dt className="font-medium">Email</dt>
                    <dd>{createdTenant.email}</dd>
                    <dt className="font-medium">Password</dt>
                    <dd className="font-mono">{createdTenant.password}</dd>
                  </dl>
                  <p className="mt-3 text-xs text-emerald-800">Open that link on the tenant domain and sign in with the email and password above.</p>
                </div>
              ) : null}

              <form className="space-y-4" onSubmit={handleSubmit}>
                <div className="grid gap-4 md:grid-cols-2">
                  <label className="space-y-2 text-sm text-slate-700">
                    <span>Name</span>
                    <input value={form.name} onChange={(event) => setForm({ ...form, name: event.target.value })} className="w-full rounded-md border border-slate-200 bg-white px-3 py-2 text-slate-900 outline-none ring-0" required />
                  </label>
                  <label className="space-y-2 text-sm text-slate-700">
                    <span>Phone no</span>
                    <input value={form.phone_number} onChange={(event) => setForm({ ...form, phone_number: event.target.value })} className="w-full rounded-md border border-slate-200 bg-white px-3 py-2 text-slate-900 outline-none ring-0" required />
                  </label>
                </div>

                <div className="grid gap-4 md:grid-cols-2">
                  <label className="space-y-2 text-sm text-slate-700">
                    <span>Mail id</span>
                    <input type="email" value={form.email} onChange={(event) => setForm({ ...form, email: event.target.value })} className="w-full rounded-md border border-slate-200 bg-white px-3 py-2 text-slate-900 outline-none ring-0" required />
                  </label>
                  <label className="space-y-2 text-sm text-slate-700">
                    <span>Tenant admin password</span>
                    <input type="password" minLength={8} value={form.tenant_password} onChange={(event) => setForm({ ...form, tenant_password: event.target.value })} className="w-full rounded-md border border-slate-200 bg-white px-3 py-2 text-slate-900 outline-none ring-0" placeholder="Minimum 8 characters" required />
                  </label>
                  <label className="space-y-2 text-sm text-slate-700">
                    <span>Tenant admin login email</span>
                    <input type="email" value={form.tenant_email} onChange={(event) => setForm({ ...form, tenant_email: event.target.value })} className="w-full rounded-md border border-slate-200 bg-white px-3 py-2 text-slate-900 outline-none ring-0" placeholder="admin@client-domain.com" required />
                    <span className="block text-xs text-slate-500">Use a unique email. For local testing use a hostname like paper.localhost</span>
                  </label>
                  <label className="space-y-2 text-sm text-slate-700">
                    <span>Domain name</span>
                    <input value={form.domain_name} onChange={(event) => setForm({ ...form, domain_name: event.target.value })} className="w-full rounded-md border border-slate-200 bg-white px-3 py-2 text-slate-900 outline-none ring-0" placeholder="paper.localhost" required />
                  </label>
                </div>

                <div className="grid gap-4 md:grid-cols-2">
                  <label className="space-y-2 text-sm text-slate-700">
                    <span>Paper name</span>
                    <input value={form.paper_name} onChange={(event) => setForm({ ...form, paper_name: event.target.value })} className="w-full rounded-md border border-slate-200 bg-white px-3 py-2 text-slate-900 outline-none ring-0" required />
                  </label>
                  <label className="space-y-2 text-sm text-slate-700">
                    <span>State</span>
                    <select
                      value={form.state}
                      onChange={(event) => handleStateChange(event.target.value)}
                      className="w-full rounded-md border border-slate-200 bg-white px-3 py-2 text-slate-900 outline-none ring-0"
                      required
                    >
                      <option value="">Select state</option>
                      {indianStates.map((state) => (
                        <option key={state} value={state}>
                          {state}
                        </option>
                      ))}
                    </select>
                  </label>
                </div>

                <label className="block space-y-2 text-sm text-slate-700">
                  <span>Dist</span>
                  <select
                    value={form.district}
                    onChange={(event) => setForm({ ...form, district: event.target.value })}
                    className="w-full rounded-md border border-slate-200 bg-white px-3 py-2 text-slate-900 outline-none ring-0"
                    required
                    disabled={!form.state}
                  >
                    <option value="">Select district</option>
                    {(districtOptions.length ? districtOptions : ["Other"]).map((district) => (
                      <option key={district} value={district}>
                        {district}
                      </option>
                    ))}
                  </select>
                </label>

                {message ? <p className="text-sm text-slate-700">{message}</p> : null}

                <div className="flex justify-end gap-3 pt-2">
                  <button type="button" onClick={() => setIsModalOpen(false)} className="rounded-md border border-slate-200 px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-100">
                    Cancel
                  </button>
                  <Button type="submit" disabled={loading}>{loading ? "Saving..." : "+ Add client"}</Button>
                </div>
              </form>
            </div>
          </div>
        ) : null}
      </div>
    </div>
  );
}
