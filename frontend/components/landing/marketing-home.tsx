import Link from "next/link";
import {
  ArrowRight,
  Bot,
  Building2,
  Check,
  FileUp,
  Globe2,
  Layers3,
  Newspaper,
  ShieldCheck,
  Sparkles,
  Users,
} from "lucide-react";

import { LandingHeader } from "@/components/landing/landing-header";
import { NewspaperPreview } from "@/components/landing/newspaper-preview";
import { Button } from "@/components/ui/button";

const capabilities = [
  { value: "PDF → pages", label: "Print-ready upload" },
  { value: "White-label", label: "Your domain, your masthead" },
  { value: "Multi-tenant", label: "Titles, resellers, groups" },
  { value: "AI briefs", label: "Editorial summaries on demand" },
];

const features = [
  {
    icon: FileUp,
    title: "From PDF to edition",
    body: "Drop the day’s print file, extract pages, and send a complete digital edition live without a separate design workflow.",
  },
  {
    icon: Newspaper,
    title: "A reader that feels like print",
    body: "Page-accurate viewing, zoom, thumbnails, and download keep the front-page experience intact on every screen.",
  },
  {
    icon: Globe2,
    title: "Branded domains",
    body: "Each newspaper publishes on its own domain, with tenant isolation so titles never share readers, files, or settings.",
  },
  {
    icon: Bot,
    title: "AI on the news desk",
    body: "Generate editorial briefs and summaries from the edition so the team can move faster after the paper is up.",
  },
  {
    icon: Layers3,
    title: "Desks, sections, history",
    body: "Categories, sub-categories, and edition history keep years of publishing organized for editors and archives.",
  },
  {
    icon: ShieldCheck,
    title: "Roles that match a newsroom",
    body: "Platform, reseller, and publisher access are separated, so agencies can white-label without touching another title.",
  },
];

const steps = [
  {
    step: "01",
    title: "Stand up the title",
    body: "Create the tenant, attach the domain, and set the masthead. One newspaper or a group of them.",
  },
  {
    step: "02",
    title: "Upload the edition",
    body: "Send the PDF, extract pages, and review the spread before it goes public.",
  },
  {
    step: "03",
    title: "Publish to readers",
    body: "The branded viewer is live on your domain. Archives, zoom, and downloads are already in place.",
  },
];

const audiences = [
  {
    icon: Newspaper,
    title: "Daily newspapers",
    body: "Keep the print ritual. Give subscribers a digital edition that still looks like your paper, not a blog.",
  },
  {
    icon: Building2,
    title: "Resellers & agencies",
    body: "White-label the stack, onboard publishers under your brand, and operate every customer from one desk.",
  },
  {
    icon: Users,
    title: "Media groups",
    body: "Run multiple titles with shared operations and strict data isolation across every masthead.",
  },
];

export function MarketingHome() {
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000";
  const structuredData = {
    "@context": "https://schema.org",
    "@graph": [
      { "@type": "Organization", name: "Dogy ePaper", url: siteUrl },
      {
        "@type": "SoftwareApplication",
        name: "Dogy ePaper",
        applicationCategory: "BusinessApplication",
        description: "Multi-tenant digital ePaper publishing platform for newspapers, resellers, and media groups.",
        url: siteUrl,
      },
    ],
  };

  return (
    <div className="min-h-screen bg-[#f4efe6] text-[#14110c]">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(structuredData) }} />

      <LandingHeader />

      <main>
        <section className="relative overflow-hidden">
          <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_top_right,rgba(217,180,138,0.28),transparent_32%),radial-gradient(circle_at_left,rgba(18,50,74,0.08),transparent_40%)]" />
          <div className="relative mx-auto grid max-w-6xl items-center gap-14 px-5 py-16 lg:grid-cols-[1.05fr_0.95fr] lg:px-8 lg:py-24">
            <div>
              <p className="inline-flex items-center gap-2 rounded-full border border-[#12324a]/10 bg-white/70 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.22em] text-[#8a6a32]">
                <Sparkles className="h-3.5 w-3.5" />
                Digital newsroom
              </p>
              <h1 className="font-display mt-6 max-w-xl text-5xl leading-[1.05] tracking-tight text-[#12324a] sm:text-6xl">
                Publish a branded newspaper that still feels like print.
              </h1>
              <p className="mt-5 max-w-xl text-lg leading-8 text-slate-600">
                Dogy is the multi-tenant ePaper platform for publishers, resellers, and media groups. Upload the edition, keep the masthead, and go live on your own domain.
              </p>
              <div className="mt-8 flex flex-wrap items-center gap-3">
                <Button asChild size="lg" className="rounded-full bg-[#12324a] px-6 hover:bg-[#0d2436]">
                  <Link href="/login">
                    Open the newsroom
                    <ArrowRight className="h-4 w-4" />
                  </Link>
                </Button>
                <Button asChild size="lg" variant="outline" className="rounded-full border-[#12324a]/20 bg-white/70 px-6">
                  <a href="#product">See how it works</a>
                </Button>
              </div>
              <ul className="mt-8 flex flex-wrap gap-x-6 gap-y-2 text-sm text-slate-600">
                {["No redesign of the paper", "Custom domains", "Reseller-ready"].map((item) => (
                  <li key={item} className="flex items-center gap-2">
                    <Check className="h-4 w-4 text-[#8a6a32]" />
                    {item}
                  </li>
                ))}
              </ul>
            </div>
            <NewspaperPreview />
          </div>
        </section>

        <section className="border-y border-[#12324a]/10 bg-[#12324a] text-[#f4efe6]">
          <div className="mx-auto grid max-w-6xl gap-8 px-5 py-10 sm:grid-cols-2 lg:grid-cols-4 lg:px-8">
            {capabilities.map((item) => (
              <div key={item.label}>
                <p className="font-display text-2xl">{item.value}</p>
                <p className="mt-1 text-sm text-white/65">{item.label}</p>
              </div>
            ))}
          </div>
        </section>

        <section id="product" className="scroll-mt-24">
          <div className="mx-auto max-w-6xl px-5 py-20 lg:px-8">
            <div className="max-w-2xl">
              <p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-[#8a6a32]">Product</p>
              <h2 className="font-display mt-3 text-4xl tracking-tight text-[#12324a]">Everything a modern news desk needs after the press run.</h2>
              <p className="mt-4 text-lg leading-8 text-slate-600">
                Built around the real publishing day: file in, pages out, edition live — with the controls a multi-title operation actually uses.
              </p>
            </div>

            <div className="mt-12 grid gap-5 md:grid-cols-2 xl:grid-cols-3">
              {features.map((feature) => (
                <article key={feature.title} className="rounded-3xl border border-[#12324a]/10 bg-white/70 p-6 shadow-[0_10px_30px_rgba(18,50,74,0.04)]">
                  <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-[#12324a] text-[#f4efe6]">
                    <feature.icon className="h-5 w-5" />
                  </div>
                  <h3 className="font-display mt-5 text-2xl text-[#12324a]">{feature.title}</h3>
                  <p className="mt-3 text-sm leading-7 text-slate-600">{feature.body}</p>
                </article>
              ))}
            </div>
          </div>
        </section>

        <section id="workflow" className="scroll-mt-24 border-y border-[#12324a]/10 bg-white/50">
          <div className="mx-auto max-w-6xl px-5 py-20 lg:px-8">
            <div className="max-w-2xl">
              <p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-[#8a6a32]">Workflow</p>
              <h2 className="font-display mt-3 text-4xl tracking-tight text-[#12324a]">Three steps from the press to the reader.</h2>
            </div>
            <ol className="mt-12 grid gap-6 lg:grid-cols-3">
              {steps.map((item) => (
                <li key={item.step} className="rounded-3xl border border-[#12324a]/10 bg-[#f4efe6] p-7">
                  <p className="font-display text-sm tracking-[0.2em] text-[#8a6a32]">{item.step}</p>
                  <h3 className="font-display mt-4 text-2xl text-[#12324a]">{item.title}</h3>
                  <p className="mt-3 text-sm leading-7 text-slate-600">{item.body}</p>
                </li>
              ))}
            </ol>
          </div>
        </section>

        <section id="solutions" className="scroll-mt-24">
          <div className="mx-auto max-w-6xl px-5 py-20 lg:px-8">
            <div className="max-w-2xl">
              <p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-[#8a6a32]">Solutions</p>
              <h2 className="font-display mt-3 text-4xl tracking-tight text-[#12324a]">One platform, three kinds of publisher.</h2>
            </div>
            <div className="mt-12 grid gap-5 lg:grid-cols-3">
              {audiences.map((item) => (
                <article key={item.title} className="rounded-[28px] bg-[#12324a] p-7 text-[#f4efe6]">
                  <item.icon className="h-6 w-6 text-[#d9b48a]" />
                  <h3 className="font-display mt-5 text-2xl">{item.title}</h3>
                  <p className="mt-3 text-sm leading-7 text-white/70">{item.body}</p>
                </article>
              ))}
            </div>
          </div>
        </section>

        <section id="platform" className="scroll-mt-24 border-t border-[#12324a]/10">
          <div className="mx-auto grid max-w-6xl items-center gap-12 px-5 py-20 lg:grid-cols-2 lg:px-8">
            <div>
              <p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-[#8a6a32]">Platform</p>
              <h2 className="font-display mt-3 text-4xl tracking-tight text-[#12324a]">A foundation that can carry more than one masthead.</h2>
              <p className="mt-4 text-lg leading-8 text-slate-600">
                Super admin, reseller, and tenant newsrooms sit on the same stack, with tenant-aware data, queues, and a public reader for every published edition.
              </p>
              <ul className="mt-8 space-y-3 text-sm text-slate-700">
                {[
                  "Laravel API with Sanctum, policies, and queued jobs",
                  "Next.js reader and dashboards for every role",
                  "PostgreSQL isolation with Redis for cache and work",
                ].map((item) => (
                  <li key={item} className="flex items-start gap-3">
                    <Check className="mt-0.5 h-4 w-4 shrink-0 text-[#8a6a32]" />
                    {item}
                  </li>
                ))}
              </ul>
            </div>
            <div className="rounded-[32px] border border-[#12324a]/10 bg-white p-8 shadow-[0_20px_50px_rgba(18,50,74,0.06)]">
              <p className="text-sm font-medium text-slate-500">Operating model</p>
              <div className="mt-6 space-y-4">
                {[
                  { role: "Platform owner", detail: "Customers, resellers, domains, security" },
                  { role: "Reseller", detail: "White-label titles under one agency desk" },
                  { role: "Publisher", detail: "Categories, uploads, AI, live editions" },
                ].map((item, index) => (
                  <div key={item.role} className="flex items-center justify-between gap-4 border-b border-slate-100 pb-4 last:border-0 last:pb-0">
                    <div>
                      <p className="font-display text-xl text-[#12324a]">{item.role}</p>
                      <p className="mt-1 text-sm text-slate-500">{item.detail}</p>
                    </div>
                    <span className="text-xs uppercase tracking-[0.18em] text-[#8a6a32]">0{index + 1}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </section>

        <section className="px-5 pb-20 lg:px-8">
          <div className="mx-auto max-w-6xl overflow-hidden rounded-[36px] bg-[#12324a] px-8 py-14 text-center text-[#f4efe6] sm:px-16">
            <p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-[#d9b48a]">Ready when the edition is</p>
            <h2 className="font-display mx-auto mt-4 max-w-2xl text-4xl sm:text-5xl">Put tomorrow’s paper on a domain you own.</h2>
            <p className="mx-auto mt-4 max-w-xl text-white/70">
              Sign in to the newsroom, upload the PDF, and publish a branded digital edition without rebuilding your paper for the web.
            </p>
            <div className="mt-8 flex flex-wrap justify-center gap-3">
              <Button asChild size="lg" className="rounded-full bg-[#d9b48a] px-6 text-[#12324a] hover:bg-[#c9a36f]">
                <Link href="/login">Sign in to Dogy</Link>
              </Button>
              <Button asChild size="lg" variant="outline" className="rounded-full border-white/20 bg-transparent px-6 text-white hover:bg-white/10">
                <Link href="/tenant-admin">Publisher desk</Link>
              </Button>
            </div>
          </div>
        </section>
      </main>

      <footer className="border-t border-[#12324a]/10">
        <div className="mx-auto flex max-w-6xl flex-col gap-8 px-5 py-10 sm:flex-row sm:items-end sm:justify-between lg:px-8">
          <div>
            <p className="font-display text-2xl text-[#12324a]">Dogy ePaper</p>
            <p className="mt-2 max-w-sm text-sm text-slate-500">Digital newspaper publishing for independent titles, resellers, and media groups.</p>
          </div>
          <div className="flex flex-wrap gap-5 text-sm text-slate-600">
            <Link href="/login" className="hover:text-[#12324a]">
              Sign in
            </Link>
            <Link href="/tenant-admin" className="hover:text-[#12324a]">
              Tenant admin
            </Link>
            <Link href="/super-admin" className="hover:text-[#12324a]">
              Platform
            </Link>
          </div>
        </div>
      </footer>
    </div>
  );
}
