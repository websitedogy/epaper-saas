import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Sign in | Dogy ePaper SaaS",
  description: "Sign in to the Dogy ePaper SaaS workspace.",
  robots: { index: false, follow: false, nocache: true },
};

export default function LoginLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return children;
}
