import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Super Admin | Dogy ePaper SaaS",
  robots: { index: false, follow: false, nocache: true },
};

export default function SuperAdminLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return children;
}
