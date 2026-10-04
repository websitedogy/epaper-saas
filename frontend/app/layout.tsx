import type { Metadata } from "next";
import { Geist, Geist_Mono, Newsreader } from "next/font/google";

import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

const newsreader = Newsreader({
  variable: "--font-newsreader",
  subsets: ["latin"],
  display: "swap",
});

export const metadata: Metadata = {
  metadataBase: new URL(process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000"),
  title: {
    default: "Dogy ePaper SaaS | Digital ePaper Publishing Platform",
    template: "%s | Dogy ePaper SaaS",
  },
  description: "Publish branded digital newspapers and ePapers from one fast, multi-tenant publishing platform.",
  alternates: { canonical: "/" },
  openGraph: {
    type: "website",
    siteName: "Dogy ePaper SaaS",
    title: "Dogy ePaper SaaS | Digital ePaper Publishing Platform",
    description: "Publish branded digital newspapers and ePapers from one fast, multi-tenant publishing platform.",
    url: "/",
  },
  twitter: {
    card: "summary",
    title: "Dogy ePaper SaaS | Digital ePaper Publishing Platform",
    description: "Publish branded digital newspapers and ePapers from one fast, multi-tenant publishing platform.",
  },
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en" className={`${geistSans.variable} ${geistMono.variable} ${newsreader.variable} h-full scroll-smooth antialiased`}>
      <body className="min-h-full bg-slate-100 text-slate-900">{children}</body>
    </html>
  );
}
