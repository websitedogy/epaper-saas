import type { Metadata } from "next";

import TenantAdminShell from "./tenant-admin-shell";

export const metadata: Metadata = {
  title: "Tenant Admin | Dogy ePaper SaaS",
  robots: { index: false, follow: false, nocache: true },
};

export default function TenantAdminLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return <TenantAdminShell>{children}</TenantAdminShell>;
}

