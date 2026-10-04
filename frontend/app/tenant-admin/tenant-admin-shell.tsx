"use client";

import { useEffect, useState } from "react";

import { Header } from "@/components/layout/header";
import { TenantSidebar } from "@/components/layout/tenant-admin-sidebar";
import { apiFetch } from "@/lib/api";

type TenantProfile = {
  name: string;
  email: string;
  roles: string[];
  customer?: {
    name: string;
    domain_name: string | null;
    paper_name: string | null;
  };
};

export default function TenantAdminShell({ children }: { children: React.ReactNode }) {
  const [mobileOpen, setMobileOpen] = useState(false);
  const [profile, setProfile] = useState<TenantProfile | null>(null);

  useEffect(() => {
    void apiFetch<{ data: TenantProfile }>("/api/v1/auth/me")
      .then((response) => setProfile(response.data))
      .catch(() => undefined);
  }, []);

  const tenantName = profile?.customer?.name ?? profile?.name ?? "Tenant";
  const tenantDomain = profile?.customer?.domain_name ?? profile?.customer?.paper_name ?? "Admin Portal";

  return (
    <div className="min-h-screen bg-slate-100">
      <div className="flex min-h-screen">
        <TenantSidebar
          mobileOpen={mobileOpen}
          onToggle={() => setMobileOpen((value) => !value)}
          tenant={{ name: tenantName, domain: tenantDomain }}
        />
        <div className="flex min-h-screen flex-1 flex-col">
          <Header
            onToggleSidebar={() => setMobileOpen((value) => !value)}
            profile={{ name: tenantName, subtitle: tenantDomain }}
          />
          <main className="flex-1 p-4 md:p-6">{children}</main>
        </div>
      </div>
    </div>
  );
}
