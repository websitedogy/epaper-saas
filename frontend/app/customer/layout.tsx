import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Customer Workspace | Dogy ePaper SaaS",
  robots: { index: false, follow: false, nocache: true },
};

export default function CustomerLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return children;
}
