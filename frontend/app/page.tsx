import type { Metadata } from "next";
import { headers } from "next/headers";

import { MarketingHome } from "@/components/landing/marketing-home";
import { TenantPaperHome } from "@/components/landing/tenant-paper-home";
import { hostnameFromHeaders, isCentralHost } from "@/lib/hosts";
import { fetchPublicEdition, fetchPublicSite } from "@/lib/public-paper";

export async function generateMetadata(): Promise<Metadata> {
  const host = hostnameFromHeaders(await headers());
  if (isCentralHost(host)) {
    return {
      title: "Digital ePaper Publishing Platform",
      description: "Publish branded digital newspapers from one multi-tenant platform.",
    };
  }
  const site = await fetchPublicSite(host);
  const paperName = site?.paper?.name ?? host;
  return {
    title: paperName,
    description: `Read ${paperName} as a digital ePaper.`,
  };
}

export default async function HomePage({
  searchParams,
}: {
  searchParams: Promise<{ page?: string }>;
}) {
  const host = hostnameFromHeaders(await headers());

  if (!isCentralHost(host)) {
    const site = await fetchPublicSite(host);
    const paper = site?.paper ?? { name: host, domain: host, logo_url: null };
    const latest = site?.editions[0];
    const edition = latest ? await fetchPublicEdition(latest.slug, host) : null;
    const params = await searchParams;
    const initialPage = Number(params.page) || 1;

    return (
      <TenantPaperHome
        paper={paper}
        edition={edition}
        archives={site?.editions ?? []}
        initialPage={initialPage}
      />
    );
  }

  return <MarketingHome />;
}
