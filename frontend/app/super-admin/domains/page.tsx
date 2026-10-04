"use client";

import { useEffect, useState } from "react";
import { Check, CheckCircle2, CircleHelp, CloudCog, Globe2, LockKeyhole, Pencil, Plus, RefreshCw, ShieldCheck, Trash2 } from "lucide-react";

import { Header } from "@/components/layout/header";
import { Sidebar } from "@/components/layout/sidebar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { API_BASE_URL, API_TOKEN_KEY } from "@/lib/api";

type Client = { id: string; name: string; email: string; domain_name?: string | null };
type Domain = {
  id: string;
  customer_id: string;
  domain: string;
  is_primary: boolean;
  verification_status: string;
  ssl_status: string;
  dns_verified_at: string | null;
  last_checked_at: string | null;
  customer?: Client;
  connection?: {
    mode: string;
    summary: string;
    records: Array<{ type: string; host: string; value: string; zone?: string }>;
  };
};

type Infrastructure = {
  wildcard_base: string;
  cname_target: string;
  server_ips: string[];
  ssl: { auto_provision: boolean; provider: string };
  servers: Array<{ role: string; host: string | null; ip: string | null; healthy: boolean | null }>;
};

const statusLabels: Record<string, string> = {
  not_connected: "Not Connected",
  dns_pending: "DNS Pending",
  dns_verified: "DNS Verified",
  ssl_provisioning: "SSL Provisioning",
  active: "Active",
  failed: "Verification Failed",
  not_active: "Not Active",
  pending: "Pending",
};

function statusVariant(status: string): "success" | "warning" | "danger" | "info" | "default" {
  if (status === "active") return "success";
  if (status === "failed" || status === "not_active") return "danger";
  if (status === "dns_verified" || status === "ssl_provisioning") return "info";
  if (status === "pending" || status === "dns_pending") return "warning";
  return "default";
}

export default function SuperAdminDomainsPage() {
  const [domains, setDomains] = useState<Domain[]>([]);
  const [clients, setClients] = useState<Client[]>([]);
  const [infrastructure, setInfrastructure] = useState<Infrastructure | null>(null);
  const [selectedClient, setSelectedClient] = useState("");
  const [domainValue, setDomainValue] = useState("");
  const [isPrimary, setIsPrimary] = useState(true);
  const [editing, setEditing] = useState<Domain | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const [busyId, setBusyId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false);

  const token = typeof window !== "undefined" ? window.localStorage.getItem(API_TOKEN_KEY) : null;
  const headers = { Authorization: `Bearer ${token ?? ""}`, "Content-Type": "application/json" };

  const load = async () => {
    setLoading(true);
    const [domainResponse, clientResponse, infraResponse] = await Promise.all([
      fetch(`${API_BASE_URL}/api/v1/super-admin/domains`, { headers }),
      fetch(`${API_BASE_URL}/api/v1/super-admin/clients?per_page=100`, { headers }),
      fetch(`${API_BASE_URL}/api/v1/super-admin/infrastructure`, { headers }),
    ]);
    const domainPayload = await domainResponse.json();
    const clientPayload = await clientResponse.json();
    const infraPayload = await infraResponse.json().catch(() => ({}));
    setDomains(domainPayload.data ?? []);
    setClients(clientPayload.data?.data ?? clientPayload.data ?? []);
    setInfrastructure(infraPayload.data ?? null);
    setLoading(false);
  };

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    void load();
    // The page only needs to load once; mutations explicitly reload it.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const resetForm = () => {
    setEditing(null);
    setSelectedClient("");
    setDomainValue("");
    setIsPrimary(true);
  };

  const openCreateForm = () => {
    resetForm();
    setMessage(null);
    setIsFormOpen(true);
  };

  const selectedClientRecord = clients.find((client) => client.id === selectedClient);

  const saveDomain = async (event: React.FormEvent) => {
    event.preventDefault();
    setMessage(null);
    const url = editing
      ? `${API_BASE_URL}/api/v1/super-admin/domains/${editing.id}`
      : `${API_BASE_URL}/api/v1/super-admin/domains`;
    const response = await fetch(url, {
      method: editing ? "PUT" : "POST",
      headers,
      body: JSON.stringify(editing ? { domain: domainValue, is_primary: isPrimary } : { customer_id: selectedClient, domain: domainValue, is_primary: isPrimary }),
    });
    const payload = await response.json().catch(() => ({}));
    if (!response.ok) {
      setMessage(payload.message ?? "The domain could not be saved.");
      return;
    }
    setMessage(payload.message);
    resetForm();
    setIsFormOpen(false);
    await load();
  };

  const verifyDomain = async (domain: Domain) => {
    setBusyId(domain.id);
    setMessage(null);
    const response = await fetch(`${API_BASE_URL}/api/v1/super-admin/domains/${domain.id}/verify`, { method: "POST", headers });
    const payload = await response.json().catch(() => ({}));
    setMessage(payload.message ?? "Domain verification completed.");
    setBusyId(null);
    await load();
  };

  const provisionSsl = async (domain: Domain) => {
    setBusyId(domain.id);
    setMessage(null);
    const response = await fetch(`${API_BASE_URL}/api/v1/super-admin/domains/${domain.id}/ssl`, { method: "POST", headers });
    const payload = await response.json().catch(() => ({}));
    setMessage(payload.message ?? "SSL provisioning started.");
    setBusyId(null);
    await load();
  };

  const removeDomain = async (domain: Domain) => {
    if (!window.confirm(`Remove ${domain.domain}?`)) return;
    setBusyId(domain.id);
    await fetch(`${API_BASE_URL}/api/v1/super-admin/domains/${domain.id}`, { method: "DELETE", headers });
    setBusyId(null);
    await load();
  };

  const setDomainActivation = async (domain: Domain, action: "activate" | "deactivate") => {
    setBusyId(domain.id);
    const response = await fetch(`${API_BASE_URL}/api/v1/super-admin/domains/${domain.id}/${action}`, { method: "POST", headers });
    const payload = await response.json().catch(() => ({}));
    setMessage(payload.message ?? `Domain ${action} request completed.`);
    setBusyId(null);
    await load();
  };

  return (
    <div className="min-h-screen bg-[#f5f7fb] lg:flex">
      <Sidebar mobileOpen={mobileSidebarOpen} onToggle={() => setMobileSidebarOpen((value) => !value)} />
      <div className="min-w-0 flex-1">
        <Header onToggleSidebar={() => setMobileSidebarOpen((value) => !value)} />
        <main className="min-h-[calc(100vh-4rem)] bg-[#f5f7fb] p-4 sm:p-6 lg:p-8">
          <div className="mx-auto max-w-[1500px] space-y-6">
            <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
              <div>
                <h1 className="text-3xl font-semibold tracking-tight text-slate-950 sm:text-4xl">Domain connections</h1>
                <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-600">Use a wildcard hostname like paper.{infrastructure?.wildcard_base ?? "dogyepaper.com"}, or point a custom domain at {infrastructure?.cname_target ?? "tenants.dogyepaper.com"} and auto-SSL will issue a certificate.</p>
              </div>
              <div className="flex flex-wrap items-center gap-3"><div className="flex items-center gap-3 rounded-xl border border-slate-200 bg-white px-4 py-3 shadow-sm"><div className="flex h-9 w-9 items-center justify-center rounded-lg bg-emerald-50 text-emerald-600"><ShieldCheck className="h-5 w-5" /></div><div><p className="text-xs font-medium uppercase tracking-[0.12em] text-slate-500">Connection center</p><p className="text-sm font-semibold text-slate-900">{domains.length} domains managed</p></div></div><Button onClick={openCreateForm}><Plus className="h-4 w-4" />Connect domain</Button></div>
            </div>

        <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
          {[
            { label: "All domains", value: domains.length, icon: Globe2, tone: "bg-slate-900 text-white" },
            { label: "Active", value: domains.filter((domain) => domain.verification_status === "active").length, icon: CheckCircle2, tone: "bg-emerald-50 text-emerald-700" },
            { label: "Needs attention", value: domains.filter((domain) => domain.verification_status !== "active").length, icon: CloudCog, tone: "bg-amber-50 text-amber-700" },
            { label: "SSL active", value: domains.filter((domain) => domain.ssl_status === "active").length, icon: LockKeyhole, tone: "bg-sky-50 text-sky-700" },
          ].map(({ label, value, icon: Icon, tone }) => <div key={label} className="flex items-center gap-3 rounded-xl border border-slate-200 bg-white p-4 shadow-sm"><div className={`flex h-10 w-10 items-center justify-center rounded-lg ${tone}`}><Icon className="h-5 w-5" /></div><div><p className="text-2xl font-semibold text-slate-950">{value}</p><p className="text-xs font-medium text-slate-500">{label}</p></div></div>)}
        </div>

        <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm sm:p-6">
          <div className="mb-5 flex items-center justify-between"><div><h2 className="font-semibold text-slate-950">Connection workflow</h2><p className="mt-1 text-sm text-slate-500">Each domain follows the same secure activation path.</p></div><CircleHelp className="h-5 w-5 text-slate-400" /></div>
          <div className="grid gap-3 md:grid-cols-4">
            {["Add domain", "Verify DNS", "Provision SSL", "Activate"].map((step, index) => <div key={step} className="flex items-center gap-3 rounded-xl bg-slate-50 p-3"><div className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-sm font-semibold ${index === 0 ? "bg-slate-900 text-white" : "bg-white text-slate-500 ring-1 ring-slate-200"}`}>{index + 1}</div><div><p className="text-sm font-semibold text-slate-800">{step}</p><p className="text-xs text-slate-500">{index === 0 ? "Assign to a client" : index === 1 ? "Point DNS records" : index === 2 ? "Secure the hostname" : "Go live"}</p></div></div>)}
          </div>
        </section>

        <div className="grid items-start gap-6 xl:grid-cols-[minmax(0,1.45fr)_minmax(340px,0.75fr)]">
          <section className="rounded-2xl border border-slate-200 bg-white shadow-sm">
            <div className="flex flex-col gap-3 border-b border-slate-200 px-5 py-5 sm:flex-row sm:items-center sm:justify-between sm:px-6"><div><h2 className="text-lg font-semibold text-slate-950">Managed domains</h2><p className="mt-1 text-sm text-slate-500">Monitor tenant routing, DNS, and SSL health.</p></div><span className="w-fit rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold text-slate-600">{domains.length} total</span></div>
            <div className="divide-y divide-slate-100">
              {loading ? <p className="p-6 text-sm text-slate-500">Loading domains...</p> : null}
              {!loading && domains.length === 0 ? <div className="p-10 text-center"><Globe2 className="mx-auto h-8 w-8 text-slate-300" /><p className="mt-3 font-medium text-slate-700">No domains connected yet</p><p className="mt-1 text-sm text-slate-500">Add a custom domain to start the connection workflow.</p></div> : null}
              {domains.map((domain) => <div key={domain.id} className="p-5 transition hover:bg-slate-50/70 sm:p-6"><div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between"><div className="flex gap-3"><div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-sky-50 text-sky-600"><Globe2 className="h-5 w-5" /></div><div><div className="flex flex-wrap items-center gap-2"><p className="font-semibold text-slate-950">{domain.domain}</p>{domain.is_primary ? <Badge variant="info">Primary</Badge> : null}</div><p className="mt-1 text-sm text-slate-500">{domain.customer?.name ?? domain.customer_id}</p><p className="mt-2 text-xs text-slate-400">{domain.last_checked_at ? `Last checked ${new Date(domain.last_checked_at).toLocaleString()}` : "Not checked yet"}</p></div></div><div className="flex flex-wrap gap-2 lg:justify-end"><Badge variant={statusVariant(domain.verification_status)}>{statusLabels[domain.verification_status] ?? domain.verification_status}</Badge><Badge variant={statusVariant(domain.ssl_status)}>{`SSL ${statusLabels[domain.ssl_status] ?? domain.ssl_status}`}</Badge></div></div><div className="mt-4 flex flex-wrap gap-2 border-t border-slate-100 pt-4"><Button variant="secondary" onClick={() => void verifyDomain(domain)} disabled={busyId === domain.id}><RefreshCw className="h-4 w-4" />{busyId === domain.id ? "Checking..." : "Verify DNS"}</Button><Button variant="secondary" onClick={() => void provisionSsl(domain)} disabled={busyId === domain.id}><LockKeyhole className="h-4 w-4" />Provision SSL</Button>{domain.verification_status === "active" ? <Button variant="secondary" onClick={() => void setDomainActivation(domain, "deactivate")} disabled={busyId === domain.id}>Deactivate</Button> : <Button variant="secondary" onClick={() => void setDomainActivation(domain, "activate")} disabled={busyId === domain.id}>Activate</Button>}<Button variant="secondary" onClick={() => { setEditing(domain); setDomainValue(domain.domain); setIsPrimary(domain.is_primary); setMessage(null); setIsFormOpen(true); }}><Pencil className="h-4 w-4" />Edit</Button><Button variant="secondary" onClick={() => void removeDomain(domain)}><Trash2 className="h-4 w-4" />Remove</Button></div>{domain.connection?.records?.length ? <dl className="mt-3 grid gap-1 text-xs text-slate-500">{domain.connection.records.map((record) => <div key={`${record.type}-${record.host}-${record.value}`} className="flex flex-wrap gap-2"><dt className="font-mono font-semibold text-slate-700">{record.type}</dt><dd className="font-mono">{record.host} → {record.value}</dd></div>)}</dl> : null}</div>)}
            </div>
          </section>

          <aside><section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm sm:p-6"><div className="flex items-center gap-2"><CircleHelp className="h-5 w-5 text-sky-600" /><h2 className="font-semibold text-slate-950">DNS setup guide</h2></div><p className="mt-2 text-sm text-slate-500">Add the platform wildcard once, then customer domains CNAME to it. Auto-SSL uses {infrastructure?.ssl.provider ?? "Caddy"}.</p><div className="mt-4 space-y-3"><div className="rounded-xl border border-slate-200 p-4"><p className="text-sm font-semibold text-slate-900">Platform wildcard</p><dl className="mt-3 grid grid-cols-[72px_1fr] gap-y-2 text-sm"><dt className="text-slate-500">Host</dt><dd className="font-mono text-slate-800">*.{infrastructure?.wildcard_base ?? "dogyepaper.com"}</dd><dt className="text-slate-500">A / CNAME</dt><dd className="font-mono text-slate-800">{infrastructure?.server_ips[0] ?? "APP_SERVER_IP"} or {infrastructure?.cname_target ?? "tenants.dogyepaper.com"}</dd></dl></div><div className="rounded-xl border border-slate-200 p-4"><p className="text-sm font-semibold text-slate-900">Custom domain</p><dl className="mt-3 grid grid-cols-[72px_1fr] gap-y-2 text-sm"><dt className="text-slate-500">CNAME</dt><dd className="font-mono text-slate-800">{infrastructure?.cname_target ?? "tenants.dogyepaper.com"}</dd><dt className="text-slate-500">A records</dt><dd className="font-mono text-slate-800">{infrastructure?.server_ips.join(", ") || "APP and extra server IPs"}</dd></dl></div>{infrastructure?.servers.length ? <div className="rounded-xl border border-slate-200 p-4"><p className="text-sm font-semibold text-slate-900">Servers</p><ul className="mt-3 space-y-1 text-sm text-slate-600">{infrastructure.servers.map((server) => <li key={server.role}>{server.role}: {server.host ?? server.ip ?? "unassigned"}{server.healthy == null ? "" : server.healthy ? " · healthy" : " · down"}</li>)}</ul></div> : null}</div><p className="mt-4 text-xs leading-5 text-slate-500">DNS changes may take up to 24 hours. After DNS verifies, SSL is provisioned automatically.</p></section></aside>
        </div>
      </div>

      {isFormOpen ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center overflow-y-auto bg-slate-950/45 p-4 backdrop-blur-sm" role="dialog" aria-modal="true" aria-labelledby="domain-modal-title">
          <div className="my-8 w-full max-w-lg rounded-2xl border border-slate-200 bg-white p-5 shadow-2xl sm:p-7">
            <div className="mb-6 flex items-start justify-between gap-4"><div><div className="mb-3 flex h-10 w-10 items-center justify-center rounded-xl bg-slate-900 text-white"><Plus className="h-5 w-5" /></div><h2 id="domain-modal-title" className="text-xl font-semibold text-slate-950">{editing ? "Edit domain" : "Connect a domain"}</h2><p className="mt-1 text-sm text-slate-500">Assign a hostname to a tenant.</p></div><button type="button" onClick={() => { setIsFormOpen(false); resetForm(); }} className="rounded-lg px-2 py-1 text-2xl leading-none text-slate-400 hover:bg-slate-100 hover:text-slate-700" aria-label="Close domain form">×</button></div>
            <form className="space-y-4" onSubmit={saveDomain}>{!editing ? <label className="block space-y-2 text-sm font-medium text-slate-700"><span>Client</span><select value={selectedClient} onChange={(event) => setSelectedClient(event.target.value)} className="w-full rounded-xl border border-slate-300 bg-white px-3 py-3 outline-none transition focus:border-sky-500 focus:ring-2 focus:ring-sky-100" required><option value="">Select a client</option>{clients.map((client) => <option key={client.id} value={client.id}>{client.name} · {client.email}{client.domain_name ? ` · ${client.domain_name}` : ""}</option>)}</select></label> : null}{!editing && selectedClientRecord ? <label className="block space-y-2 text-sm font-medium text-slate-700"><span>Current domain</span><div className="flex items-center gap-2 rounded-xl border border-slate-200 bg-slate-50 px-3 py-3 text-slate-600"><Globe2 className="h-4 w-4 text-slate-400" /><span className="truncate">{selectedClientRecord.domain_name ?? "No domain connected"}</span></div><span className="block text-xs font-normal text-slate-500">You can add a new custom domain below.</span></label> : null}<label className="block space-y-2 text-sm font-medium text-slate-700"><span>Domain name</span><div className="relative"><Globe2 className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" /><input value={domainValue} onChange={(event) => setDomainValue(event.target.value)} placeholder="abcnews.com" className="w-full rounded-xl border border-slate-300 bg-white py-3 pl-10 pr-3 outline-none transition focus:border-sky-500 focus:ring-2 focus:ring-sky-100" required /></div><span className="block text-xs font-normal text-slate-500">Use the root domain without http:// or a path.</span></label><label className="flex cursor-pointer items-center gap-3 rounded-xl border border-slate-200 bg-slate-50 p-3 text-sm text-slate-700"><input type="checkbox" checked={isPrimary} onChange={(event) => setIsPrimary(event.target.checked)} className="h-4 w-4 accent-slate-900" /><span><strong className="block font-medium text-slate-900">Primary domain</strong><small className="text-xs text-slate-500">Use this as the tenant’s main address.</small></span></label>{message ? <p className="rounded-xl border border-slate-200 bg-slate-50 p-3 text-sm text-slate-700">{message}</p> : null}<div className="flex flex-col-reverse gap-2 sm:flex-row sm:justify-end"><Button type="button" variant="secondary" onClick={() => { setIsFormOpen(false); resetForm(); }}>Cancel</Button><Button type="submit"><Check className="h-4 w-4" />{editing ? "Save domain changes" : "Add custom domain"}</Button></div></form>
          </div>
        </div>
      ) : null}
        </main>
      </div>
    </div>
  );
}
